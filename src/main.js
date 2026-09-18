import { createProject, newSlide, KINDS, PALETTE, normalizeProject, parseMarkdown, serializeMarkdown } from './model.js';
import { snippets } from './editor/snippets.js';
import { pedagogical, templateSlides } from './templates/index.js';
import { generatePrompt } from './prompts/generate.js';
import { saveLocal, loadLocal, hasLocal } from './storage/local.js';
import { downloadText, exportProject, exportWeb, importProjectZip } from './export/files.js';
import './styles/editor.css';

const root = document.querySelector('#app');
let project = createProject();
let selected = 0;
let previewTimer;
let fileHandle;
const kindNames = { cover: 'Portada', section: 'Separador', content: 'Título + contenido', columns: 'Dos columnas', image: 'Imagen + texto', question: 'Pregunta', activity: 'Actividad', data: 'Datos', quote: 'Cita', conclusions: 'Conclusiones', closing: 'Cierre' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const $ = selector => root.querySelector(selector);
const slide = () => project.slides[selected];
const playerUrl = `${import.meta.env.BASE_URL}player.html`;
const input = (label, key, value, type = 'text') => `<label>${label}<input data-config="${key}" type="${type}" value="${esc(value)}"></label>`;

root.innerHTML = `<header class="topbar"><div class="brand"><span class="brand-mark">S<span>F</span></span><div><strong>SlideForge</strong><small>Estudio de presentaciones</small></div></div><div class="top-actions"><span id="save-status" aria-live="polite">Sin guardar</span><button id="restore" ${hasLocal() ? '' : 'hidden'}>Restaurar última sesión</button><button id="open-file">Abrir</button><button id="save-file">Guardar</button><button id="present" class="button-primary">Presentar ↗</button></div></header>
<main class="workspace"><aside class="sidebar"><div class="pane-title"><div><span class="eyebrow">PROYECTO</span><h2>Diapositivas <span id="slide-count"></span></h2></div><button id="add-slide" title="Añadir diapositiva" aria-label="Añadir diapositiva">+</button></div><div id="slide-list" class="slide-list"></div><div class="sidebar-bottom"><label class="small-label">Plantilla pedagógica<select id="pedagogical"><option value="">Elegir plantilla…</option>${Object.keys(pedagogical).map(name => `<option>${esc(name)}</option>`).join('')}</select></label><button id="new-project" class="text-button">Nuevo proyecto</button></div></aside>
<section class="editor-pane"><div class="pane-title editor-title"><div><span class="eyebrow">EDITOR</span><h2 id="current-heading">Contenido</h2></div><span class="badge">Markdown + HTML</span></div><div class="slide-fields"><label>Nombre<input id="slide-name"></label><label>Diseño<select id="slide-kind">${KINDS.map(kind => `<option value="${kind}">${kindNames[kind]}</option>`).join('')}</select></label></div><div class="editor-toolbar"><label>Insertar<select id="insert"><option value="">Componente…</option>${Object.keys(snippets).map(name => `<option>${esc(name)}</option>`).join('')}</select></label><button id="upload-image">Añadir imagen</button><button id="import-content">Importar archivo</button></div><label class="editor-label" for="content">Contenido de la diapositiva</label><textarea id="content" spellcheck="false" aria-label="Contenido Markdown y HTML"></textarea><label class="editor-label" for="notes">Notas del docente</label><textarea id="notes" rows="3" placeholder="Notas visibles en Speaker View"></textarea><p class="editor-hint">Consejo: arrastra aquí imágenes, Markdown o un proyecto .slideforge.zip.</p></section>
<section class="preview-pane"><div class="pane-title"><div><span class="eyebrow">VISTA PREVIA</span><h2>Presentación</h2></div><button id="open-preview" class="text-button">Abrir ventana ↗</button></div><div class="preview-wrap"><iframe id="preview" title="Vista previa Reveal.js" src="${playerUrl}"></iframe></div><div class="preview-caption"><span class="live-dot"></span> Reveal.js + Mermaid · vista real de exportación</div></section></main>
<nav class="bottom-bar" aria-label="Herramientas"><button data-panel="branding">Branding</button><button data-panel="settings">Tema y navegación</button><button data-panel="prompt">Generar prompt para IA</button><span class="spacer"></span><button id="export-md">Exportar Markdown</button><button id="export-project">Exportar proyecto</button><button id="export-web" class="button-primary">Exportar web ZIP</button><button id="export-pdf">PDF / Imprimir</button></nav>
<dialog id="panel-dialog"><div class="dialog-body"><div class="dialog-head"><h2 id="dialog-title"></h2><button aria-label="Cerrar" class="close">×</button></div><div id="dialog-content"></div></div></dialog>
<input id="file-input" type="file" accept=".md,.markdown,.txt,.html,.json,.zip,.slideforge.zip,image/*" hidden><input id="image-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" hidden><input id="logo-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" hidden>`;

function setStatus(text) { $('#save-status').textContent = text; }
function persist() { if (saveLocal(project)) setStatus('Guardado localmente'); else setStatus('Almacenamiento lleno · exporta el proyecto'); $('#restore').hidden = false; }
function sendPreview() { const frame = $('#preview').contentWindow; frame?.postMessage({ type: 'slideforge:project', project }, location.origin); }
function refreshPreview() { clearTimeout(previewTimer); previewTimer = setTimeout(sendPreview, 350); }
function update() { renderList(); renderFields(); persist(); refreshPreview(); }
function renderList() {
  $('#slide-count').textContent = project.slides.length;
  $('#slide-list').innerHTML = project.slides.map((s, i) => `<div class="slide-item ${i === selected ? 'active' : ''}" draggable="true" data-index="${i}"><button class="slide-select" data-action="select" aria-label="Seleccionar diapositiva ${i+1}"><span class="slide-num">${String(i+1).padStart(2,'0')}</span><span class="slide-name">${esc(s.name)}</span><small>${kindNames[s.kind]}</small></button><div class="slide-actions"><button data-action="up" title="Subir" aria-label="Subir">↑</button><button data-action="down" title="Bajar" aria-label="Bajar">↓</button><button data-action="duplicate" title="Duplicar" aria-label="Duplicar">⧉</button><button data-action="delete" title="Eliminar" aria-label="Eliminar">×</button></div></div>`).join('');
}
function renderFields() { const s = slide(); $('#current-heading').textContent = s.name; $('#slide-name').value = s.name; $('#slide-kind').value = s.kind; $('#content').value = s.content; $('#notes').value = s.notes; }
function move(from, to) { if (to < 0 || to >= project.slides.length || from === to) return; const [item] = project.slides.splice(from, 1); project.slides.splice(to, 0, item); selected = to; update(); }
window.addEventListener('message', event => { if (event.origin === location.origin && event.data?.type === 'slideforge:ready') { if (event.source === $('#preview').contentWindow) sendPreview(); else event.source.postMessage({ type: 'slideforge:project', project }, location.origin); } });
$('#slide-list').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]'); if (!button) return;
  const i = Number(button.closest('.slide-item').dataset.index);
  switch (button.dataset.action) {
    case 'select': selected = i; update(); break;
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
$('#slide-name').oninput = event => { slide().name = event.target.value; $('#current-heading').textContent = slide().name; renderList(); persist(); };
$('#slide-kind').onchange = event => { slide().kind = event.target.value; update(); };
$('#content').oninput = event => { slide().content = event.target.value; persist(); refreshPreview(); };
$('#notes').oninput = event => { slide().notes = event.target.value; persist(); refreshPreview(); };
$('#insert').onchange = event => { const snippet = snippets[event.target.value]; if (!snippet) return; const editor = $('#content'); const pos = editor.selectionStart; editor.setRangeText(`\n\n${snippet}\n`, pos, editor.selectionEnd, 'end'); slide().content = editor.value; event.target.value = ''; editor.focus(); persist(); refreshPreview(); };
$('#pedagogical').onchange = event => { if (!event.target.value) return; if (confirm('¿Reemplazar las diapositivas actuales por esta plantilla?')) { project.slides = templateSlides(event.target.value); selected = 0; update(); } event.target.value = ''; };
$('#new-project').onclick = () => { if (confirm('¿Crear un proyecto nuevo? Exporta el actual si deseas conservarlo.')) { project = createProject(); selected = 0; update(); } };
$('#restore').onclick = () => { const saved = loadLocal(); if (saved) { project = normalizeProject(saved); selected = 0; update(); } };
$('#open-preview').onclick = () => window.open(playerUrl, '_blank');
$('#present').onclick = () => window.open(playerUrl, '_blank');
$('#export-pdf').onclick = () => { const windowRef = window.open(`${playerUrl}?print-pdf`, '_blank'); windowRef?.addEventListener('load', () => windowRef.postMessage({ type: 'slideforge:project', project }, location.origin)); };
$('#export-md').onclick = () => downloadText(serializeMarkdown(project), 'slides.md', 'text/markdown');
$('#export-project').onclick = () => run(() => exportProject(project));
$('#export-web').onclick = () => run(() => exportWeb(project));
async function run(task) { try { setStatus('Preparando descarga…'); await task(); setStatus('Descarga lista'); } catch (error) { alert(error.message); setStatus('Error de exportación'); } }

function openPanel(title, html) { $('#dialog-title').textContent = title; $('#dialog-content').innerHTML = html; $('#panel-dialog').showModal(); }
$('#panel-dialog .close').onclick = () => $('#panel-dialog').close();
root.querySelectorAll('[data-panel]').forEach(button => button.onclick = () => {
  if (button.dataset.panel === 'branding') openBranding();
  if (button.dataset.panel === 'settings') openSettings();
  if (button.dataset.panel === 'prompt') openPrompt();
});
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
    persist(); refreshPreview();
  };
}
function openSettings() {
  const c = project.config;
  openPanel('Tema y navegación', `<div class="form-grid"><label>Transición<select data-setting="transition">${['slide','fade','convex','concave','zoom','none'].map(x => `<option>${x}</option>`).join('')}</select></label><label>Formato<select data-setting="ratio"><option>16:9</option><option>4:3</option></select></label></div><div class="check-list"><label><input type="checkbox" data-setting="controls"> Controles de navegación</label><label><input type="checkbox" data-setting="progress"> Barra de progreso</label><label><input type="checkbox" data-setting="slideNumber"> Número de diapositiva</label></div><div class="form-section"><h3>Avanzado</h3><label>CSS personalizado<textarea data-setting="customCss" rows="5" spellcheck="false"></textarea></label><label>JavaScript personalizado<textarea data-setting="customJs" rows="5" spellcheck="false"></textarea></label><label><input type="checkbox" data-setting="enableCustomJs"> Ejecutar JavaScript personalizado en esta presentación</label><p>El JavaScript se ejecuta en el navegador de quien abre la presentación. Actívalo solo para código propio o revisado.</p></div><p>El tema institucional se aplica por defecto en vista previa y exportaciones.</p>`);
  $('#dialog-content').querySelectorAll('[data-setting]').forEach(el => { if (el.type === 'checkbox') el.checked = !!c[el.dataset.setting]; else el.value = c[el.dataset.setting]; el.onchange = () => { c[el.dataset.setting] = el.type === 'checkbox' ? el.checked : el.value; persist(); refreshPreview(); }; });
}
function openPrompt() {
  openPanel('Generar prompt para IA', `<p>Genera instrucciones para usar en una herramienta externa. SlideForge no envía datos a ninguna API.</p><form id="prompt-form" class="form-grid">${[['course','Asignatura'],['topic','Tema'],['level','Nivel'],['duration','Duración'],['count','N.º aproximado de slides'],['objectives','Objetivos'],['style','Estilo'],['interaction','Interactividad']].map(([name,label]) => `<label>${label}<input name="${name}"></label>`).join('')}<label><input type="checkbox" name="activities" checked> Actividades</label><label><input type="checkbox" name="mermaid" checked> Mermaid</label><label><input type="checkbox" name="notes" checked> Notas</label></form><button type="button" id="make-prompt">Generar</button><textarea id="prompt-output" rows="10" readonly aria-label="Prompt generado"></textarea><button type="button" id="copy-prompt">Copiar prompt</button>`);
  $('#make-prompt').onclick = () => { $('#prompt-output').value = generatePrompt($('#prompt-form')); };
  $('#copy-prompt').onclick = async () => { await navigator.clipboard.writeText($('#prompt-output').value); setStatus('Prompt copiado'); };
}

