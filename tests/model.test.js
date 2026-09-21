import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, parseMarkdown, serializeMarkdown, normalizeImportedProject, normalizeProject } from '../src/model.js';
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

test('standard Mermaid fenced code becomes a diagram', () => {
  const html = renderContent('# Flujo\n\n```mermaid\nflowchart LR\n A --> B\n```');
  assert.match(html, /class="sf-mermaid"/);
  assert.match(html, /flowchart LR/);
  assert.doesNotMatch(html, /<pre>/);
});

test('Mermaid blocks decode pasted HTML space entities before diagram lines', () => {
  const html = renderContent(':::mermaid\ntimeline\n&#x20;   title Evolución\n&#x20;   1950s : Computación por lotes\n:::');
  assert.match(html, /timeline\n    title Evolución/);
  assert.doesNotMatch(html, /&#x20;|&amp;#x20;/);
});

test('two Mermaid blocks in one slide remain separate diagrams', () => {
  const source = ':::mermaid\ntimeline\n&#x20; title Evolución\n&#x20; 2020 : Primera etapa\n&#x20; 2024 : Segunda etapa\n:::\n\n:::mermaid\nflowchart LR\n&#x20; Usuario --> Interfaz\n&#x20; Interfaz --> Sistema\n:::';
  const html = renderContent(source);
  assert.equal((html.match(/class="sf-mermaid"/g) || []).length, 2);
  assert.match(html, /data-source="timeline/);
  assert.match(html, /data-source="flowchart LR/);
});

test('equations render offline as native MathML', () => {
  assert.match(renderContent('$$E = mc^2$$'), /<math/);
});

test('Markdown tables get a content-sized scroll container', () => {
  const html = renderContent('| Criterio | Pregunta |\n| --- | --- |\n| Claridad | ¿Se entiende qué hacer? |');
  assert.match(html, /<div class="sf-table-wrap"><table>/);
  assert.match(html, /<\/table><\/div>/);
});

test('invalid project options fall back to supported values', () => {
  const value = normalizeProject({ config: { ratio: '20:9', transition: 'spin', branding: { logoMode: 'sometimes' } }, slides: [] });
  assert.equal(value.config.ratio, '16:9');
  assert.equal(value.config.transition, 'slide');
  assert.equal(value.config.branding.logoMode, 'all');
  assert.equal(value.slides.length, 1);
});

test('imported projects never execute custom JavaScript automatically', () => {
  const project = normalizeImportedProject({
    config: { enableCustomJs: true, customJs: 'window.example = true' },
    slides: [{ content: '# Importada' }]
  });
  assert.equal(project.config.enableCustomJs, false);
  assert.equal(project.config.customJs, 'window.example = true');
});
