import test from 'node:test';
import assert from 'node:assert/strict';

let run = 0;

// The observer double checks lifecycle and options; browser geometry needs UI QA.
async function setup(t) {
  const originals = Object.fromEntries(['document', 'window', 'IntersectionObserver'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const scenes = [1, 2, 3].map((number, index) => ({ id: `section-${number}`, getBoundingClientRect: () => ({ top: index * 100 }) }));
  const links = scenes.map(scene => ({
    dataset: { sceneLink: scene.id }, attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    removeAttribute(name) { this.attributes.delete(name); }
  }));
  const indicator = { textContent: '' }; const currentScene = { hidden: true };
  const focused = {}; const listeners = new Map(); const observers = [];
  const document = {
    body: { dataset: {} }, documentElement: { clientWidth: 1280, clientHeight: 400 }, activeElement: focused,
    querySelector: selector => ({ '[data-current-scene]': indicator, '.current-scene': currentScene })[selector] ?? null,
    querySelectorAll: selector => ({ '[data-scene]': scenes, '[data-scene-link]': links })[selector] ?? []
  };
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = []; this.disconnected = false; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
    emit(entries) { this.callback(entries, this); }
  }
  globalThis.document = document;
  globalThis.IntersectionObserver = Observer;
  globalThis.window = { IntersectionObserver: Observer, addEventListener: (type, callback) => listeners.set(type, callback) };
  await import(`../app.js?current-scene-test=${++run}`);
  return { document, focused, scenes, links, indicator, currentScene, observers, resize: () => listeners.get('resize')() };
}

test('current scene uses viewport height for pixel margins in a wide, short viewport', async t => {
  const ui = await setup(t);
  assert.equal(ui.observers.length, 1);
  assert.deepEqual(ui.observers[0].options, { rootMargin: '-40px 0px -120px 0px', threshold: 0 });
  assert.deepEqual(ui.observers[0].targets, ui.scenes);
  assert.equal(ui.currentScene.hidden, false);
  assert.equal(ui.indicator.textContent, '1 / 3');
  assert.equal(ui.links[0].attributes.get('aria-current'), 'location');
  assert.equal(ui.document.activeElement, ui.focused);
});

test('height changes replace the observer while preserving the last scene until new candidates arrive', async t => {
  const ui = await setup(t);
  const first = ui.observers[0];
  first.emit([{ target: ui.scenes[1], isIntersecting: true }]);
  assert.equal(ui.indicator.textContent, '2 / 3');
  ui.document.documentElement.clientWidth = 1000;
  ui.resize();
  assert.equal(ui.observers.length, 1, 'width-only resize must reuse the observer');
  assert.equal(first.disconnected, false);
  ui.document.documentElement.clientHeight = 800;
  ui.resize();
  assert.equal(ui.observers.length, 2);
  assert.equal(first.disconnected, true);
  const second = ui.observers[1];
  assert.deepEqual(second.options, { rootMargin: '-80px 0px -240px 0px', threshold: 0 });
  assert.deepEqual(second.targets, ui.scenes);
  assert.equal(ui.indicator.textContent, '2 / 3');
  assert.equal(ui.links[1].attributes.get('aria-current'), 'location');
  first.emit([{ target: ui.scenes[0], isIntersecting: true }]);
  assert.equal(ui.indicator.textContent, '2 / 3', 'queued callbacks from the old observer must be ignored');
  second.emit([{ target: ui.scenes[0], isIntersecting: false }]);
  assert.equal(ui.indicator.textContent, '2 / 3', 'an empty candidate set must preserve the last scene');
  second.emit([{ target: ui.scenes[2], isIntersecting: true }]);
  assert.equal(ui.indicator.textContent, '3 / 3', 'old visible candidates must not survive the resize');
  assert.equal(ui.links[1].attributes.has('aria-current'), false);
  assert.equal(ui.links[2].attributes.get('aria-current'), 'location');
  assert.equal(ui.document.activeElement, ui.focused);
  ui.resize();
  assert.equal(ui.observers.length, 2, 'unchanged height must not recreate an observer');
});
