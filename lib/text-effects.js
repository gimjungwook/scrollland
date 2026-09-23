import { clamp } from './scroll-state.js?v=5';

export function validateTextEffect(effect) {
  if (!effect || !['lift', 'glow', 'confetti', 'burst'].includes(effect.preset) ||
      !['scrub', 'enter'].includes(effect.mode) || typeof effect.purpose !== 'string' || !effect.purpose.trim() ||
      !/^top (?:\d{1,2}|100)%$/.test(effect.start) || !/^top (?:\d{1,2}|100)%$/.test(effect.end) ||
      Number(effect.start.match(/\d+/)[0]) <= Number(effect.end.match(/\d+/)[0]) ||
      !Number.isFinite(effect.duration) || effect.duration <= 0 ||
      !['once', 'repeat'].includes(effect.reentry) || !['finish', 'cancel'].includes(effect.exit) ||
      !['play', 'skip'].includes(effect.initial)) throw new Error('본문 강조 연출 자료가 잘못되었습니다.');
  return effect;
}

// `region` is -1 before the authored range, 0 inside it, and 1 after it.
// A once-only effect is remembered only for this page lifetime, not as learner progress.
export function enterEffectTransition(previous, region, effect, initial = false) {
  const state = previous || { region: null, played: false };
  let action = 'none';
  const crossed = state.region !== null && state.region !== region;
  const entered = region === 0 && state.region !== 0;
  const skippedRange = crossed && state.region !== 0 && region !== 0;
  const canPlay = effect.reentry === 'repeat' || !state.played;
  if (initial) {
    if (region === 0 && effect.initial === 'play' && canPlay) action = 'play';
  } else if (canPlay && (entered || (skippedRange && effect.exit === 'finish'))) action = 'play';
  if (region !== 0 && (state.region === 0 || skippedRange) && effect.exit === 'cancel') action = 'cancel';
  return { region, played: state.played || action === 'play', action };
}

export function sampleTextEffect(effect, progress) {
  const p = clamp(progress);
  const envelope = p === 0 || p === 1 ? 0 : Math.sin(Math.PI * p);
  return {
    progress: p,
    lift: effect.preset === 'lift' && envelope ? -2.5 * envelope : 0,
    glow: effect.preset === 'glow' ? envelope : 0,
    particles: ['confetti', 'burst'].includes(effect.preset) ? envelope : 0,
  };
}

