import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, parseMarkdown, serializeMarkdown, normalizeProject } from '../src/model.js';
import { renderContent } from '../src/player/blocks.js';

test('project Markdown round trip keeps slide kinds, names and notes', () => {
  const project = createProject();
  project.slides[0].notes = 'Explicar el tema antes de avanzar.';
  const slides = parseMarkdown(serializeMarkdown(project));
  assert.equal(slides.length, project.slides.length);
  assert.equal(slides[0].kind, 'cover');
  assert.equal(slides[0].name, 'Portada');
  assert.equal(slides[0].notes, project.slides[0].notes);
});

test('Markdown import does not split columns or code at embedded separators', () => {
  const slides = parseMarkdown('# A\n\n:::columns\nIzquierda\n---\nDerecha\n:::\n\n```md\n---\n```\n\n---\n\n# B');
  assert.equal(slides.length, 2);
  assert.match(slides[0].content, /Derecha/);
});

test('interactive syntax renders real controls and Mermaid source', () => {
  const html = renderContent(':::quiz\nquestion: ¿Cuál?\n- [x] A\n- [ ] B\nfeedback: Bien\n:::\n\n:::mermaid\nflowchart LR\n A --> B\n:::');
  assert.match(html, /data-correct="true"/);
  assert.match(html, /sf-mermaid/);
  assert.match(html, /flowchart LR/);
});

test('equations render offline with KaTeX markup', () => {
  assert.match(renderContent('$$E = mc^2$$'), /class="katex/);
});

test('invalid project options fall back to supported values', () => {
  const value = normalizeProject({ config: { ratio: '20:9', transition: 'spin', branding: { logoMode: 'sometimes' } }, slides: [] });
  assert.equal(value.config.ratio, '16:9');
  assert.equal(value.config.transition, 'slide');
  assert.equal(value.config.branding.logoMode, 'all');
  assert.equal(value.slides.length, 1);
});
