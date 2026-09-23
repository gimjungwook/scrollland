import test from 'node:test';
import assert from 'node:assert/strict';
import { introGeometry, mountIntro, sampleIntro } from '../lib/intro-motion.js';

const offsets = [{ x: -64, y: 30, rotate: -18, scale: .84 }, { x: 52, y: -24, rotate: 12, scale: 1.08 }];
function node(dataset = {}) {
  const values = new Map(), priorities = new Map(), attributes = new Map(), classes = new Set();
  return { dataset, offsetHeight: 550, hidden: false, textContent: '제목과 본문은 계속 읽을 수 있습니다.',
    getBoundingClientRect() { return { top: (this.pageTop || 0) - (globalThis.window?.scrollY || 0), height: this.offsetHeight }; },
    style: { setProperty(name, value, priority = '') { values.set(name, String(value)); priorities.set(name, priority); }, getPropertyValue: name => values.get(name) || '', getPropertyPriority: name => priorities.get(name) || '', removeProperty(name) { values.delete(name); priorities.delete(name); } },
    setAttribute: (name, value) => attributes.set(name, String(value)), getAttribute: name => attributes.get(name) ?? null, removeAttribute: name => attributes.delete(name),
    classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
  };
}
function intro(kind = 'course') {
  const title = node(), art = node(), body = node(), line = node(), stage = node(), figureTrack = node(), figure = node(), focus = node();
  figure.offsetHeight = 350; figureTrack.pageTop = 100;
  const pieces = offsets.map(offset => node({ fromX: String(offset.x), fromY: String(offset.y), fromRotate: String(offset.rotate), fromScale: String(offset.scale) }));
  pieces[0].setAttribute('transform', 'translate(10 20)');
  title.style.setProperty('opacity', '.9');
  art.querySelectorAll = selector => ({ '[data-intro-piece]': pieces, '[data-intro-line]': [line] })[selector] || [];
  return { ...node({ introKind: kind, introMotif: 'course-1' }), title, art, pieces, line, body, stage, figureTrack, figure, focus,
    querySelector: selector => ({ '[data-intro-art]': art, '[data-intro-title]': title, '[data-intro-stage]': stage, '[data-intro-figure-track]': figureTrack, '[data-intro-figure]': figure, '[data-intro-lesson-focus]': focus })[selector] || null,
  };
}
function plugin(initialProgress = .4, onCreate = () => {}) {
  const triggers = [];
  return { triggers, create(options) {
    const trigger = { options, progress: initialProgress, killed: false, kill() { this.killed = true; }, seek(p) { this.progress = p; options.onUpdate?.(this); }, refresh() { options.onRefreshInit?.(this); if (!this.killed) options.onRefresh?.(this); } };
    triggers.push(trigger); onCreate(options); options.onRefresh?.(trigger); return trigger;
  }, refresh() { triggers.filter(trigger => !trigger.killed).forEach(trigger => trigger.refresh()); }, update() {} };
}
function snapshot(element) {
  const style = (target, properties) => Object.fromEntries(properties.map(name => [name, target.style.getPropertyValue(name)]));
  return { title: style(element.title, ['translate', 'scale', 'opacity']),
    pieces: element.pieces.map(piece => style(piece, ['translate', 'rotate', 'scale'])),
    line: style(element.line, ['stroke-dasharray', 'stroke-dashoffset']), progress: element.dataset.introProgress,
  };
}

