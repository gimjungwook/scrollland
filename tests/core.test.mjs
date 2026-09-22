import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateLesson, validateCurriculum, fingerprint } from '../lib/contract.js';
import { renderLesson, renderIndex, renderNotFound, normalizeBasePath, escapeHTML } from '../scripts/generate.mjs';
import { executeExample, normalizeOutput } from '../scripts/validate-examples.mjs';

const section = { title: '이름으로 결과 읽기', body: ['이름은 객체를 가리킵니다.', '코드를 읽고 결과를 비교합니다.'], code: 'print(2)', output: '2', diagram: { type: 'binding', nodes: [{ label: '이름', value: 'x' }, { label: '값', value: '2' }], caption: 'x는 2를 가리킵니다.' }, trace: [{ label: '실행 전', state: '출력 전' }, { label: '실행 후', state: '2 출력' }] };
const fixture = () => ({ slug: 'example', courseId: 'values', title: '예제 읽기', problem: '어떤 수가 출력될까요?', goal: '출력된 수를 설명합니다.', prerequisites: [], topics: ['print', '출력'], takeaway: 'print는 값을 출력합니다.', sections: [structuredClone(section), structuredClone(section), structuredClone(section)], quiz: { question: '출력은?', options: [{ text: '2', correct: true, feedback: '2가 출력됩니다.' }, { text: '3', correct: false, feedback: '코드의 숫자를 다시 읽으세요.' }, { text: '없음', correct: false, feedback: 'print가 있습니다.' }] }, sourceUrls: ['https://docs.python.org/3/tutorial/'] });
const content = () => { const lesson = fixture(); return { curriculum: { title: 'ScrollLand', subtitle: 'Python 코드와 결과를 비교합니다.', language: 'ko', pythonVersion: '3.10+', courses: [{ id: 'values', title: '값', question: '값을 어떻게 읽을까요?', lessons: ['example'] }] }, lessons: { example: lesson }, order: ['example'] }; };

