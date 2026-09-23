import { validateTextEffect } from './text-effects.js';
export const DIAGRAM_TYPES = ['flow', 'binding', 'collection', 'branch', 'pipeline', 'object', 'timeline', 'sequence'];
const fail = (where, message) => { throw new Error(`${where}: ${message}`); };
const object = (v, p) => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(p, '객체가 필요합니다'); };
const string = (v, p, empty = false) => { if (typeof v !== 'string' || (!empty && !v.trim())) fail(p, '문자열이 필요합니다'); };
const array = (v, p, min = 0) => { if (!Array.isArray(v) || v.length < min) fail(p, `항목 ${min}개 이상의 배열이 필요합니다`); };
const strings = (v, p, min = 0) => { array(v, p, min); v.forEach((x, i) => string(x, `${p}[${i}]`)); };
const identifier = (v, p) => { string(v, p); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) fail(p, '영문 소문자·숫자·하이픈 식별자가 필요합니다'); };
const unique = (v, p) => { if (new Set(v).size !== v.length) fail(p, '중복 항목이 있습니다'); };
function paragraphs(value, path) {
  array(value, path, 1);
  value.forEach((paragraph, i) => {
    const p = `${path}[${i}]`;
    if (typeof paragraph === 'string') return string(paragraph, p);
    array(paragraph, p, 1);
    paragraph.forEach((run, j) => {
      object(run, `${p}[${j}]`); string(run.text, `${p}[${j}].text`, true);
      if ('bold' in run && typeof run.bold !== 'boolean') fail(p, 'bold는 불리언이어야 합니다');
      if ('effect' in run) { try { validateTextEffect(run.effect); } catch (error) { fail(p, error.message); } }
    });
    string(paragraph.map(run => run.text).join(''), p);
  });
}
export function validateLesson(lesson) {
  object(lesson, 'lesson');
  for (const key of ['slug', 'courseId']) identifier(lesson[key], key);
  for (const key of ['title', 'problem', 'goal', 'takeaway']) string(lesson[key], key);
  object(lesson.intro, 'intro');
  for (const key of ['hook', 'connection', 'payoff']) string(lesson.intro[key], `intro.${key}`);
  object(lesson.intro.preview, 'intro.preview');
  for (const key of ['before', 'after']) string(lesson.intro.preview[key], `intro.preview.${key}`);
  for (const key of ['prerequisites', 'topics', 'sourceUrls']) strings(lesson[key], key, key === 'prerequisites' ? 0 : 1);
  unique(lesson.prerequisites, 'prerequisites');
  lesson.prerequisites.forEach(x => identifier(x, 'prerequisites'));
  lesson.sourceUrls.forEach(url => { try { if (!['https:'].includes(new URL(url).protocol)) fail('sourceUrls', 'HTTPS 주소가 필요합니다'); } catch { fail('sourceUrls', '유효한 HTTPS 주소가 필요합니다'); } });
  array(lesson.sections, 'sections', 1);
  unique(lesson.sections.map(section => section.id), 'section ids');
  lesson.sections.forEach((section, i) => {
    const p = `sections[${i}]`; object(section, p);
    identifier(section.id, `${p}.id`); string(section.title, `${p}.title`);
    if (!['reading', 'visualization'].includes(section.kind)) fail(p, 'reading 또는 visualization을 지정해야 합니다');
    paragraphs(section.body, `${p}.body`);
    if ('code' in section) { string(section.code, `${p}.code`); string(section.output, `${p}.output`, true); }
    else if (['output', 'stdin', 'files'].some(key => key in section)) fail(p, '출력·입력 자료에는 예제 코드가 필요합니다');
    if ('diagram' in section) {
      object(section.diagram, `${p}.diagram`);
      if (!DIAGRAM_TYPES.includes(section.diagram.type)) fail(p, '알 수 없는 도식 형식입니다');
      string(section.diagram.caption, `${p}.diagram.caption`);
      array(section.diagram.nodes, `${p}.diagram.nodes`, 1);
      section.diagram.nodes.forEach(node => { object(node, p); string(node.label, `${p}.label`); string(node.value, `${p}.value`); if ('objectId' in node) string(node.objectId, `${p}.objectId`); if ('active' in node && typeof node.active !== 'boolean') fail(p, '선택 상태 active는 불리언이어야 합니다'); });
    }
    if ('trace' in section) {
      array(section.trace, `${p}.trace`, 1);
      section.trace.forEach(step => { object(step, p); string(step.label, `${p}.trace.label`); string(step.state, `${p}.trace.state`); });
    }
    if (section.kind === 'visualization') {
      for (const key of ['question', 'rationale']) string(section[key], `${p}.${key}`);
      object(section.diagram, `${p}.diagram`); array(section.trace, `${p}.trace`, 1);
      paragraphs(section.interpretation, `${p}.interpretation`);
      const v = section.visualization; object(v, `${p}.visualization`);
      if (v.ref !== section.id) fail(p, '시각화 ref는 구간 id와 같아야 합니다');
      if (typeof v.pin !== 'boolean') fail(p, 'pin은 불리언이어야 합니다');
      if (!Number.isFinite(v.scrollDistance) || v.scrollDistance <= 0) fail(p, 'scrollDistance는 양수여야 합니다');
      array(v.stops, `${p}.visualization.stops`, 2);
      if (v.stops.length !== section.trace.length + 1 || v.stops[0] !== 0 || v.stops.at(-1) !== 1 || v.stops.some((stop, j) => !Number.isFinite(stop) || stop < 0 || stop > 1 || (j > 0 && stop <= v.stops[j - 1]))) fail(p, 'stops는 실행 단계와 최종 상태에 대응하는 0부터 1까지의 증가 수열이어야 합니다');
    } else if ('visualization' in section) fail(p, '읽기 구간에는 시각화 설정을 지정하지 않습니다');
    if ('stdin' in section) string(section.stdin, `${p}.stdin`, true);
    if ('files' in section) {
      object(section.files, `${p}.files`);
      for (const [name, contents] of Object.entries(section.files)) {
        if (!name || name.startsWith('/') || /[\\:\x00]/.test(name) || name.split('/').some(part => !part || part === '.' || part === '..')) fail(p, `허용하지 않는 입력 파일 경로: ${name}`);
        string(contents, `${p}.files.${name}`, true);
      }
    }
  });
  object(lesson.quiz, 'quiz'); string(lesson.quiz.question, 'quiz.question'); array(lesson.quiz.options, 'quiz.options', 3);
  if (lesson.quiz.options.length !== 3) fail('quiz.options', '선택지는 정확히 3개입니다');
  lesson.quiz.options.forEach(option => { object(option, 'option'); string(option.text, 'option.text'); string(option.feedback, 'option.feedback'); if (typeof option.correct !== 'boolean') fail('option.correct', '불리언이 필요합니다'); });
  if (lesson.quiz.options.filter(x => x.correct).length !== 1) fail('quiz.options', '정답은 정확히 하나입니다');
  return lesson;
}
export function validateCurriculum(curriculum, lessons, { exactCounts = true } = {}) {
  object(curriculum, 'curriculum');
  for (const key of ['title', 'subtitle', 'language', 'pythonVersion']) string(curriculum[key], key);
  array(curriculum.courses, 'courses', 1);
  if (exactCounts && curriculum.courses.length !== 8) fail('courses', '코스는 정확히 8개입니다');
  const all = [];
  unique(curriculum.courses.map(x => x.id), 'course ids');
  for (const course of curriculum.courses) {
    object(course, 'course'); identifier(course.id, 'course.id'); string(course.title, 'course.title'); string(course.question, 'course.question'); strings(course.lessons, 'course.lessons', 1);
    object(course.intro, 'course.intro'); strings(course.intro.headline, 'course.intro.headline', 1);
    for (const key of ['premise', 'payoff']) string(course.intro[key], `course.intro.${key}`);
    object(course.intro.scene, 'course.intro.scene');
    for (const key of ['before', 'after', 'caption']) string(course.intro.scene[key], `course.intro.scene.${key}`);
    for (const slug of course.lessons) {
      identifier(slug, 'slug'); all.push(slug);
      if (!lessons[slug]) fail(slug, '레슨 원본이 없습니다');
      validateLesson(lessons[slug]);
      if (lessons[slug].slug !== slug || lessons[slug].courseId !== course.id) fail(slug, '파일명·식별자·코스 참조가 일치하지 않습니다');
    }
  }
  unique(all, 'lesson slugs');
  unique(all.flatMap(slug => lessons[slug].sections.map(section => section.id)), 'curriculum section ids');
  if (exactCounts && all.length !== 44) fail('lessons', '레슨은 정확히 44개입니다');
  if (Object.keys(lessons).some(slug => !all.includes(slug))) fail('lessons', '목차에 없는 원본이 있습니다');
  const visited = new Set(); const active = new Set();
  const visit = slug => {
    if (active.has(slug)) fail(slug, '선행 개념 순환 참조입니다');
    if (visited.has(slug)) return;
    active.add(slug);
    for (const parent of lessons[slug].prerequisites) { if (!all.includes(parent)) fail(slug, `없는 선행 레슨: ${parent}`); visit(parent); }
    active.delete(slug); visited.add(slug);
  };
  all.forEach(visit);
  const position = new Map(all.map((slug, index) => [slug, index]));
  for (const slug of all) for (const parent of lessons[slug].prerequisites) {
    if (position.get(parent) >= position.get(slug)) fail(slug, `선행 레슨은 목차에서 먼저 나와야 합니다: ${parent}`);
  }
  return all;
}
export function canonicalJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function fingerprint(value) {
  // Deterministic content identity; this is a consistency check, not an authentication mechanism.
  const text = canonicalJSON(value); let hash = 2166136261;
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}-${text.length}`;
}
export function searchTerms(value) { return value.normalize('NFKC').toLocaleLowerCase('ko').trim().split(/\s+/).filter(Boolean); }
export function matchesSearch(haystack, value) { const text = searchTerms(haystack).join(' '); return searchTerms(value).every(term => text.includes(term)); }
