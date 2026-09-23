import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutGraph, interpolateGraph } from '../lib/graph-layout.js';
import { readContent } from '../scripts/generate.mjs';

const shared = () => layoutGraph([{ label: 'birds', value: '정수 7' }, { label: 'saved', value: '같은 정수 7에 연결' }], 'binding');
const reassigned = () => layoutGraph([{ label: 'birds', value: '정수 8' }, { label: 'saved', value: '정수 7' }], 'binding');
const byId = items => new Map(items.map(item => [item.id, item]));
const edgeKeys = edges => edges.map(edge => `${edge.from}→${edge.to}`).sort();
const approximately = (actual, expected, label) => assert(Math.abs(actual - expected) < 1e-10, `${label}: ${actual} != ${expected}`);

function validGraph(graph) {
  const nodes = byId(graph.items);
  assert.equal(nodes.size, graph.items.length, 'every visible object needs a distinct stable identity');
  for (const item of graph.items) {
    for (const key of ['x', 'y']) assert(Number.isFinite(item[key]) && item[key] >= 0 && item[key] <= 100, `${item.id}: invalid ${key}`);
    if ('opacity' in item) assert(item.opacity >= 0 && item.opacity <= 1);
    if ('scale' in item) assert(Number.isFinite(item.scale) && item.scale > 0);
  }
  for (const edge of graph.edges) {
    assert(nodes.has(edge.from), `missing edge origin ${edge.from}`);
    assert(nodes.has(edge.to), `missing edge destination ${edge.to}`);
    if ('x1' in edge) {
      assert.equal(edge.x1, nodes.get(edge.from).x);
      assert.equal(edge.y1, nodes.get(edge.from).y);
      assert.equal(edge.x2, nodes.get(edge.to).x);
      assert.equal(edge.y2, nodes.get(edge.to).y);
      assert(edge.opacity >= 0 && edge.opacity <= Math.min(nodes.get(edge.from).opacity, nodes.get(edge.to).opacity));
    }
  }
}

test('binding diagrams separate names from objects and never turn an unbound name into an object', () => {
  const intro = layoutGraph([{ label: '이름', value: 'birds' }, { label: '연결된 객체', value: '정수 7' }], 'binding');
  assert.deepEqual(intro.items.map(({ id, role, label, value }) => ({ id, role, label, value })), [
    { id: 'name:birds', role: 'name', label: 'birds', value: '' },
    { id: 'object:정수 7', role: 'object', label: '객체', value: '정수 7' },
  ]);
  assert.deepEqual(edgeKeys(intro.edges), ['name:birds→object:정수 7']);
  const unbound = layoutGraph([{ label: 'birds', value: '아직 정의되지 않음' }], 'binding');
  assert.equal(unbound.items.length, 1);
  assert.equal(unbound.items[0].role, 'name');
  assert.deepEqual(unbound.edges, []);
  for (const value of ['', 'undefined', '아직 정의되지 않았습니다']) {
    assert.equal(layoutGraph([{ label: 'pending', value }], 'binding').items.length, 1);
    assert.deepEqual(layoutGraph([{ label: 'pending', value }], 'binding').edges, []);
  }
});

test('shared bindings converge on one object and reassignment changes only the affected name’s edge', () => {
  const before = shared(); const after = reassigned();
  assert.equal(before.items.filter(item => item.role === 'object').length, 1);
  assert.deepEqual(edgeKeys(before.edges), ['name:birds→object:정수 7', 'name:saved→object:정수 7']);
  assert.deepEqual(edgeKeys(after.edges), ['name:birds→object:정수 8', 'name:saved→object:정수 7']);
  assert.deepEqual(before.items.filter(item => item.role === 'name').map(item => item.id), after.items.filter(item => item.role === 'name').map(item => item.id));
  assert(after.items.some(item => item.id === 'object:정수 7'), 'saved must retain its original object');
  const combined = layoutGraph([{ label: 'birds · saved', value: '정수 7' }], 'binding');
  assert.deepEqual(edgeKeys(combined.edges), edgeKeys(before.edges));
  const labelledSummary = layoutGraph([{ label: 'birds의 현재 연결', value: '정수 8' }, { label: 'saved의 현재 연결', value: '정수 7' }], 'binding');
  assert.deepEqual(edgeKeys(labelledSummary.edges), edgeKeys(after.edges));
});

test('explicit object identities are retained even if their displayed values are equal', () => {
  const graph = layoutGraph([{ label: 'a', value: '객체 A: [1, 2]' }, { label: 'b', value: '객체 B: [1, 2]' }], 'binding');
  assert.equal(graph.items.filter(item => item.role === 'object').length, 2);
  assert.notEqual(graph.edges[0].to, graph.edges[1].to);
});