async function fileData(file) { return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
async function importFile(file, asLogo = false) {
  if (!file) return;
  const name = file.name.toLowerCase();
  if (asLogo || (file.type.startsWith('image/') && /logo|escudo|emblema/.test(name))) { project.config.branding.logo = await fileData(file); update(); if ($('#panel-dialog').open) openBranding(); return; }
  if (file.type.startsWith('image/')) { const filename = file.name.replace(/[^\w.\-]/g, '-'); project.assets[filename] = await fileData(file); const editor = $('#content'); editor.setRangeText(`\n![${file.name}](assets/${filename})\n`, editor.selectionStart, editor.selectionEnd, 'end'); slide().content = editor.value; update(); return; }
  if (name.endsWith('.zip')) { project = await importProjectZip(file); selected = 0; update(); return; }
  const text = await file.text();
  if (name.endsWith('.json')) { project = normalizeProject(JSON.parse(text)); selected = 0; update(); return; }
  if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) { const slides = parseMarkdown(text); if (!slides.length) throw new Error('El archivo no contiene diapositivas.'); project.slides = slides; selected = 0; update(); return; }
  if (name.endsWith('.html')) { const s = newSlide(); s.name = file.name; s.content = text; project.slides.splice(selected+1, 0, s); selected++; update(); return; }
  throw new Error('Formato de archivo no compatible.');
}
async function handleFiles(files, asLogo = false) { for (const file of files) { try { await importFile(file, asLogo); } catch (error) { alert(`${file.name}: ${error.message}`); } } }
$('#file-input').onchange = event => handleFiles(event.target.files);
$('#image-input').onchange = event => handleFiles(event.target.files);
$('#logo-input').onchange = event => handleFiles(event.target.files, true);
$('#open-file').onclick = async () => { if (window.showOpenFilePicker) { try { const [handle] = await showOpenFilePicker({ types: [{ description: 'SlideForge y contenido', accept: { 'application/zip': ['.zip'], 'text/plain': ['.md','.markdown','.txt','.html','.json'] } }] }); const file = await handle.getFile(); fileHandle = /\.md$|\.markdown$/i.test(file.name) ? handle : undefined; await handleFiles([file]); return; } catch (error) { if (error.name === 'AbortError') return; } } $('#file-input').click(); };
$('#import-content').onclick = () => $('#file-input').click();
$('#upload-image').onclick = () => $('#image-input').click();
$('#save-file').onclick = async () => { if (window.showSaveFilePicker) { try { fileHandle ||= await showSaveFilePicker({ suggestedName: 'slides.md', types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }] }); const writable = await fileHandle.createWritable(); await writable.write(serializeMarkdown(project)); await writable.close(); setStatus('Archivo guardado'); return; } catch (error) { if (error.name === 'AbortError') return; } } downloadText(serializeMarkdown(project), 'slides.md', 'text/markdown'); };
document.addEventListener('dragover', event => { if (event.dataTransfer?.types.includes('Files')) { event.preventDefault(); document.body.classList.add('dragging-file'); } });
document.addEventListener('dragleave', event => { if (!event.relatedTarget) document.body.classList.remove('dragging-file'); });
document.addEventListener('drop', event => { if (event.dataTransfer?.files.length) { event.preventDefault(); document.body.classList.remove('dragging-file'); handleFiles(event.dataTransfer.files); } });
renderList(); renderFields(); sendPreview();
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
