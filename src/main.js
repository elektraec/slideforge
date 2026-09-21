import { createProject, newSlide, KINDS, PALETTE, normalizeProject, normalizeImportedProject, parseMarkdown, serializeMarkdown } from './model.js';
import { snippets } from './editor/snippets.js';
import { createHistory } from './editor/history.js';
import { findComponent, componentFields, buildComponent, visualTypes, visualTypeLabel } from './editor/visual-components.js';
import { pedagogical, templateSlides } from './templates/index.js';
import { generatePrompt } from './prompts/generate.js';
import { saveLocal, loadLocal, hasLocal } from './storage/local.js';
import { downloadText, exportProject, exportWeb, importProjectZip } from './export/files.js';
import './styles/editor.css';
import './styles/authoring.css';

const root = document.querySelector('#app');
let project = createProject();
let selected = 0;
let previewTimer;
let previewRevision = 0;
let persistTimer;
let fileHandle;
let imageUploadMode = 'insert';
let history = createHistory(project);
let slideFilter = '';
let overflowDiagnostics = [];
let playerDiagnostics = [];
const kindNames = { cover: 'Portada', section: 'Separador', content: 'Título + contenido', columns: 'Dos columnas', image: 'Imagen + texto', question: 'Pregunta', activity: 'Actividad', data: 'Datos', quote: 'Cita', conclusions: 'Conclusiones', closing: 'Cierre' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = selector => root.querySelector(selector);
const slide = () => project.slides[selected];
const playerUrl = `${import.meta.env.BASE_URL}player.html`;
const input = (label, key, value, type = 'text') => `<label>${label}<input data-config="${key}" type="${type}" value="${esc(value)}"></label>`;

root.innerHTML = `<header class="topbar"><div class="brand"><span class="brand-mark">S<span>F</span></span><div><strong>SlideForge</strong><small>Estudio de presentaciones</small></div></div><div class="top-actions"><span id="save-status" aria-live="polite">Sin guardar</span><button id="undo" title="Deshacer (Ctrl+Z)" disabled>↶ Deshacer</button><button id="redo" title="Rehacer (Ctrl+Y)" disabled>↷ Rehacer</button><button id="restore" hidden>Restaurar última sesión</button><button id="open-file">Abrir</button><button id="save-flow">Guardar y publicar</button><button id="present" class="button-primary">Presentar ↗</button></div></header>
<main class="workspace"><aside class="sidebar"><div class="pane-title"><div><span class="eyebrow">PROYECTO</span><h2>Diapositivas <span id="slide-count"></span></h2></div><button id="add-slide" title="Añadir diapositiva" aria-label="Añadir diapositiva">+</button></div><div class="slide-search"><input id="slide-search" type="search" placeholder="Buscar diapositivas…" aria-label="Buscar diapositivas"><span id="search-count"></span></div><div id="slide-list" class="slide-list"></div><div class="sidebar-bottom"><label class="small-label">Plantilla pedagógica<select id="pedagogical"><option value="">Elegir plantilla…</option>${Object.keys(pedagogical).map(name => `<option>${esc(name)}</option>`).join('')}</select></label><button id="new-project" class="text-button">Nuevo proyecto</button></div></aside>
<section class="editor-pane"><div class="pane-title editor-title"><div><span class="eyebrow">EDITOR</span><h2 id="current-heading">Contenido</h2></div><span class="badge">Markdown + visual</span></div><div id="overflow-alert" class="overflow-alert" hidden></div><div class="slide-fields"><label>Nombre<input id="slide-name"></label><label>Diseño<select id="slide-kind">${KINDS.map(kind => `<option value="${kind}">${kindNames[kind]}</option>`).join('')}</select></label></div><div class="editor-toolbar"><label>Insertar<select id="insert"><option value="">Componente…</option>${Object.keys(snippets).map(name => `<option>${esc(name)}</option>`).join('')}</select></label><button id="visual-editor">Editor visual</button><button id="upload-image">Añadir imagen</button><button id="import-content">Importar archivo</button></div><label class="editor-label" for="content">Contenido de la diapositiva</label><textarea id="content" spellcheck="false" aria-label="Contenido Markdown y HTML"></textarea><label class="editor-label" for="notes">Notas del docente</label><textarea id="notes" rows="3" placeholder="Notas visibles en Speaker View"></textarea><p class="editor-hint">Selecciona o coloca el cursor dentro de un bloque ::: para editarlo visualmente.</p></section>
<section class="preview-pane"><div class="pane-title"><div><span class="eyebrow">VISTA PREVIA</span><h2>Presentación</h2></div><button id="open-preview" class="text-button">Abrir ventana ↗</button></div><div class="preview-wrap"><iframe id="preview" title="Vista previa Reveal.js" src="${playerUrl}"></iframe></div><div class="preview-caption"><span class="live-dot"></span> Reveal.js + Mermaid · vista real de exportación</div></section></main>
<nav class="bottom-bar" aria-label="Herramientas"><button data-panel="branding">Branding</button><button data-panel="assets">Recursos <span id="asset-count"></span></button><button data-panel="settings">Tema y navegación</button><button data-panel="prompt">Generar prompt para IA</button><button data-panel="diagnostics">Diagnóstico <span id="diagnostic-count"></span></button><span class="spacer"></span><button id="export-md">Markdown</button><button id="export-project">Proyecto portable</button><button id="export-web" class="button-primary">Web para publicar</button><button id="export-pdf">PDF / Imprimir</button></nav>
<dialog id="panel-dialog"><div class="dialog-body"><div class="dialog-head"><h2 id="dialog-title"></h2><button aria-label="Cerrar" class="close">×</button></div><div id="dialog-content"></div></div></dialog>
<input id="file-input" type="file" accept=".md,.markdown,.txt,.html,.json,.zip,.slideforge.zip,image/*" hidden><input id="image-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" hidden><input id="logo-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" hidden>`;

function setStatus(text) { $('#save-status').textContent = text; }
function updateHistoryButtons() { $('#undo').disabled = !history.canUndo; $('#redo').disabled = !history.canRedo; }
function commitHistory() { history.push(project); updateHistoryButtons(); }
function applyHistory(value, message) {
  if (!value) return;
  project = normalizeProject(value);
  selected = Math.min(selected, project.slides.length - 1);
  renderList(); renderFields(); persist(); refreshPreview(); updateHistoryButtons(); setStatus(message);
}
function persist() {
  clearTimeout(persistTimer);
  setStatus('Guardando…');
  persistTimer = setTimeout(async () => {
    const saved = await saveLocal(structuredClone(project));
    setStatus(saved ? 'Guardado en este dispositivo' : 'No se pudo guardar · exporta el proyecto');
    if (saved) $('#restore').hidden = false;
  }, 500);
}
function sendPreview() { const frame = $('#preview').contentWindow; frame?.postMessage({ type: 'slideforge:project', project, revision: previewRevision }, location.origin); }
function refreshPreview() { clearTimeout(previewTimer); previewTimer = setTimeout(() => { previewRevision++; sendPreview(); }, 350); }
function referencedAssets(content) {
  const result = {};
  for (const match of content.matchAll(/assets\/([\w.\-]+)/g)) if (project.assets[match[1]]) result[match[1]] = project.assets[match[1]];
  return result;
}
function sendSlidePreview(index = selected) {
  const current = project.slides[index];
  $('#preview').contentWindow?.postMessage({ type: 'slideforge:slide-update', index, slide: current, assets: referencedAssets(current.content) }, location.origin);
}
function refreshSlidePreview(index = selected) {
  if (project.config.enableCustomJs) { refreshPreview(); return; }
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => sendSlidePreview(index), 180);
}
function calculateDiagnostics() {
  const merged = new Map(playerDiagnostics.map(item => [item.index, item]));
  project.slides.forEach((item, index) => {
    const lines = item.content.split('\n');
    const vertical = lines.length > 28 || item.content.length > 2200;
    const horizontal = lines.some(line => line.length > 125 && !/^\s*(?:https?:|:::mermaid|flowchart|graph)/i.test(line));
    if ((vertical || horizontal) && !merged.has(index)) merged.set(index, { index, vertical, horizontal, elements: ['Estimación por cantidad de contenido'] });
  });
  overflowDiagnostics = [...merged.values()].sort((a, b) => a.index - b.index);
  $('#diagnostic-count').textContent = overflowDiagnostics.length ? `(${overflowDiagnostics.length})` : '';
}
function update({ record = true } = {}) { if (record) commitHistory(); calculateDiagnostics(); renderList(); renderFields(); persist(); refreshPreview(); }
function thumbnailText(content) {
  return content.replace(/```[\s\S]*?```/g, ' Código ').replace(/:::[a-z]+/gi, '').replace(/:::/g, '').replace(/<[^>]+>/g, ' ').replace(/[#>*_|[\]()-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 85);
}
function renderList() {
  $('#slide-count').textContent = project.slides.length;
  $('#asset-count').textContent = Object.keys(project.assets).length ? `(${Object.keys(project.assets).length})` : '';
  const query = slideFilter.trim().toLocaleLowerCase();
  const visible = project.slides.map((s, i) => ({ s, i })).filter(({ s }) => !query || `${s.name} ${s.content} ${s.notes}`.toLocaleLowerCase().includes(query));
  $('#search-count').textContent = query ? `${visible.length}/${project.slides.length}` : '';
  $('#slide-list').innerHTML = visible.map(({ s, i }) => `<div class="slide-item ${i === selected ? 'active' : ''} ${overflowDiagnostics.some(item => item.index === i) ? 'has-overflow' : ''}" draggable="true" data-index="${i}"><button class="slide-select" data-action="select" aria-label="Seleccionar diapositiva ${i+1}"><span class="slide-thumb sf-thumb-${s.kind}"><b>${esc(s.name)}</b><i>${esc(thumbnailText(s.content))}</i></span><span class="slide-num">${String(i+1).padStart(2,'0')}</span><span class="slide-name">${esc(s.name)}</span><small>${kindNames[s.kind]}${overflowDiagnostics.some(item => item.index === i) ? ' · ⚠ Desbordamiento' : ''}</small></button><div class="slide-actions"><button data-action="up" title="Subir" aria-label="Subir">↑</button><button data-action="down" title="Bajar" aria-label="Bajar">↓</button><button data-action="duplicate" title="Duplicar" aria-label="Duplicar">⧉</button><button data-action="delete" title="Eliminar" aria-label="Eliminar">×</button></div></div>`).join('') || '<p class="empty-search">No hay coincidencias.</p>';
}
function renderFields() {
  const s = slide(); $('#current-heading').textContent = s.name; $('#slide-name').value = s.name; $('#slide-kind').value = s.kind; $('#content').value = s.content; $('#notes').value = s.notes;
  renderOverflowAlert();
}
function renderOverflowAlert() {
  const issue = overflowDiagnostics.find(item => item.index === selected);
  $('#overflow-alert').hidden = !issue;
  $('#overflow-alert').innerHTML = issue ? `<strong>⚠ Contenido fuera de la diapositiva</strong><span>${issue.horizontal ? 'Exceso horizontal. ' : ''}${issue.vertical ? 'Exceso vertical. ' : ''}${esc(issue.elements?.join(', ') || 'Revisa el contenido y reduce texto o tamaño.')}</span>` : '';
}
function move(from, to) { if (to < 0 || to >= project.slides.length || from === to) return; const [item] = project.slides.splice(from, 1); project.slides.splice(to, 0, item); selected = to; update(); }
window.addEventListener('message', event => {
  if (event.origin !== location.origin) return;
  if (event.data?.type === 'slideforge:ready') { if (event.source === $('#preview').contentWindow) sendPreview(); else event.source.postMessage({ type: 'slideforge:project', project }, location.origin); }
  if (event.source === $('#preview').contentWindow && event.data?.type === 'slideforge:diagnostics') {
    playerDiagnostics = event.data.overflow || [];
    calculateDiagnostics();
    renderList(); renderFields();
  }
});
$('#slide-list').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]'); if (!button) return;
  const i = Number(button.closest('.slide-item').dataset.index);
  switch (button.dataset.action) {
    case 'select': selected = i; renderList(); renderFields(); break;
    case 'up': move(i, i-1); break;
    case 'down': move(i, i+1); break;
    case 'duplicate': { const copy = structuredClone(project.slides[i]); copy.id = crypto.randomUUID(); copy.name += ' (copia)'; project.slides.splice(i+1, 0, copy); selected = i+1; update(); break; }
    case 'delete': if (project.slides.length > 1) { project.slides.splice(i,1); selected = Math.min(selected, project.slides.length-1); update(); } break;
  }
});
let dragged = -1;
$('#slide-list').addEventListener('dragstart', event => { dragged = Number(event.target.closest('.slide-item')?.dataset.index ?? -1); });
$('#slide-list').addEventListener('dragover', event => { if (event.target.closest('.slide-item')) event.preventDefault(); });
$('#slide-list').addEventListener('drop', event => { const target = Number(event.target.closest('.slide-item')?.dataset.index ?? -1); if (dragged >= 0 && target >= 0) { event.preventDefault(); move(dragged, target); } });
$('#add-slide').onclick = () => { project.slides.splice(selected+1, 0, newSlide()); selected++; update(); };
$('#slide-search').oninput = event => { slideFilter = event.target.value; renderList(); };
$('#undo').onclick = () => applyHistory(history.undo(), 'Cambio deshecho');
$('#redo').onclick = () => applyHistory(history.redo(), 'Cambio rehecho');
document.addEventListener('keydown', event => {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
  if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? $('#redo').click() : $('#undo').click(); }
  if (event.key.toLowerCase() === 'y') { event.preventDefault(); $('#redo').click(); }
});
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.target.matches('input, textarea, select, button, [contenteditable]')) return;
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) $('#preview').contentWindow?.postMessage({ type: 'slideforge:navigate', key: event.key }, location.origin);
});
$('#slide-name').oninput = event => { slide().name = event.target.value; commitHistory(); $('#current-heading').textContent = slide().name; renderList(); persist(); refreshSlidePreview(); };
$('#slide-kind').onchange = event => { slide().kind = event.target.value; commitHistory(); renderList(); persist(); refreshSlidePreview(); };
$('#content').oninput = event => { slide().content = event.target.value; commitHistory(); calculateDiagnostics(); renderList(); renderOverflowAlert(); persist(); refreshSlidePreview(); };
$('#notes').oninput = event => { slide().notes = event.target.value; commitHistory(); persist(); refreshSlidePreview(); };
$('#insert').onchange = event => { const snippet = snippets[event.target.value]; if (!snippet) return; const editor = $('#content'); const pos = editor.selectionStart; editor.setRangeText(`\n\n${snippet}\n`, pos, editor.selectionEnd, 'end'); slide().content = editor.value; event.target.value = ''; editor.focus(); commitHistory(); persist(); refreshSlidePreview(); };
$('#pedagogical').onchange = event => { if (!event.target.value) return; if (confirm('¿Reemplazar las diapositivas actuales por esta plantilla?')) { project.slides = templateSlides(event.target.value); selected = 0; update(); } event.target.value = ''; };
$('#new-project').onclick = () => { if (confirm('¿Crear un proyecto nuevo? Exporta el actual si deseas conservarlo.')) { project = createProject(); selected = 0; history.reset(project); update({ record: false }); updateHistoryButtons(); } };
$('#restore').onclick = async () => { const saved = await loadLocal(); if (saved) { project = normalizeProject(saved); selected = 0; history.reset(project); update({ record: false }); updateHistoryButtons(); setStatus('Última sesión restaurada'); } };
$('#open-preview').onclick = () => window.open(playerUrl, '_blank');
$('#present').onclick = () => window.open(playerUrl, '_blank');
$('#export-pdf').onclick = () => { const windowRef = window.open(`${playerUrl}?print-pdf`, '_blank'); windowRef?.addEventListener('load', () => windowRef.postMessage({ type: 'slideforge:project', project }, location.origin)); };
$('#export-md').onclick = () => downloadText(serializeMarkdown(project), 'slides.md', 'text/markdown');
$('#export-project').onclick = () => run(() => exportProject(project));
$('#export-web').onclick = () => run(() => exportWeb(project));
async function run(task) { try { setStatus('Preparando descarga…'); await task(); setStatus('Descarga lista'); } catch (error) { alert(error.message); setStatus('Error de exportación'); } }

