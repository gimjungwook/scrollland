import { fingerprint } from '../lib/contract.js';
import { courseOpening, lessonOpening } from './render-intro.mjs';
const e = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const json = value => JSON.stringify(value).replaceAll('<','\\u003c');
const n = value => String(value).padStart(2,'0');
const kindNames = {binding:'이름과 객체', flow:'실행 순서', collection:'값의 구성', branch:'조건과 선택', pipeline:'입력에서 결과로', object:'객체의 구조', timeline:'상태의 변화'};
function code(text) {
  return text.split('\n').map((line,i)=>`<span class="code-line" data-code-line="${i+1}"><span class="line-number" aria-hidden="true">${n(i+1)}</span><span class="line-source">${e(line)||' '}</span></span>`).join('');
}
function prose(paragraphs) {
  return paragraphs.map(paragraph => `<p>${typeof paragraph === 'string' ? e(paragraph) : paragraph.map(run => {
    const text = run.bold ? `<strong>${e(run.text)}</strong>` : e(run.text);
    return run.effect ? `<span class="text-effect" data-effect="${e(JSON.stringify(run.effect))}"><span class="effect-text">${text}</span><span class="effect-decoration" aria-hidden="true"></span></span>` : text;
  }).join('')}</p>`).join('');
}
function frame(title, description, body, prefix='') {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)} · ScrollLand</title><meta name="description" content="${e(description)}"><meta name="theme-color" content="#101815"><link rel="icon" href="${prefix}favicon.svg"><link rel="stylesheet" href="${prefix}styles.css?v=5"><script defer src="${prefix}lib/gsap.min.js"></script><script defer src="${prefix}lib/ScrollTrigger.min.js"></script><script type="module" src="${prefix}app.js?v=5"></script></head><body><a class="skip-link" href="#main">학습 내용으로 건너뛰기</a><header class="site-header"><a class="brand" href="${prefix}index.html"><span class="brand-glyph" aria-hidden="true">↳</span>ScrollLand<span class="brand-dot">.</span></a><span class="header-current" data-header-current>한 줄에서 시작하는 Python</span><a class="catalog-link" href="${prefix}index.html#courses">전체 목차 ↗</a><div class="global-progress" aria-hidden="true"><i data-global-progress></i></div></header>${body}<footer class="site-footer"><p>한 줄씩, 이해가 이어집니다.</p><span>ScrollLand · Python</span><a href="${prefix}README.md">자료·검증 범위</a></footer></body></html>\n`;
}
function sourceInput(section, heading) {
 const input = 'stdin' in section ? `<div><${heading} class="input-label">표준 입력</${heading}><pre>${e(section.stdin || '(빈 입력)')}</pre></div>`:'';
 const files = Object.entries(section.files||{}).map(([name,text])=>`<div><${heading} class="input-label">${e(name)}</${heading}><pre>${e(text||'(빈 파일)')}</pre></div>`).join('');
 return input||files ? `<aside class="input-material"><p class="pane-label">예제에 제공한 입력 자료</p>${input}${files}</aside>`:'';
}
function readableNodes(nodes) {
 return `<dl class="readable-nodes">${nodes.map(node=>`<div><dt>${e(node.label)}</dt><dd>${e(node.value)}</dd></div>`).join('')}</dl>`;
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
 return `<section class="visualization-section" id="${e(section.id)}" data-kind="visualization" data-visualization>${opening}<p class="section-question">${e(section.question)}</p>${sourceInput(section,inputHeading)}<div class="visualization-track" data-visualization-track data-pin="${v.pin}" style="--travel:${v.scrollDistance}"><div class="scene-stage" hidden aria-hidden="true"><div class="scene-top"><span class="scene-kicker">${e(kindNames[section.diagram.type])}</span><span class="scene-position" data-position>01 / ${n(section.trace.length+1)}</span></div><div class="learning-stage" data-has-code="${Boolean(section.code)}">${codePane}<div class="visual-pane"><span class="pane-label">${e(kindNames[section.diagram.type])}</span><div class="state-canvas" data-state-canvas></div><p class="diagram-state" data-state-caption></p></div></div><div class="narration"><div><span class="step-eyebrow" data-step-label></span><p class="step-state" data-step-state></p></div></div><div class="scene-bottom"><span>스크롤하며 변화를 살펴보세요</span><div class="scene-progress" aria-hidden="true"><i data-scene-progress></i></div><span aria-hidden="true">↓</span></div></div><div class="visualization-fallback">${section.code ? example(section, lesson) : ''}<ol class="static-trace">${section.trace.map((step,j)=>`<li><strong>${e(step.label)}</strong><p>${e(step.state)}</p>${readableNodes(motion?.steps?.[j]?.nodes || [])}${section.code ? `<p class="trace-output">이 단계의 출력: ${e(motion?.steps?.[j]?.output || '(표준 출력 없음)')}</p>` : ''}</li>`).join('')}</ol><p class="pane-label">실행 후 관계와 값</p>${readableNodes(motion?.finalNodes || section.diagram.nodes)}<p>${e(section.diagram.caption)}</p></div></div><div class="section-interpretation">${prose(section.interpretation)}</div><script type="application/json" data-scene-data>${json({section,motion:motion||null})}</script></section>`;
}
function renderQuiz(lesson, heading) {
 return `<section class="reading-check"><p class="eyebrow">잠깐, 머릿속으로 실행해 보세요.</p><${heading}>${e(lesson.quiz.question)}</${heading}><ol class="check-options">${lesson.quiz.options.map(option=>`<li>${e(option.text)}</li>`).join('')}</ol><p class="check-hint">답을 떠올린 뒤, 아래의 설명과 비교해 보세요.</p><div class="answer-reveal"><div class="answer-main"><span>정답</span><strong>${e(lesson.quiz.options.find(option=>option.correct).text)}</strong></div>${lesson.quiz.options.map(option=>`<p class="answer-reason"><strong>${option.correct?'정답':'오답'}: ${e(option.text)}</strong><span>${e(option.feedback)}</span></p>`).join('')}</div></section>`;
}
function article(lesson, content, prefix='', single=false) {
 const heading=single?'h1':'h3', sectionHeading=single?'h2':'h4';
 const course=content.curriculum.courses.find(c=>c.id===lesson.courseId), index=content.order.indexOf(lesson.slug);
 return `<article class="lesson-article" id="lesson-${lesson.slug}" data-lesson-article data-title="${e(lesson.title)}" data-content-fingerprint="${fingerprint(lesson)}">${lessonOpening(lesson,course,index,content.order.length,heading,prefix,content.lessons)}${lesson.sections.map((section,i)=>renderSection(section,i,lesson,content.motion?.scenes?.[section.id],sectionHeading)).join('')}${renderQuiz(lesson,sectionHeading)}<section class="lesson-takeaway"><p class="eyebrow">기억할 한 가지</p><${sectionHeading}>${e(lesson.takeaway)}</${sectionHeading}><div class="source-links">${lesson.sourceUrls.map((url,i)=>`<a href="${e(url)}">Python 공식 자료 ${i+1} ↗</a>`).join('')}</div></section></article>`;
}
function catalog(content) {
 return `<section class="catalog" id="courses"><p class="eyebrow">전체 학습 지도</p><h2>44개의 문제.<br>하나로 이어지는 이해.</h2>${content.curriculum.courses.map((course,i)=>`<div class="course"><span class="course-index">${n(i+1)}</span><div><h3><a href="#course-${e(course.id)}">${e(course.title)} ↗</a></h3><p>${e(course.question)}</p><ol>${course.lessons.map(slug=>`<li><a href="#lesson-${slug}"><span>${n(content.order.indexOf(slug)+1)}</span>${e(content.lessons[slug].title)}<i aria-hidden="true">↗</i></a></li>`).join('')}</ol></div></div>`).join('')}</section>`;
}
export function renderIndex(content) {
 return frame('한 줄을 읽고, 변화를 이해하다','글과 예제를 읽고 필요한 곳에서 변화 과정을 살펴보는 Python 학습 여정.',`<main id="main">${content.curriculum.courses.map((course,i)=>courseOpening(course,i,content.curriculum.courses.length)+course.lessons.map(slug=>article(content.lessons[slug],content)).join('')).join('')}${catalog(content)}</main>`);
}
export function renderLesson(lesson,content) {
 const i=content.order.indexOf(lesson.slug),next=content.lessons[content.order[i+1]],previous=content.lessons[content.order[i-1]];
 return frame(lesson.title,lesson.goal,`<main id="main">${article(lesson,content,'../',true)}<nav class="lesson-navigation" aria-label="레슨 이동">${previous?`<a href="${previous.slug}.html">이전 · ${e(previous.title)}</a>`:''}${next?`<a href="../index.html#lesson-${next.slug}">이어서 · ${e(next.title)} →</a>`:''}<a href="../index.html#courses">전체 목차 보기</a></nav></main>`,'../');
}
