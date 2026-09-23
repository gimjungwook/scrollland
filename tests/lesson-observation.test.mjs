import test from 'node:test';
import assert from 'node:assert/strict';
import { readContent, renderLesson } from '../scripts/generate.mjs';
import { sampleScene } from '../lib/scroll-state.js';
import { layoutGraph, interpolateGraph } from '../lib/graph-layout.js';

test('the first program distinguishes comment, evaluation, first print and next print', async () => {
  const content = await readContent();
  const section = content.lessons['run-python'].sections.find(s => s.id === 'run-python-scene-2');
  const motion = content.motion.scenes[section.id];
  const frames = section.visualization.stops.map(p => sampleScene(section, motion, p));
  assert.deepEqual(frames.map(f => f.output), ['', '', '7', '7\n기록 #1', '7\n기록 #1']);
  assert.deepEqual(frames.map(f => f.lines), [[1], [2], [2], [3], []]);
  assert.equal(frames[1].nodes.find(n => n.label === '계산한 값').value, '7');
  assert.equal(frames[1].output, '', 'evaluation is not itself printing');
});

test('selecting a string slice changes selection while every original character stays in place', async () => {
  const content = await readContent();
  const section = content.lessons.strings.sections.find(s => s.id === 'strings-scene-2');
  const motion = content.motion.scenes[section.id];
  const frames = section.visualization.stops.map(p => sampleScene(section, motion, p));
  assert.deepEqual(frames.map(f => f.nodes.filter(n => n.active).map(n => n.label)), [[], ['0','1','2'], ['4','5'], ['0','1','2','3','4','5'], []]);
  const layouts = frames.map(f => layoutGraph(f.nodes, 'sequence'));
  for (const layout of layouts) {
    assert.equal(layout.items.map(n => n.value).join(''), 'OBS-27');
    assert.deepEqual(layout.items.map(({id,x,y}) => ({id,x,y})), layouts[0].items.map(({id,x,y}) => ({id,x,y})));
    assert.equal(layout.edges.length, 0, 'position marks are not execution arrows');
  }
  assert.equal(frames[2].output, 'OBS\n27');
  assert.equal(frames[3].output, 'OBS\n27\nOBS-27');
  assert.deepEqual(interpolateGraph(layouts[1], layouts[2], 0).items.filter(n=>n.active).map(n=>n.label), ['0','1','2']);
  assert.deepEqual(interpolateGraph(layouts[1], layouts[2], 1).items.filter(n=>n.active).map(n=>n.label), ['4','5']);
  const staticPage = renderLesson(content.lessons.strings, content);
  assert(staticPage.includes('0 · 선택'));
  assert(staticPage.includes('5 · 선택'));
});

test('reassignment preserves the other name and prints each name only at its print statement', async () => {
  const content = await readContent();
  const section = content.lessons.variables.sections.find(s => s.id === 'variables-scene-4');
  const motion = content.motion.scenes[section.id];
  const frames = section.visualization.stops.map(p => sampleScene(section, motion, p));
  assert.deepEqual(frames.map(f => f.output), ['', '', '', '8', '8\n7', '8\n7']);
  assert.deepEqual(frames[3].lines, [4]);
  assert.deepEqual(frames[4].lines, [5]);
  for (const f of frames.slice(2)) assert.equal(f.nodes.find(n => n.label === 'saved').value, '정수 7');
});
