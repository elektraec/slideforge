import test from 'node:test';
import assert from 'node:assert/strict';
import { fitDiagram } from '../src/player/diagram-layout.js';

test('small diagrams keep their natural size', () => {
  assert.deepEqual(fitDiagram(300, 180, 900, 460), { width: 300, height: 180 });
});

test('wide and tall diagrams fit slide limits without changing proportions', () => {
  assert.deepEqual(fitDiagram(1800, 600, 900, 460), { width: 900, height: 300 });
  assert.deepEqual(fitDiagram(500, 1000, 900, 460), { width: 230, height: 460 });
});
