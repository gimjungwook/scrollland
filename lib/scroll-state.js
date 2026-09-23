// Learning states depend on scroll position, never on elapsed animation time.
export const clamp = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function sceneStops(section) {
  return section.visualization.stops;
}

export function sampleScene(section, motion, progress) {
  const p = clamp(progress);
  const stops = sceneStops(section);
  const count = stops.length;
  let index = 0;
  while (index < count - 1 && p >= stops[index + 1]) index++;
  const complete = index === section.trace.length;
  const phase = complete ? 1 : clamp((p - stops[index]) / (stops[index + 1] - stops[index]));
  const trace = section.trace[Math.min(index, section.trace.length - 1)];
  const step = motion?.steps?.[index];
  return {
    progress: p, index, phase, complete, count,
    label: complete ? (section.code === undefined ? '관계 변화 요약' : '실행 과정 요약') : trace.label,
    state: complete ? section.diagram.caption : trace.state,
    lines: complete ? [] : (step?.lines || []),
    nodes: complete ? (motion?.finalNodes || section.diagram.nodes) : (step?.nodes || [{ label: trace.label, value: trace.state }]),
    output: complete ? (section.output || '') : (step?.output || ''),
  };
}

export function validateMotion(motion, lessons) {
  if (motion?.version !== 2 || !motion.scenes || typeof motion.scenes !== 'object' || Array.isArray(motion.scenes)) throw new Error('motion.json 형식이 잘못되었습니다.');
  const expected = new Set();
  const nodesValid = nodes => Array.isArray(nodes) && nodes.length && nodes.every(node =>
    node && typeof node.label === 'string' && typeof node.value === 'string' &&
    (!('objectId' in node) || (typeof node.objectId === 'string' && node.objectId.trim())) &&
    (!('active' in node) || typeof node.active === 'boolean'));
  for (const [slug, lesson] of Object.entries(lessons)) {
    for (const section of lesson.sections) {
      if (section.kind !== 'visualization') continue;
      const ref = section.visualization?.ref;
      if (typeof ref !== 'string' || !ref || expected.has(ref)) throw new Error(`${slug}: 시각화 참조 오류`);
      expected.add(ref);
      const scene = motion.scenes[ref];
      if (!scene) throw new Error(`${ref}: 시각화 상태 자료가 없습니다.`);
      const stops = section.visualization.stops;
      if (!Array.isArray(stops) || stops.length !== section.trace.length + 1 || stops[0] !== 0 || stops.at(-1) !== 1 || stops.some((stop, i) => !Number.isFinite(stop) || stop < 0 || stop > 1 || (i && stop <= stops[i - 1]))) throw new Error(`${ref}: 상태 전환 위치 오류`);
      if (!Array.isArray(scene.steps) || scene.steps.length !== section.trace.length) throw new Error(`${ref}: 연출 단계 수가 다릅니다.`);
      if (!nodesValid(scene.finalNodes)) throw new Error(`${ref}: 최종 상태 노드 오류`);
      const hasCode = typeof section.code === 'string';
      const lineCount = hasCode ? section.code.split('\n').length : 0;
      for (const step of scene.steps) {
        const lines = !hasCode && step.lines === undefined ? [] : step.lines;
        if (!Array.isArray(lines) || lines.some(n => !Number.isInteger(n) || n < 1 || n > lineCount)) throw new Error(`${ref}: 코드 줄 범위 오류`);
        if (!nodesValid(step.nodes)) throw new Error(`${ref}: 상태 노드 오류`);
        if (hasCode ? typeof step.output !== 'string' : step.output !== undefined && step.output !== '') throw new Error(`${ref}: 출력 형식 오류`);
      }
    }
  }
  for (const ref of Object.keys(motion.scenes)) if (!expected.has(ref)) throw new Error(`${ref}: 사용하지 않는 시각화 자료입니다.`);
  return motion;
}
