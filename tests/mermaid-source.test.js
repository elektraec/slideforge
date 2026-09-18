import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareMermaidSource } from '../src/player/mermaid-source.js';

test('long rectangular flowchart labels use Mermaid automatic wrapping', () => {
  const source = 'flowchart LR\n UI["UI: interfaz visible e interacción con el sistema"] --> UX[UX: experiencia completa del usuario]';
  const prepared = prepareMermaidSource(source);
  assert.match(prepared, /UI\["`UI: interfaz visible e interacción con el sistema`"\]/);
  assert.match(prepared, /UX\["`UX: experiencia completa del usuario`"\]/);
});

test('short labels and timelines preserve their original syntax', () => {
  assert.equal(prepareMermaidSource('flowchart LR\n A[Usuario] --> B[Interfaz]'), 'flowchart LR\n A[Usuario] --> B[Interfaz]');
  assert.equal(prepareMermaidSource('timeline\n  2020 : Primera etapa'), 'timeline\n  2020 : Primera etapa');
});
