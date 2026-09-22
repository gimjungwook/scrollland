import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCurriculum, fingerprint } from '../lib/contract.js';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const e = escapeHTML;
export function normalizeBasePath(value = '/') {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(value)) throw new Error('SCROLLLAND_BASE_PATH는 / 또는 /저장소이름/ 형태의 영문·숫자·밑줄·하이픈 경로여야 합니다.');
  return value;
}
export function renderNotFound(basePath = '/') {
  const href = `${normalizeBasePath(basePath)}index.html`;
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>레슨을 찾을 수 없습니다 · ScrollLand</title><style>body{margin:0;padding:48px 24px;background:#f7f8f4;color:#20312c;font:16px/1.8 sans-serif}main{max-width:640px;margin:32px auto}h1{font-size:32px;line-height:1.4}a{color:#245c4b;text-underline-offset:4px}a:focus-visible{outline:3px solid #0a6950;outline-offset:4px}</style></head><body><main><p>ScrollLand</p><h1>이 주소의 레슨을 찾을 수 없습니다.</h1><p>주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 전체 목차에서 레슨 제목을 찾아 다시 열어 주세요.</p><p><a href="${e(href)}">전체 목차 열기</a></p></main></body></html>\n`;
}
export async function readContent() {
  const curriculum = JSON.parse(await readFile(resolve(root, 'curriculum.json'), 'utf8'));
  const lessons = {};
  for (const name of (await readdir(resolve(root, 'lessons'))).filter(x => x.endsWith('.json')).sort()) lessons[name.slice(0, -5)] = JSON.parse(await readFile(resolve(root, 'lessons', name), 'utf8'));
  const order = validateCurriculum(curriculum, lessons); return { curriculum, lessons, order };
}
const mark = `<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>`;
function frame({ title, description, prefix = '', body, attributes = '' }) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${e(description)}"><meta name="theme-color" content="#f7f8f4"><meta name="color-scheme" content="light"><title>${e(title)} · ScrollLand</title><link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${prefix}styles.css"><script defer src="${prefix}lib/gsap.min.js"></script><script defer src="${prefix}lib/ScrollTrigger.min.js"></script><script type="module" src="${prefix}app.js"></script></head>
<body ${attributes}><a class="skip-link" href="#main">본문으로 건너뛰기</a><header class="site-header"><a class="brand" href="${prefix}index.html">${mark}<span>ScrollLand</span></a><span class="header-note">코드의 변화를 읽는 Python</span><a class="header-link" href="${prefix}index.html#courses">전체 목차 <span aria-hidden="true">↗</span></a></header>${body}<footer class="site-footer"><a href="${prefix}index.html">ScrollLand</a><p>학습 자료 초판 · 내용 검토와 학습 효과 검증 전</p><a href="${prefix}README.md">실행 방법·검증 범위</a></footer></body></html>\n`;
}
export function renderIndex({ curriculum, lessons, order }) {
  const courses = curriculum.courses.map((course, i) => `<section class="course" id="course-${e(course.id)}" data-course><header class="course-heading"><span class="course-number">${String(i + 1).padStart(2, '0')}</span><div><h2>${e(course.title)}</h2><p>${e(course.question)}</p></div><span class="course-count">${course.lessons.length}개 레슨</span></header><ol class="lesson-list">${course.lessons.map(slug => { const l = lessons[slug]; return `<li data-lesson data-search="${e([l.title, ...l.topics, l.goal, slug, course.title].join(' '))}"><a class="lesson-link" href="learn/${slug}.html"><span class="lesson-number">${String(order.indexOf(slug) + 1).padStart(2, '0')}</span><span><strong>${e(l.title)}</strong><span class="lesson-goal">${e(l.goal)}</span></span><span class="link-arrow" aria-hidden="true">↗</span></a></li>`; }).join('')}</ol></section>`).join('');
  return frame({ title: 'Python을 문제에서부터', description: curriculum.subtitle, body: `<main id="main" class="catalog"><section class="catalog-intro"><p class="eyebrow">Python · 8개 코스 · 44개 레슨</p><h1>한 줄의 코드가<br>무엇을 바꾸는지.</h1><div class="intro-bottom"><p>${e(curriculum.subtitle)}</p><a class="button primary" href="learn/${order[0]}.html">첫 레슨 읽기 <span aria-hidden="true">→</span></a></div><div class="reading-key"><span>문제</span><span aria-hidden="true">→</span><span>코드</span><span aria-hidden="true">→</span><span>결과와 상태</span><span aria-hidden="true">→</span><span>직접 설명하기</span></div></section><section id="courses" class="catalog-content"><div class="catalog-tools"><div><p class="eyebrow">학습 목차</p><h2 class="catalog-heading">해결할 문제에서 시작하세요.</h2></div><form class="search-form" role="search" hidden><label for="lesson-search">레슨 찾기</label><div class="search-control"><input id="lesson-search" type="search" placeholder="제목이나 개념 검색" autocomplete="off" aria-describedby="search-status"><button type="reset" aria-label="검색 초기화">초기화</button></div><p id="search-status" role="status" aria-live="polite">44개 레슨</p></form></div><p class="search-empty" hidden>일치하는 레슨이 없습니다. 다른 개념을 입력하거나 검색을 초기화해 보세요.</p>${courses}</section></main>` });
}
const diagramNames = { binding: '이름과 값의 연결', flow: '처리 순서', collection: '항목의 구성', branch: '조건과 선택', pipeline: '입력에서 결과까지', object: '객체의 구성', timeline: '시간에 따른 상태' };
function renderSection(section, i) {
  const type = section.diagram.type;
  const input = ('stdin' in section || section.files) ? `<details class="input-material" open><summary>예제에 제공한 입력 자료</summary>${'stdin' in section ? `<p>표준 입력</p><pre><code>${e(section.stdin || '(빈 입력)')}</code></pre>` : ''}${Object.entries(section.files || {}).map(([name, text]) => `<p><code>${e(name)}</code></p><pre><code>${e(text || '(빈 파일)')}</code></pre>`).join('')}</details>` : '';
  return `<section id="section-${i + 1}" class="scene" data-scene><div class="scene-title"><span class="scene-number">${String(i + 1).padStart(2, '0')}</span><h2>${e(section.title)}</h2></div><div class="scene-body">${section.body.map(text => `<p>${e(text)}</p>`).join('')}</div><div class="example"><div class="code-panel"><div class="panel-heading"><h3>Python 코드</h3><span>Python 3.10+</span></div><pre tabindex="0" aria-label="${e(section.title)} 예제 코드"><code>${e(section.code)}</code></pre></div><div class="output-panel"><h3>예제 실행 결과</h3><pre tabindex="0" aria-label="${e(section.title)} 예제 실행 결과"><samp>${e(section.output || '(표준 출력 없음)')}</samp></pre></div></div>${input}<figure class="diagram diagram-${type}" data-preset="${['fade-up', 'slide-in', 'stage-swap'][i % 3]}"><div class="diagram-heading"><span class="motion-mark" data-motion-mark aria-hidden="true"></span><h3>${diagramNames[type]}</h3></div><ol class="diagram-nodes">${section.diagram.nodes.map((node, n) => `<li><span class="node-label">${e(node.label)}</span><strong class="node-value">${e(node.value)}</strong>${['flow', 'pipeline', 'timeline'].includes(type) && n < section.diagram.nodes.length - 1 ? '<span class="node-connector" aria-hidden="true">→</span>' : ''}</li>`).join('')}</ol><figcaption>${e(section.diagram.caption)}</figcaption></figure><div class="trace" data-trace="${i}"><div class="trace-heading"><h3>실행 흐름 살펴보기</h3><p>검증한 예제의 상태를 순서대로 읽습니다.</p></div><ol class="trace-steps">${section.trace.map((step, n) => `<li data-trace-step><span class="trace-number">${n + 1}</span><div><h4>${e(step.label)}</h4><p>${e(step.state)}</p></div></li>`).join('')}</ol><div class="trace-controls" hidden><button type="button" data-previous aria-label="${e(section.title)} 이전 상태 강조">이전 상태</button><span data-trace-status role="status" aria-live="polite"></span><button type="button" data-next aria-label="${e(section.title)} 다음 상태 강조">다음 상태</button></div></div></section>`;
}
export function renderLesson(lesson, { curriculum, lessons, order }) {
  const course = curriculum.courses.find(x => x.id === lesson.courseId);
  const index = order.indexOf(lesson.slug); const previous = lessons[order[index - 1]], next = lessons[order[index + 1]];
  const nav = (l, label) => l ? `<a class="lesson-neighbor" href="${l.slug}.html"><span>${label}</span><strong>${e(l.title)}</strong></a>` : '';
  const body = `<div class="lesson-shell"><aside class="lesson-aside"><a class="back-link" href="../index.html#course-${course.id}">← ${e(course.title)}</a><p class="eyebrow">레슨 ${String(index + 1).padStart(2, '0')} / 44</p><nav aria-label="이 레슨의 장면"><ol>${lesson.sections.map((s, i) => `<li><a href="#section-${i + 1}" data-scene-link="section-${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span>${e(s.title)}</a></li>`).join('')}<li><a href="#lesson-check"><span>?</span>선택 확인 문항</a></li><li><a href="#takeaway"><span>↳</span>기억할 내용</a></li></ol></nav><p class="current-scene" hidden>현재 장면 <span data-current-scene>1 / ${lesson.sections.length}</span></p></aside><main id="main" class="lesson-content"><header class="lesson-intro"><p class="eyebrow">${e(course.title)}</p><h1>${e(lesson.title)}</h1><p class="lesson-problem">${e(lesson.problem)}</p><div class="learning-goal"><span>읽고 나면</span><p>${e(lesson.goal)}</p></div>${lesson.prerequisites.length ? `<p class="prerequisites"><span>먼저 읽으면 좋은 레슨</span> ${lesson.prerequisites.map(slug => `<a href="${slug}.html">${e(lessons[slug].title)}</a>`).join(' · ')}</p>` : '<p class="prerequisites">선행 개념 없이 시작할 수 있습니다.</p>'}<p class="reading-note">아래로 이어 읽으세요. 결과와 상태는 항상 보이며, 확인 문항은 원할 때 답하면 됩니다.</p></header><div class="enhancement-notice" role="status" hidden><p data-load-message></p><button data-retry type="button">답변 확인·단계 강조 다시 불러오기</button></div><noscript><p class="static-notice">본문·예제·결과는 모두 읽을 수 있습니다. 선택 확인 문항의 정답과 해설도 아래에 표시되어 있습니다.</p></noscript>${lesson.sections.map(renderSection).join('')}<section id="lesson-check" class="knowledge-check"><p class="eyebrow">원할 때 확인하세요</p><h2>코드를 읽고, 한 번 예측하기</h2><p class="quiz-question">${e(lesson.quiz.question)}</p><div class="quiz-options" hidden>${lesson.quiz.options.map((option, i) => `<button type="button" data-option="${i}" aria-pressed="false"><span aria-hidden="true">${String.fromCharCode(65 + i)}</span>${e(option.text)}</button>`).join('')}</div><p class="quiz-feedback" role="status" aria-live="polite" hidden></p><details class="answer-details" open><summary>정답과 모든 선택지의 해설 읽기</summary><ol>${lesson.quiz.options.map(option => `<li><strong>${option.correct ? '정답' : '오답'}: ${e(option.text)}</strong><p>${e(option.feedback)}</p></li>`).join('')}</ol></details></section><section id="takeaway" class="takeaway"><p class="eyebrow">기억할 내용</p><h2>${e(lesson.takeaway)}</h2><p>처음의 문제로 돌아가 코드가 만든 변화를 자신의 말로 설명해 보세요.</p></section><nav class="lesson-navigation" aria-label="이전·다음 레슨">${nav(previous, '← 이전 레슨')}${nav(next, '다음 레슨 →')}<a class="all-lessons" href="../index.html#courses">전체 목차 보기</a></nav><details class="sources"><summary>이 레슨의 공식 참고 자료</summary><ul>${lesson.sourceUrls.map(url => `<li><a href="${e(url)}">${e(url)}</a></li>`).join('')}</ul></details></main></div>`;
  return frame({ title: lesson.title, description: lesson.goal, prefix: '../', body, attributes: `data-lesson-slug="${e(lesson.slug)}" data-lesson-source="../lessons/${e(lesson.slug)}.json" data-content-fingerprint="${fingerprint(lesson)}" data-section-count="${lesson.sections.length}"` });
}
export async function generate(check = false) {
  const content = await readContent();
  const basePath = normalizeBasePath(process.env.SCROLLLAND_BASE_PATH || '/');
  const output = new Map([['index.html', renderIndex(content)], ['404.html', renderNotFound(basePath)], ...content.order.map(slug => [`learn/${slug}.html`, renderLesson(content.lessons[slug], content)])]);
  await mkdir(resolve(root, 'learn'), { recursive: true });
  const extra = (await readdir(resolve(root, 'learn'))).filter(name => name.endsWith('.html') && !output.has(`learn/${name}`));
  if (extra.length) throw new Error(`목차에 없는 생성 페이지: ${extra.join(', ')}`);
  for (const [name, html] of output) {
    if (check) { const current = await readFile(resolve(root, name), 'utf8').catch(() => ''); if (current !== html) throw new Error(`원본과 생성 결과가 다릅니다: ${name}. npm run build를 실행하세요.`); }
    else await writeFile(resolve(root, name), html);
  }
  const required = ['styles.css', 'app.js', 'favicon.svg', 'lib/contract.js', 'lib/load-lesson.js', 'lib/gsap.min.js', 'lib/ScrollTrigger.min.js'];
  for (const file of required) await readFile(resolve(root, file));
  for (const [name, html] of output) {
    for (const [, link] of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
      if (/^(?:https?:|mailto:)/.test(link)) continue;
      const decoded = link.replaceAll('&amp;', '&');
      const relative = name === '404.html' && decoded.startsWith(basePath) ? decoded.slice(basePath.length) : decoded;
      const file = resolve(root, dirname(name), relative.split('#')[0]);
      if (!file.startsWith(`${root}/`)) throw new Error(`프로젝트 밖 링크: ${name} ${link}`);
      await readFile(file).catch(() => { throw new Error(`없는 링크: ${name} → ${link}`); });
    }
  }
  console.log(`${check ? '검증' : '생성'} 완료: ${content.curriculum.courses.length}개 코스, ${content.order.length}개 레슨, ${content.order.reduce((n, s) => n + content.lessons[s].sections.length, 0)}개 장면. 모든 내부 파일 링크 정상.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) generate(process.argv.includes('--check')).catch(error => { console.error(error.message); process.exitCode = 1; });
