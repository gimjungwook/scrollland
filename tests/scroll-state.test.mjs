import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { clamp, sampleScene, validateMotion } from '../lib/scroll-state.js';
import { readContent, escapeHTML } from '../scripts/generate.mjs';
import { renderIndex, renderLesson } from '../scripts/render-scroll.mjs';

const section = {
  title: '이름의 연결 바꾸기',
  body: ['saved와 birds는 처음에 같은 객체를 가리킵니다.', '재대입은 birds의 연결만 바꿉니다.'],
  code: 'birds = 7\nsaved = birds\nbirds = birds + 1\nprint(birds)\nprint(saved)',
  output: '8\n7',
  diagram: {
    type: 'binding',
    nodes: [{ label: 'birds', value: '정수 8' }, { label: 'saved', value: '정수 7' }],
    caption: 'birds → 8, saved → 7',
  },
  trace: [
    { label: '최초 대입', state: 'birds → 7' },
    { label: '같은 객체 사용', state: 'saved → 7, birds → 7' },
    { label: '재대입 이후', state: 'birds → 8, saved → 7' },
  ],
};
const motionScene = {
  finalNodes: [{ label: 'birds', value: '정수 8' }, { label: 'saved', value: '정수 7' }],
  steps: [
    { lines: [1], nodes: [{ label: 'birds', value: '정수 7' }], output: '' },
    { lines: [2], nodes: [{ label: 'birds', value: '정수 7' }, { label: 'saved', value: '정수 7' }], output: '' },
    { lines: [3, 4, 5], nodes: [{ label: 'birds', value: '정수 8' }, { label: 'saved', value: '정수 7' }], output: '8\n7' },
  ],
};
const lessons = { example: { sections: [section] } };
const motion = () => ({ version: 1, lessons: { example: [structuredClone(motionScene)] } });
const sample = p => sampleScene(section, motionScene, p);
const inlineScenes = html => [...html.matchAll(/<script type="application\/json" data-scene-data>([\s\S]*?)<\/script>/g)].map(([, value]) => JSON.parse(value));

test('progress boundaries select complete, synchronized frames including the terminal result', () => {
  const expected = [
    { p: 0, index: 0, phase: 0 },
    { p: 0.249, index: 0, phase: 0.996 },
    { p: 0.25, index: 1, phase: 0 },
    { p: 0.5, index: 2, phase: 0 },
    { p: 0.75, index: 3, phase: 0 },
    { p: 1, index: 3, phase: 1 },
  ];
  for (const { p, index, phase } of expected) {
    const result = sample(p);
    assert.equal(result.index, index);
    assert.equal(result.phase, phase);
    assert.equal(result.count, 4);
    assert.equal(result.complete, index === 3);
    if (index < 3) {
      assert.equal(result.label, section.trace[index].label);
      assert.equal(result.state, section.trace[index].state);
      assert.deepEqual(result.lines, motionScene.steps[index].lines);
      assert.deepEqual(result.nodes, motionScene.steps[index].nodes);
      assert.equal(result.output, motionScene.steps[index].output);
    } else {
      assert.equal(result.label, '실행 과정 요약');
      assert.equal(result.state, section.diagram.caption);
      assert.deepEqual(result.lines, []);
      assert.deepEqual(result.nodes, motionScene.finalNodes);
      assert.equal(result.output, section.output);
    }
  }
});

test('reversing and jumping over frames reproduces the same position without accumulated state', () => {
  const positions = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
  const expected = positions.map(sample);
  for (const p of [1, 0, 0.97, 0.02, 0.5, 1, 0.25]) sample(p);
  for (let i = positions.length - 1; i >= 0; i--) assert.deepEqual(sample(positions[i]), expected[i]);
  for (let i = 0; i < positions.length; i++) assert.deepEqual(sample(positions[i]), expected[i]);
  const saved = sample(0.375).nodes.find(node => node.label === 'saved');
  assert.deepEqual(sample(0.625).nodes.find(node => node.label === 'saved'), saved, 'reassigning birds must preserve the saved binding');
});

