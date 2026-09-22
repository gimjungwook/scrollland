import { clamp, sampleScene } from './lib/scroll-state.js?v=3';
import { layoutGraph, interpolateGraph } from './lib/graph-layout.js?v=3';

const escape = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function prepareGraph(canvas, layouts, kind) {
  const items=new Map(),edges=new Map();
  layouts.forEach(layout=>{layout.items.forEach(item=>items.set(item.id,item));layout.edges.forEach(edge=>edges.set(JSON.stringify([edge.from,edge.to]),edge));});
  const roleClass=role=>({name:'name-node',object:'object-node',condition:'condition-node',branch:'branch-node',collection:'collection-node',timeline:'timeline-node',attribute:'attribute-node',frame:'object-frame',flow:'flow-node',pipeline:'flow-node'}[role]);
  canvas.innerHTML=`<svg class="graph-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${[...edges.keys()].map(key=>`<path data-edge-id="${escape(key)}"/>`).join('')}</svg>${[...items.values()].map(item=>`<div class="${item.role==='frame'?'':'graph-node '}${roleClass(item.role)}" data-graph-id="${escape(item.id)}"><span>${escape(item.role==='name'?'이름':item.label)}</span><strong></strong></div>`).join('')}`;
  const nodeElements=new Map([...canvas.querySelectorAll('[data-graph-id]')].map(node=>[node.dataset.graphId,node]));
  const edgeElements=new Map([...canvas.querySelectorAll('[data-edge-id]')].map(node=>[node.dataset.edgeId,node]));
  return graph=>{
    canvas.dataset.timelineGrid=String(kind==='timeline'&&graph.items.some(item=>item.x>60&&item.opacity>.001));
    canvas.dataset.objectCount=String(graph.items.filter(item=>item.role==='object'&&item.opacity>.05).length);
    nodeElements.forEach(node=>{node.style.opacity='0';});
    edgeElements.forEach(node=>{node.style.opacity='0';});
    graph.items.forEach(item=>{
      const node=nodeElements.get(item.id);
      node.style.opacity=String(item.opacity);
      if(item.role!=='frame'){
        node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;
        node.style.transform=`translate(-50%,-50%) scale(${item.scale})`;
        const value=item.role==='name'?item.label:item.value;
        const strong=node.querySelector('strong');strong.textContent=value;strong.classList.toggle('long-value',value.length>15);
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

function mountScene(element) {
  const {section,motion}=JSON.parse(element.querySelector('[data-scene-data]').textContent);
  const stage=element.querySelector('.scene-stage');
  const canvas=element.querySelector('[data-state-canvas]');
  const pre=element.querySelector('.stage-code');
  const lines=[...element.querySelectorAll('[data-code-line]')];
  const output=element.querySelector('[data-output]'),empty=element.querySelector('[data-output-empty]');
  let lastIndex=-1,lastBody='';
  const layouts=Array.from({length:section.trace.length+1},(_,i)=>layoutGraph(sampleScene(section,motion,(i+.5)/(section.trace.length+1)).nodes,section.diagram.type));
  const drawGraph=prepareGraph(canvas,layouts,section.diagram.type);
  let cameraFrom=0,cameraTo=0;
  stage.hidden=false;
  return p=>{
    const state=sampleScene(section,motion,p);
    element.dataset.scrollProgress=p.toFixed(5);
    element.dataset.currentStep=String(state.index);
    const linear=clamp(state.phase*3);
    const reveal=linear*linear*(3-2*linear);
    canvas.style.setProperty('--reveal',1);
    drawGraph(interpolateGraph(layouts[Math.max(0,state.index-1)],layouts[state.index],reveal));
    stage.style.setProperty('--scene-progress',p);
    element.querySelector('[data-scene-progress]').style.transform=`scaleX(${p})`;
    if(lastIndex!==state.index){
      lastIndex=state.index;
      element.querySelector('[data-position]').textContent=`${String(state.index+1).padStart(2,'0')} / ${String(state.count).padStart(2,'0')}`;
      element.querySelector('[data-step-label]').textContent=state.label;
      element.querySelector('[data-step-state]').textContent=state.state;
      element.querySelector('[data-state-caption]').textContent=state.complete?'결과와 관계 확인':state.label;
      canvas.dataset.frame=String(state.index);
      lines.forEach(line=>line.classList.toggle('is-active',state.lines.includes(Number(line.dataset.codeLine))));
      output.textContent=state.output;
      empty.hidden=state.output!=='';
      empty.textContent=state.complete?'표준 출력 없음':'아직 출력 없음';
    }
    const previous=sampleScene(section,motion,Math.max(0,(state.index-.5)/state.count));
    const previousLine=lines.find(line=>previous.lines.includes(Number(line.dataset.codeLine)));
    const current=lines.find(line=>state.lines.includes(Number(line.dataset.codeLine)));
    cameraFrom=state.index>0&&previousLine?Math.max(0,previousLine.offsetTop-pre.clientHeight*.3):0;
    cameraTo=current?Math.max(0,current.offsetTop-pre.clientHeight*.3):Math.max(0,pre.scrollHeight-pre.clientHeight);
    // The code camera moves with the same scroll progress; wheel events remain native page input.
    pre.scrollTop=cameraFrom+(cameraTo-cameraFrom)*reveal;
    output.scrollTop=Math.max(0,output.scrollHeight-output.clientHeight)*clamp((state.phase-.25)/.65);
    if(lastBody!==state.body){lastBody=state.body;element.querySelector('[data-step-body]').textContent=state.body;}
  };
}

function setupScrollExperience() {
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let context;
  let initialAnchorApplied=false;
  const scenes=[...document.querySelectorAll('[data-scroll-scene]')];
  const fallback=document.querySelector('[data-motion-fallback]');
  const apply=()=>{
    if(context)context.revert();context=undefined;
    document.documentElement.classList.remove('motion-on');
    scenes.forEach(scene=>{scene.querySelector('.scene-stage').hidden=true;});
    if(media.matches||!window.gsap||!window.ScrollTrigger){
      if(fallback){fallback.hidden=false;fallback.textContent=media.matches?'움직임 줄이기 설정에 따라 전체 설명과 상태를 이어서 표시합니다.':'스크롤 연출을 불러오지 못해 전체 설명과 상태를 이어서 표시합니다.';}return;
    }
    try {
      window.gsap.registerPlugin(window.ScrollTrigger);
      context=window.gsap.context(()=>{
        document.documentElement.classList.add('motion-on');
        if(fallback)fallback.hidden=true;
        scenes.forEach(element=>{
          const render=mountScene(element),position={p:0};render(0);
          window.gsap.to(position,{p:1,ease:'none',onUpdate:()=>render(position.p),scrollTrigger:{trigger:element,start:'top top',end:'bottom bottom',scrub:true,invalidateOnRefresh:true,onRefresh:self=>render(self.progress)}});
        });
        document.querySelectorAll('[data-scroll-check]').forEach(element=>{
          const answer=element.querySelector('[data-answer-reveal]');
          const timeline=window.gsap.timeline({scrollTrigger:{trigger:element,start:'top top',end:'bottom bottom',scrub:true,invalidateOnRefresh:true}});
          timeline.fromTo(answer,{opacity:0,y:70},{opacity:1,y:0,duration:.28,ease:'power2.out'},.48);
        });
        const hero=document.querySelector('[data-hero]');
        if(hero){
          const tl=window.gsap.timeline({scrollTrigger:{trigger:hero,start:'top top',end:'bottom bottom',scrub:true,invalidateOnRefresh:true}});
          tl.to('.hero-title',{scale:.84,y:-50,opacity:.2,ease:'none'},0)
            .to('.hero-description',{opacity:0,y:-35,ease:'none'},0)
            .to('.hero-machine',{scale:1.27,y:-80,rotateX:0,rotateY:0,ease:'power1.inOut'},0)
            .fromTo('.hero-path',{strokeDasharray:420,strokeDashoffset:420},{strokeDashoffset:0,ease:'none'},.1)
            .to('.hero-value',{opacity:0,y:-35,duration:.15},.48)
            .fromTo('.hero-value-next',{opacity:0,y:35},{opacity:1,y:0,duration:.15},.48)
            .to('.hero-orbit',{scale:1.18,transformOrigin:'center center',opacity:.65},.2)
            .to('.hero-watermark',{xPercent:-10,opacity:.18,ease:'none'},0);
        }
        document.querySelectorAll('[data-lesson-article]').forEach(article=>{
          window.ScrollTrigger.create({trigger:article,start:'top 40%',end:'bottom 40%',onToggle:self=>{if(self.isActive)document.querySelector('[data-header-current]').textContent=article.dataset.title;}});
          const title=article.querySelector('.lesson-opening h1, .lesson-opening h2');
          window.gsap.fromTo(title,{y:60,opacity:.25},{y:0,opacity:1,ease:'none',scrollTrigger:{trigger:article.querySelector('.lesson-opening'),start:'top 85%',end:'top 25%',scrub:true}});
        });
        window.gsap.to('[data-global-progress]',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true,invalidateOnRefresh:true}});
      });
      window.ScrollTrigger.refresh();
      // Complete the explicit URL-anchor navigation after the story obtains its final height.
      // This is never used to advance lessons or react to ordinary scrolling.
      if(!initialAnchorApplied){
        initialAnchorApplied=true;
        let id='';try{id=decodeURIComponent(window.location.hash.slice(1));}catch{}
        const target=id?document.getElementById(id):null;
        const navigation=window.performance?.getEntriesByType?.('navigation')?.[0]?.type;
        if(target&&navigation!=='reload'&&navigation!=='back_forward'){target.scrollIntoView({behavior:'instant',block:'start'});window.ScrollTrigger.update();}
      }
    } catch(error) {
      if(context)context.revert();context=undefined;
      document.documentElement.classList.remove('motion-on');
      scenes.forEach(scene=>{scene.querySelector('.scene-stage').hidden=true;});
      if(fallback){fallback.hidden=false;fallback.textContent='스크롤 연출을 준비하지 못해 전체 설명과 상태를 이어서 표시합니다.';}
      console.error('ScrollLand motion initialization failed',error);
    }
  };
  apply();media.addEventListener('change',apply);
  window.addEventListener('pagehide',()=>{if(context)context.revert();},{once:true});
}
setupScrollExperience();
