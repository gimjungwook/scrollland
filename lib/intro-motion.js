import { clamp } from './scroll-state.js?v=5';

const kinds = new Set(['course', 'lesson']);
const number = (value, fallback, name) => {
  if (value === undefined) return fallback;
  if (String(value).trim() === '' || !Number.isFinite(Number(value))) throw new Error(`도입 ${name} 값이 잘못되었습니다.`);
  return Number(value);
};
const pieceData = piece => {
  const data = {
    x: number(piece.dataset.fromX, 0, '가로 이동'),
    y: number(piece.dataset.fromY, 0, '세로 이동'),
    rotate: number(piece.dataset.fromRotate, 0, '회전'),
    scale: number(piece.dataset.fromScale, 1, '크기'),
  };
  if (data.scale <= 0) throw new Error('도입 크기는 양수여야 합니다.');
  return data;
};

// One scroll position always describes the same arrangement. Intro motion never
// changes the reading state, waits for a timer, pins a panel or hides the title.
export function sampleIntro(kind, pieces, progress) {
  if (!kinds.has(kind)) throw new Error('도입 종류가 잘못되었습니다.');
  const p = clamp(progress), settled = p * p * (3 - 2 * p), remaining = 1 - settled;
  const amplitude = kind === 'course' ? 1 : .55;
  return {
    progress: p,
    title: { y: 16 * amplitude * remaining, scale: 1 - .02 * amplitude * remaining },
    pieces: pieces.map(piece => ({
      x: piece.x * amplitude * remaining,
      y: piece.y * amplitude * remaining,
      rotate: piece.rotate * amplitude * remaining,
      scale: 1 + (piece.scale - 1) * amplitude * remaining,
    })),
    lineOffset: remaining,
  };
}

function keepStyles(element, properties) {
  const initial = properties.map(name => ({ name, value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority?.(name) || '' }));
  return () => initial.forEach(({ name, value, priority }) => {
    if (value) element.style.setProperty(name, value, priority);
    else element.style.removeProperty(name);
  });
}

export function mountIntro(element, { ScrollTrigger, reportError } = {}) {
  const kind = element.dataset.introKind;
  if (!kinds.has(kind)) throw new Error('도입 종류가 잘못되었습니다.');
  const art = element.querySelector('[data-intro-art]');
  const title = element.querySelector('[data-intro-title]');
  if (!art || !title) throw new Error('도입 그림 또는 제목이 없습니다.');
  const pieces = [...art.querySelectorAll('[data-intro-piece]')];
  const lines = [...art.querySelectorAll('[data-intro-line]')];
  if (!pieces.length && !lines.length) throw new Error('도입 그림의 구성 요소가 없습니다.');
  const offsets = pieces.map(pieceData);
  const restores = [keepStyles(title, ['translate', 'scale']), ...pieces.map(piece => keepStyles(piece, ['translate', 'rotate', 'scale']))];
  lines.forEach(line => {
    const length = line.getAttribute('pathLength');
    restores.push(keepStyles(line, ['stroke-dasharray', 'stroke-dashoffset']));
    restores.push(() => { if (length === null) line.removeAttribute('pathLength'); else line.setAttribute('pathLength', length); });
  });
  let trigger, disposed = false, failed = false;
  const reset = () => { restores.forEach(restore => restore()); delete element.dataset.introProgress; };
  const render = progress => {
    if (disposed || failed) return;
    const state = sampleIntro(kind, offsets, progress);
    element.dataset.introProgress = state.progress.toFixed(5);
    // Individual CSS transforms compose with any static SVG transform attribute.
    title.style.setProperty('translate', `0 ${state.title.y}px`);
    title.style.setProperty('scale', String(state.title.scale));
    pieces.forEach((piece, index) => {
      const position = state.pieces[index];
      piece.style.setProperty('translate', `${position.x}px ${position.y}px`);
      piece.style.setProperty('rotate', `${position.rotate}deg`);
      piece.style.setProperty('scale', String(position.scale));
    });
    lines.forEach(line => {
      line.setAttribute('pathLength', '1');
      line.style.setProperty('stroke-dasharray', '1');
      line.style.setProperty('stroke-dashoffset', String(state.lineOffset));
    });
  };
  const fail = error => {
    failed = true; trigger?.kill(); reset(); element.dataset.introStatus = 'failed';
    reportError?.('intro', element, error);
  };
  const safeRender = progress => { try { render(progress); } catch (error) { fail(error); } };
  try {
    const courseDistance = () => {
      const viewport = globalThis.window?.innerHeight || globalThis.document?.documentElement?.clientHeight || 800;
      // Equivalent to bottom 45% after a top 15% start. Keep a positive range
      // even if an unusually tall viewport contains the whole short intro.
      return `+=${Math.max(1, element.offsetHeight - viewport * .3)}`;
    };
    trigger = ScrollTrigger.create({
      trigger: element, start: kind === 'course' ? 'top 15%' : 'top 90%',
      end: kind === 'course' ? courseDistance : 'top 20%', invalidateOnRefresh: true,
      onUpdate: self => safeRender(self.progress), onRefresh: self => safeRender(self.progress),
    });
    if (failed) trigger.kill();
    else { safeRender(trigger.progress); if (!failed) element.dataset.introStatus = 'ready'; }
  } catch (error) { fail(error); }
  return () => {
    disposed = true; trigger?.kill(); reset();
    if (!failed) delete element.dataset.introStatus;
  };
}