test('intro sampling is reversible, bounded and deterministic without mutating authored offsets', () => {
  const pieces = Object.freeze(offsets.map(piece => Object.freeze({ ...piece })));
  const positions = [0, .1, .37, .75, 1], first = positions.map(p => sampleIntro('course', pieces, p));
  positions.toReversed().forEach((p, i) => assert.deepEqual(sampleIntro('course', pieces, p), first.at(-i - 1)));
  assert.deepEqual(first[0].pieces, offsets);
  assert(first.at(-1).pieces.every(piece => piece.x === 0 && piece.y === 0 && piece.rotate === 0 && piece.scale === 1));
  assert.equal(first[0].lineOffset, 1); assert.equal(first.at(-1).lineOffset, 0);
  assert.equal(first[0].title.y, 16); assert.equal(first[0].title.scale, .98); assert.deepEqual(first.at(-1).title, { y: 0, scale: 1 });
  for (const p of [-1, NaN, undefined]) assert.deepEqual(sampleIntro('course', pieces, p), first[0]);
  assert.deepEqual(sampleIntro('course', pieces, 9), first.at(-1));
});

test('lesson intros use smaller motion while preserving the same complete arrangement', () => {
  const course = sampleIntro('course', offsets, 0), lesson = sampleIntro('lesson', offsets, 0);
  assert(lesson.title.y < course.title.y); assert(lesson.title.scale > course.title.scale);
  lesson.pieces.forEach((piece, i) => { assert(Math.abs(piece.x) < Math.abs(course.pieces[i].x)); assert(Math.abs(piece.rotate) < Math.abs(course.pieces[i].rotate)); });
  assert.deepEqual(sampleIntro('course', offsets, 1), sampleIntro('lesson', offsets, 1));
});

test('mounting applies the current scroll position immediately without hiding content or overriding static SVG transforms', () => {
  const element = intro(), ScrollTrigger = plugin(.37), dispose = mountIntro(element, { ScrollTrigger });
  const expected = sampleIntro('course', offsets, .37);
  assert.equal(element.dataset.introStatus, 'ready'); assert.equal(element.dataset.introProgress, '0.37000');
  assert.equal(element.pieces[0].style.getPropertyValue('translate'), `${expected.pieces[0].x}px ${expected.pieces[0].y}px`);
  assert.equal(element.pieces[0].getAttribute('transform'), 'translate(10 20)');
  assert.equal(element.title.style.getPropertyValue('opacity'), '.9');
  for (const target of [element, element.title, element.art, element.body, ...element.pieces]) assert(!target.hidden);
  assert.equal(element.dataset.introMode, 'whole');
  assert.equal(ScrollTrigger.triggers[0].options.start(), -76); assert.equal(ScrollTrigger.triggers[0].options.end(), '+=560');
  assert.equal(ScrollTrigger.triggers[0].options.pin, undefined); assert.equal(ScrollTrigger.triggers[0].options.snap, undefined);
  dispose();
});

test('reverse scrolling and refresh reproduce identical intro styles at the same progress', () => {
  const element = intro(), ScrollTrigger = plugin(), dispose = mountIntro(element, { ScrollTrigger }), trigger = ScrollTrigger.triggers[0];
  trigger.seek(.63); const expected = snapshot(element);
  for (const p of [1, 0, .8, .63]) trigger.seek(p);
  assert.deepEqual(snapshot(element), expected); trigger.refresh(); assert.deepEqual(snapshot(element), expected);
  dispose();
});

test('disposal restores authored styles and SVG attributes for a complete static intro', () => {
  const element = intro(), ScrollTrigger = plugin();
  element.line.setAttribute('pathLength', '240'); element.line.style.setProperty('stroke-dashoffset', '0');
  element.pieces[0].style.setProperty('scale', '1', 'important');
  element.style.setProperty('--intro-travel', '0px', 'important');
  const before = snapshot(element), dispose = mountIntro(element, { ScrollTrigger });
  assert.equal(element.line.getAttribute('pathLength'), '1');
  dispose(); assert.deepEqual(snapshot(element), before); assert.equal(element.line.getAttribute('pathLength'), '240');
  assert.equal(element.pieces[0].style.getPropertyPriority('scale'), 'important'); assert.equal(element.dataset.introStatus, undefined); assert(ScrollTrigger.triggers[0].killed);
  assert.equal(element.dataset.introMode, undefined); assert.equal(element.style.getPropertyValue('--intro-travel'), '0px'); assert.equal(element.style.getPropertyPriority('--intro-travel'), 'important');
  for (const property of ['--intro-stage-height', '--intro-figure-height', '--intro-top']) assert.equal(element.style.getPropertyValue(property), '');
});

