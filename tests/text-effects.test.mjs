import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTextEffect, enterEffectTransition, sampleTextEffect, mountTextEffect } from '../lib/text-effects.js';
const effect = { preset: 'confetti', mode: 'enter', purpose: '문맥에 맞는 성취감 강조', start: 'top 85%', end: 'top 35%', duration: 1.1, reentry: 'once', exit: 'finish', initial: 'skip' };

test('custom effects require an explicit allowed preset and complete playback conditions', () => {
  assert.equal(validateTextEffect(effect), effect);
  for (const field of Object.keys(effect)) { const bad = { ...effect }; delete bad[field]; assert.throws(() => validateTextEffect(bad), undefined, field); }
  for (const change of [{ preset: '<script>' }, { mode: 'loop' }, { duration: 0 }, { duration: Infinity }, { start: 'top 10%' }, { end: 'top 101%' }, { purpose: '' }, { reentry: 'always' }]) assert.throws(() => validateTextEffect({ ...effect, ...change }));
});

test('enter once runs only on entry, never loops while a reader pauses, and does not replay on reverse entry', () => {
  let state = enterEffectTransition(null, -1, effect, true);
  state = enterEffectTransition(state, 0, effect); assert.equal(state.action, 'play');
  for (let i = 0; i < 10; i++) { state = enterEffectTransition(state, 0, effect); assert.equal(state.action, 'none'); }
  state = enterEffectTransition(state, 1, effect); assert.equal(state.action, 'none');
  state = enterEffectTransition(state, 0, effect); assert.equal(state.action, 'none');
});

test('repeat entry rearms only after leaving; cancel stops motion when scrolling past or before the phrase', () => {
  const settings = { ...effect, reentry: 'repeat', exit: 'cancel' };
  let state = enterEffectTransition(null, -1, settings, true);
  state = enterEffectTransition(state, 0, settings); assert.equal(state.action, 'play');
  state = enterEffectTransition(state, 0, settings); assert.equal(state.action, 'none');
  state = enterEffectTransition(state, -1, settings); assert.equal(state.action, 'cancel');
  state = enterEffectTransition(state, 0, settings); assert.equal(state.action, 'play');
  state = enterEffectTransition(state, 1, settings); assert.equal(state.action, 'cancel');
});

test('restored middle positions obey initial play or skip and offscreen effects never play on initial load', () => {
  assert.equal(enterEffectTransition(null, 0, effect, true).action, 'none');
  assert.equal(enterEffectTransition(null, 0, { ...effect, initial: 'play' }, true).action, 'play');
  for (const region of [-1, 1]) assert.equal(enterEffectTransition(null, region, { ...effect, initial: 'play' }, true).action, 'none');
  const played = { region: 0, played: true };
  assert.equal(enterEffectTransition(played, 0, { ...effect, initial: 'play' }, true).action, 'none');
});

test('a fast skipped range follows the authored exit policy instead of queuing effects or moving the document', () => {
  const before = { region: -1, played: false };
  assert.equal(enterEffectTransition(before, 1, effect).action, 'play');
  assert.equal(enterEffectTransition(before, 1, { ...effect, exit: 'cancel' }).action, 'cancel');
});

test('scrub effects are deterministic, local and rest at either endpoint without modifying text content', () => {
  for (const preset of ['lift', 'glow', 'confetti', 'burst']) {
    const config = { ...effect, preset, mode: 'scrub' };
    const middle = sampleTextEffect(config, .5);
    sampleTextEffect(config, 1); sampleTextEffect(config, 0);
    assert.deepEqual(sampleTextEffect(config, .5), middle);
    const start = sampleTextEffect(config, 0), end = sampleTextEffect(config, 1);
    assert.equal(start.lift, 0); assert.equal(start.glow, 0); assert.equal(start.particles, 0);
    assert(Math.abs(end.lift) + Math.abs(end.glow) + Math.abs(end.particles) < 1e-10);
    assert(!('text' in middle) && !('body' in middle) && !('learningState' in middle));
  }
});


function mounted(t, settings = effect) {
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  t.after(() => { if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else delete globalThis.document; });
  const node = () => ({ style: { removeProperty(key) { delete this[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())]; } }, dataset: {},
    children: [], attributes: {}, textContent: '그대로 읽히는 강조 문구',
    setAttribute(key, value) { this.attributes[key] = value; }, replaceChildren() { this.children = []; }, append(child) { this.children.push(child); },
  });
  globalThis.document = { createElement: node, documentElement: { clientWidth: 360 } };
  const text = node(), decoration = node(), element = { ...node(), dataset: { effect: JSON.stringify(settings) },
    querySelector: selector => ({ '.effect-text': text, '.effect-decoration': decoration })[selector], getBoundingClientRect: () => ({ left: 40, right: 140, width: 100, height: 32 }),
  };
  const memory = new WeakMap(), tweens = [], errors = [];
  let trigger;
  const ScrollTrigger = { create(options) {
    let position = 0;
    trigger = { start: 100, end: 300, progress: 0, killed: false, scroll: () => position, kill() { this.killed = true; },
      seek(value) { position = value; this.progress = Math.max(0, Math.min(1, (value - this.start) / (this.end - this.start))); options.onUpdate(this); },
      refresh() { options.onRefresh?.(this); },
    }; return trigger;
  } };
  const gsap = { to(position, options) { const tween = { killed: false, kill() { this.killed = true; }, advance(p) { position.p = p; options.onUpdate(); } }; tweens.push(tween); return tween; } };
  const dispose = mountTextEffect(element, { gsap, ScrollTrigger, memory, reportError: (...args) => errors.push(args) });
  return { element, text, decoration, trigger, tweens, errors, dispose };
}