test('the terminal result uses explicit final nodes instead of inferring completion from the last trace or caption', () => {
  const source = structuredClone(section);
  source.diagram.nodes = [{ label: 'birds의 현재 연결', value: '정수 8' }, { label: 'saved의 현재 연결', value: '정수 7' }];
  const authored = structuredClone(motionScene);
  authored.steps.at(-1).nodes = [{ label: 'birds', value: '정수 7' }, { label: 'saved', value: '정수 7' }];
  const before = sampleScene(source, authored, 0.74);
  const complete = sampleScene(source, authored, 0.75);
  assert.equal(complete.complete, true);
  assert.notDeepEqual(complete.nodes, before.nodes, 'the final trace can precede the actual end of the example');
  assert.deepEqual(complete.nodes, authored.finalNodes);
  assert.notDeepEqual(complete.nodes, source.diagram.nodes, 'a result caption is not a new set of variable identities');
  assert.equal(complete.output, source.output);
  assert.deepEqual(complete.lines, []);
  assert.deepEqual(sampleScene(source, undefined, 1).nodes, source.diagram.nodes, 'static-only content still has its original diagram fallback');
});

test('sampling cannot mutate lesson content or motion metadata', () => {
  const freeze = value => {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  };
  const lesson = freeze(structuredClone(section));
  const animation = freeze(structuredClone(motionScene));
  const before = JSON.stringify({ lesson, animation });
  for (const p of [0, 0.51, 1, 0.12, 0.9, 0]) sampleScene(lesson, animation, p);
  assert.equal(JSON.stringify({ lesson, animation }), before);
});

test('out-of-range positions clamp safely and paragraph selection stays within the source', () => {
  assert.deepEqual(sample(-1), sample(0));
  assert.deepEqual(sample(2), sample(1));
  for (const p of [NaN, Infinity, -Infinity, undefined, '0.5']) {
    assert.equal(clamp(p), 0);
    assert.deepEqual(sample(p), sample(0));
  }
  assert.equal(sample(0.499).body, section.body[0]);
  assert.equal(sample(0.5).body, section.body[1]);
  assert.equal(sample(1).body, section.body.at(-1));
});

test('a scene without optional motion has an honest textual state and the exact terminal output', () => {
  const before = sampleScene(section, undefined, 0);
  assert.deepEqual(before.lines, [], 'missing execution metadata must not invent an active code line');
  assert.deepEqual(before.nodes, [{ label: section.trace[0].label, value: section.trace[0].state }]);
  assert.equal(before.output, '');
  assert.deepEqual(sampleScene(section, undefined, 1).nodes, section.diagram.nodes);
  assert.equal(sampleScene(section, undefined, 1).output, section.output);
});

test('motion contract rejects missing scenes, mismatched steps and invalid code or state data', () => {
  assert.equal(validateMotion(motion(), lessons).version, 1);
  for (const [label, mutate] of [
    ['unsupported version', m => m.version = 2],
    ['missing lesson', m => delete m.lessons.example],
    ['missing scene', m => m.lessons.example = []],
    ['extra scene', m => m.lessons.example.push(structuredClone(motionScene))],
    ['missing step', m => m.lessons.example[0].steps.pop()],
    ['extra step', m => m.lessons.example[0].steps.push(structuredClone(motionScene.steps[0]))],
    ['missing final nodes', m => delete m.lessons.example[0].finalNodes],
    ['empty final nodes', m => m.lessons.example[0].finalNodes = []],
    ['nontext final node', m => m.lessons.example[0].finalNodes[0].value = 7],
    ['invalid final object identity', m => m.lessons.example[0].finalNodes[0].objectId = null],
    ['line zero', m => m.lessons.example[0].steps[0].lines = [0]],
    ['line beyond code', m => m.lessons.example[0].steps[0].lines = [6]],
    ['fractional line', m => m.lessons.example[0].steps[0].lines = [1.5]],
    ['string line', m => m.lessons.example[0].steps[0].lines = ['1']],
    ['missing line list', m => delete m.lessons.example[0].steps[0].lines],
    ['empty nodes', m => m.lessons.example[0].steps[0].nodes = []],
    ['nontext node', m => m.lessons.example[0].steps[0].nodes[0].value = 7],
    ['missing label', m => delete m.lessons.example[0].steps[0].nodes[0].label],
    ['nontext object identity', m => m.lessons.example[0].steps[0].nodes[0].objectId = 0],
    ['null object identity', m => m.lessons.example[0].steps[0].nodes[0].objectId = null],
    ['empty object identity', m => m.lessons.example[0].steps[0].nodes[0].objectId = ''],
    ['nontext output', m => m.lessons.example[0].steps[0].output = 7],
  ]) {
    const changed = motion(); mutate(changed);
    assert.throws(() => validateMotion(changed, lessons), undefined, label);
  }
});