test('invalid authored offsets fail before changing the title or artwork', () => {
  for (const [name, value] of [['fromX', 'NaN'], ['fromY', '20px'], ['fromRotate', ''], ['fromScale', '0']]) {
    const element = intro(), before = snapshot(element); element.pieces[0].dataset[name] = value;
    assert.throws(() => mountIntro(element, { ScrollTrigger: plugin() })); assert.deepEqual(snapshot(element), before);
  }
});

test('a rendering failure restores only that intro and leaves neighboring intro motion operational', () => {
  const first = intro(), second = intro('lesson'), ScrollTrigger = plugin(), errors = [];
  let refreshes = 0;
  const before = snapshot(first), disposeFirst = mountIntro(first, { ScrollTrigger, reportError: (...args) => errors.push(args), requestRefresh: () => refreshes++ }), disposeSecond = mountIntro(second, { ScrollTrigger });
  const set = first.pieces[0].style.setProperty;
  first.pieces[0].style.setProperty = () => { throw new Error('unavailable geometry'); };
  ScrollTrigger.triggers[0].seek(.7);
  first.pieces[0].style.setProperty = set;
  assert.equal(errors.length, 1); assert.equal(first.dataset.introStatus, 'failed'); assert.deepEqual(snapshot(first), before);
  assert.equal(first.dataset.introMode, undefined); assert.equal(first.style.getPropertyValue('--intro-travel'), ''); assert.equal(refreshes, 1);
  assert(ScrollTrigger.triggers[0].killed); assert(!ScrollTrigger.triggers[1].killed); ScrollTrigger.triggers[1].seek(1); assert.equal(second.line.style.getPropertyValue('stroke-dashoffset'), '0');
  assert.equal(first.title.textContent, '제목과 본문은 계속 읽을 수 있습니다.');
  disposeFirst(); disposeSecond();
});

