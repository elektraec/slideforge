import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistory } from '../src/editor/history.js';
import { findComponent, componentFields, buildComponent } from '../src/editor/visual-components.js';

test('history provides bounded undo and redo snapshots', () => {
  const history = createHistory({ title: 'A' });
  history.push({ title: 'B' });
  history.push({ title: 'C' });
  assert.deepEqual(history.undo(), { title: 'B' });
  assert.deepEqual(history.undo(), { title: 'A' });
  assert.equal(history.undo(), null);
  assert.deepEqual(history.redo(), { title: 'B' });
});

test('visual editor parses and regenerates quiz blocks', () => {
  const source = '# Actividad\n\n:::quiz\nquestion: Capital de Ecuador\n- [x] Quito\n- [ ] Cuenca\nfeedback: Correcto\n:::';
  const found = findComponent(source, source.indexOf('Capital'));
  assert.equal(found.type, 'quiz');
  const fields = Object.fromEntries(componentFields('quiz', found.body).map(field => [field.name, field.value]));
  assert.equal(fields.question, 'Capital de Ecuador');
  assert.match(fields.items, /^\*Quito/m);
  assert.match(buildComponent('quiz', fields), /- \[x\] Quito/);
});
