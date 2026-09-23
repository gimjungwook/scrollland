import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { clamp, sampleScene, validateMotion } from '../lib/scroll-state.js';

const section = {
  id: 'example-reassignment', kind: 'visualization',
  title: '이름의 연결 바꾸기', body: ['두 이름은 같은 객체를 가리킵니다.', '재대입은 birds의 연결만 바꿉니다.'],
  code: 'birds = 7\nsaved = birds\nbirds = birds + 1\nprint(birds)\nprint(saved)', output: '8\n7',
  visualization: { ref: 'example-reassignment', pin: true, scrollDistance: 160, stops: [0, .2, .65, 1] },
  diagram: { type: 'binding', nodes: [{ label: 'birds', value: '정수 8' }, { label: 'saved', value: '정수 7' }], caption: 'birds → 8, saved → 7' },
  trace: [{ label: '최초 대입', state: 'birds → 7' }, { label: '같은 객체 사용', state: 'saved → 7, birds → 7' }, { label: '재대입 이후', state: 'birds → 8, saved → 7' }],
};
const authored = {
  finalNodes: [{ label: 'birds', value: '정수 8' }, { label: 'saved', value: '정수 7' }],
  steps: [
    { lines: [1], nodes: [{ label: 'birds', value: '정수 7' }], output: '' },
    { lines: [2], nodes: [{ label: 'birds', value: '정수 7' }, { label: 'saved', value: '정수 7' }], output: '' },
    { lines: [3, 4, 5], nodes: [{ label: 'birds', value: '정수 8' }, { label: 'saved', value: '정수 7' }], output: '8\n7' },
  ],
};
const sample = p => sampleScene(section, authored, p);
const lessons = () => ({ example: { sections: [structuredClone(section), { id: 'only-prose', kind: 'reading', body: ['읽기만 하는 문단입니다.'] }] } });
const motion = () => ({ version: 2, scenes: { [section.id]: structuredClone(authored) } });

test('authored nonuniform stops synchronize the code, values and output without selecting or replacing prose', () => {
  for (const [p, index, phase] of [[0, 0, 0], [.1, 0, .5], [.2, 1, 0], [.425, 1, .5], [.65, 2, 0], [1, 3, 1]]) {
    const frame = sample(p);
    assert.equal(frame.index, index); assert(Math.abs(frame.phase - phase) < 1e-10);
    assert.equal(frame.count, 4); assert.equal(frame.complete, index === 3);
    assert(!('body' in frame), 'the state controller must not choose a prose paragraph');
    if (!frame.complete) {
      assert.equal(frame.label, section.trace[index].label); assert.equal(frame.state, section.trace[index].state);
      assert.deepEqual(frame.lines, authored.steps[index].lines); assert.deepEqual(frame.nodes, authored.steps[index].nodes); assert.equal(frame.output, authored.steps[index].output);
    } else { assert.deepEqual(frame.nodes, authored.finalNodes); assert.equal(frame.output, section.output); assert.deepEqual(frame.lines, []); }
  }
});

test('reverse and skipped scroll positions reproduce the same state and preserve an unchanged binding', () => {
  const positions = [0, .199, .2, .43, .649, .65, .83, 1];
  const snapshots = positions.map(sample);
  for (const p of [1, 0, .9, .02, .43, 1]) sample(p);
  positions.toReversed().forEach((p, i) => assert.deepEqual(sample(p), snapshots.at(-i - 1)));
  assert.deepEqual(sample(.43).nodes.find(n => n.label === 'saved'), sample(.83).nodes.find(n => n.label === 'saved'));
});

test('final state uses explicit terminal identities, not the potentially earlier trace or descriptive diagram labels', () => {
  const source = structuredClone(section), state = structuredClone(authored);
  source.diagram.nodes[0].label = '현재 birds 연결'; state.steps.at(-1).nodes[0].value = '정수 7';
  assert.deepEqual(sampleScene(source, state, 1).nodes, state.finalNodes);
  assert.notDeepEqual(sampleScene(source, state, 1).nodes, sampleScene(source, state, .99).nodes);
  assert.deepEqual(sampleScene(source, undefined, 1).nodes, source.diagram.nodes);
});

test('sampling never mutates source data and clamps invalid positions', () => {
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const source = freeze(structuredClone(section)), state = freeze(structuredClone(authored)), before = JSON.stringify({ source, state });
  for (const p of [0, .51, 1, .12, .9, 0]) sampleScene(source, state, p);
  assert.equal(JSON.stringify({ source, state }), before);
  assert.deepEqual(sample(-1), sample(0)); assert.deepEqual(sample(2), sample(1));
  for (const p of [NaN, Infinity, undefined, '0.5']) { assert.equal(clamp(p), 0); assert.deepEqual(sample(p), sample(0)); }
});

