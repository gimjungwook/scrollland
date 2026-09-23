import { clamp } from './scroll-state.js?v=7';

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
// changes the reading state, waits for a timer or hides the title. Courses finish
// their arrangement before the last 15% of the stationary observation range.
export function sampleIntro(kind, pieces, progress) {
  if (!kinds.has(kind)) throw new Error('도입 종류가 잘못되었습니다.');
  const p = clamp(progress), phase = kind === 'course' ? clamp(p / .85) : p;
  const settled = phase * phase * (3 - 2 * phase), remaining = 1 - settled;
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

function keepData(element, name) {
  const initial = element.dataset[name];
  return () => { if (initial === undefined) delete element.dataset[name]; else element.dataset[name] = initial; };
}

// Use the unpinned, complete artwork for measurement so a prior mode cannot
// inflate the next measurement after a font, width or viewport-height change.
export function introGeometry(viewport, header, stageHeight, figureHeight) {
  const top = Math.max(0, header) + 12, available = Math.max(0, viewport - top - 12);
  const fits = height => Number.isFinite(height) && height > 0 && height <= available;
  const mode = fits(stageHeight) ? 'whole' : fits(figureHeight) ? 'figure' : 'static';
  return { mode, top, travel: mode === 'static' ? 0 : Math.max(320, Math.min(720, viewport * .7)) };
}

export function mountIntro(element, { ScrollTrigger, reportError, requestRefresh } = {}) {
  const kind = element.dataset.introKind;
  if (!kinds.has(kind)) throw new Error('도입 종류가 잘못되었습니다.');
  const art = element.querySelector('[data-intro-art]');
  const title = element.querySelector('[data-intro-title]');
  if (!art || !title) throw new Error('도입 그림 또는 제목이 없습니다.');
  const stage = element.querySelector('[data-intro-stage]');
  const figureTrack = element.querySelector('[data-intro-figure-track]');
  const figure = element.querySelector('[data-intro-figure]');
  const focus = element.querySelector('[data-intro-lesson-focus]');
  if (kind === 'course' ? !stage || !figureTrack || !figure : !focus) throw new Error('도입 관찰 영역이 없습니다.');
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
  const layoutProperties = ['--intro-stage-height', '--intro-figure-height', '--intro-travel', '--intro-top'];
  const restoreLayout = keepStyles(element, layoutProperties), restoreMode = keepData(element, 'introMode');
  const restoreProgress = keepData(element, 'introProgress'), restoreStatus = keepData(element, 'introStatus');
  let trigger, disposed = false, failed = false, geometry = { mode: 'static', top: 0, travel: 0 }, stageOffset = 0;
  const resetArtwork = () => restores.forEach(restore => restore());
  const reset = () => { resetArtwork(); restoreLayout(); restoreMode(); restoreProgress(); };
  const render = progress => {
    if (disposed || failed) return;
    if (kind === 'course' && geometry.mode === 'static') {
      resetArtwork(); element.dataset.introProgress = '1.00000'; return;
    }
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
    // Removing a held course's travel shifts every later reading position.
    if (kind === 'course') requestRefresh?.();
  };
  const safeRender = progress => { try { render(progress); } catch (error) { fail(error); } };
  const measure = () => {
    if (disposed || failed || kind !== 'course') return;
    try {
      delete element.dataset.introMode;
      layoutProperties.forEach(property => element.style.removeProperty(property));
      resetArtwork();
      const viewport = globalThis.window?.innerHeight || globalThis.document?.documentElement?.clientHeight || 800;
      const header = parseFloat(globalThis.window?.getComputedStyle?.(globalThis.document?.documentElement)?.getPropertyValue('--header')) || 64;
      const height = node => Math.max(node.offsetHeight || 0, node.scrollHeight || 0);
      const stageHeight = height(stage), figureHeight = height(figure);
      stageOffset = stage.getBoundingClientRect().top - element.getBoundingClientRect().top;
      geometry = introGeometry(viewport, header, stageHeight, figureHeight);
      element.style.setProperty('--intro-stage-height', `${stageHeight}px`);
      element.style.setProperty('--intro-figure-height', `${figureHeight}px`);
      element.style.setProperty('--intro-travel', `${geometry.travel}px`);
      element.style.setProperty('--intro-top', `${geometry.top}px`);
      element.dataset.introMode = geometry.mode;
    } catch (error) { fail(error); }
  };
  try {
    measure();
    const courseStart = () => {
      // The outer section and figure track stay in normal flow. Reading their
      // position avoids using a stage already stuck at the viewport edge.
      const top = geometry.mode === 'figure' ? figureTrack.getBoundingClientRect().top : element.getBoundingClientRect().top + stageOffset;
      return top + (globalThis.window?.scrollY || 0) - geometry.top;
    };
    if (!failed) {
      trigger = ScrollTrigger.create({
        trigger: kind === 'course' ? element : focus,
        start: kind === 'course' ? courseStart : 'top 85%',
        end: kind === 'course' ? () => `+=${Math.max(1, geometry.travel)}` : 'top 45%',
        invalidateOnRefresh: true, onRefreshInit: measure,
        onUpdate: self => safeRender(self.progress), onRefresh: self => safeRender(self.progress),
      });
      if (failed) trigger.kill();
      else { safeRender(trigger.progress); if (!failed) element.dataset.introStatus = 'ready'; }
    }
  } catch (error) { fail(error); }
  return () => {
    disposed = true; trigger?.kill(); reset();
    if (!failed) restoreStatus();
  };
}
