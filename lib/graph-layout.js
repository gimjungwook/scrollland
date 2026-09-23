// Graphs are derived only from lesson state. No DOM, clocks, or random IDs are used.
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const mix = (start, end, t) => t === 0 ? start : t === 1 ? end : start + (end - start) * t;
const spread = (index, count, start = 20, end = 80) => count < 2 ? 50 : mix(start, end, index / (count - 1));
const text = value => String(value ?? '').trim();
const unbound = value => !value || /^(?:undefined|not defined)$/i.test(value) || /(?:아직\s*)?(?:정의되지\s*않(?:음|았습니다)|미정의|정의\s*전|연결\s*전)|기본값\s*사용\s*대상|반환\s*대기/.test(value);

function bindingValue(value) {
  // These phrases describe an existing object; they are not part of its value.
  return text(value)
    .replace(/^같은\s+(?=정수\s)/, '')
    .replace(/^같은\s+리스트\s*(?:→\s*)?(?=\[)/, '')
    .replace(/에\s*연결$/, '')
    .replace(/\s+유지$/, '')
    .trim();
}

function bindingPairs(nodes) {
  // The introductory static diagram explicitly separates a name from its object.
  if (nodes.length === 2 && nodes[0].label === '이름' && nodes[1].label === '연결된 객체') {
    return [{ label: nodes[0].value, value: nodes[1].value, ...(nodes[1].objectId ? { objectId: nodes[1].objectId } : {}) }];
  }
  return nodes.flatMap(node => node.label.split(/\s*·\s*/).filter(Boolean).map(label => ({
    label: label.replace(/의\s*현재\s*연결$/, '').trim(), value: node.value,
    ...(node.objectId ? { objectId: node.objectId } : {}),
  })));
}

/**
 * Map labelled state values to positions in a 100 by 100 logical canvas.
 * A binding name has an empty value and points to a separate object item.
 * An explicit objectId preserves mutable object identity when its value changes.
 * Without one, value identity is used; no identity is inferred from [] or {}.
 * Explicit identity qualifiers (for example "객체 A" and "객체 B") are kept.
 * Other layouts preserve identity by role and label, even when values change.
 */
export function layoutGraph(nodes, kind = 'flow') {
  const source = (Array.isArray(nodes) ? nodes : []).map((node, index) => ({
    label: text(node?.label) || `항목 ${index + 1}`, value: text(node?.value),
    ...(typeof node?.active === 'boolean' ? { active: node.active } : {}),
    ...(typeof node?.objectId === 'string' && node.objectId.trim() ? { objectId: node.objectId.trim() } : {}),
  }));
  const items = [], edges = [];
  if (!source.length) return { items, edges };
  const used = new Map();
  const add = (role, label, value, x, y, identity = label) => {
    const base = `${role}:${identity}`;
    const occurrence = used.get(base) || 0;
    used.set(base, occurrence + 1);
    const id = occurrence ? `${base}:${occurrence + 1}` : base;
    items.push({ id, role, label, value, x, y });
    return id;
  };

  if (kind === 'binding') {
    const pairs = bindingPairs(source);
    const objects = new Map();
    for (const pair of pairs) {
      if (!unbound(pair.value)) {
        const value = bindingValue(pair.value);
        const identity = pair.objectId || value;
        if (!objects.has(identity)) objects.set(identity, { id: `object:${identity}`, identity, value });
      }
    }
    pairs.forEach((pair, index) => {
      const from = add('name', pair.label, '', 20, spread(index, pairs.length, 22, 78));
      if (!unbound(pair.value)) edges.push({ from, to: objects.get(pair.objectId || bindingValue(pair.value)).id });
    });
    [...objects.values()].forEach((object, index) => {
      add('object', '객체', object.value, 77, spread(index, objects.size, 22, 78), object.identity);
    });
  } else if (kind === 'sequence') {
    // Position is identity: selecting a slice must never move or remove the
    // unselected characters, or imply that the source string was mutated.
    source.forEach((node, index) => {
      add('sequence', node.label, node.value, spread(index, source.length, 8, 92), 50);
      items.at(-1).active = node.active === true;
    });
  } else if (kind === 'branch') {
    const head = source[0];
    const from = add('condition', head.label, head.value, 50, source.length === 1 ? 50 : 22);
    source.slice(1).forEach((node, index) => {
      const to = add('branch', node.label, node.value, spread(index, source.length - 1, 18, 82), 76);
      edges.push({ from, to });
    });
  } else if (kind === 'object') {
    add('frame', '객체', '', 50, 50, 'object');
    source.forEach((node, index) => add('attribute', node.label, node.value, 50, spread(index, source.length, 29, 73)));
  } else if (kind === 'timeline') {
    let previous;
    const grid = source.length >= 4;
    const rows = Math.ceil(source.length / 2);
    source.forEach((node, index) => {
      // Four captions cannot fit in one mobile column. Keep reading order while
      // moving the same keyed items into two columns; interpolation stays pure.
      const x = grid ? (index % 2 === 0 ? 28 : 75) : 55;
      const y = grid ? spread(Math.floor(index / 2), rows, 25, 75) : spread(index, source.length, 20, 80);
      const current = add('timeline', node.label, node.value, x, y);
      if (previous) edges.push({ from: previous, to: current });
      previous = current;
    });
  } else {
    const role = kind === 'collection' ? 'collection' : kind === 'pipeline' ? 'pipeline' : 'flow';
    let previous;
    source.forEach((node, index) => {
      const current = add(role, node.label, node.value, spread(index, source.length, 14, 86), 50);
      if (previous && role !== 'collection') edges.push({ from: previous, to: current });
      previous = current;
    });
  }
  return { items, edges };
}

function restingPoint(item) {
  // The same off-stage point is used for entering and leaving. Reversing scroll
  // therefore retraces precisely the same path instead of starting a new tween.
  const offsets = {
    name: [-14, 4], object: [15, 13], collection: [0, 14],
    condition: [0, -14], branch: [0, 14], attribute: [12, 8],
    frame: [0, 0], flow: [-14, 0], pipeline: [-14, 0], timeline: [0, 14], sequence: [0, 0],
  };
  const [dx, dy] = offsets[item.role] || [0, 12];
  return { x: clamp(item.x + dx, 0, 100), y: clamp(item.y + dy, 0, 100) };
}
const opacity = item => clamp(item?.opacity ?? 1);
const scale = item => Number.isFinite(item?.scale) ? item.scale : 1;
const byId = items => new Map((items || []).map(item => [item.id, item]));
const edgeKey = edge => JSON.stringify([edge.from, edge.to]);

/**
 * Interpolate a pair of layouts without mutating either input.
 * Items exclusive to one endpoint remain in the result at zero opacity at the
 * opposite endpoint, so callers can keep keyed DOM nodes across the boundary.
 * Edges use the interpolated node centres, in the same 0..100 coordinate space.
 */
export function interpolateGraph(previous, next, progress) {
  const t = clamp(progress);
  const before = byId(previous?.items), after = byId(next?.items);
  // Stable order also makes interpolateGraph(A, B, t) reversible with B, A, 1-t.
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort((a, b) => {
    const frameA = (after.get(a) || before.get(a)).role === 'frame';
    const frameB = (after.get(b) || before.get(b)).role === 'frame';
    return Number(frameB) - Number(frameA) || (a < b ? -1 : a > b ? 1 : 0);
  });
  const items = ids.map(id => {
    const start = before.get(id), end = after.get(id);
    // At the exact midpoint, select the same text in either direction.
    const representative = !start || !end ? start || end : t === .5
      ? (JSON.stringify([start.role, start.label, start.value]) <= JSON.stringify([end.role, end.label, end.value]) ? start : end)
      : t < .5 ? start : end;
    const from = start || restingPoint(end);
    const to = end || restingPoint(start);
    return {
      id, role: representative.role, label: representative.label, value: representative.value,
      ...('active' in representative ? { active: representative.active } : {}),
      x: mix(from.x, to.x, t), y: mix(from.y, to.y, t),
      opacity: mix(start ? opacity(start) : 0, end ? opacity(end) : 0, t),
      scale: mix(start ? scale(start) : .86, end ? scale(end) : .86, t),
    };
  });
  const positions = byId(items);
  const oldEdges = new Map((previous?.edges || []).map(edge => [edgeKey(edge), edge]));
  const newEdges = new Map((next?.edges || []).map(edge => [edgeKey(edge), edge]));
  const edges = [...new Set([...oldEdges.keys(), ...newEdges.keys()])].sort().flatMap(key => {
    const start = oldEdges.get(key), end = newEdges.get(key);
    const edge = end || start;
    const from = positions.get(edge.from), to = positions.get(edge.to);
    if (!from || !to) return [];
    return [{
      from: edge.from, to: edge.to,
      x1: from.x, y1: from.y, x2: to.x, y2: to.y,
      opacity: Math.min(from.opacity, to.opacity, mix(start ? opacity(start) : 0, end ? opacity(end) : 0, t)),
    }];
  });
  return { items, edges };
}
