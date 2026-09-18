import Reveal from 'reveal.js';
import RevealMarkdown from 'reveal.js/plugin/markdown';
import RevealHighlight from 'reveal.js/plugin/highlight';
import RevealNotes from 'reveal.js/plugin/notes';
import RevealSearch from 'reveal.js/plugin/search';
import RevealZoom from 'reveal.js/plugin/zoom';
import mermaid from 'mermaid';
import { renderContent } from './blocks.js';
import { mountInteractions } from './interactions.js';
import { normalizeProject } from '../model.js';
import 'reveal.js/reveal.css';
import 'reveal.js/plugin/highlight/monokai.css';
import 'katex/dist/katex.min.css';
import '../styles/theme-institutional.css';

const slideRoot = document.querySelector('#slides');
const revealRoot = document.querySelector('.reveal');
let deck;
let rendering = false;
let pendingProject;
let mermaidSerial = 0;
mountInteractions(slideRoot);
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables: { primaryColor: '#f4effa', primaryTextColor: '#3a1467', primaryBorderColor: '#542e91', lineColor: '#f37121' } });

function assetContent(content, assets) {
  return content.replace(/(?:assets\/)([\w.\-]+)/g, (match, name) => assets[name] || match);
}

function logoAllowed(kind, mode) { return mode === 'all' || (mode === 'ends' && (kind === 'cover' || kind === 'closing')); }

async function draw(projectInput) {
  const project = normalizeProject(projectInput);
  const { config, assets } = project;
  let customStyle = document.querySelector('#slideforge-custom-style');
  if (!customStyle) { customStyle = document.createElement('style'); customStyle.id = 'slideforge-custom-style'; document.head.append(customStyle); }
  customStyle.textContent = config.customCss || '';
  document.title = `${config.title || 'Presentación'} · SlideForge`;
  const colors = config.branding.colors;
  const vars = { dark: '--inst-purple-dark', primary: '--inst-purple', soft: '--inst-purple-soft', orange: '--inst-orange', yellow: '--inst-yellow', white: '--inst-white' };
  for (const [key, variable] of Object.entries(vars)) document.documentElement.style.setProperty(variable, colors[key]);
  if (deck) { await deck.destroy(); deck = null; }
  slideRoot.innerHTML = '';
  project.slides.forEach(slide => {
    const section = document.createElement('section');
    section.className = `sf-slide sf-slide-${slide.kind}`;
    section.innerHTML = `<div class="sf-slide-inner">${renderContent(assetContent(slide.content, assets))}</div>`;
    if (config.branding.logo && logoAllowed(slide.kind, config.branding.logoMode)) {
      const img = document.createElement('img');
      img.className = `sf-logo sf-logo-${config.branding.logoPosition}`;
      img.src = config.branding.logo;
      img.alt = config.institution ? `Logo de ${config.institution}` : 'Logo institucional';
      section.append(img);
    }
    if (slide.notes) {
      const aside = document.createElement('aside');
      aside.className = 'notes';
      aside.textContent = slide.notes;
      section.append(aside);
    }
    slideRoot.append(section);
  });
  const width = config.ratio === '4:3' ? 960 : 1280;
  for (const node of slideRoot.querySelectorAll('.sf-mermaid')) {
    try {
      const id = `sfmermaid${++mermaidSerial}`;
      const source = node.dataset.source;
      const result = await mermaid.render(id, source, node);
      node.innerHTML = result.svg;
      result.bindFunctions?.(node);
    } catch (error) {
      node.textContent = `Error en Mermaid: ${error.message}`;
      console.error('SlideForge Mermaid:', error);
    }
  }
  deck = new Reveal(revealRoot, { width, height: 720, margin: 0.06, minScale: 0.2, maxScale: 2, controls: !!config.controls, progress: !!config.progress, slideNumber: !!config.slideNumber, transition: config.transition, hash: !window.frameElement, plugins: [RevealMarkdown, RevealHighlight, RevealNotes, RevealSearch, RevealZoom] });
  await deck.initialize();
  deck.layout();
  if (config.enableCustomJs && config.customJs) {
    try { new Function('deck', 'root', 'project', config.customJs)(deck, slideRoot, project); }
    catch (error) { console.error('SlideForge custom JavaScript:', error); }
  }
}

async function queueDraw(project) {
  pendingProject = project;
  if (rendering) return;
  rendering = true;
  while (pendingProject) {
    const next = pendingProject;
    pendingProject = null;
    try { await draw(next); } catch (error) { slideRoot.textContent = error.message; }
  }
  rendering = false;
}

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'slideforge:project') return;
  queueDraw(event.data.project);
});

const embedded = document.querySelector('#slideforge-project');
if (embedded) {
  try { queueDraw(JSON.parse(embedded.textContent)); } catch (error) { slideRoot.textContent = error.message; }
} else if (window.opener) {
  window.opener.postMessage({ type: 'slideforge:ready' }, location.origin);
} else if (window.parent !== window) {
  window.parent.postMessage({ type: 'slideforge:ready' }, location.origin);
}

window.addEventListener('keydown', event => {
  if (event.key === 'f' && !(event.target instanceof HTMLInputElement)) document.documentElement.requestFullscreen?.();
});
