import { mountIntro } from './lib/intro-motion.js?v=5';
import { mountTextEffect } from './lib/text-effects.js?v=5';
import { clamp, sampleScene, validateMotion } from './lib/scroll-state.js?v=5';
import { layoutGraph, interpolateGraph } from './lib/graph-layout.js?v=5';

const escape = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
// Reserve each binding's own slot across the whole example. A second object
// appearing must not move an unchanged object or make its identity ambiguous.
function stableLayouts(section, motion) {
  const layouts = section.visualization.stops.map(p => layoutGraph(sampleScene(section, motion, p).nodes, section.diagram.type));
  const all = new Map();
  layouts.forEach(layout => layout.items.forEach(item => { if (!all.has(item.id)) all.set(item.id, item); }));
  const byRole = role => [...all.values()].filter(item => item.role === role);
  const distribute = (items, x, start, end) => items.forEach((item, i) => {
    item = { ...item, x, y: items.length < 2 ? (start + end) / 2 : start + (end - start) * i / (items.length - 1) };
    all.set(item.id, item);
  });
  const slotsFor = role => {
    const slots = new Map();
    byRole(role).forEach(item => {
      const occupied = new Set();
      layouts.filter(layout => layout.items.some(other => other.id === item.id)).forEach(layout => {
        layout.items.filter(other => other.role === role && slots.has(other.id)).forEach(other => occupied.add(slots.get(other.id)));
      });
      let slot = 0; while (occupied.has(slot)) slot++;
      slots.set(item.id, slot);
    });
    return { slots, count: Math.max(0, ...slots.values()) + 1 };
  };
  if (section.diagram.type === 'binding') {
    distribute(byRole('name'), 20, 22, 78);
    distribute(byRole('object'), 77, 22, 78);
  } else if (section.diagram.type === 'object') {
    const { slots, count } = slotsFor('attribute');
    byRole('attribute').forEach(item => all.set(item.id, { ...item, x: 50, y: count < 2 ? 50 : 29 + 44 * slots.get(item.id) / (count - 1) }));
  } else if (section.diagram.type === 'timeline') {
    const items = byRole('timeline'), { slots, count } = slotsFor('timeline'), grid = count >= 4, rows = Math.ceil(count / 2);
    items.forEach(item => { const i = slots.get(item.id); all.set(item.id, { ...item,
      x: grid ? (i % 2 ? 75 : 28) : 55,
      y: grid ? (rows < 2 ? 50 : 25 + 50 * Math.floor(i / 2) / (rows - 1)) : (count < 2 ? 50 : 20 + 60 * i / (count - 1)),
    }); });
  } else {
    // Use the most complete frame as the anchor; transient labels can reuse a
    // departed label's slot, while any label present in both frames stays put.
    const anchor = layouts.reduce((longest, layout) => layout.items.length > longest.items.length ? layout : longest, layouts[0]);
    anchor.items.forEach(item => all.set(item.id, item));
  }
  return layouts.map(layout => ({ ...layout, items: layout.items.map(item => ({ ...item, x: all.get(item.id).x, y: all.get(item.id).y })) }));
}

// Commit the current semantic frame atomically. Motion introduces only its new
// nodes; it never leaves an old value or old connection under a new explanation.
function presentGraph(previous, current, reveal) {
  const introduced = interpolateGraph(previous, current, reveal);
  const positions = new Map(introduced.items.map(item => [item.id, item]));
  const before = new Map(previous.items.map(item => [item.id, item]));
  const items = current.items.map(item => ({ ...positions.get(item.id), ...item,
    x: positions.get(item.id).x, y: positions.get(item.id).y, opacity: 1,
    scale: before.has(item.id) && before.get(item.id).value !== item.value
      ? 1 + .025 * Math.sin(Math.PI * reveal) : positions.get(item.id).scale,
  }));
  const currentPositions = new Map(items.map(item => [item.id, item]));
  const edges = current.edges.map(edge => {
    const from = currentPositions.get(edge.from), to = currentPositions.get(edge.to);
    return { ...edge, x1: from.x, y1: from.y, x2: to.x, y2: to.y, opacity: 1 };
  });
  return { items, edges };
}