test('data contract accepts complete content and forbids invalid types or incomplete choices', () => {
  assert.equal(validateLesson(fixture()).slug, 'example');
  for (const mutate of [l => l.sections[0].body = ['one'], l => l.sections[0].diagram.type = 'unknown', l => l.quiz.options[1].correct = true, l => l.sections[0].trace = [], l => l.topics = [], l => l.sections[0].diagram.nodes[0].value = '', l => l.quiz.options[0].correct = 'true']) { const l = fixture(); mutate(l); assert.throws(() => validateLesson(l)); }
});
test('input fixtures permit empty contents but reject path traversal and absolute paths', () => {
  const l = fixture(); l.sections[0].output = ''; l.sections[0].stdin = ''; l.sections[0].files = { 'data/empty.txt': '' }; validateLesson(l);
  for (const name of ['../secret', '/tmp/file', 'a/../../b', 'a\\b', 'C:file', 'a//b', './x']) { l.sections[0].files = { [name]: '' }; assert.throws(() => validateLesson(l)); }
});
test('curriculum detects missing references, duplicates, course mismatch and prerequisite cycles', () => {
  const c = content(); assert.deepEqual(validateCurriculum(c.curriculum, c.lessons, { exactCounts: false }), ['example']);
  assert.throws(() => validateCurriculum(c.curriculum, c.lessons));
  c.lessons.example.prerequisites = ['missing']; assert.throws(() => validateCurriculum(c.curriculum, c.lessons, { exactCounts: false }));
  c.lessons.example.prerequisites = ['example']; assert.throws(() => validateCurriculum(c.curriculum, c.lessons, { exactCounts: false }));
  c.lessons.example.prerequisites = []; c.curriculum.courses[0].lessons.push('example'); assert.throws(() => validateCurriculum(c.curriculum, c.lessons, { exactCounts: false }));
});
test('content fingerprint ignores object key order but detects every content mutation', () => {
  const l = fixture(); assert.equal(fingerprint(l), fingerprint(Object.fromEntries(Object.entries(l).reverse())));
  const changed = structuredClone(l); changed.sections[1].body[0] += ' 변경'; assert.notEqual(fingerprint(l), fingerprint(changed));
});
test('curriculum order teaches prerequisites before the lessons that use them', () => {
  const c = content();
  c.lessons.second = { ...fixture(), slug: 'second', prerequisites: ['example'] };
  c.curriculum.courses[0].lessons.push('second');
  assert.deepEqual(validateCurriculum(c.curriculum, c.lessons, { exactCounts: false }), ['example', 'second']);
  c.curriculum.courses[0].lessons.reverse();
  assert.throws(() => validateCurriculum(c.curriculum, c.lessons, { exactCounts: false }), /선행 레슨은 목차에서 먼저/);
});
test('static lesson includes full code, output, diagrams, trace and answer explanations without JavaScript', () => {
  const c = content(); c.lessons.example.sections[0].body[0] = '<script>alert(1)</script>';
  const html = renderLesson(c.lessons.example, c);
  assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;')); assert(!html.includes('<script>alert(1)</script>'));
  assert.equal((html.match(/class="scene"/g) || []).length, 3);
  assert(html.includes('data-content-fingerprint')); assert(html.includes('정답: 2'));
  assert(html.includes('실행 전')); assert(html.includes('x는 2를 가리킵니다.')); assert(html.includes('print(2)'));
  assert(!html.includes('이전 레슨')); assert(!html.includes('다음 레슨 →')); assert(html.includes('전체 목차 보기'));
  assert(html.includes('id="example-scene-1"')); assert.match(html, /href="\.\.\/styles\.css(?:\?[^"\s]*)?"/);
  const index = renderIndex(c); assert(index.includes('href="#lesson-example"'));
  assert(index.includes('id="lesson-example"'));
  assert(!/<(?:button|input|select|textarea)\b/.test(index), 'the continuous learning path must not require form controls');
  assert.equal(escapeHTML('"<>&'), '&quot;&lt;&gt;&amp;');
});
test('previous and next links follow the flattened course order and include destination titles', () => {
  const c = content(); const second = { ...fixture(), slug: 'second', title: '두 번째 문제', courseId: 'tools' };
  c.curriculum.courses.push({ id: 'tools', title: '도구', question: '도구는?', lessons: ['second'] }); c.lessons.second = second; c.order.push('second');
  assert(renderLesson(c.lessons.example, c).includes('href="../index.html#lesson-second">이어서 · 두 번째 문제'));
  assert(renderLesson(second, c).includes('href="example.html">이전 · 예제 읽기'));
  const index = renderIndex(c);
  assert(index.indexOf('id="lesson-example"') < index.indexOf('id="lesson-second"'), 'continuous lessons must follow the same flattened order');
});
test('missing-page navigation reaches the configured catalog without JavaScript', () => {
  assert(renderNotFound().includes('href="/index.html"'));
  const nested = renderNotFound('/scrollland/');
  assert(nested.includes('href="/scrollland/index.html"'));
  assert(!nested.includes('<script'));
  for (const value of ['scrollland', '//other/', '/../', '/<script>/', '/scrollland']) assert.throws(() => normalizeBasePath(value));
});
test('example comparison preserves meaningful internal whitespace and removes one final newline', async () => {
  assert.equal(normalizeOutput('a\r\n\r\n'), 'a\n');
  assert.equal(normalizeOutput(' a \n'), ' a ');
  await executeExample({ code: 'from pathlib import Path\nprint(input())\nprint(Path("data/example.txt").read_text())', stdin: '입력\n', files: { 'data/example.txt': '자료' }, output: '입력\n자료' });
  await executeExample({ code: 'from measures import double\nprint(double(3))', files: { 'measures.py': 'def double(value):\n    return value * 2\n' }, output: '6' });
  await assert.rejects(executeExample({ code: 'print(2)', output: '3' }), /출력 불일치/);
  await assert.rejects(executeExample({ code: 'while True: pass', output: '' }, { timeout: 50 }), /제한/);
});
test('runtime has no persistence, code execution, wheel interception or arbitrary page scrolling', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert(!/localStorage|sessionStorage|document\.cookie|eval\(|new Function|scrollTo\(|preventDefault\(/.test(app));
  assert(app.includes('prefers-reduced-motion: reduce'));
});
