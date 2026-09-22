import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { fingerprint } from '../lib/contract.js';

const lesson = JSON.parse(await readFile(new URL('../lessons/variables.json', import.meta.url), 'utf8'));
let run = 0;

// This small DOM double exercises the asynchronous controller. Native focus and
// scroll behavior must also be checked in a browser.
async function setup(t) {
  const originals = Object.fromEntries(['document', 'window', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const element = () => ({
    hidden: false, disabled: false, tabIndex: 0, textContent: '', dataset: {}, attributes: new Map(), listeners: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    removeAttribute(name) { this.attributes.delete(name); },
    addEventListener(name, callback) { this.listeners.set(name, callback); }
  });
  const retry = element(); const message = element(); const notice = element(); const quiz = element();
  const other = element(); const focusCalls = []; const requests = [];
  notice.hidden = true; quiz.hidden = true;
  notice.querySelector = selector => ({ '[data-load-message]': message, '[data-retry]': retry })[selector];
  const document = {
    body: { dataset: { lessonSlug: lesson.slug, lessonSource: 'variables.json', contentFingerprint: fingerprint(lesson), sectionCount: String(lesson.sections.length) } },
    activeElement: other,
    querySelector: selector => ({ '.enhancement-notice': notice, '.quiz-options': quiz, '.quiz-feedback': element() })[selector] ?? null,
    querySelectorAll: selector => selector === '[data-option]' ? lesson.quiz.options.map(element) : []
  };
  message.focus = options => {
    focusCalls.push({ options, noticeHidden: notice.hidden, retryHidden: retry.hidden });
    document.activeElement = message;
  };
  globalThis.document = document;
  globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {} }), addEventListener() {} };
  globalThis.fetch = () => new Promise((resolve, reject) => requests.push({ resolve, reject }));
  await import(`../app.js?enhancement-test=${++run}`);
  const respond = async (index, ok = true) => {
    requests[index].resolve({ ok, status: ok ? 200 : 503, json: async () => lesson });
    await setImmediate();
  };
  return { document, retry, message, notice, quiz, other, focusCalls, requests, respond, click: () => retry.listeners.get('click')() };
}

test('initial enhancement succeeds without moving focus or showing the notice', async t => {
  const ui = await setup(t);
  await ui.respond(0);
  assert.equal(ui.document.activeElement, ui.other);
  assert.equal(ui.focusCalls.length, 0);
  assert.equal(ui.notice.hidden, true);
  assert.equal(ui.retry.hidden, true);
  assert.equal(ui.quiz.hidden, false);
});

test('focused retry keeps focus during loading and moves it to visible success text before hiding the button', async t => {
  const ui = await setup(t);
  await ui.respond(0, false);
  ui.document.activeElement = ui.retry;
  const pending = ui.click();
  assert.equal(ui.retry.disabled, false);
  assert.equal(ui.retry.attributes.get('aria-disabled'), 'true');
  assert.equal(ui.document.activeElement, ui.retry);
  await ui.click();
  assert.equal(ui.requests.length, 2, 'repeated activation must not start another request');
  await ui.respond(1); await pending;
  assert.equal(ui.document.activeElement, ui.message);
  assert.equal(ui.message.textContent, '답변 확인과 단계 강조를 사용할 수 있습니다.');
  assert.equal(ui.message.tabIndex, -1);
  assert.deepEqual(ui.focusCalls, [{ options: { preventScroll: true }, noticeHidden: false, retryHidden: false }]);
  assert.equal(ui.notice.hidden, false);
  assert.equal(ui.retry.hidden, true);
  assert.equal(ui.retry.attributes.has('aria-disabled'), false);
  await ui.click();
  assert.equal(ui.requests.length, 2, 'completed enhancement must not reload');
});

test('retry success preserves focus when the reader moves elsewhere while loading', async t => {
  const ui = await setup(t);
  await ui.respond(0, false);
  ui.document.activeElement = ui.retry;
  const pending = ui.click();
  ui.document.activeElement = ui.other;
  await ui.respond(1); await pending;
  assert.equal(ui.document.activeElement, ui.other);
  assert.equal(ui.focusCalls.length, 0);
  assert.equal(ui.notice.hidden, true);
  assert.equal(ui.retry.hidden, true);
});

test('a failed retry stays focused and available for another attempt', async t => {
  const ui = await setup(t);
  await ui.respond(0, false);
  ui.document.activeElement = ui.retry;
  const pending = ui.click();
  await ui.respond(1, false); await pending;
  assert.equal(ui.document.activeElement, ui.retry);
  assert.equal(ui.notice.hidden, false);
  assert.equal(ui.retry.hidden, false);
  assert.equal(ui.retry.disabled, false);
  assert.equal(ui.retry.attributes.has('aria-disabled'), false);
  assert.match(ui.message.textContent, /불러오지 못했습니다/);
  const recovered = ui.click();
  assert.equal(ui.requests.length, 3);
  await ui.respond(2); await recovered;
  assert.equal(ui.document.activeElement, ui.message);
  assert.equal(ui.quiz.hidden, false);
});
