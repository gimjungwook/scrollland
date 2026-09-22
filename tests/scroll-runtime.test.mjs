import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sampleScene } from '../lib/scroll-state.js';
import { layoutGraph, interpolateGraph } from '../lib/graph-layout.js';

const lesson = JSON.parse(await readFile(new URL('../lessons/variables.json', import.meta.url), 'utf8'));
const motion = JSON.parse(await readFile(new URL('../motion.json', import.meta.url), 'utf8'));
const source = lesson.sections[3];
const animation = motion.lessons.variables[3];
let run = 0;

function element() {
  const classes = new Set(); const properties = new Map(); const attributes = new Map();
  return {
    hidden: false, textContent: '', dataset: {}, innerHTML: '', scrollTop: 0,
    offsetTop: 0, clientHeight: 100, scrollHeight: 500,
    style: { setProperty: (key, value) => properties.set(key, value), getPropertyValue: key => properties.get(key) },
    classList: {
      add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value),
      toggle(value, enabled) { enabled ? classes.add(value) : classes.delete(value); },
    },
    setAttribute: (key, value) => attributes.set(key, String(value)),
    getAttribute: key => attributes.get(key),
  };
}

function makeScene(section = source, sceneMotion = animation) {
  const parts = Object.fromEntries([
    '[data-scene-data]', '.scene-stage', '[data-state-canvas]', '.stage-code', '[data-output]',
    '[data-output-empty]', '[data-scene-progress]', '[data-position]', '[data-step-label]',
    '[data-step-state]', '[data-state-caption]', '[data-step-body]',
  ].map(selector => [selector, element()]));
  parts['[data-scene-data]'].textContent = JSON.stringify({ section, motion: sceneMotion });
  parts['.scene-stage'].hidden = true;
  const canvas = parts['[data-state-canvas]'];
  const decode = value => value.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
  let markup = ''; let graphNodes = []; let graphEdges = [];
  canvas.markupWrites = 0;
  Object.defineProperty(canvas, 'innerHTML', {
    get: () => markup,
    set(value) {
      markup = value; canvas.markupWrites++;
      // Parse only the keyed elements emitted by prepareGraph. This is not a
      // browser DOM or a general HTML parser; layout remains browser QA's job.
      graphNodes = [...value.matchAll(/data-graph-id="([^"]+)"/g)].map(([, id]) => {
        const span = element(); const strong = element();
        return { ...element(), dataset: { graphId: decode(id) }, querySelector: selector => ({ span, strong })[selector] ?? null };
      });
      graphEdges = [...value.matchAll(/data-edge-id="([^"]+)"/g)].map(([, id]) => ({ ...element(), dataset: { edgeId: decode(id) } }));
    },
  });
  canvas.querySelectorAll = selector => ({ '[data-graph-id]': graphNodes, '[data-edge-id]': graphEdges })[selector] ?? [];
  const codeLines = section.code.split('\n').map((_, i) => ({ ...element(), dataset: { codeLine: String(i + 1) }, offsetTop: 20 + i * 24 }));
  const scene = {
    ...element(), parts, codeLines,
    querySelector: selector => parts[selector] ?? null,
    querySelectorAll: selector => selector === '[data-code-line]' ? codeLines : [],
  };
  return scene;
}