test('mounted entry effects play locally once, preserve prose and remove decorative particles on disposal', t => {
  const ui = mounted(t); assert.equal(ui.tweens.length, 0); assert.equal(ui.decoration.children.length, 10);
  assert.equal(ui.decoration.attributes['aria-hidden'], 'true');
  ui.trigger.seek(150); assert.equal(ui.tweens.length, 1); ui.tweens[0].advance(.5);
  assert(ui.decoration.children.some(particle => Number(particle.style.opacity) > 0));
  assert.equal(ui.text.textContent, '그대로 읽히는 강조 문구');
  ui.tweens[0].advance(1); assert(ui.decoration.children.every(particle => particle.style.opacity === '0'));
  ui.trigger.seek(400); ui.trigger.seek(150); assert.equal(ui.tweens.length, 1);
  ui.dispose(); assert(ui.trigger.killed); assert(ui.tweens[0].killed); assert.equal(ui.decoration.children.length, 0);
});

test('mounted scrub effects reproduce the same phrase position after reverse scrolling and leave it static on disposal', t => {
  const ui = mounted(t, { ...effect, preset: 'lift', mode: 'scrub' });
  ui.trigger.seek(200); const top = ui.text.style.top; assert.equal(top, '-2.5px');
  ui.trigger.seek(300); assert.equal(ui.text.style.top, '0px'); ui.trigger.seek(200); assert.equal(ui.text.style.top, top);
  assert.equal(ui.tweens.length, 0); ui.dispose(); assert.equal(ui.text.style.top, undefined); assert.equal(ui.text.textContent, '그대로 읽히는 강조 문구');
});

test('a phrase rendering failure cancels only that effect and keeps its original text', t => {
  const ui = mounted(t, { ...effect, mode: 'scrub' });
  ui.element.getBoundingClientRect = () => { throw new Error('missing geometry'); };
  ui.trigger.seek(200); assert(ui.trigger.killed); assert.equal(ui.element.dataset.effectStatus, 'failed'); assert.equal(ui.errors.length, 1);
  assert.equal(ui.text.textContent, '그대로 읽히는 강조 문구'); assert(ui.decoration.children.every(particle => particle.style.opacity === '0'));
});


test('particles stay within the reading column and viewport without being clamped into the emphasized glyphs', t => {
  const ui = mounted(t, { ...effect, mode: 'scrub' });
  const reading = { left: 20, right: 340 };
  ui.element.closest = () => ({ getBoundingClientRect: () => reading });
  for (const rect of [
    { left: 20, right: 120, width: 100, height: 32 },
    { left: 240, right: 340, width: 100, height: 32 },
    { left: 20, right: 340, width: 320, height: 32 },
  ]) {
    ui.element.getBoundingClientRect = () => rect;
    for (const scroll of [101, 150, 200, 250, 299]) {
      ui.trigger.seek(scroll);
      for (const particle of ui.decoration.children) {
        const [, rawX, rawY] = particle.style.transform.match(/translate\(([-\d.e]+)px, ([-\d.e]+)px\)/);
        const x = Number(rawX), y = Number(rawY), center = rect.left + rect.width / 2;
        assert(center + x - 4 >= reading.left); assert(center + x + 4 <= reading.right);
        assert(Math.abs(x) >= rect.width / 2 + 7 || Math.abs(y) >= rect.height / 2 + 7);
      }
    }
  }
});

test('finished or cancelled particles have no transformed overflow, and refresh repositions an active entry effect after resize', t => {
  const ui = mounted(t);
  let rect = { left: 220, right: 340, width: 120, height: 32 };
  ui.element.getBoundingClientRect = () => rect;
  ui.element.closest = () => ({ getBoundingClientRect: () => ({ left: 20, right: document.documentElement.clientWidth - 20 }) });
  ui.trigger.seek(150); ui.tweens[0].advance(.5);
  document.documentElement.clientWidth = 280;
  rect = { left: 140, right: 260, width: 120, height: 32 };
  ui.trigger.refresh();
  for (const particle of ui.decoration.children) {
    const [, rawX] = particle.style.transform.match(/translate\(([-\d.e]+)px, ([-\d.e]+)px\)/);
    assert(rect.left + rect.width / 2 + Number(rawX) + 4 <= 260);
  }
  ui.tweens[0].advance(1);
  assert(ui.decoration.children.every(particle => particle.style.opacity === '0' && particle.style.transform === ''));
  ui.dispose(); assert.equal(ui.decoration.children.length, 0);
});