test('reading sections need no motion entry while selected visualizations require exactly their own valid data', () => {
  assert.equal(validateMotion(motion(), lessons()).version, 2);
  assert.doesNotThrow(() => validateMotion({ version: 2, scenes: {} }, { prose: { sections: [{ kind: 'reading', body: ['텍스트'] }] } }));
  for (const [label, mutate] of [
    ['old version', m => m.version = 1], ['invalid scene map', m => m.scenes = 7], ['invalid step collection', m => m.scenes[section.id].steps = { length: 3 }], ['missing scene', m => delete m.scenes[section.id]],
    ['extra scene', m => m.scenes.orphan = structuredClone(authored)],
    ['missing step', m => m.scenes[section.id].steps.pop()], ['missing final state', m => delete m.scenes[section.id].finalNodes],
    ['invalid final identity', m => m.scenes[section.id].finalNodes[0].objectId = null],
    ['line zero', m => m.scenes[section.id].steps[0].lines = [0]], ['line past source', m => m.scenes[section.id].steps[0].lines = [6]],
    ['fractional line', m => m.scenes[section.id].steps[0].lines = [1.5]], ['missing code lines', m => delete m.scenes[section.id].steps[0].lines],
    ['empty nodes', m => m.scenes[section.id].steps[0].nodes = []], ['numeric value', m => m.scenes[section.id].steps[0].nodes[0].value = 7],
    ['empty identity', m => m.scenes[section.id].steps[0].nodes[0].objectId = ''], ['numeric output', m => m.scenes[section.id].steps[0].output = 7],
  ]) { const changed = motion(); mutate(changed); assert.throws(() => validateMotion(changed, lessons()), undefined, label); }
  for (const stops of [[0, .5, 1], [0, .5, .5, 1], [.1, .3, .6, 1], [0, .3, .6, .9], [0, .3, NaN, 1]]) {
    const changed = lessons(); changed.example.sections[0].visualization.stops = stops;
    assert.throws(() => validateMotion(motion(), changed));
  }
});

test('all selected published visualizations resolve by ID, preserve outputs and restore the initial state', async () => {
  const curriculum = JSON.parse(await readFile(new URL('../curriculum.json', import.meta.url), 'utf8'));
  const lessons = Object.fromEntries(await Promise.all(curriculum.courses.flatMap(course => course.lessons).map(async slug => [slug, JSON.parse(await readFile(new URL(`../lessons/${slug}.json`, import.meta.url), 'utf8'))])));
  const motion = JSON.parse(await readFile(new URL('../motion.json', import.meta.url), 'utf8'));
  validateMotion(motion, lessons);
  let selected = 0, reading = 0;
  for (const lesson of Object.values(lessons)) for (const source of lesson.sections) {
    if (source.kind === 'reading') { reading++; continue; }
    selected++; const scene = motion.scenes[source.visualization.ref];
    scene.steps.forEach((step, i) => {
      const frame = sampleScene(source, scene, source.visualization.stops[i]);
      assert.equal(frame.index, i); assert.deepEqual(frame.nodes, step.nodes); assert.deepEqual(frame.lines, step.lines); assert.equal(frame.output, step.output);
      assert(source.output.startsWith(step.output), `${source.id}: intermediate output differs from verified final output`);
    });
    const initial = sampleScene(source, scene, 0), final = sampleScene(source, scene, 1);
    assert.deepEqual(final.nodes, scene.finalNodes); assert.equal(final.output, source.output); assert.deepEqual(sampleScene(source, scene, 0), initial);
  }
  assert(reading > 0 && selected > 0, 'the published reading path must distinguish normal reading from chosen visualizations');
  assert.equal(Object.keys(motion.scenes).length, selected);
});


test('diagram-only motion permits omitted or empty code/output metadata and rejects invented source lines or output', () => {
  const source = structuredClone(section), scene = structuredClone(authored);
  delete source.code; delete source.output;
  scene.steps.forEach(step => { delete step.lines; delete step.output; });
  const validate = value => validateMotion({ version: 2, scenes: { [source.id]: value } }, { diagram: { sections: [source] } });
  assert.doesNotThrow(() => validate(scene));
  for (const p of [0, .2, .65, 1]) { const state = sampleScene(source, scene, p); assert.deepEqual(state.lines, []); assert.equal(state.output, ''); }
  scene.steps.forEach(step => { step.lines = []; step.output = ''; });
  assert.doesNotThrow(() => validate(scene));
  for (const [field, value] of [['lines', [1]], ['lines', [0]], ['lines', null], ['output', 'invented'], ['output', null]]) {
    const invalid = structuredClone(scene); invalid.steps[0][field] = value; assert.throws(() => validate(invalid));
  }
});