test('every one of 44 lessons and 135 scenes is embedded in one continuous, non-click learning path', async () => {
  const content = await readContent();
  assert.equal(content.curriculum.courses.length, 8);
  assert.equal(content.order.length, 44);
  const html = renderIndex(content);
  const articles = [...html.matchAll(/<article class="lesson-article" id="lesson-([a-z0-9-]+)"/g)].map(([, slug]) => slug);
  assert.deepEqual(articles, content.order);
  const scenes = inlineScenes(html);
  assert.equal(scenes.length, 135);
  const expected = content.order.flatMap(slug => content.lessons[slug].sections);
  assert.deepEqual(scenes.map(scene => scene.section), expected);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length, 'a combined lesson page must not duplicate scene or anchor IDs');
  assert(!/<(?:button|input|select|textarea)\b/.test(html), 'the lesson journey must not depend on manual controls');
  for (const slug of content.order) assert(html.includes(`href="#lesson-${slug}"`));
});

test('static transcripts preserve every example, provided input, trace and answer without scripts', async () => {
  const content = await readContent();
  for (const slug of content.order) {
    const lesson = content.lessons[slug];
    const html = renderLesson(lesson, content);
    const transcripts = [...html.matchAll(/<div class="scene-transcript">([\s\S]*?)<\/div><script type="application\/json" data-scene-data>/g)].map(([, body]) => body);
    const inputs = new Map([...html.matchAll(/<aside class="scene-input-deck">([\s\S]*?)<\/aside><section class="scene" id="([^"]+)"/g)].map(([, body, id]) => [id, body]));
    assert.equal(transcripts.length, lesson.sections.length, slug);
    assert.equal((html.match(/<div class="scene-stage" hidden aria-hidden="true">/g) || []).length, lesson.sections.length, `${slug}: enhanced stages must start hidden`);
    lesson.sections.forEach((source, i) => {
      const transcript = transcripts[i];
      for (const text of [source.title, ...source.body, source.code, source.output, source.diagram.caption, ...source.trace.flatMap(step => [step.label, step.state])]) {
        assert(transcript.includes(escapeHTML(text)), `${slug}/${i}: missing static source text`);
      }
      const authored = content.motion.lessons[slug][i];
      const [, orderedStates, finalState] = transcript.match(/<ol>([\s\S]*?)<\/ol><h3>결과와 관계 확인<\/h3>([\s\S]*)$/) || [];
      assert(orderedStates && finalState, `${slug}/${i}: readable state history and terminal result must exist outside JSON`);
      const frames = [...orderedStates.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([, body]) => body);
      const pairs = body => [...body.matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)].map(([, label, value]) => [label, value]);
      const escapedPairs = nodes => nodes.map(node => [escapeHTML(node.label), escapeHTML(node.value)]);
      assert.equal(frames.length, authored.steps.length, `${slug}/${i}: each execution step must have readable state text`);
      authored.steps.forEach((step, index) => {
        assert.deepEqual(pairs(frames[index]), escapedPairs(step.nodes), `${slug}/${i}/${index}: static state must match the same animated frame`);
        assert(frames[index].includes(`<p>이 단계의 출력: ${escapeHTML(step.output || '(표준 출력 없음)')}</p>`), `${slug}/${i}/${index}: static step output is missing or from another frame`);
      });
      assert.deepEqual(pairs(finalState), escapedPairs(authored.finalNodes), `${slug}/${i}: static final state must use the explicit terminal nodes`);
      const input = inputs.get(`${slug}-scene-${i + 1}`) || '';
      if ('stdin' in source) assert(input.includes(escapeHTML(source.stdin || '(빈 입력)')), `${slug}/${i}: missing visible stdin before the scene`);
      for (const [name, text] of Object.entries(source.files || {})) {
        assert(input.includes(escapeHTML(name)), `${slug}/${i}: missing file name before the scene`);
        assert(input.includes(escapeHTML(text || '(빈 파일)')), `${slug}/${i}: missing file contents before the scene`);
      }
    });
    assert(html.includes('<div class="answer-reveal" data-answer-reveal>'), `${slug}: answer must be present before enhancement`);
    for (const option of lesson.quiz.options) {
      assert(html.includes(escapeHTML(option.text)), `${slug}: missing answer choice`);
      assert(html.includes(escapeHTML(option.feedback)), `${slug}: missing answer explanation`);
    }
    assert(!/<(?:button|input|select|textarea)\b/.test(html));
  }
});

