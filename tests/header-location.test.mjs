import test from 'node:test';
import assert from 'node:assert/strict';

let run = 0;
async function setup(t, { reduced = false, libraries = true, hash = '', navigation = 'navigate', initialScroll = 0 } = {}) {
  const globals = Object.fromEntries(['document', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => Object.entries(globals).forEach(([key, descriptor]) => { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }));
  let scroll = initialScroll;
  const header = { textContent: '이전에 방문한 레슨' }, listeners = new Map(), mediaListeners = new Map(), anchors = [];
  const source = [
    { id: 'course-values', top: 64, title: '값으로 생각하기', kind: 'course' },
    { id: 'lesson-variables', top: 864, title: '값에 이름을 연결하기', kind: 'lesson' },
    { id: 'course-tools', top: 2864, title: '외부 도구와 데이터 연결하기', kind: 'course' },
    { id: 'lesson-modules', top: 3564, title: '모듈을 불러와 연결하기', kind: 'lesson' },
  ];
  const locations = source.map(item => ({ id: item.id, dataset: item.kind === 'lesson' ? { title: item.title } : {},
    querySelector: selector => selector === '.course-subtitle' && item.kind === 'course' ? { textContent: item.title } : null,
    getBoundingClientRect: () => ({ top: item.top - scroll }),
    scrollIntoView() { anchors.push(item.id); scroll = item.top - 64; },
  }));
  const root = { classList: { add() {}, remove() {} }, clientHeight: 800 };
  const media = { matches: reduced, addEventListener: (name, callback) => mediaListeners.set(name, callback) };
  const refreshListeners = new Set();
  const ScrollTrigger = { refresh() { refreshListeners.forEach(callback => callback()); }, update() {}, addEventListener(name, callback) { if (name === 'refresh') refreshListeners.add(callback); }, removeEventListener(name, callback) { if (name === 'refresh') refreshListeners.delete(callback); } };
  globalThis.document = { documentElement: root, getElementById: id => locations.find(location => location.id === id) || null,
    querySelector: selector => selector === '[data-header-current]' ? header : null,
    querySelectorAll: selector => selector === '[data-intro-kind="course"], [data-lesson-article]' ? locations : [],
  };
  globalThis.window = { innerHeight: 800, location: { hash }, performance: { getEntriesByType: () => [{ type: navigation }] },
    matchMedia: () => media, requestAnimationFrame: callback => callback(),
    addEventListener(name, callback, options) { if (!listeners.has(name)) listeners.set(name, new Map()); listeners.get(name).set(callback, options); },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
    ...(libraries ? { gsap: { registerPlugin() {} }, ScrollTrigger } : {}),
  };
  const emit = (name, event = {}) => [...(listeners.get(name)?.keys() || [])].forEach(callback => callback(event));
  await import(`../app.js?header-test=${++run}`);
  return { header, source, listeners, anchors, refresh: () => ScrollTrigger.refresh(),
    scrollTo(value) { scroll = value; emit('scroll'); },
    resize(height) { window.innerHeight = height; emit('resize'); },
    reduced(value) { media.matches = value; mediaListeners.get('change')(); },
    pagehide: () => emit('pagehide'), pageshow: () => emit('pageshow', { persisted: true }),
  };
}

test('initial position, skipped course boundaries and reverse scrolling update the actual reading location', async t => {
  const ui = await setup(t);
  assert.equal(ui.header.textContent, '값으로 생각하기');
  for (const [scroll, title] of [[900, '값에 이름을 연결하기'], [2920, '외부 도구와 데이터 연결하기'], [5000, '모듈을 불러와 연결하기'], [2900, '외부 도구와 데이터 연결하기'], [1000, '값에 이름을 연결하기'], [0, '값으로 생각하기']]) {
    ui.scrollTo(scroll); assert.equal(ui.header.textContent, title);
  }
  assert.equal(ui.anchors.length, 0);
  assert([...ui.listeners.get('scroll').values()].every(options => options.passive === true));
});

test('a direct course anchor reports the destination course after initial layout alignment', async t => {
  const ui = await setup(t, { hash: '#course-tools' });
  assert.deepEqual(ui.anchors, ['course-tools']); assert.equal(ui.header.textContent, '외부 도구와 데이터 연결하기');
});

for (const navigation of ['reload', 'back_forward']) test(`${navigation} uses the restored position without realigning a stale anchor`, async t => {
  const ui = await setup(t, { hash: '#course-values', navigation, initialScroll: 4000 });
  assert.equal(ui.header.textContent, '모듈을 불러와 연결하기'); assert.deepEqual(ui.anchors, []);
});

test('resizing recalculates the reading line, and returning from page cache reinstalls one observer', async t => {
  const ui = await setup(t); ui.scrollTo(2700); assert.equal(ui.header.textContent, '외부 도구와 데이터 연결하기');
  ui.resize(200); assert.equal(ui.header.textContent, '값에 이름을 연결하기');
  ui.pagehide(); assert.equal(ui.listeners.get('scroll').size, 0);
  ui.pageshow(); assert.equal(ui.listeners.get('scroll').size, 1); assert.equal(ui.header.textContent, '값에 이름을 연결하기');
  ui.resize(800); assert.equal(ui.header.textContent, '외부 도구와 데이터 연결하기');
});

for (const options of [{ reduced: true }, { libraries: false }]) test(`location remains available with ${options.reduced ? 'reduced motion' : 'missing motion libraries'}`, async t => {
  const ui = await setup(t, options); ui.scrollTo(2900); assert.equal(ui.header.textContent, '외부 도구와 데이터 연결하기');
  ui.scrollTo(5000); assert.equal(ui.header.textContent, '모듈을 불러와 연결하기'); assert.deepEqual(ui.anchors, []);
});

test('changing motion preference replaces rather than duplicates the location observer', async t => {
  const ui = await setup(t); ui.scrollTo(2920); ui.reduced(true); ui.reduced(false);
  assert.equal(ui.listeners.get('scroll').size, 1); assert.equal(ui.listeners.get('resize').size, 1);
  assert.equal(ui.header.textContent, '외부 도구와 데이터 연결하기');
});


test('a motion-layout refresh recomputes the current location even without a new scroll event', async t => {
  const ui = await setup(t); ui.scrollTo(2700); assert.equal(ui.header.textContent, '외부 도구와 데이터 연결하기');
  ui.source[2].top += 200; ui.source[3].top += 200; ui.refresh();
  assert.equal(ui.header.textContent, '값에 이름을 연결하기');
});
