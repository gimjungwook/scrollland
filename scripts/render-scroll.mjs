import { fingerprint } from '../lib/contract.js';
import { courseOpening, lessonOpening } from './render-intro.mjs';
const e = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const json = value => JSON.stringify(value).replaceAll('<','\\u003c');
const n = value => String(value).padStart(2,'0');
const kindNames = {binding:'이름과 객체', flow:'실행 순서', collection:'값의 구성', branch:'조건과 선택', pipeline:'입력에서 결과로', object:'객체의 구조', timeline:'상태의 변화', sequence:'글자의 위치와 선택 범위'};
function code(text) {
  return text.split('\n').map((line,i)=>`<span class="code-line" data-code-line="${i+1}"><span class="line-number" aria-hidden="true">${n(i+1)}</span><span class="line-source">${e(line)||' '}</span></span>`).join('');
}
function prose(paragraphs) {
  return paragraphs.map(paragraph => `<p>${typeof paragraph === 'string' ? e(paragraph) : paragraph.map(run => {
    const text = run.bold ? `<strong>${e(run.text)}</strong>` : e(run.text);
    return run.effect ? `<span class="text-effect" data-effect="${e(JSON.stringify(run.effect))}"><span class="effect-text">${text}</span><span class="effect-decoration" aria-hidden="true"></span></span>` : text;
  }).join('')}</p>`).join('');
}
function frame(title, description, body, prefix='', kind='lesson') {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)} · ScrollLand</title><meta name="description" content="${e(description)}"><meta name="theme-color" content="#101815"><link rel="icon" href="${prefix}favicon.svg"><link rel="stylesheet" href="${prefix}styles.css?v=12"><script defer src="${prefix}lib/gsap.min.js"></script><script defer src="${prefix}lib/ScrollTrigger.min.js"></script><script type="module" src="${prefix}app.js?v=12"></script></head><body data-page-kind="${kind}"><a class="skip-link" href="#main">학습 내용으로 건너뛰기</a><header class="site-header"><a class="brand" href="${prefix}index.html"><span class="brand-glyph" aria-hidden="true">↳</span>ScrollLand<span class="brand-dot">.</span></a><span class="header-current" data-header-current>${e(title)}</span><a class="catalog-link" href="${prefix}index.html#courses">전체 목차 ↗</a><div class="global-progress" aria-hidden="true"><i data-global-progress></i></div></header>${body}<footer class="site-footer"><p>한 줄씩, 이해가 이어집니다.</p><span>ScrollLand · Python</span><a href="${prefix}README.md">자료·검증 범위</a></footer></body></html>\n`;
}
function sourceInput(section, heading) {
 const input = 'stdin' in section ? `<div><${heading} class="input-label">표준 입력</${heading}><pre>${e(section.stdin || '(빈 입력)')}</pre></div>`:'';
 const files = Object.entries(section.files||{}).map(([name,text])=>`<div><${heading} class="input-label">${e(name)}</${heading}><pre>${e(text||'(빈 파일)')}</pre></div>`).join('');
 return input||files ? `<aside class="input-material"><p class="pane-label">예제에 제공한 입력 자료</p>${input}${files}</aside>`:'';
}
function readableNodes(nodes) {
 return `<dl class="readable-nodes">${nodes.map(node=>`<div><dt>${e(node.label)}${node.active ? ' · 선택' : ''}</dt><dd>${e(node.value)}</dd></div>`).join('')}</dl>`;
}
function example(section, lesson) {
 return `<div class="example-block"><div class="example-code"><div class="pane-label"><span>Python</span><span>${e(lesson.slug)}.py</span></div><pre tabindex="0" aria-label="${e(section.title)} Python 코드"><code>${code(section.code)}</code></pre></div><div class="example-output"><p class="pane-label">실행 결과</p><pre>${e(section.output || '(표준 출력 없음)')}</pre></div></div>`;
}
function staticDiagram(section) {
 return section.diagram ? `<figure class="static-diagram"><figcaption>${e(section.diagram.caption)}</figcaption>${readableNodes(section.diagram.nodes)}</figure>` : '';
}
function renderSection(section, i, lesson, motion, heading) {
 const inputHeading = `h${Number(heading.slice(1))+1}`;
 const opening = `<div class="section-heading"><span class="section-index" aria-hidden="true">${n(i+1)}</span><${heading}>${e(section.title)}</${heading}></div><div class="section-prose">${prose(section.body)}</div>`;
 if (section.kind === 'reading') {
   return `<section class="reading-section" id="${e(section.id)}" data-kind="reading">${opening}${sourceInput(section,inputHeading)}${section.code ? example(section, lesson) : ''}${staticDiagram(section)}${section.trace ? `<ol class="static-trace">${section.trace.map(step=>`<li><strong>${e(step.label)}</strong><p>${e(step.state)}</p></li>`).join('')}</ol>` : ''}</section>`;
 }
 const v = section.visualization;
 const codePane = section.code ? `<div class="code-pane"><div class="pane-label"><span>Python</span><span class="code-file">${e(lesson.slug)}.py</span></div><pre class="stage-code" tabindex="0" aria-label="${e(section.title)} Python 코드"><code>${code(section.code)}</code></pre><div class="stage-output"><span>출력</span><samp data-output></samp><i data-output-empty>아직 출력 없음</i></div></div>` : "";
 return `<section class="visualization-section" id="${e(section.id)}" data-kind="visualization" data-visualization>${opening}<p class="section-question">${e(section.question)}</p>${sourceInput(section,inputHeading)}<div class="visualization-track" data-visualization-track data-pin="${v.pin}" style="--travel:${v.scrollDistance}"><div class="scene-stage" data-has-code="${Boolean(section.code)}" hidden aria-hidden="true"><div class="scene-top"><span class="scene-kicker">${e(kindNames[section.diagram.type])}</span><span class="scene-position" data-position>01 / ${n(section.trace.length+1)}</span></div><div class="learning-stage" data-has-code="${Boolean(section.code)}">${codePane}<div class="visual-pane"><span class="pane-label">${e(kindNames[section.diagram.type])}</span><div class="state-canvas" data-state-canvas></div><p class="diagram-state" data-state-caption></p></div></div><div class="narration"><div><span class="step-eyebrow" data-step-label></span><p class="step-state" data-step-state></p></div></div><div class="scene-bottom"><span>스크롤하며 변화를 살펴보세요</span><div class="scene-progress" aria-hidden="true"><i data-scene-progress></i></div><span aria-hidden="true">↓</span></div></div><div class="visualization-fallback">${section.code ? example(section, lesson) : ''}<ol class="static-trace">${section.trace.map((step,j)=>`<li><strong>${e(step.label)}</strong><p>${e(step.state)}</p>${readableNodes(motion?.steps?.[j]?.nodes || [])}${section.code ? `<p class="trace-output">이 단계의 출력: ${e(motion?.steps?.[j]?.output || '(표준 출력 없음)')}</p>` : ''}</li>`).join('')}</ol><p class="pane-label">실행 후 관계와 값</p>${readableNodes(motion?.finalNodes || section.diagram.nodes)}<p>${e(section.diagram.caption)}</p></div></div><div class="section-interpretation">${prose(section.interpretation)}</div><script type="application/json" data-scene-data>${json({section,motion:motion||null})}</script></section>`;
}
function renderQuiz(lesson, heading) {
 return `<section class="reading-check"><p class="eyebrow">잠깐, 머릿속으로 실행해 보세요.</p><${heading}>${e(lesson.quiz.question)}</${heading}><ol class="check-options">${lesson.quiz.options.map(option=>`<li>${e(option.text)}</li>`).join('')}</ol><p class="check-hint">답을 떠올린 뒤, 아래의 설명과 비교해 보세요.</p><div class="answer-reveal"><div class="answer-main"><span>정답</span><strong>${e(lesson.quiz.options.find(option=>option.correct).text)}</strong></div>${lesson.quiz.options.map(option=>`<p class="answer-reason"><strong>${option.correct?'정답':'오답'}: ${e(option.text)}</strong><span>${e(option.feedback)}</span></p>`).join('')}</div></section>`;
}
function article(lesson, content) {
 const course=content.curriculum.courses.find(c=>c.id===lesson.courseId), index=course.lessons.indexOf(lesson.slug);
 return `<article class="lesson-article" id="lesson-${e(lesson.slug)}" data-lesson-article data-title="${e(lesson.title)}" data-content-fingerprint="${fingerprint(lesson)}">${lessonOpening(lesson,course,index,course.lessons.length,'h1','../',content.lessons)}${lesson.sections.map((section,i)=>renderSection(section,i,lesson,content.motion?.scenes?.[section.id],'h2')).join('')}${renderQuiz(lesson,'h2')}<section class="lesson-takeaway"><p class="eyebrow">기억할 한 가지</p><h2>${e(lesson.takeaway)}</h2><div class="source-links">${lesson.sourceUrls.map((url,i)=>`<a href="${e(url)}">Python 공식 자료 ${i+1} ↗</a>`).join('')}</div></section></article>`;
}
function catalog(content) {
 return `<section class="catalog" id="courses"><p class="eyebrow">전체 학습 지도</p><h2>${content.curriculum.courses.length}개의 코스.<br>풀고 싶은 문제부터.</h2>${content.curriculum.courses.map((course,i)=>`<div class="course" id="course-${e(course.id)}"><span class="course-index">${n(i+1)}</span><div><h3><a href="courses/${e(course.id)}.html">${e(course.title)} ↗</a></h3><p>${e(course.question)}</p><ol>${course.lessons.map((slug,j)=>`<li id="lesson-${e(slug)}"><a href="learn/${e(slug)}.html"><span>${n(j+1)}</span>${e(content.lessons[slug].title)}<i aria-hidden="true">↗</i></a></li>`).join('')}</ol></div></div>`).join('')}</section>`;
}
export function renderIndex(content) {
 const routes = Object.fromEntries(content.curriculum.courses.flatMap(course=>[[`course-${course.id}`,`courses/${course.id}.html`],...course.lessons.map(slug=>[`lesson-${slug}`,`learn/${slug}.html`])]));
 const opening = `<section class="home-opening" aria-labelledby="home-title"><div class="home-opening-inner"><div><p class="eyebrow">ScrollLand · Python</p><h1 id="home-title">코드 한 줄을 읽고,<br>변화를 이해하다.</h1></div><div class="home-opening-copy"><p class="home-description">${e(content.curriculum.subtitle)}</p><p>설명과 예제를 자기 속도로 읽습니다. 변화 과정을 살펴볼 때는 스크롤에 맞춰 코드와 그림이 함께 움직입니다.</p><div class="home-actions"><a class="home-start" href="courses/${e(content.curriculum.courses[0].id)}.html">첫 코스 시작하기 ↗</a><a href="#courses">코스 살펴보기 ↓</a></div><p class="home-scope">${content.curriculum.courses.length}개 코스 · ${content.order.length}개 레슨 · 설치 없이 읽는 Python</p></div></div></section>`;
 return frame('Python 학습 코스', '글과 예제를 읽고 필요한 곳에서 변화 과정을 살펴보는 Python 학습 여정.', `<main id="main">${opening}${catalog(content)}</main><script type="application/json" data-legacy-routes>${json(routes)}</script>`, '', 'home');
}
export function renderCourse(course, content) {
 const index=content.curriculum.courses.findIndex(item=>item.id===course.id);
 const external=new Set(course.lessons.flatMap(slug=>content.lessons[slug].prerequisites).filter(slug=>!course.lessons.includes(slug)));
 const prerequisites=content.order.filter(slug=>external.has(slug));
 const prior=prerequisites.length?`<section class="course-prerequisites"><h3>먼저 익힐 개념</h3><p>아래 레슨의 개념을 사용합니다. 낯선 내용은 먼저 읽고 돌아오세요.</p><ul>${prerequisites.map(slug=>`<li><a href="../learn/${e(slug)}.html">${e(content.lessons[slug].title)} ↗</a></li>`).join('')}</ul></section>`:'';
 const syllabus=`<section class="course-syllabus" id="lessons"><p class="eyebrow">이 코스의 읽기 순서</p><h2>${e(course.question)}</h2>${prior}<ol class="syllabus-list">${course.lessons.map((slug,i)=>{const lesson=content.lessons[slug];return `<li><a href="../learn/${e(slug)}.html"><span class="syllabus-number">${n(i+1)}</span><div><strong>${e(lesson.title)}</strong><p>${e(lesson.goal)}</p></div><i aria-hidden="true">↗</i></a></li>`;}).join('')}</ol></section>`;
 return frame(course.title,course.intro.payoff,`<main id="main">${courseOpening(course,index,content.curriculum.courses.length,content.lessons[course.lessons[0]].title)}${syllabus}<nav class="lesson-navigation" aria-label="코스 탐색"><a href="../learn/${e(course.lessons[0])}.html">첫 레슨 · ${e(content.lessons[course.lessons[0]].title)} →</a><a href="../index.html#courses">전체 목차 보기</a></nav></main>`,'../','course');
}
export function renderLesson(lesson,content) {
 const i=content.order.indexOf(lesson.slug),next=content.lessons[content.order[i+1]],previous=content.lessons[content.order[i-1]];
 const destination=(target,direction)=>{if(!target)return '';const cross=target.courseId!==lesson.courseId,course=content.curriculum.courses.find(item=>item.id===target.courseId);return `<a href="${e(target.slug)}.html">${direction} ${cross?'코스 · '+e(course.title)+' · ':'레슨 · '}${e(target.title)}${direction==='다음'?' →':''}</a>`;};
 return frame(lesson.title,lesson.goal,`<main id="main">${article(lesson,content)}<nav class="lesson-navigation" aria-label="레슨 이동">${destination(previous,'이전')}${destination(next,'다음')}<a href="../courses/${e(lesson.courseId)}.html#lessons">이 코스의 목차 보기</a><a href="../index.html#courses">전체 목차 보기</a></nav></main>`,'../','lesson');
}