let appRun = 0;
async function app(t, { reduced = false, libraries = true, malformed = false, hash = '' } = {}) {
  const globals = Object.fromEntries(['window', 'document'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => Object.entries(globals).forEach(([name, descriptor]) => { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }));
  const intros = [intro(), intro('lesson')], events = [], errors = [], root = node(), fallback = node(), mediaListeners = new Map(), listeners = new Map();
  intros.forEach((element, i) => { element.id = `intro-${i}`; element.scrollIntoView = () => { assert.equal(intros[0].dataset.introMode, 'whole'); events.push('anchor'); }; });
  if (malformed) intros[0].pieces[0].dataset.fromX = 'invalid';
  const ScrollTrigger = plugin(.4, () => events.push('intro-created'));
  const media = { matches: reduced, addEventListener: (name, callback) => mediaListeners.set(name, callback) };
  globalThis.document = { documentElement: root,
    querySelector: selector => selector === '[data-motion-fallback]' ? fallback : null,
    querySelectorAll: selector => selector === '[data-intro]' ? intros : [],
    getElementById: id => intros.find(element => element.id === id) || null,
  };
  globalThis.window = { innerHeight: 800, scrollY: 0, getComputedStyle: () => ({ getPropertyValue: () => '64px' }), location: { hash }, performance: { getEntriesByType: () => [{ type: 'navigate' }] }, matchMedia: () => media,
    addEventListener: (name, callback) => listeners.set(name, callback), requestAnimationFrame: callback => callback(),
    ...(libraries ? { gsap: { registerPlugin() {} }, ScrollTrigger } : {}),
  };
  t.mock.method(console, 'error', (...args) => errors.push(args));
  await import(`../app.js?intro-test=${++appRun}`);
  return { intros, ScrollTrigger, root, fallback, events, errors,
    setReduced(value) { media.matches = value; mediaListeners.get('change')(); },
    pagehide: () => listeners.get('pagehide')(), pageshow: () => listeners.get('pageshow')({ persisted: true }),
    active: () => ScrollTrigger.triggers.filter(trigger => !trigger.killed),
  };
}

for (const options of [{ reduced: true }, { libraries: false }]) test(`static artwork remains complete when ${options.reduced ? 'reduced motion is requested' : 'animation libraries are unavailable'}`, async t => {
  const ui = await app(t, options); assert.equal(ui.active().length, 0);
  for (const element of ui.intros) { assert.equal(element.dataset.introStatus, undefined); assert.equal(element.line.style.getPropertyValue('stroke-dashoffset'), ''); assert.equal(element.title.style.getPropertyValue('translate'), ''); assert(!element.title.hidden); }
});

test('app lifecycle restores static intros for reduced motion and preserves held geometry through page cache', async t => {
  const ui = await app(t); assert.equal(ui.active().length, 2); const rendered = ui.intros.map(snapshot);
  ui.setReduced(true); assert.equal(ui.active().length, 0); assert(ui.intros.every(element => element.title.style.getPropertyValue('translate') === ''));
  ui.setReduced(false); assert.equal(ui.active().length, 2); assert.deepEqual(ui.intros.map(snapshot), rendered);
  const active = ui.active();
  ui.pagehide(); assert.deepEqual(ui.active(), active); assert.deepEqual(ui.intros.map(snapshot), rendered);
  ui.pageshow(); assert.deepEqual(ui.active(), active); assert.deepEqual(ui.intros.map(snapshot), rendered);
});

test('app settles course observation geometry before aligning an explicit initial anchor', async t => {
  const ui = await app(t, { hash: '#intro-1' }); assert.deepEqual(ui.events, ['intro-created', 'intro-created', 'anchor']);
  assert(ui.intros.every(element => element.dataset.introProgress === '0.40000'));
});

test('one invalid intro keeps its original text and does not interrupt the other intro or add a reading error notice', async t => {
  const ui = await app(t, { malformed: true }); assert.equal(ui.errors.length, 1); assert.equal(ui.active().length, 1); assert(ui.fallback.hidden);
  assert.equal(ui.intros[0].dataset.introStatus, 'failed'); assert.equal(ui.intros[1].dataset.introStatus, 'ready'); assert(!ui.intros[0].title.hidden);
});


test('a course completes its arrangement at 85% and holds it while still in the sticky observation range', () => {
  const complete = sampleIntro('course', offsets, .85);
  for (const progress of [.85, .9, 1]) {
    const sampled = sampleIntro('course', offsets, progress);
    assert.deepEqual(sampled.pieces, complete.pieces); assert.deepEqual(sampled.title, complete.title); assert.equal(sampled.lineOffset, 0);
  }
  assert(sampleIntro('course', offsets, .8).lineOffset > 0);
});

test('course geometry fits the complete stage or figure below the header and bounds the observation distance', () => {
  assert.deepEqual(introGeometry(800, 64, 712, 350), { mode: 'whole', top: 76, travel: 560 });
  assert.deepEqual(introGeometry(800, 64, 713, 350), { mode: 'figure', top: 76, travel: 560 });
  assert.deepEqual(introGeometry(400, 64, 713, 313), { mode: 'static', top: 76, travel: 0 });
  assert.equal(introGeometry(400, 64, 713, 312).travel, 320);
  assert.equal(introGeometry(2000, 64, 713, 350).travel, 720);
  assert.equal(introGeometry(70, 64, 10, 10).mode, 'static');
  assert.equal(introGeometry(800, 64, 0, 0).mode, 'static');
});

test('resize remeasures unpinned content and switches whole, figure and static modes without stale travel', () => {
  const element = intro(), ScrollTrigger = plugin(.4), before = snapshot(element);
  const measuredModes = [], stageHeight = { value: 550 };
  Object.defineProperty(element.stage, 'offsetHeight', { get() { measuredModes.push(element.dataset.introMode); return stageHeight.value; } });
  const dispose = mountIntro(element, { ScrollTrigger }), trigger = ScrollTrigger.triggers[0];
  const expected = snapshot(element); assert.equal(element.dataset.introMode, 'whole');
  stageHeight.value = 900; trigger.refresh();
  assert.equal(element.dataset.introMode, 'figure'); assert.equal(trigger.options.start(), 24); assert.deepEqual(snapshot(element), expected);
  element.figure.offsetHeight = 730; trigger.refresh();
  assert.equal(element.dataset.introMode, 'static'); assert.equal(element.style.getPropertyValue('--intro-travel'), '0px'); assert.equal(trigger.options.end(), '+=1');
  assert.deepEqual(snapshot(element), { ...before, progress: '1.00000' });
  trigger.seek(.1); assert.deepEqual(snapshot(element), { ...before, progress: '1.00000' });
  stageHeight.value = 550; trigger.refresh();
  assert.equal(element.dataset.introMode, 'whole'); trigger.seek(.4); assert.deepEqual(snapshot(element), expected);
  assert(measuredModes.every(mode => mode === undefined)); dispose();
});

test('course start follows normal-flow position even when its stage is already sticky or earlier courses change height', t => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'window');
  t.after(() => prior ? Object.defineProperty(globalThis, 'window', prior) : delete globalThis.window);
  globalThis.window = { scrollY: 400, innerHeight: 800 };
  const element = intro(), ScrollTrigger = plugin(); element.pageTop = 1000; element.stage.pageTop = 1030;
  const dispose = mountIntro(element, { ScrollTrigger }), options = ScrollTrigger.triggers[0].options;
  assert.equal(options.start(), 954);
  element.stage.getBoundingClientRect = () => ({ top: 76 }); window.scrollY = 1100;
  assert.equal(options.start(), 954, 'a sticky bounding box must not redefine the timeline');
  element.pageTop += 500; assert.equal(options.start(), 1454, 'start includes geometry changes from preceding courses');
  dispose();
});