// The double executes the production controller and its GSAP callbacks. GSAP's
// interpolation and actual browser geometry are deliberately left to UI QA.
async function setup(t, { reduced = false, gsapAvailable = true, pluginAvailable = true, malformed = false, hash = '', navigationType = 'navigate', section = source, sceneMotion = animation } = {}) {
  const globals = Object.fromEntries(['document', 'window', 'location', 'requestAnimationFrame'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(globals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const scenes = [makeScene(section, sceneMotion), makeScene(section, sceneMotion)];
  scenes[0].id = 'variables-scene-4'; scenes[1].id = 'variables-scene-1';
  if (malformed) scenes[0].parts['[data-scene-data]'].textContent = '{';
  const answer = element();
  const check = { ...element(), querySelector: selector => selector === '[data-answer-reveal]' ? answer : null };
  const root = element(); const fallback = element(); const header = element();
  const targets = new Map([...scenes.map(scene => [scene.id, scene]), ['lesson-variables', { ...element(), id: 'lesson-variables' }]]);
  const anchorCalls = []; const navigationEvents = [];
  targets.forEach(target => {
    target.scrollIntoView = options => { anchorCalls.push({ id: target.id, options }); navigationEvents.push('anchor'); };
  });
  const document = {
    documentElement: root,
    getElementById: id => targets.get(id) ?? null,
    querySelector: selector => ({ '[data-motion-fallback]': fallback, '[data-header-current]': header })[selector] ?? null,
    querySelectorAll: selector => ({ '[data-scroll-scene]': scenes, '[data-scroll-check]': [check], '[data-lesson-article]': [] })[selector] ?? [],
  };
  const mediaListeners = new Map(); const windowListeners = new Map();
  const media = { matches: reduced, addEventListener: (name, callback) => mediaListeners.set(name, callback) };
  const tweens = []; const timelines = []; const contexts = []; const registered = [];
  const plugin = { refreshCalls: 0, updateCalls: 0, refresh() { this.refreshCalls++; navigationEvents.push('refresh'); }, update() { this.updateCalls++; navigationEvents.push('update'); }, create() {} };
  let activeContext;
  const gsap = {
    registerPlugin: value => registered.push(value),
    context(callback) {
      const context = { reverted: false, revertCalls: 0, revert() { this.reverted = true; this.revertCalls++; } };
      contexts.push(context); activeContext = context; callback(); activeContext = undefined;
      return context;
    },
    to(target, options) {
      const tween = {
        target, options, context: activeContext,
        seek(progress) {
          assert(!this.context?.reverted, 'a disposed controller must not receive updates');
          target.p = progress; options.onUpdate?.();
        },
      };
      tweens.push(tween); return tween;
    },
    fromTo(target, from, to) { const tween = { target, from, to, context: activeContext }; tweens.push(tween); return tween; },
    timeline(options) {
      const timeline = {
        options, context: activeContext, actions: [],
        fromTo(target, from, to, position) { this.actions.push({ target, from, to, position }); return this; },
        to(target, to, position) { this.actions.push({ target, to, position }); return this; },
      };
      timelines.push(timeline); return timeline;
    },
  };
  globalThis.document = document;
  const location = { hash }; const frames = [];
  const requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
  const flushFrames = () => {
    for (let batch = 0; frames.length && batch < 10; batch++) frames.splice(0).forEach(callback => callback());
    assert.equal(frames.length, 0, 'initialization must not schedule perpetual automatic progression');
  };
  globalThis.location = location; globalThis.requestAnimationFrame = requestAnimationFrame;
  globalThis.window = {
    location, requestAnimationFrame,
    performance: { getEntriesByType: type => type === 'navigation' ? [{ type: navigationType }] : [] },
    matchMedia(query) { assert.equal(query, '(prefers-reduced-motion: reduce)'); return media; },
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    ...(gsapAvailable ? { gsap } : {}), ...(pluginAvailable ? { ScrollTrigger: plugin } : {}),
  };
  const errors = [];
  if (malformed) t.mock.method(console, 'error', (...args) => errors.push(args));
  await import(`../app.js?scroll-runtime-test=${++run}`);
  flushFrames();
  return {
    scenes, root, fallback, answer, check, tweens, timelines, contexts, registered, plugin, errors, anchorCalls, navigationEvents, location,
    sceneTweens: () => tweens.filter(tween => typeof tween.options?.onUpdate === 'function'),
    setReduced(value) { media.matches = value; mediaListeners.get('change')(); flushFrames(); },
    pagehide: () => windowListeners.get('pagehide')(),
  };
}

function snapshot(scene) {
  const p = scene.parts;
  return {
    index: scene.dataset.currentStep,
    position: p['[data-position]'].textContent,
    activeLines: scene.codeLines.filter(line => line.classList.contains('is-active')).map(line => Number(line.dataset.codeLine)),
    graph: p['[data-state-canvas]'].querySelectorAll('[data-graph-id]').filter(node => Number(node.style.opacity) > 0).map(node => ({
      id: node.dataset.graphId, label: node.querySelector('span').textContent, value: node.querySelector('strong').textContent,
      left: node.style.left, top: node.style.top, opacity: node.style.opacity, transform: node.style.transform,
    })),
    label: p['[data-step-label]'].textContent,
    state: p['[data-step-state]'].textContent,
    body: p['[data-step-body]'].textContent,
    output: p['[data-output]'].textContent,
    emptyHidden: p['[data-output-empty]'].hidden,
  };
}

test('each learning scene receives a reversible, scroll-linked controller without manual controls', async t => {
  const ui = await setup(t);
  assert.equal(ui.registered[0], ui.plugin);
  assert.equal(ui.sceneTweens().length, ui.scenes.length);
  assert.equal(ui.root.classList.contains('motion-on'), true);
  assert.equal(ui.fallback.hidden, true);
  assert.equal(ui.plugin.refreshCalls, 1);
  ui.sceneTweens().forEach((tween, i) => {
    assert.equal(tween.options.scrollTrigger.trigger, ui.scenes[i]);
    assert.equal(tween.options.scrollTrigger.scrub, true, 'scene progress must follow scroll position, not a one-time entry animation');
    assert.equal(tween.options.scrollTrigger.once, undefined);
    assert.equal(tween.options.scrollTrigger.snap, undefined);
    assert.equal(tween.options.ease, 'none');
    assert.equal(ui.scenes[i].parts['.scene-stage'].hidden, false);
    assert.equal(ui.scenes[i].dataset.currentStep, '0');
  });
});

test('runtime updates code, diagram, narration and output in the same frame, including backward jumps', async t => {
  const ui = await setup(t);
  const scene = ui.scenes[0]; const tween = ui.sceneTweens()[0];
  const initial = snapshot(scene);
  for (const p of [0.62, 1, 0.37, 0.99, 0]) {
    tween.seek(p);
    const expected = sampleScene(source, animation, p);
    const actual = snapshot(scene);
    assert.equal(actual.index, String(expected.index));
    assert.deepEqual(actual.activeLines, expected.lines);
    assert.equal(actual.output, expected.output);
    assert.equal(actual.label, expected.label);
    assert.equal(actual.state, expected.state);
    assert.equal(actual.body, expected.body);
    assert.equal(actual.emptyHidden, expected.output !== '');
    const count = source.trace.length + 1;
    const prior = sampleScene(source, animation, (Math.max(0, expected.index - 1) + 0.5) / count);
    const progress = Math.min(1, expected.phase * 3);
    const graph = interpolateGraph(layoutGraph(prior.nodes, source.diagram.type), layoutGraph(expected.nodes, source.diagram.type), progress * progress * (3 - 2 * progress));
    for (const item of graph.items.filter(item => item.opacity > 0)) {
      const node = actual.graph.find(node => node.id === item.id);
      assert(node, `missing frame node ${item.id}`);
      assert.equal(node.value, item.role === 'name' ? item.label : item.value);
      assert.equal(node.left, `${item.x}%`);
      assert.equal(node.top, `${item.y}%`);
      assert.equal(node.opacity, String(item.opacity));
    }
    assert.equal(scene.parts['[data-state-canvas]'].dataset.frame, actual.index);
  }
  assert.deepEqual(snapshot(scene), initial);
  assert.deepEqual(snapshot(ui.scenes[1]), initial, 'one scene must not mutate another scene');
});

test('continuous motion changes within a step while preserving that step’s semantic content', async t => {
  const ui = await setup(t); const scene = ui.scenes[0]; const tween = ui.sceneTweens()[0];
  tween.seek(0.251);
  const first = snapshot(scene);
  const canvas = scene.parts['[data-state-canvas]'];
  const identities = canvas.querySelectorAll('[data-graph-id]');
  const camera = scene.parts['.stage-code'].scrollTop;
  tween.seek(0.27);
  const next = snapshot(scene);
  const { graph: firstGraph, ...firstMeaning } = first;
  const { graph: nextGraph, ...nextMeaning } = next;
  assert.deepEqual(nextMeaning, firstMeaning, 'within-step motion must not prematurely apply the next execution state');
  assert.notDeepEqual(nextGraph, firstGraph, 'node positions and opacity must continue changing between semantic boundaries');
  assert.deepEqual(canvas.querySelectorAll('[data-graph-id]'), identities, 'interpolation must retain the existing DOM nodes');
  assert.equal(canvas.markupWrites, 1, 'a progress update must not replace the graph markup');
  assert(scene.parts['.stage-code'].scrollTop > camera, 'the code viewport follows the same continuous progression');
  assert.equal(scene.parts['[data-scene-progress]'].style.transform, 'scaleX(0.27)');
});

test('the first code camera starts above the first emphasized line so setup and imports remain readable', async t => {
  const decorators = JSON.parse(await readFile(new URL('../lessons/decorators.json', import.meta.url), 'utf8'));
  const section = decorators.sections[2];
  const sceneMotion = motion.lessons.decorators[2];
  assert(section.code.startsWith('from functools import wraps'));
  assert(sceneMotion.steps[0].lines[0] > 1, 'the regression requires unhighlighted setup before the first emphasized line');
  const ui = await setup(t, { section, sceneMotion });
  const scene = ui.scenes[0]; const tween = ui.sceneTweens()[0];
  const pre = scene.parts['.stage-code'];
  const firstState = snapshot(scene);
  assert.equal(pre.scrollTop, 0, 'entry must expose the import at the start of the code');
  const count = section.trace.length + 1;
  tween.seek(1 / (6 * count));
  const intermediate = pre.scrollTop;
  assert(intermediate > 0, 'scrolling within the first step must move toward its emphasized line');
  assert.deepEqual(snapshot(scene), firstState, 'moving the initial code viewport must not advance the execution state');
  tween.seek(1 / (3 * count));
  assert(pre.scrollTop > intermediate, 'the initial code movement must interpolate instead of jumping at entry');
  tween.seek(0);
  assert.equal(pre.scrollTop, 0, 'reverse scrolling must reveal the import again');
  assert.deepEqual(ui.anchorCalls, [], 'moving the code viewport must not scroll the whole document');
});

test('code viewport geometry is recalculated without crossing an execution-state boundary', async t => {
  const ui = await setup(t); const scene = ui.scenes[0]; const tween = ui.sceneTweens()[0];
  const pre = scene.parts['.stage-code'];
  scene.codeLines.forEach(line => { line.offsetTop += 100; });
  tween.seek(0.27);
  const before = snapshot(scene); const oldCamera = pre.scrollTop;
  scene.codeLines.forEach(line => { line.offsetTop += 100; });
  tween.seek(0.27);
  assert(Math.abs(pre.scrollTop - oldCamera - 100) < 1e-9, 'the same scroll position must use the new code-line offsets after reflow');
  const afterOffsets = pre.scrollTop;
  pre.clientHeight += 40;
  tween.seek(0.27);
  assert(Math.abs(pre.scrollTop - afterOffsets + 12) < 1e-9, 'the code focal position must reflect the resized viewport height');
  assert.deepEqual(snapshot(scene), before, 'a size change cannot change the selected Python execution state');
});

test('a scroll-trigger refresh redraws the current progress even when the user has stopped scrolling', async t => {
  const ui = await setup(t); const scene = ui.scenes[0]; const tween = ui.sceneTweens()[0];
  const refresh = tween.options.scrollTrigger.onRefresh;
  assert.equal(typeof refresh, 'function', 'resize and refresh require a render callback independent of tween updates');
  tween.seek(1);
  const pre = scene.parts['.stage-code'];
  const finalState = snapshot(scene);
  pre.clientHeight = 180; pre.scrollHeight = 900;
  refresh({ progress: 1 });
  assert.equal(pre.scrollTop, 720, 'refresh must expose the end of the resized code pane without another wheel event');
  assert.deepEqual(snapshot(scene), finalState);
  refresh({ progress: 0 });
  assert.equal(scene.dataset.currentStep, '0', 'refresh must render the reported trigger progress instead of a stale tween value');
  assert.equal(pre.scrollTop, 0);
  assert.deepEqual(snapshot(scene).activeLines, animation.steps[0].lines);
  assert.deepEqual(ui.anchorCalls, []);
});

test('a long output is read from top to bottom by page progress and reverses without an inner scroll gesture', async t => {
  const loops = JSON.parse(await readFile(new URL('../lessons/for-range.json', import.meta.url), 'utf8'));
  const section = loops.sections[2];
  assert.equal(section.output.split('\n').length, 8, 'the regression uses the longest published output');
  const ui = await setup(t, { section, sceneMotion: motion.lessons['for-range'][2] });
  const scene = ui.scenes[0]; const tween = ui.sceneTweens()[0];
  const output = scene.parts['[data-output]'];
  output.clientHeight = 48; output.scrollHeight = 192;
  const count = section.trace.length + 1;
  const position = phase => (count - 1 + phase) / count;
  tween.seek(position(0.1));
  assert.equal(output.textContent, section.output);
  assert.equal(output.scrollTop, 0, 'a newly displayed result starts with its first line');
  tween.seek(position(0.575));
  const middle = output.scrollTop;
  assert(middle > 0 && middle < 144, 'scroll progress exposes the middle of the result without changing its contents');
  assert.equal(output.textContent, section.output);
  tween.seek(1);
  assert.equal(output.scrollTop, 144, 'the final output line must be reachable through page scrolling alone');
  tween.seek(position(0.575));
  assert(Math.abs(output.scrollTop - middle) < 1e-9, 'reverse scrolling restores the identical output viewport');
  tween.seek(position(0.1));
  assert.equal(output.scrollTop, 0);
  output.clientHeight = 240;
  tween.options.scrollTrigger.onRefresh({ progress: 1 });
  assert.equal(output.scrollTop, 0, 'a result that fits after resize needs no viewport movement');
  assert.equal(output.textContent, section.output);
  assert.deepEqual(ui.anchorCalls, []);
});

test('quiz answers reveal through scroll rather than a click callback', async t => {
  const ui = await setup(t);
  const timeline = ui.timelines.find(item => item.options.scrollTrigger.trigger === ui.check);
  assert(timeline, 'the quiz requires its own scroll controller');
  assert.equal(timeline.options.scrollTrigger.scrub, true);
  const reveal = timeline.actions.find(action => action.target === ui.answer);
  assert.equal(reveal.from.opacity, 0);
  assert.equal(reveal.to.opacity, 1);
  assert(reveal.position > 0, 'the answer must leave a scroll interval for considering the question');
});

test('a live reduced-motion change disposes old controllers and restores the complete static reading path', async t => {
  const ui = await setup(t);
  const original = ui.contexts[0];
  ui.setReduced(true);
  assert.equal(original.revertCalls, 1);
  assert.equal(ui.root.classList.contains('motion-on'), false);
  assert.equal(ui.fallback.hidden, false);
  assert.match(ui.fallback.textContent, /움직임 줄이기/);
  assert(ui.scenes.every(scene => scene.parts['.scene-stage'].hidden));
  ui.setReduced(false);
  assert.equal(ui.contexts.length, 2);
  assert.equal(ui.root.classList.contains('motion-on'), true);
  assert(ui.scenes.every(scene => !scene.parts['.scene-stage'].hidden));
  assert.equal(ui.sceneTweens().length, 4);
  assert.equal(ui.fallback.hidden, true);
  ui.pagehide();
  assert.equal(ui.contexts[1].revertCalls, 1);
});

test('initial reduced motion and missing animation libraries keep static content available', async t => {
  for (const options of [{ reduced: true }, { gsapAvailable: false }, { pluginAvailable: false }]) {
    await t.test(JSON.stringify(options), async subtest => {
      const ui = await setup(subtest, options);
      assert.equal(ui.sceneTweens().length, 0);
      assert.equal(ui.root.classList.contains('motion-on'), false);
      assert.equal(ui.fallback.hidden, false);
      assert(ui.scenes.every(scene => scene.parts['.scene-stage'].hidden));
    });
  }
});

test('malformed embedded data restores the static reading path instead of leaving an empty motion stage', async t => {
  const ui = await setup(t, { malformed: true });
  assert.equal(ui.root.classList.contains('motion-on'), false);
  assert.equal(ui.fallback.hidden, false);
  assert(ui.scenes.every(scene => scene.parts['.scene-stage'].hidden));
  assert.equal(ui.errors.length, 1);
});

test('normal scrolling and motion preference changes never initiate page navigation', async t => {
  const ui = await setup(t);
  for (const p of [0.7, 1, 0, 0.3]) ui.sceneTweens()[0].seek(p);
  ui.location.hash = '#variables-scene-4';
  ui.setReduced(true); ui.setReduced(false);
  assert.deepEqual(ui.anchorCalls, []);
  assert.equal(ui.plugin.updateCalls, 0);
});

test('an explicit initial URL anchor is completed once after layout refresh', async t => {
  for (const [hash, id] of [['#variables-scene-4', 'variables-scene-4'], ['#lesson-variables', 'lesson-variables'], ['#variables%2Dscene%2D4', 'variables-scene-4']]) {
    await t.test(hash, async subtest => {
      const ui = await setup(subtest, { hash });
      assert.deepEqual(ui.anchorCalls, [{ id, options: { behavior: 'instant', block: 'start' } }]);
      assert.deepEqual(ui.navigationEvents, ['refresh', 'anchor', 'update']);
      for (const p of [1, 0, 0.6]) ui.sceneTweens()[0].seek(p);
      ui.setReduced(true); ui.setReduced(false);
      assert.equal(ui.anchorCalls.length, 1, 'ordinary updates must not repeat the initial navigation');
      assert.equal(ui.plugin.updateCalls, 1);
    });
  }
});

test('missing or malformed initial fragments cannot trigger navigation or disable the reading path', async t => {
  for (const hash of ['#missing-lesson', '#%invalid', '#']) {
    await t.test(hash, async subtest => {
      const ui = await setup(subtest, { hash });
      assert.deepEqual(ui.anchorCalls, []);
      assert.equal(ui.plugin.updateCalls, 0);
      assert.equal(ui.root.classList.contains('motion-on'), true);
    });
  }
});

test('reload and history restoration keep the browser’s restored reading position', async t => {
  for (const navigationType of ['reload', 'back_forward']) {
    await t.test(navigationType, async subtest => {
      const ui = await setup(subtest, { hash: '#variables-scene-4', navigationType });
      assert.deepEqual(ui.anchorCalls, []);
      assert.equal(ui.plugin.updateCalls, 0);
    });
  }
});