function prepareGraph(canvas, layouts, kind) {
  const items=new Map(),edges=new Map();
  layouts.forEach(layout=>{layout.items.forEach(item=>items.set(item.id,item));layout.edges.forEach(edge=>edges.set(JSON.stringify([edge.from,edge.to]),edge));});
  const roleClass=role=>({name:'name-node',object:'object-node',condition:'condition-node',branch:'branch-node',collection:'collection-node',timeline:'timeline-node',attribute:'attribute-node',frame:'object-frame',flow:'flow-node',pipeline:'flow-node'}[role]);
  canvas.innerHTML=`<svg class="graph-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${[...edges.keys()].map(key=>`<path data-edge-id="${escape(key)}"/>`).join('')}</svg>${[...items.values()].map(item=>`<div class="${item.role==='frame'?'':'graph-node '}${roleClass(item.role)}" data-graph-id="${escape(item.id)}"><span>${escape(item.role==='name'?'이름':item.label)}</span><strong></strong></div>`).join('')}`;
  const timelineGrid=kind==='timeline'&&[...items.values()].some(item=>item.x>60);
  const objectCount=[...items.values()].filter(item=>item.role==='object').length;
  const nodeElements=new Map([...canvas.querySelectorAll('[data-graph-id]')].map(node=>[node.dataset.graphId,node]));
  const edgeElements=new Map([...canvas.querySelectorAll('[data-edge-id]')].map(node=>[node.dataset.edgeId,node]));
  return graph=>{
    canvas.dataset.timelineGrid=String(timelineGrid);
    canvas.dataset.objectCount=String(objectCount);
    nodeElements.forEach(node=>{node.style.opacity='0';node.hidden=true;node.setAttribute('aria-hidden','true');});
    edgeElements.forEach(node=>{node.style.opacity='0';});
    graph.items.forEach(item=>{
      const node=nodeElements.get(item.id);
      node.style.opacity=String(item.opacity);node.hidden=item.opacity===0;node.setAttribute('aria-hidden',String(item.opacity===0));
      if(item.role!=='frame'){
        node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;
        node.style.transform=`translate(-50%,-50%) scale(${item.scale})`;
        const value=item.role==='name'?item.label:item.value;
        const strong=node.querySelector('strong');strong.textContent=value;strong.classList.toggle('long-value',value.length>15||(item.role==='object'&&(value.length>=8||/[\[{]/.test(value))));
        node.querySelector('span').textContent=item.role==='name'?'이름':item.label;
      }
    });
    graph.edges.forEach(edge=>{
      const node=edgeElements.get(JSON.stringify([edge.from,edge.to]));
      let {x1,y1,x2,y2}=edge;
      if(kind==='binding'){x1+=11;x2-=12;}
      else if(kind==='branch'){y1+=9;y2-=9;}
      else if(kind!=='timeline'){x1+=9;x2-=9;}
      node.setAttribute('d',`M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`);
      node.style.opacity=String(edge.opacity);
    });
  };
}

export function mountScene(element) {
  const { section, motion } = JSON.parse(element.querySelector('[data-scene-data]').textContent);
  validateMotion({ version: 2, scenes: { [section.visualization.ref]: motion } }, { current: { sections: [section] } });
  const stage = element.querySelector('.scene-stage');
  const canvas = element.querySelector('[data-state-canvas]');
  const pre = element.querySelector('.stage-code');
  const lines = pre ? [...pre.querySelectorAll('[data-code-line]')] : [];
  const output = element.querySelector('[data-output]'), empty = element.querySelector('[data-output-empty]');
  if (section.code !== undefined && (!pre || !output || !empty)) throw new Error('코드 예제 표시 요소가 없습니다.');
  const layouts = stableLayouts(section, motion);
  const drawGraph = prepareGraph(canvas, layouts, section.diagram.type);
  let lastIndex = -1;
  return p => {
    const state = sampleScene(section, motion, p);
    element.dataset.scrollProgress = state.progress.toFixed(5);
    element.dataset.currentStep = String(state.index);
    const linear = clamp(state.phase * 3);
    const reveal = linear * linear * (3 - 2 * linear);
    drawGraph(presentGraph(layouts[Math.max(0, state.index - 1)], layouts[state.index], reveal));
    element.querySelector('[data-scene-progress]').style.transform = `scaleX(${state.progress})`;
    if (lastIndex !== state.index) {
      lastIndex = state.index;
      element.querySelector('[data-position]').textContent = `${String(state.index + 1).padStart(2, '0')} / ${String(state.count).padStart(2, '0')}`;
      element.querySelector('[data-step-label]').textContent = state.label;
      element.querySelector('[data-step-state]').textContent = state.state;
      element.querySelector('[data-state-caption]').textContent = state.complete ? '결과와 관계 확인' : state.label;
      canvas.dataset.frame = String(state.index);
      lines.forEach(line => line.classList.toggle('is-active', state.lines.includes(Number(line.dataset.codeLine))));
      if (output) output.textContent = state.output;
      if (empty) { empty.hidden = state.output !== ''; empty.textContent = state.complete ? '표준 출력 없음' : '아직 출력 없음'; }
    }
    if (pre) {
      const previous = sampleScene(section, motion, section.visualization.stops[Math.max(0, state.index - 1)]);
      const previousLine = lines.find(line => previous.lines[0] === Number(line.dataset.codeLine));
      const current = lines.find(line => state.lines[0] === Number(line.dataset.codeLine));
      const cameraFrom = state.index > 0 && previousLine ? Math.max(0, previousLine.offsetTop - pre.clientHeight * .3) : 0;
      const cameraTo = current ? Math.max(0, current.offsetTop - pre.clientHeight * .3) : Math.max(0, pre.scrollHeight - pre.clientHeight);
      pre.scrollTop = state.index === 0 ? cameraFrom + (cameraTo - cameraFrom) * reveal : cameraTo;
    }
    if (output) output.scrollTop = Math.max(0, output.scrollHeight - output.clientHeight) * clamp((state.phase - .25) / .65);
    // Prose lives outside this visualization and is never replaced or hidden here.
  };
}

export function setupScrollExperience() {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [...document.querySelectorAll('[data-visualization]')];
  const effects = [...document.querySelectorAll('.text-effect[data-effect]')];
  const intros = [...document.querySelectorAll('[data-intro]')];
  const effectMemory = new WeakMap();
  const header = document.querySelector('[data-header-current]');
  const locations = header ? [...document.querySelectorAll('[data-intro-kind="course"], [data-lesson-article]')].map(element => ({
    element, title: (element.dataset.title || element.querySelector('.course-subtitle')?.textContent || '').trim(),
  })).filter(location => location.title) : [];
  const drawLocation = () => {
    if (!header || !locations.length) return;
    const readingLine = (window.innerHeight || document.documentElement.clientHeight || 0) * .4;
    // Document-order boundaries make a skipped range or reverse jump as reliable
    // as slow scrolling. Six rectangle reads suffice for the complete course.
    let low = 0, high = locations.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (locations[middle].element.getBoundingClientRect().top <= readingLine) low = middle + 1;
      else high = middle;
    }
    const current = locations[Math.max(0, low - 1)];
    if (header.textContent !== current.title) header.textContent = current.title;
  };
  const fallback = document.querySelector('[data-motion-fallback]');
  let disposers = [], initialAnchorApplied = false, refreshPending = false;
  const dispose = () => { disposers.splice(0).reverse().forEach(stop => stop()); };
  const resetScene = element => {
    element.classList.remove('visualization-ready');
    delete element.dataset.visualizationReady;
    delete element.dataset.visualizationStatus;
    const stage = element.querySelector('.scene-stage');
    const track = element.querySelector('[data-visualization-track]');
    const transcript = element.querySelector('.visualization-fallback');
    if (stage) { stage.hidden = true; stage.setAttribute('aria-hidden', 'true'); }
    if (transcript) { transcript.hidden = false; transcript.style.removeProperty('display'); }
    if (track) { track.classList.remove('is-enhanced'); track.style.removeProperty('min-height'); track.style.removeProperty('--stage-height'); }
  };
  const reportError = (type, element, error) => {
    // The event exposes only an element identifier and failure category, never lesson text.
    console.error(`ScrollLand ${type} failed (${element.id || 'inline'}):`, error);
    if (fallback && !['text-effect', 'intro'].includes(type)) { fallback.hidden = false; fallback.textContent = '일부 연출을 준비하지 못했습니다. 해당 내용은 정적으로 이어서 읽을 수 있습니다.'; }
  };
  const requestRefresh = () => {
    if (refreshPending) return;
    refreshPending = true;
    window.requestAnimationFrame(() => { refreshPending = false; window.ScrollTrigger?.refresh(); drawLocation(); });
  };
  const apply = () => {
    dispose(); scenes.forEach(resetScene);
    document.documentElement.classList.remove('motion-on');
    // Location is useful with or without motion, and never changes page position.
    if (header && locations.length) {
      window.addEventListener('scroll', drawLocation, { passive: true });
      window.addEventListener('resize', drawLocation);
      window.ScrollTrigger?.addEventListener?.('refresh', drawLocation);
      disposers.push(() => {
        window.removeEventListener?.('scroll', drawLocation); window.removeEventListener?.('resize', drawLocation);
        window.ScrollTrigger?.removeEventListener?.('refresh', drawLocation);
      });
      drawLocation();
    }
    if (media.matches || !window.gsap || !window.ScrollTrigger) {
      if (fallback) { fallback.hidden = false; fallback.textContent = media.matches ? '움직임 줄이기 설정에 따라 강조와 상태 변화를 정적으로 표시합니다.' : '연출을 불러오지 못했습니다. 본문과 예제, 상태 설명을 그대로 읽을 수 있습니다.'; }
      return;
    }
    const { gsap, ScrollTrigger } = window;
    try { gsap.registerPlugin(ScrollTrigger); }
    catch (error) { reportError('motion-library', document.documentElement, error); return; }
    document.documentElement.classList.add('motion-on');
    if (fallback) fallback.hidden = true;
    for (const element of scenes) {
      let trigger, stopped = false;
      const restore = () => { stopped = true; trigger?.kill(); resetScene(element); };
      disposers.push(restore);
      try {
        const render = mountScene(element);
        const data = JSON.parse(element.querySelector('[data-scene-data]').textContent).section.visualization;
        const stage = element.querySelector('.scene-stage');
        const track = element.querySelector('[data-visualization-track]');
        const transcript = element.querySelector('.visualization-fallback');
        if (!stage || !track || !transcript) throw new Error('시각화 표시 요소가 없습니다.');
        track.dataset.pin = String(data.pin);
        track.style.setProperty('--travel', data.scrollDistance);
        stage.hidden = false;
        const safeRender = p => {
          if (stopped) return;
          try { render(p); }
          catch (error) { restore(); element.dataset.visualizationStatus = 'failed'; reportError('visualization', element, error); requestRefresh(); }
        };
        render(0);
        element.classList.add('visualization-ready');
        track.classList.add('is-enhanced');
        element.dataset.visualizationReady = 'true';
        stage.setAttribute('aria-hidden', 'false');
        transcript.hidden = true;
        let stickyTop = 88;
        const geometry = () => {
          if (stopped) return;
          try {
            // Give the code camera a bounded panel before measuring. Otherwise a
            // long program's full source height incorrectly disqualifies pinning.
            track.dataset.pin = 'false';
            const headerHeight = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue?.('--header')) || 72;
            stickyTop = headerHeight + 16;
            const viewport = window.innerHeight || document.documentElement.clientHeight;
            const minimum = Math.max(parseFloat(window.getComputedStyle(stage).minHeight) || 0, window.innerWidth <= 760 ? 600 : 540);
            const candidate = Math.max(minimum, viewport - stickyTop - 16);
            track.style.setProperty('--stage-height', `${candidate}px`);
            // Captions and narration can wrap differently in each state. Measure
            // every authored state, then return to the same reading position.
            const progress = trigger?.progress || 0;
            let overflow = 0;
            for (const stop of JSON.parse(element.querySelector('[data-scene-data]').textContent).section.visualization.stops) {
              render(stop);
              overflow = Math.max(overflow, stage.scrollHeight - Math.max(stage.clientHeight, candidate));
            }
            render(progress);
            const height = Math.max(candidate + overflow, stage.offsetHeight);
            const pinned = data.pin && height + stickyTop + 16 <= viewport + 1;
            track.dataset.pin = String(pinned);
            track.style.setProperty('--stage-height', `${height}px`);
            // In a short window, scrolling past a tall unpinned figure can skip
            // its early states. Keep the ordered reading version directly below.
            transcript.hidden = pinned;
            if (pinned) transcript.style.removeProperty('display');
            else transcript.style.setProperty('display', 'block');
          } catch (error) {
            restore(); element.dataset.visualizationStatus = 'failed'; reportError('visualization', element, error); requestRefresh();
          }
        };
        geometry();
        trigger = ScrollTrigger.create({
          trigger: track,
          start: () => track.dataset.pin === 'true' ? `top ${stickyTop}px` : 'top 85%',
          end: () => track.dataset.pin === 'true' ? `+=${Math.max(1, track.offsetHeight - stage.offsetHeight)}` : `+=${Math.max(1, stage.offsetHeight + (window.innerHeight || document.documentElement.clientHeight) * .5)}`,
          invalidateOnRefresh: true,
          onRefreshInit: geometry,
          onUpdate: self => safeRender(self.progress),
          onRefresh: self => safeRender(self.progress),
        });
        safeRender(trigger.progress);
      } catch (error) { restore(); element.dataset.visualizationStatus = 'failed'; reportError('visualization', element, error); }
    }
    // Finish any explicit entry anchor before mounting phrase effects, so their
    // authored initial policy observes the actual restored reading position.
    ScrollTrigger.refresh();
    if (!initialAnchorApplied) {
      initialAnchorApplied = true;
      let id = ''; try { id = decodeURIComponent(window.location.hash.slice(1)); } catch {}
      const target = id ? document.getElementById(id) : null;
      const navigation = window.performance?.getEntriesByType?.('navigation')?.[0]?.type;
      if (target && navigation !== 'reload' && navigation !== 'back_forward') {
        target.scrollIntoView({ behavior: 'instant', block: 'start' }); ScrollTrigger.update();
      }
    }
    for (const element of intros) {
      try { disposers.push(mountIntro(element, { ScrollTrigger, reportError })); }
      catch (error) { element.dataset.introStatus = 'failed'; reportError('intro', element, error); }
    }
    for (const element of effects) {
      try { disposers.push(mountTextEffect(element, { gsap, ScrollTrigger, memory: effectMemory, reportError })); }
      catch (error) { element.dataset.effectStatus = 'failed'; reportError('text-effect', element, error); }
    }
    const progress = document.querySelector('[data-global-progress]');
    if (progress) {
      const drawProgress = self => { progress.style.transform = `scaleX(${self.progress})`; };
      const trigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: drawProgress, onRefresh: drawProgress });
      disposers.push(() => trigger.kill());
    }
    ScrollTrigger.refresh(); drawLocation();
  };
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('pagehide', dispose);
  window.addEventListener('pageshow', event => { if (event.persisted) apply(); });
  // Fonts can alter stage heights after first paint; refresh only when they settle.
  document.fonts?.ready.then(requestRefresh);
  return dispose;
}
if (typeof document !== 'undefined' && typeof window !== 'undefined') setupScrollExperience();
