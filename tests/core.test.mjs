import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateLesson, validateCurriculum, fingerprint } from '../lib/contract.js';
import { renderLesson, renderIndex, renderCourse, renderNotFound, normalizeBasePath, escapeHTML } from '../scripts/generate.mjs';
import { executeExample, normalizeOutput } from '../scripts/validate-examples.mjs';

const section = { id: 'example-example', kind: 'reading', title: '이름으로 결과 읽기', body: ['이름은 객체를 가리킵니다.'], code: 'print(2)', output: '2', diagram: { type: 'binding', nodes: [{ label: '이름', value: 'x' }, { label: '값', value: '2' }], caption: 'x는 2를 가리킵니다.' } };
const lessonIntro = () => ({ hook: '값 하나를 어떻게 기억할까요?', connection: '처음 읽는 코드 한 줄입니다.', payoff: '출력으로 값을 확인합니다.', preview: {before: 'print(2)', after: '2'} });
const courseIntro = () => ({ headline: ['하나의 값,', '하나의 이름.'], premise: '결과를 읽습니다.', payoff: '이름으로 값을 사용합니다.', scene: {before: '2', after: 'x = 2', caption: '이름은 값을 가리킵니다.'} });
const fixture = (slug = 'example') => ({ intro: lessonIntro(), slug, courseId: 'values', title: '예제 읽기', problem: '어떤 수가 출력될까요?', goal: '출력된 수를 설명합니다.', prerequisites: [], topics: ['print', '출력'], takeaway: 'print는 값을 출력합니다.', sections: [
  { id: `${slug}-reading`, kind: 'reading', title: '먼저 읽기', body: ['본문은 스크롤 위치와 관계없이 계속 읽을 수 있습니다.'] },
  { ...structuredClone(section), id: `${slug}-example` },
  { ...structuredClone(section), id: `${slug}-visual`, kind: 'visualization', question: '무엇이 바뀔까요?', rationale: '출력 전후를 추적합니다.', interpretation: ['이 코드는 2를 출력합니다.'], trace: [{label: '실행 전', state: '출력 전'}, {label: '실행 후', state: '2 출력'}], visualization: {ref: `${slug}-visual`, pin: true, scrollDistance: 140, stops: [0, 0.6, 1]} }
], quiz: { question: '출력은?', options: [{ text: '2', correct: true, feedback: '2가 출력됩니다.' }, { text: '3', correct: false, feedback: '코드의 숫자를 다시 읽으세요.' }, { text: '없음', correct: false, feedback: 'print가 있습니다.' }] }, sourceUrls: ['https://docs.python.org/3/tutorial/'] });
const content = () => { const lesson = fixture(); return { curriculum: { title: 'ScrollLand', subtitle: 'Python 코드와 결과를 비교합니다.', language: 'ko', pythonVersion: '3.10+', courses: [{ intro: courseIntro(), id: 'values', title: '값', question: '값을 어떻게 읽을까요?', lessons: ['example'] }] }, lessons: { example: lesson }, order: ['example'], motion: {version: 2, scenes: {'example-visual': {steps: [{lines: [], nodes: [{label: '출력', value: '없음'}], output: ''}, {lines: [1], nodes: [{label: '출력', value: '2'}], output: '2'}], finalNodes: section.diagram.nodes}}} }; };
const effect = () => ({preset: 'glow', mode: 'scrub', purpose: '핵심어 구분', start: 'top 85%', end: 'top 35%', duration: 0.9, reentry: 'repeat', exit: 'cancel', initial: 'skip'});

