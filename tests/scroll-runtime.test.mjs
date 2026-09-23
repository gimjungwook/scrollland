import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sampleScene } from '../lib/scroll-state.js';
import { layoutGraph } from '../lib/graph-layout.js';

const source = {
  id: 'bindings', kind: 'visualization', body: ['본문 첫 문단', '본문 두 번째 문단'],
  code: '# setup\n# names\nbirds = 7\nsaved = birds\nbirds = birds + 1\nprint(birds, saved)', output: '8 7',
  visualization: { ref: 'bindings', pin: true, scrollDistance: 170, stops: [0, .25, .6, 1] },
  diagram: { type: 'binding', nodes: [{ label: 'birds', value: '정수 8' }, { label: 'saved', value: '정수 7' }], caption: 'birds → 8, saved → 7' },
  trace: [{ label: '최초 대입', state: 'birds → 7' }, { label: '같은 객체 연결', state: 'birds → 7, saved → 7' }, { label: '재대입', state: 'birds → 8, saved → 7' }],
};
const motion = {
  finalNodes: source.diagram.nodes,
  steps: [
    { lines: [3], nodes: [{ label: 'birds', value: '정수 7' }], output: '' },
    { lines: [4], nodes: [{ label: 'birds', value: '정수 7' }, { label: 'saved', value: '정수 7' }], output: '' },
    { lines: [5, 6], nodes: source.diagram.nodes, output: '8 7' },
  ],
};
let run = 0;
function element() {
  const classes = new Set(), properties = new Map(), attributes = new Map();
  return {
    hidden: false, textContent: '', dataset: {}, innerHTML: '', scrollTop: 0, offsetTop: 0,
    clientHeight: 100, scrollHeight: 500, offsetHeight: 400,
    style: { setProperty: (key, value) => properties.set(key, value), removeProperty: key => properties.delete(key), getPropertyValue: key => properties.get(key) },
    classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value), toggle(value, enabled) { enabled ? classes.add(value) : classes.delete(value); } },
    setAttribute: (key, value) => attributes.set(key, String(value)), getAttribute: key => attributes.get(key),
  };
}
function makeScene(section, sceneMotion) {
  const parts = Object.fromEntries(['[data-scene-data]', '.scene-stage', '[data-visualization-track]', '.visualization-fallback', '[data-state-canvas]', '.stage-code', '[data-output]', '[data-output-empty]', '[data-scene-progress]', '[data-position]', '[data-step-label]', '[data-step-state]', '[data-state-caption]'].map(selector => [selector, element()]));
  parts['[data-scene-data]'].textContent = JSON.stringify({ section, motion: sceneMotion });
  parts['.scene-stage'].hidden = true; parts['[data-visualization-track]'].offsetHeight = 900;
  const canvas = parts['[data-state-canvas]'];
  const decode = value => value.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
  let markup = '', graphNodes = [], graphEdges = []; canvas.markupWrites = 0;
  Object.defineProperty(canvas, 'innerHTML', { get: () => markup, set(value) {
    markup = value; canvas.markupWrites++;
    graphNodes = [...value.matchAll(/data-graph-id="([^"]+)"/g)].map(([, id]) => { const span = element(), strong = element(); return { ...element(), dataset: { graphId: decode(id) }, querySelector: selector => ({ span, strong })[selector] ?? null }; });
    graphEdges = [...value.matchAll(/data-edge-id="([^"]+)"/g)].map(([, id]) => ({ ...element(), dataset: { edgeId: decode(id) } }));
  } });
  canvas.querySelectorAll = selector => ({ '[data-graph-id]': graphNodes, '[data-edge-id]': graphEdges })[selector] ?? [];
  const codeLines = (section.code === undefined ? [] : section.code.split('\n')).map((_, i) => ({ ...element(), dataset: { codeLine: String(i + 1) }, offsetTop: 20 + i * 24 }));
  if (section.code === undefined) { delete parts['.stage-code']; delete parts['[data-output]']; delete parts['[data-output-empty]']; }
  if (parts['.stage-code']) parts['.stage-code'].querySelectorAll = selector => selector === '[data-code-line]' ? codeLines : [];
  const fallbackLines = codeLines.map(line => ({ ...element(), dataset: { ...line.dataset }, offsetTop: 9999 }));
  return { ...element(), parts, codeLines, fallbackLines, querySelector: selector => parts[selector] ?? null, querySelectorAll: selector => selector === '[data-code-line]' ? [...codeLines, ...fallbackLines] : [] };
}
async function setup(t, { reduced = false, gsapAvailable = true, pluginAvailable = true, malformed = false, hash = '', navigationType = 'navigate', section = source, sceneMotion = motion, malformedEffect = false } = {}) {
  const globals = Object.fromEntries(['document', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => { for (const [key, descriptor] of Object.entries(globals)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const scenes = [makeScene(section, sceneMotion), makeScene(section, sceneMotion)];
  scenes.forEach((scene, i) => { scene.id = `scene-${i}`; });
  if (malformed) scenes[0].parts['[data-scene-data]'].textContent = '{';
  const prose = { ...element(), textContent: '본문은 계속 그대로 읽을 수 있습니다.' }, reading = element(), quiz = element(), title = element();
  const root = element(), fallback = element(), targets = new Map(scenes.map(scene => [scene.id, scene]));
  const anchors = [], events = [];
  targets.forEach(target => { target.scrollIntoView = options => { anchors.push({ id: target.id, options }); events.push('anchor'); }; });
  const document = { documentElement: root, getElementById: id => targets.get(id) ?? null,
    querySelector: selector => ({ '[data-motion-fallback]': fallback })[selector] ?? null,
    querySelectorAll: selector => ({ '[data-visualization]': scenes, '.text-effect[data-effect]': malformedEffect ? [{ ...element(), dataset: { effect: '{' } }] : [], '[data-lesson-article]': [], '.section-prose': [prose], '[data-reading]': [reading], '[data-scroll-check]': [quiz], '.lesson-opening h2': [title] })[selector] ?? [],
  };
  const mediaListeners = new Map(), windowListeners = new Map();
  const media = { matches: reduced, addEventListener: (name, fn) => mediaListeners.set(name, fn) };
  const triggers = [], registered = [], frames = [];
  const plugin = {
    refreshCalls: 0, updateCalls: 0,
    create(options) {
      const trigger = { options, progress: 0, killed: false, start: 0, end: 500, scroll: () => 0,
        kill() { this.killed = true; },
        seek(p) { assert(!this.killed); this.progress = p; options.onUpdate?.(this); },
      }; triggers.push(trigger); return trigger;
    },
    refresh() { this.refreshCalls++; events.push('refresh'); triggers.filter(x => !x.killed).forEach(x => { x.options.onRefreshInit?.(); x.options.onRefresh?.(x); }); },
    update() { this.updateCalls++; events.push('update'); },
  };
  const gsap = { registerPlugin: value => registered.push(value) };
  globalThis.document = document;
  globalThis.window = { location: { hash }, performance: { getEntriesByType: () => [{ type: navigationType }] },
    innerHeight: 1000, innerWidth: 1200, getComputedStyle: () => ({ top: '88px', getPropertyValue: () => '72px' }), requestAnimationFrame: fn => frames.push(fn),
    matchMedia: () => media, addEventListener: (name, fn) => windowListeners.set(name, fn),
    ...(gsapAvailable ? { gsap } : {}), ...(pluginAvailable ? { ScrollTrigger: plugin } : {}),
  };
  const errors = []; t.mock.method(console, 'error', (...args) => errors.push(args));
  await import(`../app.js?test=${++run}`);
  return { scenes, prose, reading, quiz, title, root, fallback, triggers, registered, plugin, errors, anchors, events,
    active: () => triggers.filter(x => !x.killed),
    setReduced(value) { media.matches = value; mediaListeners.get('change')(); },
    flushFrames() { frames.splice(0).forEach(fn => fn()); },
    pagehide: () => windowListeners.get('pagehide')(), pageshow: () => windowListeners.get('pageshow')({ persisted: true }),
  };
}
function snapshot(scene) {
  const p = scene.parts;
  return { index: scene.dataset.currentStep, position: p['[data-position]'].textContent,
    activeLines: scene.codeLines.filter(line => line.classList.contains('is-active')).map(line => Number(line.dataset.codeLine)),
    graph: p['[data-state-canvas]'].querySelectorAll('[data-graph-id]').filter(node => Number(node.style.opacity) > 0).map(node => ({ id: node.dataset.graphId, label: node.querySelector('span').textContent, value: node.querySelector('strong').textContent, left: node.style.left, top: node.style.top, opacity: node.style.opacity })),
    edges: p['[data-state-canvas]'].querySelectorAll('[data-edge-id]').filter(node => Number(node.style.opacity) > 0).map(node => JSON.parse(node.dataset.edgeId)),
    label: p['[data-step-label]'].textContent, state: p['[data-step-state]'].textContent, output: p['[data-output]']?.textContent ?? '', empty: p['[data-output-empty]']?.hidden,
  };
}

test('only selected visualizations receive scroll controllers; prose, titles and answers stay in normal flow', async t => {
  const ui = await setup(t); assert.equal(ui.registered[0], ui.plugin); assert.equal(ui.active().length, 2); assert(ui.fallback.hidden);
  ui.active().forEach((trigger, i) => { assert.equal(trigger.options.trigger, ui.scenes[i].parts['[data-visualization-track]']); assert.equal(trigger.options.snap, undefined); assert.equal(trigger.options.pin, undefined); });
  for (const scene of ui.scenes) { assert(!scene.parts['.scene-stage'].hidden); assert(scene.parts['.visualization-fallback'].hidden); assert.equal(scene.parts['.scene-stage'].getAttribute('aria-hidden'), 'false'); }
  for (const element of [ui.prose, ui.reading, ui.quiz, ui.title]) assert(!element.hidden);
  assert.equal(ui.prose.textContent, '본문은 계속 그대로 읽을 수 있습니다.');
});

test('fast and reverse scroll synchronize code, objects and output without touching prose or neighboring visualizations', async t => {
  const ui = await setup(t), scene = ui.scenes[0], trigger = ui.active()[0], initial = snapshot(scene);
  for (const p of [.7, 1, .37, .99, 0]) {
    trigger.seek(p); const expected = sampleScene(source, motion, p), actual = snapshot(scene);
    assert.equal(actual.index, String(expected.index)); assert.deepEqual(actual.activeLines, expected.lines); assert.equal(actual.output, expected.output); assert.equal(actual.state, expected.state); assert.equal(actual.label, expected.label);
    const graph = layoutGraph(expected.nodes, source.diagram.type);
    assert.deepEqual(actual.graph.map(node => node.id).sort(), graph.items.map(item => item.id).sort());
    graph.items.forEach(item => { const node = actual.graph.find(node => node.id === item.id); assert(node); assert.equal(node.value, item.role === 'name' ? item.label : item.value); assert.equal(node.opacity, '1'); });
    assert.deepEqual(actual.edges.sort(), graph.edges.map(edge => [edge.from, edge.to]).sort());
    assert.equal(ui.prose.textContent, '본문은 계속 그대로 읽을 수 있습니다.');
  }
  assert.deepEqual(snapshot(scene), initial); assert.deepEqual(snapshot(ui.scenes[1]), initial);
});

test('new graph nodes animate while semantic frames retain DOM identities and the code camera exposes setup before following highlighted lines', async t => {
  const ui = await setup(t), scene = ui.scenes[0], trigger = ui.active()[0], pre = scene.parts['.stage-code'];
  assert.equal(pre.scrollTop, 0); const meaning = snapshot(scene);
  trigger.seek(.025); const firstOffset = pre.scrollTop; assert(firstOffset > 0); assert.deepEqual(snapshot(scene), meaning);
  trigger.seek(.06); assert(pre.scrollTop > firstOffset); trigger.seek(0); assert.equal(pre.scrollTop, 0);
  trigger.seek(.251); const first = snapshot(scene), canvas = scene.parts['[data-state-canvas]'], nodes = canvas.querySelectorAll('[data-graph-id]');
  trigger.seek(.28); const next = snapshot(scene); assert.notDeepEqual(first.graph, next.graph); assert.equal(first.state, next.state);
  assert.deepEqual(canvas.querySelectorAll('[data-graph-id]'), nodes); assert.equal(canvas.markupWrites, 1); assert.deepEqual(ui.anchors, []);
});

test('resize recomputes the selected stage distance and code camera at the same semantic state', async t => {
  const ui = await setup(t), scene = ui.scenes[0], trigger = ui.active()[0], pre = scene.parts['.stage-code'];
  trigger.seek(.4); const before = snapshot(scene), offset = pre.scrollTop;
  pre.clientHeight = 40; scene.parts['.scene-stage'].offsetHeight = 610; ui.plugin.refresh();
  assert.equal(snapshot(scene).state, before.state); assert(pre.scrollTop > offset);
  assert.equal(scene.parts['[data-visualization-track]'].style.getPropertyValue('--stage-height'), '896px');
});

test('unpinned visualization uses its normal document geometry without adding sticky distance', async t => {
  const section = structuredClone(source); section.visualization.pin = false;
  const ui = await setup(t, { section }); assert.equal(ui.active()[0].options.start(), 'top 85%'); assert.equal(ui.active()[0].options.end(), '+=900');
  assert.equal(ui.scenes[0].parts['[data-visualization-track]'].style.minHeight, undefined);
});

test('a malformed visualization falls back locally while the other visualization remains operational', async t => {
  const ui = await setup(t, { malformed: true }); assert.equal(ui.active().length, 1); assert.equal(ui.errors.length, 1);
  assert(ui.scenes[0].parts['.scene-stage'].hidden); assert(!ui.scenes[0].parts['.visualization-fallback'].hidden);
  assert(!ui.scenes[1].parts['.scene-stage'].hidden); ui.active()[0].seek(1); assert.equal(ui.scenes[1].parts['[data-output]'].textContent, source.output); assert(!ui.prose.hidden);
});

test('a render failure restores its own static states and does not dispose the other controller', async t => {
  const ui = await setup(t), scene = ui.scenes[0], triggers = ui.active();
  scene.parts['[data-step-state]'] = null; triggers[0].seek(.7); ui.flushFrames();
  assert(triggers[0].killed); assert(!triggers[1].killed); assert(scene.parts['.scene-stage'].hidden); assert(!scene.parts['.visualization-fallback'].hidden); assert.equal(ui.errors.length, 1);
});

test('changing reduced-motion preference restores static states and can prepare selective motion again', async t => {
  const ui = await setup(t), old = ui.active(); ui.setReduced(true);
  assert(old.every(x => x.killed)); assert.equal(ui.active().length, 0); assert(!ui.root.classList.contains('motion-on'));
  for (const scene of ui.scenes) { assert(scene.parts['.scene-stage'].hidden); assert(!scene.parts['.visualization-fallback'].hidden); }
  ui.setReduced(false); assert.equal(ui.active().length, 2); assert(ui.prose.textContent);
});

test('missing animation libraries keep every static state readable', async t => {
  const ui = await setup(t, { gsapAvailable: false }); assert.equal(ui.active().length, 0); assert(!ui.fallback.hidden);
  for (const scene of ui.scenes) { assert(scene.parts['.scene-stage'].hidden); assert(!scene.parts['.visualization-fallback'].hidden); }
});

test('an explicit initial anchor is aligned once after layout but reload and back navigation retain browser position', async t => {
  const ui = await setup(t, { hash: '#scene-1' }); assert.equal(ui.anchors.length, 1); assert.equal(ui.anchors[0].id, 'scene-1'); assert(ui.events.indexOf('refresh') < ui.events.indexOf('anchor'));
  ui.setReduced(true); ui.setReduced(false); assert.equal(ui.anchors.length, 1);
});
for (const navigationType of ['reload', 'back_forward']) test(`${navigationType} never receives an automatic anchor scroll`, async t => { const ui = await setup(t, { hash: '#scene-1', navigationType }); assert.deepEqual(ui.anchors, []); });

test('back-forward cache restoration recreates disposed controllers without moving the reading position', async t => {
  const ui = await setup(t); ui.pagehide(); assert.equal(ui.active().length, 0); ui.pageshow(); assert.equal(ui.active().length, 2); assert.deepEqual(ui.anchors, []);
});

test('short windows and zoom use a full readable unpinned stage rather than squeezing or clipping text', async t => {
  const ui = await setup(t); globalThis.window.innerHeight = 520; ui.plugin.refresh();
  for (const scene of ui.scenes) { assert.equal(scene.parts['[data-visualization-track]'].dataset.pin, 'false'); assert(!scene.parts['.visualization-fallback'].hidden); assert.equal(scene.parts['.visualization-fallback'].style.getPropertyValue('display'), 'block'); }
  assert.equal(ui.active()[0].options.start(), 'top 85%');
  globalThis.window.innerHeight = 1000; ui.plugin.refresh();
  for (const scene of ui.scenes) { assert.equal(scene.parts['[data-visualization-track]'].dataset.pin, 'true'); assert(scene.parts['.visualization-fallback'].hidden); }
});


test('every state boundary atomically presents its current values and relationships, including zero transition progress', async t => {
  const ui = await setup(t), scene = ui.scenes[0], trigger = ui.active()[0];
  for (const p of [0, .25, .250001, .6, .600001, 1, .6, .25, 0]) {
    trigger.seek(p); const state = sampleScene(source, motion, p), actual = snapshot(scene), graph = layoutGraph(state.nodes, source.diagram.type);
    assert.deepEqual(actual.graph.map(node => node.id).sort(), graph.items.map(node => node.id).sort());
    assert.deepEqual(actual.edges.sort(), graph.edges.map(edge => [edge.from, edge.to]).sort());
    for (const expected of graph.items) {
      const node = actual.graph.find(node => node.id === expected.id);
      assert.equal(node.value, expected.role === 'name' ? expected.label : expected.value);
      assert.equal(node.opacity, '1');
    }
    assert.equal(actual.state, state.state); assert.equal(actual.output, state.output); assert.deepEqual(actual.activeLines, [...state.lines].sort((a, b) => a - b));
  }
});

test('an unchanged object and its established name keep the same position when a new binding or object appears', async t => {
  const ui = await setup(t), scene = ui.scenes[0], trigger = ui.active()[0];
  const positions = ids => Object.fromEntries(snapshot(scene).graph.filter(node => ids.includes(node.id)).map(node => [node.id, [node.left, node.top]]));
  trigger.seek(.5); const established = positions(['object:정수 7', 'name:saved', 'name:birds']);
  for (const p of [.6, .600001, .7, .99, 1, .5]) { trigger.seek(p); assert.deepEqual(positions(Object.keys(established)), established); }
});

test('hidden graph nodes leave the accessibility tree and static code is never highlighted or used as a camera target', async t => {
  const ui = await setup(t), scene = ui.scenes[0], trigger = ui.active()[0], canvas = scene.parts['[data-state-canvas]'];
  for (const p of [0, .3, .8, 0]) {
    trigger.seek(p);
    for (const node of canvas.querySelectorAll('[data-graph-id]')) {
      const visible = Number(node.style.opacity) > 0;
      assert.equal(node.hidden, !visible); assert.equal(node.getAttribute('aria-hidden'), String(!visible));
    }
    assert(scene.fallbackLines.every(line => !line.classList.contains('is-active')));
    assert(scene.parts['.stage-code'].scrollTop < 9999);
  }
});

test('a changed value appears immediately in a reused object node while its stable identity and position remain intact', async t => {
  const section = structuredClone(source), sceneMotion = structuredClone(motion);
  section.visualization.stops = [0, .4, 1]; section.trace = section.trace.slice(0, 2);
  section.diagram.nodes = [{ label: 'items', value: '[9, 2]', objectId: 'same-list' }];
  sceneMotion.steps = [
    { lines: [3], nodes: [{ label: 'items', value: '[4, 2]', objectId: 'same-list' }], output: '' },
    { lines: [4], nodes: section.diagram.nodes, output: '' },
  ]; sceneMotion.finalNodes = section.diagram.nodes;
  const ui = await setup(t, { section, sceneMotion }), scene = ui.scenes[0], trigger = ui.active()[0];
  const before = snapshot(scene).graph.find(node => node.id === 'object:same-list');
  trigger.seek(.4); const after = snapshot(scene).graph.find(node => node.id === 'object:same-list');
  assert.equal(after.value, '[9, 2]'); assert.equal(after.left, before.left); assert.equal(after.top, before.top);
});


test('a malformed inline effect logs the failure without adding an error notice to the reading flow', async t => {
  const ui = await setup(t, { malformedEffect: true });
  assert.equal(ui.errors.length, 1); assert(ui.fallback.hidden); assert.equal(ui.active().length, 2); assert(!ui.prose.hidden);
});

const publishedMotion = JSON.parse(await readFile(new URL('../motion.json', import.meta.url), 'utf8'));
const curriculum = JSON.parse(await readFile(new URL('../curriculum.json', import.meta.url), 'utf8'));
for (const slug of curriculum.courses.flatMap(course => course.lessons)) {
  const lesson = JSON.parse(await readFile(new URL(`../lessons/${slug}.json`, import.meta.url), 'utf8'));
  for (const section of lesson.sections.filter(section => section.kind === 'visualization')) {
    test(`${section.id}: all published state boundaries present synchronized values, code and relationships`, async t => {
      const sceneMotion = publishedMotion.scenes[section.visualization.ref], ui = await setup(t, { section, sceneMotion });
      const trigger = ui.active()[0], scene = ui.scenes[0];
      let settled = null;
      for (const [index, p] of section.visualization.stops.entries()) {
        trigger.seek(p);
        const state = sampleScene(section, sceneMotion, p), actual = snapshot(scene), expected = layoutGraph(state.nodes, section.diagram.type);
        assert.equal(actual.state, state.state); assert.equal(actual.output, state.output); assert.deepEqual(actual.activeLines, [...state.lines].sort((a, b) => a - b));
        assert.deepEqual(actual.graph.map(node => node.id).sort(), expected.items.map(node => node.id).sort());
        assert.deepEqual(actual.edges.sort(), expected.edges.map(edge => [edge.from, edge.to]).sort());
        for (const item of expected.items) {
          const node = actual.graph.find(node => node.id === item.id);
          assert.equal(node.value, item.role === 'name' ? item.label : item.value);
          const prior = settled?.graph.find(other => other.id === item.id);
          if (prior) { assert.equal(node.left, prior.left, `${item.id} moved horizontally`); assert.equal(node.top, prior.top, `${item.id} moved vertically`); }
        }
        if (index < section.visualization.stops.length - 1) {
          trigger.seek(p + (section.visualization.stops[index + 1] - p) * .5);
          settled = snapshot(scene);
        }
      }
    });
  }
}


test('long code follows the first authored active line, including a call before its earlier function body', async t => {
  const section = structuredClone(source), sceneMotion = structuredClone(motion);
  section.code = Array.from({ length: 30 }, (_, i) => `# source line ${i + 1}`).join('\n');
  sceneMotion.steps[1].lines = [25, 3];
  const ui = await setup(t, { section, sceneMotion }), scene = ui.scenes[0];
  ui.active()[0].seek(.25);
  assert.deepEqual(snapshot(scene).activeLines, [3, 25]);
  assert.equal(scene.parts['.stage-code'].scrollTop, scene.codeLines[24].offsetTop - scene.parts['.stage-code'].clientHeight * .3);
  assert(scene.fallbackLines.every(line => !line.classList.contains('is-active')));
});


test('collection object values use the readable compact type treatment before they can overflow narrow canvases', async t => {
  const section = structuredClone(source), sceneMotion = structuredClone(motion);
  const nodes = [{ label: 'items', value: '[4, 2, 3]', objectId: 'a-list' }];
  sceneMotion.steps.forEach(step => step.nodes = nodes); sceneMotion.finalNodes = nodes;
  const ui = await setup(t, { section, sceneMotion });
  const node = ui.scenes[0].parts['[data-state-canvas]'].querySelectorAll('[data-graph-id]').find(node => node.dataset.graphId === 'object:a-list');
  assert(node.querySelector('strong').classList.contains('long-value'));
});


test('a diagram-only visualization synchronizes its relationships without requiring or inventing a code/output pane', async t => {
  const section = structuredClone(source), sceneMotion = structuredClone(motion);
  delete section.code; delete section.output;
  sceneMotion.steps.forEach(step => { delete step.lines; delete step.output; });
  const ui = await setup(t, { section, sceneMotion }), scene = ui.scenes[0], trigger = ui.active()[0];
  const initial = snapshot(scene);
  for (const p of [0, .25, .6, 1, .3, 0]) {
    trigger.seek(p); const state = sampleScene(section, sceneMotion, p), actual = snapshot(scene), graph = layoutGraph(state.nodes, section.diagram.type);
    assert.equal(actual.state, state.state); assert.equal(actual.label, state.label); assert.equal(actual.output, '');
    assert.deepEqual(actual.activeLines, []); assert.deepEqual(actual.edges.sort(), graph.edges.map(edge => [edge.from, edge.to]).sort());
    assert.equal(scene.querySelector('.stage-code'), null); assert.equal(scene.querySelector('[data-output]'), null); assert.equal(scene.querySelector('[data-output-empty]'), null);
  }
  assert.deepEqual(snapshot(scene), initial); assert.equal(ui.errors.length, 0); assert.equal(ui.active().length, 2);
});


test('unpinned progress depends on the figure height, never on the ordered fallback below it', async t => {
  const section = structuredClone(source); section.visualization.pin = false;
  const ui = await setup(t, { section }), scene = ui.scenes[0], trigger = ui.active()[0];
  const track = scene.parts['[data-visualization-track]'], stage = scene.parts['.scene-stage'];
  assert(!scene.parts['.visualization-fallback'].hidden);
  const before = trigger.options.end();
  track.offsetHeight += 9000; assert.equal(trigger.options.end(), before);
  stage.offsetHeight += 200; assert.equal(trigger.options.end(), `+=${stage.offsetHeight + window.innerHeight * .5}`);
  window.innerHeight = 520; assert.equal(trigger.options.end(), `+=${stage.offsetHeight + 260}`);
});
