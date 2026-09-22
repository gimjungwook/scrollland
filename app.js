import { matchesSearch } from './lib/contract.js';
import { loadVerifiedLesson } from './lib/load-lesson.js';

function enhanceSearch() {
  const form = document.querySelector('.search-form'); if (!form) return;
  const input = form.querySelector('input'); const rows = [...document.querySelectorAll('[data-lesson]')];
  const courses = [...document.querySelectorAll('[data-course]')];
  const status = document.querySelector('#search-status'); const empty = document.querySelector('.search-empty');
  const update = () => {
    let count = 0;
    rows.forEach(row => { row.hidden = !matchesSearch(row.dataset.search, input.value); if (!row.hidden) count++; });
    courses.forEach(course => { course.hidden = ![...course.querySelectorAll('[data-lesson]')].some(row => !row.hidden); });
    status.textContent = input.value.trim() ? `${count}개 레슨을 찾았습니다.` : `${rows.length}개 레슨`;
    empty.hidden = count !== 0;
  };
  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', () => { input.value = ''; update(); input.focus(); });
  input.addEventListener('input', update);
}

function enhanceCurrentScene() {
  if (!('IntersectionObserver' in window)) return;
  const scenes = [...document.querySelectorAll('[data-scene]')]; if (!scenes.length) return;
  const links = [...document.querySelectorAll('[data-scene-link]')];
  const indicator = document.querySelector('[data-current-scene]');
  const visible = new Set();
  const mark = scene => {
    links.forEach(link => { if (link.dataset.sceneLink === scene.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    indicator.textContent = `${scenes.indexOf(scene) + 1} / ${scenes.length}`;
  };
  mark(scenes[0]); document.querySelector('.current-scene').hidden = false;
  let observer; let height;
  const observe = () => {
    const nextHeight = document.documentElement.clientHeight;
    if (nextHeight === height) return;
    height = nextHeight;
    if (observer) observer.disconnect();
    visible.clear();
    observer = new IntersectionObserver((entries, source) => {
      if (source !== observer) return;
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      const candidates = [...visible].sort((a, b) => Math.abs(a.getBoundingClientRect().top) - Math.abs(b.getBoundingClientRect().top));
      if (candidates.length) mark(candidates[0]);
    }, { rootMargin: `-${height * 0.1}px 0px -${height * 0.3}px 0px`, threshold: 0 });
    scenes.forEach(scene => observer.observe(scene));
  };
  observe();
  window.addEventListener('resize', observe);
}

function enhanceQuiz(lesson) {
  const buttons = [...document.querySelectorAll('[data-option]')];
  const feedback = document.querySelector('.quiz-feedback');
  buttons.forEach((button, i) => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const option = lesson.quiz.options[i];
    feedback.hidden = false;
    feedback.dataset.correct = String(option.correct);
    feedback.textContent = `${option.correct ? '맞았습니다.' : '다시 생각해 보세요.'} ${option.feedback}`;
  }));
  document.querySelector('.quiz-options').hidden = false;
}

function enhanceTraces() {
  document.querySelectorAll('[data-trace]').forEach(trace => {
    const steps = [...trace.querySelectorAll('[data-trace-step]')];
    const controls = trace.querySelector('.trace-controls');
    const previous = trace.querySelector('[data-previous]'); const next = trace.querySelector('[data-next]');
    const status = trace.querySelector('[data-trace-status]'); let current = 0;
    const update = () => {
      steps.forEach((step, i) => { step.classList.toggle('is-current', i === current); if (i === current) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current'); });
      previous.disabled = current === 0; next.disabled = current === steps.length - 1;
      status.textContent = `${current + 1} / ${steps.length} 상태 강조`;
    };
    previous.addEventListener('click', () => { current = Math.max(0, current - 1); update(); });
    next.addEventListener('click', () => { current = Math.min(steps.length - 1, current + 1); update(); });
    controls.hidden = false; update();
  });
}

export function enhanceMotion() {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let context;
  const cleanup = () => { if (context) context.revert(); context = undefined; };
  const apply = () => {
    cleanup();
    if (media.matches || !window.gsap || !window.ScrollTrigger) return;
    try {
      window.gsap.registerPlugin(window.ScrollTrigger);
      context = window.gsap.context(() => {
        document.querySelectorAll('[data-preset]').forEach(figure => {
          if (figure.dataset.motionPlayed) return;
          const mark = figure.querySelector('[data-motion-mark]');
          const type = figure.dataset.preset;
          const from = { opacity: 0.85, ...(type === 'fade-up' ? { y: 14 } : type === 'slide-in' ? { x: -14 } : { scale: 0.96 }) };
          window.gsap.fromTo(mark, from, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.4, immediateRender: false, ease: 'power1.out', scrollTrigger: { trigger: figure.closest('[data-scene]'), start: 'top 85%', once: true, onEnter: () => { figure.dataset.motionPlayed = 'true'; } } });
        });
      });
    } catch { cleanup(); }
  };
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('pagehide', cleanup, { once: true });
}

async function enhanceLesson() {
  const { lessonSlug, lessonSource, contentFingerprint, sectionCount } = document.body.dataset;
  if (!lessonSlug) return;
  const notice = document.querySelector('.enhancement-notice'); const message = notice.querySelector('[data-load-message]'); const retry = notice.querySelector('[data-retry]');
  let loading = false; let complete = false;
  const load = async () => {
    if (loading || complete) return;
    loading = true; retry.setAttribute('aria-disabled', 'true');
    if (!notice.hidden) message.textContent = '답변 확인과 단계 강조를 다시 불러오고 있습니다. 본문과 모든 해설은 계속 읽을 수 있습니다.';
    try {
      const lesson = await loadVerifiedLesson(lessonSource, { slug: lessonSlug, sectionCount: Number(sectionCount), fingerprint: contentFingerprint });
      enhanceQuiz(lesson); enhanceTraces(); complete = true;
      if (document.activeElement === retry) {
        notice.hidden = false;
        message.textContent = '답변 확인과 단계 강조를 사용할 수 있습니다.';
        message.tabIndex = -1;
        message.focus({ preventScroll: true });
      } else notice.hidden = true;
      retry.hidden = true;
      enhanceMotion();
    } catch {
      notice.hidden = false; retry.hidden = false;
      message.textContent = '선택 확인 문항의 답변 확인과 실행 흐름 살펴보기의 단계 강조를 불러오지 못했습니다. 본문·예제·결과·모든 해설은 계속 읽을 수 있습니다.';
    } finally { loading = false; retry.removeAttribute('aria-disabled'); }
  };
  retry.addEventListener('click', load); await load();
}

// Optional enhancements never replace or hide the generated learning content.
enhanceSearch();
enhanceCurrentScene();
enhanceLesson();