test('service, course and lesson introductions belong to separate readable pages', () => {
  const c = content(), index = renderIndex(c), course = renderCourse(c.curriculum.courses[0], c);
  assert(!index.includes('data-intro-kind="course"'));
  assert(!index.includes('data-intro-kind="lesson"'));
  assert(!index.includes('data-lesson-article'));
  assert(index.includes('href="courses/values.html"'));
  assert(index.includes('href="learn/example.html"'));
  assert.equal((course.match(/data-intro-kind="course"/g)||[]).length, 1);
  assert(!course.includes('data-lesson-article'));
  assert(course.includes('이름은 값을 가리킵니다.'));
  const lesson = renderLesson(c.lessons.example,c);
  assert(lesson.includes('값 하나를 어떻게 기억할까요?'));
  assert(lesson.includes('처음 읽는 코드 한 줄입니다.'));
  assert(lesson.includes('출력으로 값을 확인합니다.'));
  assert(lesson.includes('href="../courses/values.html"'));
  assert(!lesson.includes('data-intro-kind="course"'));
  c.lessons.example.intro.hook = '<script>alert(1)</script>';
  c.curriculum.courses[0].intro.headline[0] = '<img src=x>';
  assert(renderLesson(c.lessons.example,c).includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert(renderCourse(c.curriculum.courses[0],c).includes('&lt;img src=x&gt;'));
});

test('every page has one primary heading and section/input headings descend one level at a time', () => {
  const c = content();
  c.lessons.example.sections[1].stdin = '입력'; c.lessons.example.sections[1].files = { 'data.txt': '자료' };
  const headingList = html => [...html.matchAll(/<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/g)].map(match => ({ level: Number(match[1]), text: match[2].replace(/<[^>]+>/g, '') }));
  const pages = [renderIndex(c), renderCourse(c.curriculum.courses[0], c), renderLesson(c.lessons.example, c)];
  for (const html of pages) {
    const headings = headingList(html);
    assert.equal(headings.filter(h=>h.level===1).length,1);
    assert.equal(headings[0].level,1);
    for (let i=1;i<headings.length;i++) assert(headings[i].level<=headings[i-1].level+1, `${headings[i].text} skips a heading level`);
  }
  const single = pages[2];
  assert.deepEqual(headingList(single).filter(h=>h.level===1).map(h=>h.text), ['예제 읽기']);
  assert(single.includes('<h2>먼저 읽기</h2>'));
  assert(single.includes('<h3 class="input-label">표준 입력</h3>'));
  assert(single.includes('<h3 class="input-label">data.txt</h3>'));
});

test('intro contracts fail for missing learning context or symbolic scene captions', () => {
  for (const mutate of [l=>delete l.intro, l=>l.intro.hook='', l=>delete l.intro.connection, l=>delete l.intro.preview.after]) {
    const l=fixture(); mutate(l); assert.throws(()=>validateLesson(l));
  }
  for (const mutate of [c=>delete c.intro, c=>c.intro.headline=[], c=>delete c.intro.scene.caption]) {
    const c=content(); mutate(c.curriculum.courses[0]); assert.throws(()=>validateCurriculum(c.curriculum,c.lessons,{exactCounts:false}));
  }
});

test('reading content has no arbitrary example, diagram, paragraph or section quota', () => {
  const l = fixture(); l.sections = [l.sections[0]];
  assert.equal(validateLesson(l).sections.length, 1);
  l.slug = 'variables'; validateLesson(l);
  l.sections[0].body = Array(7).fill('정적인 설명만 있는 단락입니다.'); validateLesson(l);
});
test('data contract requires complete selected visualizations and valid choices', () => {
  assert.equal(validateLesson(fixture()).slug, 'example');
  for (const mutate of [l => l.sections[0].body = [], l => l.sections[1].diagram.type = 'unknown', l => l.quiz.options[1].correct = true, l => l.sections[2].trace = [], l => l.topics = [], l => l.sections[1].diagram.nodes[0].value = '', l => l.quiz.options[0].correct = 'true', l => delete l.sections[2].rationale, l => l.sections[2].visualization.stops = [0, 1, 0.8], l => l.sections[2].visualization.ref = 'missing', l => l.sections[1].id = l.sections[0].id, l => l.sections[0].output = '2']) { const l = fixture(); mutate(l); assert.throws(() => validateLesson(l)); }
});
test('a relationship-only visualization does not require an invented program or output pane', () => {
  const c = content(); const visual = c.lessons.example.sections[2];
  delete visual.code; delete visual.output;
  validateLesson(c.lessons.example);
  const html = renderLesson(c.lessons.example, c);
  const stage = html.slice(html.indexOf('class="visualization-section"'), html.indexOf('class="reading-check"'));
  assert(stage.includes('data-has-code="false"'));
  assert(!stage.includes('class="code-pane"'));
  assert(!stage.includes('class="example-block"'));
  assert(!stage.includes('이 단계의 출력:'));
  assert(stage.includes('x는 2를 가리킵니다.'));
  assert(stage.includes('class="section-interpretation"'));
});
test('inline effects require an explicit complete specification; plain bold stays static', () => {
  const l = fixture(); l.sections[0].body = [[{text: '강조만', bold: true}, {text: '핵심어', effect: effect()}]];
  validateLesson(l);
  const html = renderLesson(l, content());
  assert(html.includes('<strong>강조만</strong><span class="text-effect"'));
  for (const change of [v => delete v.purpose, v => v.preset = 'any-animation', v => v.duration = -1, v => v.start = 'top 10%', v => v.initial = 'guess']) {
    const broken = structuredClone(l); change(broken.sections[0].body[0][1].effect); assert.throws(() => validateLesson(broken));
  }
});
test('input fixtures permit empty contents but reject path traversal and absolute paths', () => {
  const l = fixture(); l.sections[1].output = ''; l.sections[1].stdin = ''; l.sections[1].files = { 'data/empty.txt': '' }; validateLesson(l);
  for (const name of ['../secret', '/tmp/file', 'a/../../b', 'a\\b', 'C:file', 'a//b', './x']) { l.sections[1].files = { [name]: '' }; assert.throws(() => validateLesson(l)); }
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
  c.lessons.second = { ...fixture('second'), prerequisites: ['example'] };
  c.curriculum.courses[0].lessons.push('second');
  assert.deepEqual(validateCurriculum(c.curriculum, c.lessons, { exactCounts: false }), ['example', 'second']);
  c.curriculum.courses[0].lessons.reverse();
  assert.throws(() => validateCurriculum(c.curriculum, c.lessons, { exactCounts: false }), /선행 레슨은 목차에서 먼저/);
});
test('static lesson includes full code, output, diagrams, trace and answer explanations without JavaScript', () => {
  const c = content(); c.lessons.example.sections[0].body[0] = '<script>alert(1)</script>';
  const html = renderLesson(c.lessons.example, c);
  assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;')); assert(!html.includes('<script>alert(1)</script>'));
  assert.equal((html.match(/data-visualization>/g) || []).length, 1);
  assert.equal((html.match(/data-kind="reading"/g) || []).length, 2);
  assert(html.indexOf('class="check-options"') < html.indexOf('class="answer-reveal"'));
  assert(!html.includes('data-step-body'));
  assert(!html.includes('data-scroll-check'));
  assert(html.indexOf('class="section-interpretation"') > html.indexOf('class="visualization-fallback"'));
  assert(html.includes('data-content-fingerprint')); assert(html.includes('정답: 2'));
  assert(html.includes('실행 전')); assert(html.includes('x는 2를 가리킵니다.')); assert(html.includes('print(2)'));
  assert(!html.includes('이전 레슨')); assert(!html.includes('다음 레슨 →')); assert(html.includes('href="../courses/values.html"'));
  assert(html.includes('id="example-reading"')); assert.match(html, /href="\.\.\/styles\.css(?:\?[^"\s]*)?"/);
  const index = renderIndex(c); assert(index.includes('href="learn/example.html"')); assert(!index.includes('data-lesson-article'));
  assert(index.includes('id="lesson-example"'));
  assert(!/<(?:button|input|select|textarea)\b/.test(index), 'the catalog must work through ordinary links without form controls');
  assert.equal(escapeHTML('"<>&'), '&quot;&lt;&gt;&amp;');
});
test('previous and next links open lesson pages directly and name the destination course when crossing courses', () => {
  const c = content(); const second = { ...fixture('second'), title: '두 번째 문제', courseId: 'tools' };
  c.curriculum.courses.push({ intro: courseIntro(), id: 'tools', title: '도구', question: '도구는?', lessons: ['second'] }); c.lessons.second = second; c.order.push('second');
  const firstHTML = renderLesson(c.lessons.example, c), secondHTML = renderLesson(second, c);
  const linkText = (html, href) => [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].filter(match=>match[1]===href).map(match=>match[2].replace(/<[^>]+>/g,''));
  assert(linkText(firstHTML,'second.html').some(text=>text.includes('두 번째 문제')&&text.includes('도구')));
  assert(linkText(secondHTML,'example.html').some(text=>text.includes('예제 읽기')&&text.includes('값')));
  assert(!firstHTML.includes('../index.html#lesson-second'));
  assert(!secondHTML.includes('../index.html#lesson-example'));
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
test('runtime excludes learning-data storage, code execution, wheel interception and unrestricted page scrolling', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert(!/localStorage|sessionStorage|document\.cookie|eval\(|new Function|scrollTo\(|preventDefault\(/.test(app));
  assert(app.includes('prefers-reduced-motion: reduce'));
});