test('an explicit mutable object identity survives in-place edits while an equal-valued copy stays separate', () => {
  const first = layoutGraph([{ label: 'original · backup', value: '[4, 2]', objectId: 'shared-list' }], 'binding');
  const changed = layoutGraph([{ label: 'original · backup', value: '[9, 2]', objectId: 'shared-list' }], 'binding');
  const copied = layoutGraph([
    { label: 'original · backup', value: '[9, 2]', objectId: 'shared-list' },
    { label: 'independent', value: '[9, 2]', objectId: 'copied-list' },
  ], 'binding');
  const target = (graph, name) => graph.edges.find(edge => edge.from === `name:${name}`)?.to;
  assert(target(first, 'original'));
  assert.equal(target(first, 'original'), target(changed, 'original'), 'in-place mutation must not replace the object node');
  assert.equal(target(changed, 'original'), target(changed, 'backup'));
  assert.equal(target(changed, 'original'), target(copied, 'original'));
  assert.notEqual(target(copied, 'original'), target(copied, 'independent'), 'value equality must not merge separate objects');
  const before = byId(first.items).get(target(first, 'original'));
  const after = byId(changed.items).get(target(changed, 'original'));
  assert.notEqual(before.value, after.value);
  assert.equal(interpolateGraph(first, changed, 0.5).items.filter(item => item.role === 'object').length, 1, 'a mutable value transition must update one existing object');
});

test('all diagram kinds retain stable identities and valid relationships as values change', () => {
  const nodes = [{ label: '처음', value: '1' }, { label: '중간', value: '2' }, { label: '마지막', value: '3' }];
  for (const kind of ['flow', 'binding', 'collection', 'branch', 'pipeline', 'object', 'timeline']) {
    const graph = layoutGraph(nodes, kind);
    validGraph(graph);
    if (kind !== 'binding') {
      const updated = layoutGraph(nodes.map(node => ({ ...node, value: `${node.value}0` })), kind);
      assert.deepEqual(graph.items.map(item => item.id), updated.items.map(item => item.id), `${kind}: changing a value must not recreate the same labelled item`);
    }
    if (kind === 'collection') assert.equal(graph.edges.length, 0, 'collection order is not an execution arrow');
    if (kind === 'object') assert.equal(graph.items[0].role, 'frame');
  }
  const repeated = layoutGraph([{ label: '항목', value: '1' }, { label: '항목', value: '2' }], 'collection');
  assert.equal(new Set(repeated.items.map(item => item.id)).size, 2);
});

test('interpolation preserves both endpoint identities and connects edges to the moving node positions', () => {
  const before = shared(); const after = reassigned();
  const start = interpolateGraph(before, after, 0);
  const middle = interpolateGraph(before, after, 0.5);
  const end = interpolateGraph(before, after, 1);
  for (const graph of [start, middle, end]) validGraph(graph);
  assert.deepEqual(start.items.map(item => item.id), end.items.map(item => item.id), 'entering objects stay keyed even when invisible');
  assert.equal(byId(start.items).get('object:정수 8').opacity, 0);
  assert.equal(byId(end.items).get('object:정수 8').opacity, 1);
  for (const [layout, frame] of [[before, start], [after, end]]) {
    for (const node of layout.items) {
      const rendered = byId(frame.items).get(node.id);
      assert.equal(rendered.x, node.x);
      assert.equal(rendered.y, node.y);
      assert.equal(rendered.opacity, 1);
      assert.equal(rendered.label, node.label);
      assert.equal(rendered.value, node.value);
    }
    assert.deepEqual(edgeKeys(frame.edges.filter(edge => edge.opacity === 1)), edgeKeys(layout.edges));
  }
  const disappearing = interpolateGraph(after, before, 1);
  assert.equal(byId(disappearing.items).get('object:정수 8').opacity, 0);
  assert(byId(middle.items).get('object:정수 8').opacity > 0 && byId(middle.items).get('object:정수 8').opacity < 1);
});