test('embedded scene data cannot terminate its script or inject markup', async () => {
  const content = await readContent();
  const lesson = structuredClone(content.lessons[content.order[0]]);
  lesson.sections[0].body[0] = '</script><img src=x onerror="alert(1)">';
  const html = renderLesson(lesson, content);
  assert(!html.includes('</script><img src=x'));
  assert.equal(inlineScenes(html)[0].section.body[0], lesson.sections[0].body[0]);
  assert(html.includes(escapeHTML(lesson.sections[0].body[0])));
});

test('all authored motion frames match lesson identity, code bounds and synchronized terminal state', async () => {
  const content = await readContent();
  const authored = JSON.parse(await readFile(new URL('../motion.json', import.meta.url), 'utf8'));
  validateMotion(authored, content.lessons);
  assert.deepEqual(Object.keys(authored.lessons).sort(), [...content.order].sort(), 'motion metadata must cover exactly the published lessons');
  let count = 0;
  for (const slug of content.order) {
    const lesson = content.lessons[slug];
    const rendered = inlineScenes(renderLesson(lesson, content));
    lesson.sections.forEach((source, i) => {
      count++;
      const animated = authored.lessons[slug][i];
      assert.deepEqual(rendered[i].motion, animated, `${slug}/${i}: generated scene must use its own authored metadata`);
      animated.steps.forEach((step, index) => {
        const p = (index + 0.5) / (source.trace.length + 1);
        const frame = sampleScene(source, animated, p);
        assert.equal(frame.index, index);
        assert.deepEqual(frame.lines, step.lines, `${slug}/${i}/${index}: code emphasis is from a different frame`);
        assert.deepEqual(frame.nodes, step.nodes, `${slug}/${i}/${index}: diagram is from a different frame`);
        assert.equal(frame.output, step.output, `${slug}/${i}/${index}: output is from a different frame`);
        assert(source.output.startsWith(step.output), `${slug}/${i}/${index}: intermediate output is not a prefix of the verified final output`);
      });
      const end = sampleScene(source, animated, 1);
      assert.deepEqual(end.nodes, animated.finalNodes);
      assert.equal(end.output, source.output);
      const initial = sampleScene(source, animated, 0);
      sampleScene(source, animated, 1);
      assert.deepEqual(sampleScene(source, animated, 0), initial, `${slug}/${i}: reverse scroll does not restore the initial state`);
    });
  }
  assert.equal(count, 135);
});

test('the real default-argument lesson finishes with both returned lists instead of its earlier empty-list trace', async () => {
  const content = await readContent();
  const section = content.lessons.arguments.sections[2];
  const authored = content.motion.lessons.arguments[2];
  assert(authored.steps.at(-1).nodes.some(node => node.value.includes('[]')), 'this regression needs a last trace that precedes append and return');
  const complete = sampleScene(section, authored, 1);
  assert(complete.nodes.some(node => node.value.includes('[2]') && /반환|출력/.test(node.label)), 'the first call result must be identified as a returned or printed value');
  assert(complete.nodes.some(node => node.value.includes('[3]') && /반환|출력/.test(node.label)), 'the second call result must include the appended 3');
  assert(!complete.nodes.some(node => node.value.includes('[]')), 'the earlier empty local list is not the final result');
  const first = complete.nodes.find(node => node.value.includes('[2]'));
  const second = complete.nodes.find(node => node.value.includes('[3]'));
  assert(first.objectId && second.objectId, 'the two lists require explicit identities');
  assert.notEqual(first.objectId, second.objectId, 'independent calls must not be shown sharing a mutable default');
  assert.equal(complete.output, '[2]\n[3]');
});
