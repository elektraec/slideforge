import JSZip from 'jszip';
import { serializeMarkdown, normalizeImportedProject } from '../model.js';

const safeName = s => String(s || 'presentacion').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'presentacion';
export function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); }
export function downloadText(text, name, type = 'text/plain') { download(new Blob([text], { type }), name); }

function filesForProject(project, zip) {
  zip.file('slides.md', serializeMarkdown(project));
  const copy = structuredClone(project);
  const logo = copy.config.branding.logo;
  if (logo?.startsWith('data:')) { const ext = logo.match(/^data:image\/(\w+)/)?.[1] || 'png'; zip.file(`branding/logo.${ext}`, logo.split(',')[1], { base64: true }); copy.config.branding.logo = `branding/logo.${ext}`; }
  for (const [name, data] of Object.entries(copy.assets)) {
    if (data.startsWith('data:')) { zip.file(`assets/${name}`, data.split(',')[1], { base64: true }); copy.assets[name] = `assets/${name}`; }
  }
  zip.file('config.json', JSON.stringify(copy.config, null, 2));
  zip.file('project.json', JSON.stringify(copy, null, 2));
}

export async function exportProject(project) {
  const zip = new JSZip(); filesForProject(project, zip);
  download(await zip.generateAsync({ type: 'blob' }), `${safeName(project.config.title)}.slideforge.zip`);
}

function embeddedHtml(project) {
  const json = JSON.stringify(project).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${project.config.title.replace(/[&<>"']/g, '')} · SlideForge</title><link rel="stylesheet" href="./css/player.css"></head><body><div class="reveal"><div class="slides" id="slides"></div></div><script type="application/json" id="slideforge-project">${json}</script><script src="./js/player.js"></script></body></html>`;
}

export async function exportWeb(project) {
  const zip = new JSZip(); filesForProject(project, zip);
  const base = import.meta.env.BASE_URL;
  const [js, css] = await Promise.all(['player.js', 'player.css'].map(async file => { const response = await fetch(`${base}runtime/${file}`); if (!response.ok) throw new Error(`No se encontró runtime/${file}`); return response.text(); }));
  zip.file('index.html', embeddedHtml(project));
  zip.file('js/player.js', js);
  zip.file('css/player.css', css);
  download(await zip.generateAsync({ type: 'blob' }), `${safeName(project.config.title)}-web.zip`);
}

async function urlToData(url, zip) { const blob = await zip.file(url)?.async('blob'); if (!blob) return ''; return await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); }); }

export async function importProjectZip(file) {
  const zip = await JSZip.loadAsync(file);
  const projectFile = zip.file('project.json');
  if (!projectFile) throw new Error('El ZIP no contiene project.json.');
  const project = normalizeImportedProject(JSON.parse(await projectFile.async('text')));
  if (project.config.branding.logo?.startsWith('branding/')) project.config.branding.logo = await urlToData(project.config.branding.logo, zip);
  for (const [name, data] of Object.entries(project.assets)) if (data.startsWith('assets/')) project.assets[name] = await urlToData(data, zip);
  return project;
}