test('reverse interpolation retraces the same geometry instead of starting a direction-dependent animation', () => {
  const before = shared(); const after = reassigned();
  for (const p of [0, 0.1, 0.25, 0.5, 0.77, 1]) {
    const forward = interpolateGraph(before, after, p);
    const backward = interpolateGraph(after, before, 1 - p);
    assert.deepEqual(forward.items.map(item => item.id), backward.items.map(item => item.id));
    forward.items.forEach((item, i) => {
      for (const key of ['x', 'y', 'opacity', 'scale']) approximately(item[key], backward.items[i][key], `${item.id}.${key}`);
      assert.equal(item.label, backward.items[i].label);
      assert.equal(item.value, backward.items[i].value);
    });
    assert.deepEqual(edgeKeys(forward.edges), edgeKeys(backward.edges));
    forward.edges.forEach((edge, i) => {
      for (const key of ['x1', 'y1', 'x2', 'y2', 'opacity']) approximately(edge[key], backward.edges[i][key], `${edge.from}→${edge.to}.${key}`);
    });
  }
  const first = layoutGraph([{ label: '합계', value: '7' }], 'flow');
  const second = layoutGraph([{ label: '합계', value: '8' }], 'flow');
  assert.deepEqual(interpolateGraph(first, second, 0.5), interpolateGraph(second, first, 0.5), 'midpoint text must resolve identically even when the stable item has a changed value');
});

test('layout and interpolation are deterministic, bounded and do not mutate their input', () => {
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const before = freeze(shared()); const after = freeze(reassigned());
  const empty = { items: [], edges: [] };
  const original = JSON.stringify({ before, after });
  assert.deepEqual(interpolateGraph(before, after, -3), interpolateGraph(before, after, 0));
  assert.deepEqual(interpolateGraph(before, after, 4), interpolateGraph(before, after, 1));
  assert.deepEqual(interpolateGraph(before, after, NaN), interpolateGraph(before, after, 0));
  const selected = interpolateGraph(before, after, 0.6);
  for (const p of [0, 1, 0.2, 0.99, 0.5]) interpolateGraph(before, after, p);
  assert.deepEqual(interpolateGraph(before, after, 0.6), selected);
  for (const p of [0, 0.5, 1]) { validGraph(interpolateGraph(empty, after, p)); validGraph(interpolateGraph(before, empty, p)); }
  assert.deepEqual(layoutGraph([], 'binding'), empty);
  assert.deepEqual(interpolateGraph(empty, empty, 0.5), empty);
  assert.equal(JSON.stringify({ before, after }), original);
});

test('every selected visualization produces valid graphs through all authored state transitions', async () => {
  const content = await readContent();
  let scenes = 0;
  for (const slug of content.order) {
    content.lessons[slug].sections.filter(section => section.kind === 'visualization').forEach(section => {
      scenes++;
      const authored = content.motion.scenes[section.id];
      const layouts = [...authored.steps.map(step => step.nodes), authored.finalNodes].map(nodes => layoutGraph(nodes, section.diagram.type));
      layouts.forEach(validGraph);
      for (let j = 1; j < layouts.length; j++) {
        for (const p of [0, 0.5, 1]) validGraph(interpolateGraph(layouts[j - 1], layouts[j], p));
      }
    });
  }
  assert(scenes > 0);
  assert.equal(scenes, Object.keys(content.motion.scenes).length);
});

test('the real alias and nested-copy lessons preserve mutable identity through every displayed edit', async () => {
  const content = await readContent();
  const layouts = (slug, scene) => {
    const authored = content.motion.scenes[`${slug}-scene-${scene + 1}`];
    return [...authored.steps.map(step => step.nodes), authored.finalNodes].map(nodes => layoutGraph(nodes, 'binding'));
  };
  const target = (graph, name) => {
    const edge = graph.edges.find(edge => edge.from === `name:${name}`);
    assert(edge, `the source expression ${name} disappeared from its binding diagram`);
    return edge.to;
  };
  const alias = layouts('list-transform', 0);
  const sharedId = target(alias[0], 'original');
  for (const graph of alias) {
    assert.equal(target(graph, 'original'), sharedId, 'backup[0] = 9 edits the existing list');
    assert.equal(target(graph, 'backup'), sharedId);
  }
  assert.notEqual(byId(alias[0].items).get(sharedId).value, byId(alias[1].items).get(sharedId).value);

  const nested = layouts('nested-data', 2);
  const original = 'original["counts"]'; const copied = 'copied["counts"]'; const independent = 'independent["counts"]';
  const nestedSharedId = target(nested[0], original);
  for (const graph of nested) {
    assert.equal(target(graph, original), nestedSharedId, 'append edits the same nested list');
    assert.equal(target(graph, copied), nestedSharedId, 'shallow copying retains the nested alias');
  }
  const independentId = target(nested[1], independent);
  assert.notEqual(independentId, nestedSharedId, 'copy() creates a separate list despite equal contents');
  assert.equal(target(nested[2], independent), independentId, 'editing the copied list retains its identity');
  assert.equal(byId(nested[1].items).get(nestedSharedId).value, byId(nested[2].items).get(nestedSharedId).value, 'the independent edit must not change the original list');
  assert.notEqual(byId(nested[1].items).get(independentId).value, byId(nested[2].items).get(independentId).value);
});