function openPanel(title, html) { $('#dialog-title').textContent = title; $('#dialog-content').innerHTML = html; $('#panel-dialog').showModal(); }
$('#panel-dialog .close').onclick = () => $('#panel-dialog').close();
function openVisualEditor(forcedType, targetComponent) {
  const editor = $('#content');
  const found = targetComponent || findComponent(editor.value, editor.selectionStart);
  const type = forcedType || (found && visualTypes.includes(found.type) ? found.type : 'quiz');
  const fields = componentFields(type, found?.type === type ? found.body : '');
  openPanel(found ? 'Editar componente visual' : 'Insertar componente visual', `<div class="visual-component"><label>Tipo de componente<select id="visual-type">${visualTypes.map(value => `<option value="${value}" ${value === type ? 'selected' : ''}>${visualTypeLabel(value)}</option>`).join('')}</select></label>${fields.map(item => `<label>${item.label}${item.kind === 'textarea' ? `<textarea data-visual-field="${item.name}" rows="${item.name === 'source' ? 9 : 5}">${esc(item.value)}</textarea>` : `<input data-visual-field="${item.name}" value="${esc(item.value)}">`}</label>`).join('')}<p class="editor-hint">SlideForge generará la sintaxis compatible automáticamente.</p><button type="button" id="apply-visual" class="button-primary">${found ? 'Actualizar componente' : 'Insertar componente'}</button></div>`);
  $('#visual-type').onchange = event => openVisualEditor(event.target.value, found);
  $('#apply-visual').onclick = () => {
    const values = {};
    $('#dialog-content').querySelectorAll('[data-visual-field]').forEach(input => { values[input.dataset.visualField] = input.value; });
    const block = buildComponent(type, values);
    if (found) editor.setRangeText(block, found.start, found.end, 'end');
    else editor.setRangeText(`\n\n${block}\n`, editor.selectionStart, editor.selectionEnd, 'end');
    slide().content = editor.value;
    commitHistory(); persist(); refreshSlidePreview(); $('#panel-dialog').close(); editor.focus();
  };
}
$('#visual-editor').onclick = () => openVisualEditor();
function openDiagnostics() {
  openPanel('Diagnóstico de desbordamiento', overflowDiagnostics.length ? `<p>Se detectó contenido fuera del área visible en ${overflowDiagnostics.length} diapositiva(s).</p><div class="diagnostic-list">${overflowDiagnostics.map(item => `<button type="button" data-diagnostic-slide="${item.index}"><strong>${String(item.index + 1).padStart(2, '0')} · ${esc(project.slides[item.index]?.name || 'Diapositiva')}</strong><span>${item.horizontal ? 'Horizontal ' : ''}${item.vertical ? 'Vertical ' : ''}${esc(item.elements?.join(', ') || '')}</span></button>`).join('')}</div>` : '<div class="diagnostic-ok"><strong>✓ Sin desbordamientos detectados</strong><p>El contenido de las diapositivas cabe en el área visible actual.</p></div>');
  $('#dialog-content').onclick = event => { const button = event.target.closest('[data-diagnostic-slide]'); if (!button) return; selected = Number(button.dataset.diagnosticSlide); renderList(); renderFields(); $('#panel-dialog').close(); };
}
function openSaveFlow() {
  openPanel('Guardar, exportar y publicar', `<ol class="save-flow"><li><strong>Guardar la edición</strong><p>El autoguardado conserva la sesión en este dispositivo. Guarda además un archivo editable cuando quieras una copia explícita.</p><button type="button" data-save-action="markdown">Guardar Markdown</button><button type="button" data-save-action="project">Descargar proyecto portable</button></li><li><strong>Exportar la presentación</strong><p>El ZIP web contiene la presentación completa con Reveal.js, Mermaid, recursos e interacciones.</p><button type="button" data-save-action="web" class="button-primary">Descargar web ZIP</button><button type="button" data-save-action="pdf">Abrir PDF / impresión</button></li><li><strong>Publicar</strong><p>Descomprime el ZIP web dentro de una carpeta pública, por ejemplo <code>public/presentaciones/mi-clase/</code>. Publica el repositorio y comparte la URL que termina en esa carpeta.</p><p>Para Canvas LMS, usa esa URL como <code>src</code> de un iframe.</p></li></ol>`);
  $('#dialog-content').onclick = event => {
    const action = event.target.closest('[data-save-action]')?.dataset.saveAction;
    if (!action) return;
    if (action === 'markdown') saveMarkdown();
    if (action === 'project') $('#export-project').click();
    if (action === 'web') $('#export-web').click();
    if (action === 'pdf') $('#export-pdf').click();
  };
}
$('#save-flow').onclick = openSaveFlow;
root.querySelectorAll('[data-panel]').forEach(button => button.onclick = () => {
  if (button.dataset.panel === 'branding') openBranding();
  if (button.dataset.panel === 'assets') openAssets();
  if (button.dataset.panel === 'settings') openSettings();
  if (button.dataset.panel === 'prompt') openPrompt();
  if (button.dataset.panel === 'diagnostics') openDiagnostics();
});
function resourceSize(value) {
  if (typeof value !== 'string' || !value.startsWith('data:')) return '';
  const bytes = Math.max(0, Math.round((value.length - value.indexOf(',') - 1) * .75));
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function insertAsset(name) {
  const editor = $('#content');
  editor.setRangeText(`\n![Descripción](assets/${name})\n`, editor.selectionStart, editor.selectionEnd, 'end');
  slide().content = editor.value;
  commitHistory();
  persist();
  refreshSlidePreview();
}
function openAssets() {
  const entries = Object.entries(project.assets);
  openPanel('Biblioteca de recursos', `<div class="asset-toolbar"><p>${entries.length ? `${entries.length} recurso(s) disponibles para reutilizar.` : 'Todavía no hay imágenes en el proyecto.'}</p><button type="button" id="add-resource">Añadir recurso</button></div><div class="asset-grid">${entries.map(([name, data]) => `<article class="asset-item"><img src="${esc(data)}" alt=""><div><strong>${esc(name)}</strong><small>${resourceSize(data)}</small></div><button type="button" data-asset-insert="${esc(name)}">Insertar</button><button type="button" data-asset-delete="${esc(name)}" class="text-button">Eliminar</button></article>`).join('')}</div>`);
  $('#add-resource').onclick = () => { imageUploadMode = 'library'; $('#image-input').click(); };
  $('#dialog-content').onclick = event => {
    const insert = event.target.closest('[data-asset-insert]');
    if (insert) { insertAsset(insert.dataset.assetInsert); $('#panel-dialog').close(); return; }
    const remove = event.target.closest('[data-asset-delete]');
    if (!remove) return;
    const name = remove.dataset.assetDelete;
    const used = project.slides.some(item => item.content.includes(`assets/${name}`));
    if (used && !confirm('Este recurso está usado en una o más diapositivas. ¿Eliminarlo de todos modos?')) return;
    delete project.assets[name];
    update();
    openAssets();
  };
}
function openBranding() {
  const c = project.config, b = c.branding;
  openPanel('Branding institucional', `<div class="form-grid">${input('Institución', 'institution', c.institution)}${input('Docente', 'author', c.author)}${input('Asignatura', 'course', c.course)}${input('Título del proyecto', 'title', c.title)}</div><div class="form-section"><h3>Logo institucional</h3><div class="logo-preview">${b.logo ? `<img src="${esc(b.logo)}" alt="Vista previa del logo">` : '<span>Sin logo cargado</span>'}</div><button type="button" id="choose-logo">Cargar logo</button><button type="button" id="remove-logo">Quitar logo</button><div class="form-grid"><label>Mostrar logo<select data-brand="logoMode"><option value="all">En todas las slides</option><option value="ends">Solo portada y cierre</option><option value="none">No mostrar</option></select></label><label>Posición<select data-brand="logoPosition"><option value="top-right">Superior derecha</option><option value="top-left">Superior izquierda</option><option value="bottom-right">Inferior derecha</option><option value="bottom-left">Inferior izquierda</option></select></label></div></div><div class="form-section"><h3>Paleta institucional</h3><div class="color-grid">${Object.entries(PALETTE).map(([key]) => `<label>${({dark:'Morado oscuro',primary:'Morado',soft:'Morado suave',orange:'Naranja',yellow:'Amarillo',white:'Blanco'})[key]}<input type="color" data-color="${key}" value="${b.colors[key]}"></label>`).join('')}</div><button type="button" id="reset-colors">Restaurar paleta oficial</button></div>`);
  $('[data-brand="logoMode"]').value = b.logoMode; $('[data-brand="logoPosition"]').value = b.logoPosition;
  $('#choose-logo').onclick = () => $('#logo-input').click();
  $('#remove-logo').onclick = () => { b.logo = ''; update(); openBranding(); };
  $('#reset-colors').onclick = () => { b.colors = { ...PALETTE }; update(); openBranding(); };
  $('#dialog-content').oninput = event => {
    const t = event.target;
    if (t.dataset.config) c[t.dataset.config] = t.value;
    if (t.dataset.brand) b[t.dataset.brand] = t.value;
    if (t.dataset.color) b.colors[t.dataset.color] = t.value;
    commitHistory(); persist(); refreshPreview();
  };
}
function openSettings() {
  const c = project.config;
  openPanel('Tema y navegación', `<div class="form-grid"><label>Transición<select data-setting="transition">${['slide','fade','convex','concave','zoom','none'].map(x => `<option>${x}</option>`).join('')}</select></label><label>Formato<select data-setting="ratio"><option>16:9</option><option>4:3</option></select></label></div><div class="check-list"><label><input type="checkbox" data-setting="controls"> Controles de navegación</label><label><input type="checkbox" data-setting="progress"> Barra de progreso</label><label><input type="checkbox" data-setting="slideNumber"> Número de diapositiva</label></div><div class="form-section"><h3>Avanzado</h3><label>CSS personalizado<textarea data-setting="customCss" rows="5" spellcheck="false"></textarea></label><label>JavaScript personalizado<textarea data-setting="customJs" rows="5" spellcheck="false"></textarea></label><label><input type="checkbox" data-setting="enableCustomJs"> Ejecutar JavaScript personalizado en esta presentación</label><p>El JavaScript se ejecuta en el navegador de quien abre la presentación. Actívalo solo para código propio o revisado.</p></div><p>El tema institucional se aplica por defecto en vista previa y exportaciones.</p>`);
  $('#dialog-content').querySelectorAll('[data-setting]').forEach(el => { if (el.type === 'checkbox') el.checked = !!c[el.dataset.setting]; else el.value = c[el.dataset.setting]; el.onchange = () => { c[el.dataset.setting] = el.type === 'checkbox' ? el.checked : el.value; commitHistory(); persist(); refreshPreview(); }; });
}
function openPrompt() {
  openPanel('Generar prompt para IA', `<p>Genera instrucciones para usar en una herramienta externa. SlideForge no envía datos a ninguna API.</p><form id="prompt-form" class="form-grid">${[['course','Asignatura'],['topic','Tema'],['level','Nivel'],['duration','Duración'],['count','N.º aproximado de slides'],['objectives','Objetivos'],['style','Estilo'],['interaction','Interactividad']].map(([name,label]) => `<label>${label}<input name="${name}"></label>`).join('')}<label><input type="checkbox" name="activities" checked> Actividades</label><label><input type="checkbox" name="mermaid" checked> Mermaid</label><label><input type="checkbox" name="notes" checked> Notas</label></form><button type="button" id="make-prompt">Generar</button><textarea id="prompt-output" rows="10" readonly aria-label="Prompt generado"></textarea><button type="button" id="copy-prompt">Copiar prompt</button>`);
  $('#make-prompt').onclick = () => { $('#prompt-output').value = generatePrompt($('#prompt-form')); };
  $('#copy-prompt').onclick = async () => { await navigator.clipboard.writeText($('#prompt-output').value); setStatus('Prompt copiado'); };
}

async function fileData(file) { return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
function uniqueAssetName(original) {
  const cleaned = original.replace(/[^\w.\-]/g, '-') || 'recurso';
  if (!project.assets[cleaned]) return cleaned;
  const dot = cleaned.lastIndexOf('.');
  const base = dot > 0 ? cleaned.slice(0, dot) : cleaned;
  const extension = dot > 0 ? cleaned.slice(dot) : '';
  let counter = 2;
  while (project.assets[`${base}-${counter}${extension}`]) counter++;
  return `${base}-${counter}${extension}`;
}
async function importFile(file, asLogo = false) {
  if (!file) return;
  const name = file.name.toLowerCase();
  if (asLogo || (file.type.startsWith('image/') && /logo|escudo|emblema/.test(name))) { project.config.branding.logo = await fileData(file); update(); if ($('#panel-dialog').open) openBranding(); return; }
  if (file.type.startsWith('image/')) {
    const filename = uniqueAssetName(file.name);
    project.assets[filename] = await fileData(file);
    renderList();
    persist();
    if (imageUploadMode === 'insert') insertAsset(filename);
    if (imageUploadMode === 'library' && $('#panel-dialog').open) openAssets();
    return;
  }
  if (name.endsWith('.zip')) { project = await importProjectZip(file); selected = 0; history.reset(project); update({ record: false }); updateHistoryButtons(); if (project.config.customJs) setStatus('Proyecto importado · JavaScript personalizado desactivado'); return; }
  const text = await file.text();
  if (name.endsWith('.json')) { project = normalizeImportedProject(JSON.parse(text)); selected = 0; history.reset(project); update({ record: false }); updateHistoryButtons(); if (project.config.customJs) setStatus('Proyecto importado · JavaScript personalizado desactivado'); return; }
  if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) { const slides = parseMarkdown(text); if (!slides.length) throw new Error('El archivo no contiene diapositivas.'); project.slides = slides; selected = 0; update(); return; }
  if (name.endsWith('.html')) { const s = newSlide(); s.name = file.name; s.content = text; project.slides.splice(selected+1, 0, s); selected++; update(); return; }
  throw new Error('Formato de archivo no compatible.');
}
async function handleFiles(files, asLogo = false) { for (const file of files) { try { await importFile(file, asLogo); } catch (error) { alert(`${file.name}: ${error.message}`); } } }
$('#file-input').onchange = async event => { await handleFiles(event.target.files); event.target.value = ''; };
$('#image-input').onchange = async event => { await handleFiles(event.target.files); imageUploadMode = 'insert'; event.target.value = ''; };
$('#logo-input').onchange = async event => { await handleFiles(event.target.files, true); event.target.value = ''; };
$('#open-file').onclick = async () => { if (window.showOpenFilePicker) { try { const [handle] = await showOpenFilePicker({ types: [{ description: 'SlideForge y contenido', accept: { 'application/zip': ['.zip'], 'text/plain': ['.md','.markdown','.txt','.html','.json'] } }] }); const file = await handle.getFile(); fileHandle = /\.md$|\.markdown$/i.test(file.name) ? handle : undefined; await handleFiles([file]); return; } catch (error) { if (error.name === 'AbortError') return; } } $('#file-input').click(); };
$('#import-content').onclick = () => $('#file-input').click();
$('#upload-image').onclick = () => { imageUploadMode = 'insert'; $('#image-input').click(); };
async function saveMarkdown() { if (window.showSaveFilePicker) { try { fileHandle ||= await showSaveFilePicker({ suggestedName: 'slides.md', types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }] }); const writable = await fileHandle.createWritable(); await writable.write(serializeMarkdown(project)); await writable.close(); setStatus('Archivo guardado'); return; } catch (error) { if (error.name === 'AbortError') return; } } downloadText(serializeMarkdown(project), 'slides.md', 'text/markdown'); }
document.addEventListener('dragover', event => { if (event.dataTransfer?.types.includes('Files')) { event.preventDefault(); document.body.classList.add('dragging-file'); } });
document.addEventListener('dragleave', event => { if (!event.relatedTarget) document.body.classList.remove('dragging-file'); });
document.addEventListener('drop', event => { if (event.dataTransfer?.files.length) { event.preventDefault(); document.body.classList.remove('dragging-file'); handleFiles(event.dataTransfer.files); } });
renderList(); renderFields();
updateHistoryButtons();
hasLocal().then(value => { $('#restore').hidden = !value; });
async function loadInstalledLogo() {
  if (project.config.branding.logo) return;
  for (const name of ['logo-institucional.png', 'logo-institucional.svg']) {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}branding/${name}`);
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) continue;
      if (!project.config.branding.logo) { project.config.branding.logo = await fileData(new File([await response.blob()], name)); persist(); refreshPreview(); }
      break;
    } catch { /* Optional installed logo. */ }
  }
}
loadInstalledLogo();
