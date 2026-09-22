// Every learning state is derived from a position, never elapsed time.
export const clamp = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
export function sampleScene(section, motion, progress) {
  const p = clamp(progress);
  const count = section.trace.length + 1;
  const scaled = p * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  const phase = Math.min(1, scaled - index);
  const complete = index === section.trace.length;
  const trace = section.trace[Math.min(index, section.trace.length - 1)];
  const step = motion?.steps?.[index];
  return {
    progress: p, index, phase, complete,
    label: complete ? '실행 과정 요약' : trace.label,
    state: complete ? section.diagram.caption : trace.state,
    lines: complete ? [] : (step?.lines || []),
    nodes: complete ? (motion?.finalNodes || section.diagram.nodes) : (step?.nodes || [{ label: trace.label, value: trace.state }]),
    output: complete ? section.output : (step?.output || ''),
    body: section.body[Math.min(section.body.length - 1, Math.floor(p * section.body.length))],
    count,
  };
}
export function validateMotion(motion, lessons) {
  if (motion?.version !== 1 || !motion.lessons) throw new Error('motion.json 형식이 잘못되었습니다.');
  for (const [slug, lesson] of Object.entries(lessons)) {
    const scenes = motion.lessons[slug];
    if (!Array.isArray(scenes) || scenes.length !== lesson.sections.length) throw new Error(`${slug}: 연출 장면 수가 다릅니다.`);
    scenes.forEach((scene, i) => {
      const section = lesson.sections[i];
      if (scene.steps?.length !== section.trace.length) throw new Error(`${slug}/${i}: 연출 단계 수가 다릅니다.`);
      if (!Array.isArray(scene.finalNodes) || !scene.finalNodes.length || scene.finalNodes.some(n => typeof n.label !== 'string' || typeof n.value !== 'string')) throw new Error(`${slug}/${i}: 최종 상태 노드 오류`);
      if (scene.finalNodes.some(n => 'objectId' in n && (typeof n.objectId !== 'string' || !n.objectId.trim()))) throw new Error(`${slug}/${i}: 최종 객체 식별자 오류`);
      scene.steps.forEach(step => {
        if (!Array.isArray(step.lines) || step.lines.some(n => !Number.isInteger(n) || n < 1 || n > section.code.split('\n').length)) throw new Error(`${slug}/${i}: 코드 줄 범위 오류`);
        if (!Array.isArray(step.nodes) || !step.nodes.length || step.nodes.some(n => typeof n.label !== 'string' || typeof n.value !== 'string')) throw new Error(`${slug}/${i}: 상태 노드 오류`);
        if (step.nodes.some(n => 'objectId' in n && (typeof n.objectId !== 'string' || !n.objectId.trim()))) throw new Error(`${slug}/${i}: 객체 식별자 오류`);
        if (typeof step.output !== 'string') throw new Error(`${slug}/${i}: 출력 형식 오류`);
      });
    });
  }
  return motion;
}
