import test from 'node:test';
import assert from 'node:assert/strict';

let run = 0;
const tracked = new WeakSet(), key = '__scrolllandReadingPosition';
const address = 'https://scrollland.test/index.html#lesson-functions';
function history(initial = { otherState: { preserved: true } }) {
  let state = initial;
  return { get state() { return state; }, replaceState(value) { state = value; } };
}
async function page(t, { navigation = 'navigate', entry = address, savedHistory = history(), initialY = 0, malformedEffect = false } = {}) {
  if (!tracked.has(t)) {
    tracked.add(t);
    const globals = Object.fromEntries(['window', 'document'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    t.after(() => Object.entries(globals).forEach(([name, descriptor]) => descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name]));
  }
  const listeners = new Map(), frames = [], events = [], anchors = [], scrolls = [], errors = [];
  let fontsLoaded = false, y = initialY, resolveFonts;
  const root = { classList: { add() {}, remove() {} } };
  const target = {
    top: 10000,
    getBoundingClientRect: () => ({ top: target.top - y }),
    scrollIntoView() { events.push('anchor'); anchors.push(target.top); y = target.top - 88; },
  };
  const plugin = { refresh() { target.top = fontsLoaded ? 18000 : 10000; events.push('refresh'); }, update() { events.push('update'); } };
  const document = {
    readyState: 'loading', documentElement: root, fonts: { ready: new Promise(resolve => { resolveFonts = resolve; }) },
    querySelector: () => null,
    querySelectorAll: selector => selector === '.text-effect[data-effect]' && malformedEffect ? [{ dataset: { effect: '{' } }] : [],
    getElementById: id => id === 'lesson-functions' ? target : null,
  };
  const window = {
    location: { href: entry, hash: new URL(entry).hash }, history: savedHistory, innerHeight: 900, scrollX: 0,
    get scrollY() { return y; }, scrollTo(options) { scrolls.push(options); events.push('restore'); y = Math.min(options.top, fontsLoaded ? 250000 : 147858); },
    performance: { getEntriesByType: () => [{ type: navigation }] }, matchMedia: () => ({ matches: false, addEventListener() {} }),
    gsap: { registerPlugin() {} }, ScrollTrigger: plugin,
    requestAnimationFrame: callback => frames.push(callback),
    addEventListener(name, callback, options) { if (!listeners.has(name)) listeners.set(name, new Map()); listeners.get(name).set(callback, options); },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
  };
  const emit = (name, detail = {}) => [...(listeners.get(name) || [])].forEach(([callback, options]) => { callback({ type: name, ...detail }); if (options?.once) listeners.get(name).delete(callback); });
  globalThis.window = window; globalThis.document = document;
  t.mock.method(console, 'error', (...args) => { errors.push(args); events.push('effect-mounted'); });
  await import(`../app.js?position-test=${++run}`);
  const flush = async () => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
    while (frames.length) frames.splice(0).forEach(callback => callback());
  };
  return { target, window, document, history: savedHistory, events, anchors, scrolls, errors, emit, flush,
    load() { document.readyState = 'complete'; emit('load'); },
    fonts() { fontsLoaded = true; resolveFonts(); },
    userScroll(to, input = 'wheel', detail = {}) { emit(input, detail); y = to; },
    current: () => y,
    async complete() { this.load(); this.fonts(); await flush(); },
  };
}

test('a fresh direct link waits for fonts and load, then aligns before mounting phrase effects', async t => {
  const ui = await page(t, { malformedEffect: true });
  assert.deepEqual(ui.anchors, []); assert.equal(ui.errors.length, 0);
  ui.load(); await ui.flush(); assert.deepEqual(ui.anchors, []);
  ui.fonts(); await ui.flush();
  assert.deepEqual(ui.anchors, [18000]); assert.equal(ui.target.getBoundingClientRect().top, 88);
  assert(ui.events.indexOf('anchor') < ui.events.indexOf('effect-mounted'));
  ui.emit('load'); await ui.flush(); assert.equal(ui.anchors.length, 1);
});

test('font completion alone does not race the browser load and native position restoration', async t => {
  const ui = await page(t); ui.fonts(); await ui.flush(); assert.deepEqual(ui.anchors, []);
  ui.load(); await ui.flush(); assert.deepEqual(ui.anchors, [18000]);
});

for (const input of ['wheel', 'touchstart', 'pointerdown', 'hashchange', 'keydown']) test(`${input} intent cancels a delayed initial correction`, async t => {
  const ui = await page(t); ui.userScroll(1234, input, { key: 'PageDown' }); await ui.complete();
  assert.deepEqual(ui.anchors, []); assert.deepEqual(ui.scrolls, []); assert.equal(ui.current(), 1234);
});

test('native scroll events do not cancel a required direct-link correction', async t => {
  const ui = await page(t); ui.emit('scroll'); await ui.complete(); assert.deepEqual(ui.anchors, [18000]);
});

for (const navigation of ['reload', 'back_forward']) test(`${navigation} restores a saved enhanced-page coordinate after fonts instead of retaining an early native clamp`, async t => {
  const savedHistory = history({ otherState: { preserved: true }, [key]: { url: address, x: 0, y: 163988 } });
  const ui = await page(t, { navigation, savedHistory, initialY: 147858 });
  assert.equal(ui.current(), 147858); await ui.complete();
  assert.equal(ui.current(), 163988); assert.equal(ui.scrolls.length, 1); assert.deepEqual(ui.anchors, []);
  assert.deepEqual(savedHistory.state.otherState, { preserved: true });
});

test('leaving saves only URL and scroll coordinates without discarding foreign history state', async t => {
  const ui = await page(t); await ui.complete(); ui.userScroll(163988); ui.emit('pagehide');
  assert.deepEqual(ui.history.state, { otherState: { preserved: true }, [key]: { url: address, x: 0, y: 163988 } });
  assert.equal(ui.current(), 163988);
  const next = await page(t, { navigation: 'reload', savedHistory: ui.history, initialY: 147858 }); await next.complete();
  assert.equal(next.current(), 163988); assert.deepEqual(next.anchors, []);
});

test('back-forward cache uses the saved coordinate without reapplying the initial anchor', async t => {
  const ui = await page(t); await ui.complete(); ui.userScroll(42000); ui.emit('pagehide');
  ui.window.scrollTo({ top: 30000 }); ui.emit('pageshow', { persisted: true }); await ui.flush();
  assert.equal(ui.current(), 42000); assert.equal(ui.anchors.length, 1);
});

test('input after cache return cancels its pending restoration too', async t => {
  const ui = await page(t); await ui.complete(); ui.userScroll(42000); ui.emit('pagehide');
  ui.emit('pageshow', { persisted: true }); ui.userScroll(30000); await ui.flush();
  assert.equal(ui.current(), 30000);
});

test('reload with another URL or malformed saved coordinates leaves restoration to the browser', async t => {
  for (const saved of [{ url: `${address}-other`, x: 0, y: 42 }, { url: address, x: 0, y: NaN }]) {
    const ui = await page(t, { navigation: 'reload', savedHistory: history({ [key]: saved }), initialY: 5678 }); await ui.complete();
    assert.deepEqual(ui.scrolls, []); assert.deepEqual(ui.anchors, []); assert.equal(ui.current(), 5678);
  }
});

test('input before reload settlement keeps the reader position instead of restoring saved coordinates', async t => {
  const ui = await page(t, { navigation: 'reload', savedHistory: history({ [key]: { url: address, x: 0, y: 163988 } }) });
  ui.userScroll(2000); await ui.complete(); assert.equal(ui.current(), 2000); assert.deepEqual(ui.scrolls, []);
});