test('viewport and header changes reevaluate the available observation space at refresh', t => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'window');
  t.after(() => prior ? Object.defineProperty(globalThis, 'window', prior) : delete globalThis.window);
  let header = 64;
  globalThis.window = { innerHeight: 900, scrollY: 0, getComputedStyle: () => ({ getPropertyValue: () => `${header}px` }) };
  const element = intro(), ScrollTrigger = plugin(), dispose = mountIntro(element, { ScrollTrigger }), trigger = ScrollTrigger.triggers[0];
  assert.equal(element.dataset.introMode, 'whole'); assert.equal(trigger.options.end(), '+=630');
  window.innerHeight = 450; header = 60; trigger.refresh();
  assert.equal(element.dataset.introMode, 'figure'); assert.equal(element.style.getPropertyValue('--intro-top'), '72px'); assert.equal(trigger.options.end(), '+=320');
  window.innerHeight = 400; trigger.refresh();
  assert.equal(element.dataset.introMode, 'static'); assert.equal(element.dataset.introProgress, '1.00000');
  window.innerHeight = 900; trigger.refresh();
  assert.equal(element.dataset.introMode, 'whole'); assert.equal(element.dataset.introProgress, '0.40000');
  dispose();
});

test('lesson animation uses its title/art focus and completes before that focus exits the viewport', () => {
  const element = intro('lesson'), ScrollTrigger = plugin(), dispose = mountIntro(element, { ScrollTrigger }), options = ScrollTrigger.triggers[0].options;
  assert.equal(options.trigger, element.focus); assert.equal(options.start, 'top 85%'); assert.equal(options.end, 'top 45%');
  assert.equal(element.dataset.introMode, undefined); assert.equal(element.style.getPropertyValue('--intro-travel'), ''); assert.equal(options.pin, undefined);
  dispose();
});