export function mountTextEffect(element, { gsap, ScrollTrigger, memory, reportError }) {
  const effect = validateTextEffect(JSON.parse(element.dataset.effect));
  const text = element.querySelector('.effect-text');
  const decoration = element.querySelector('.effect-decoration');
  if (!text || !decoration) throw new Error('본문 강조 연출 요소가 없습니다.');
  let trigger, tween, disposed = false, failed = false, renderedProgress = 0;
  const particles = [];
  const particleEffect = ['confetti', 'burst'].includes(effect.preset);
  decoration.setAttribute('aria-hidden', 'true');
  decoration.style.pointerEvents = 'none';
  decoration.replaceChildren();
  if (particleEffect) {
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('i');
      particle.className = `effect-particle effect-particle-${effect.preset}`;
      particle.style.cssText = 'position:absolute;left:50%;top:50%;width:3px;height:5px;opacity:0;pointer-events:none;';
      particle.style.background = ['var(--accent, #1e6657)', '#c18442', '#719187'][i % 3];
      if (effect.preset === 'burst') particle.style.borderRadius = '50%';
      decoration.append(particle); particles.push(particle);
    }
  }
  const reset = () => {
    text.style.removeProperty('position'); text.style.removeProperty('top'); text.style.removeProperty('text-shadow');
    particles.forEach(particle => { particle.style.opacity = '0'; particle.style.transform = ''; });
    delete element.dataset.effectProgress;
  };
  const render = p => {
    if (disposed || failed) return;
    const state = sampleTextEffect(effect, p);
    renderedProgress = state.progress;
    element.dataset.effectProgress = state.progress.toFixed(5);
    if (effect.preset === 'lift') { text.style.position = 'relative'; text.style.top = `${state.lift}px`; }
    if (effect.preset === 'glow') text.style.textShadow = `0 0 ${state.glow * 12}px rgba(190, 138, 51, ${state.glow * .48})`;
    if (!particleEffect) return;
    if (state.particles === 0) {
      // Transparent transformed descendants can still enlarge scrollable bounds.
      particles.forEach(particle => { particle.style.opacity = '0'; particle.style.transform = ''; });
      return;
    }
    const rect = element.getBoundingClientRect();
    const reading = element.closest?.('.section-prose, .section-interpretation')?.getBoundingClientRect();
    const viewportWidth = document.documentElement?.clientWidth || globalThis.window?.innerWidth || Infinity;
    const center = rect.left + rect.width / 2, halfWidth = Math.max(12, rect.width / 2), halfHeight = rect.height / 2;
    // A rotated 3 by 5 pixel particle fits within this four-pixel radius.
    const radius = 4;
    const min = Math.max(0, reading?.left ?? rect.left - 24) + radius - center;
    const max = Math.min(viewportWidth, reading?.right ?? rect.right + 24) - radius - center;
    particles.forEach((particle, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const desiredX = Math.cos(angle) * (halfWidth + 5 + 13 * state.progress);
      const x = Math.max(min, Math.min(max, desiredX));
      let y = Math.sin(angle) * (halfHeight + 7 + 17 * state.progress) + (effect.preset === 'confetti' ? 9 * state.progress * state.progress : 0);
      // Near a reading-column edge, route constrained particles above or below
      // the phrase instead of pushing them into the glyphs or off the viewport.
      if (Math.abs(x) < rect.width / 2 + radius + 3 && Math.abs(y) < halfHeight + radius + 3) {
        y = (Math.sin(angle) >= 0 ? 1 : -1) * (halfHeight + radius + 3);
      }
      particle.style.opacity = String(state.particles * .8);
      particle.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${i * 37 + state.progress * 110}deg)`;
    });
  };
  const fail = error => {
    failed = true; tween?.kill(); trigger?.kill(); reset();
    element.dataset.effectStatus = 'failed'; reportError?.('text-effect', element, error);
  };
  const safeRender = p => { try { render(p); } catch (error) { fail(error); } };
  const regionOf = self => self.scroll() < self.start ? -1 : self.scroll() > self.end ? 1 : 0;
  const transition = (self, initial = false) => {
    if (disposed || failed) return;
    if (effect.mode === 'scrub') { safeRender(self.progress); return; }
    const next = enterEffectTransition(memory.get(element), regionOf(self), effect, initial);
    memory.set(element, next);
    if (next.action === 'cancel') { tween?.kill(); safeRender(0); }
    if (next.action === 'play') {
      tween?.kill(); const position = { p: 0 }; safeRender(0);
      tween = gsap.to(position, { p: 1, duration: effect.duration, ease: 'none', onUpdate: () => safeRender(position.p) });
    }
  };
  try {
    render(0);
    // Initialization is explicit so loading an anchor cannot accidentally fire enter effects.
    let ready = false;
    trigger = ScrollTrigger.create({ trigger: element, start: effect.start, end: effect.end,
      onUpdate: self => { if (ready) transition(self); },
      onRefresh: self => { if (ready) safeRender(effect.mode === 'scrub' ? self.progress : renderedProgress); },
    });
    ready = true; transition(trigger, true); if (!failed) element.dataset.effectStatus = 'ready';
  } catch (error) { fail(error); }
  return () => {
    disposed = true; trigger?.kill(); tween?.kill(); reset(); decoration.replaceChildren();
    if (!failed) delete element.dataset.effectStatus;
  };
}
