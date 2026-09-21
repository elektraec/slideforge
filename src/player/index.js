import Reveal from 'reveal.js';
import RevealHighlight from 'reveal.js/plugin/highlight';
import RevealNotes from 'reveal.js/plugin/notes';
import RevealSearch from 'reveal.js/plugin/search';
import RevealZoom from 'reveal.js/plugin/zoom';
import mermaid from 'mermaid';
import { renderContent } from './blocks.js';
import { prepareMermaidSource } from './mermaid-source.js';
import { fitDiagram } from './diagram-layout.js';
import { mountInteractions } from './interactions.js';
import { normalizeProject } from '../model.js';
import 'reveal.js/reveal.css';
import 'reveal.js/plugin/highlight/monokai.css';
import '../styles/theme-institutional.css';

const slideRoot = document.querySelector('#slides');
const revealRoot = document.querySelector('.reveal');
let deck;
let rendering = false;
let pendingProject;
const pendingSlideUpdates = new Map();
let currentProject;
let mermaidSerial = 0;
let activeSlideCount = 0;
let lastProjectSignature = '';
let lastProjectRevision = -1;
mountInteractions(slideRoot);
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', fontFamily: 'Arial, sans-serif', fontSize: '16px', markdownAutoWrap: true, flowchart: { wrappingWidth: 180 }, timeline: { useMaxWidth: true }, themeVariables: { primaryColor: '#f4effa', primaryTextColor: '#3a1467', primaryBorderColor: '#542e91', lineColor: '#f37121' } });

function assetContent(content, assets) {
  return content.replace(/(?:assets\/)([\w.\-]+)/g, (match, name) => assets[name] || match);
}

function logoAllowed(kind, mode) { return mode === 'all' || (mode === 'ends' && (kind === 'cover' || kind === 'closing')); }
function goToEnd() {
  deck?.slide(Math.max(0, activeSlideCount - 1), 0, 0);
}

function renderSection(section, slide, project) {
  const { config, assets } = project;
  section.className = `sf-slide sf-slide-${slide.kind}`;
  section.innerHTML = `<div class="sf-slide-inner">${renderContent(assetContent(slide.content, assets))}</div>`;
  if (section.querySelector('.sf-mermaid')) section.classList.add('sf-slide-has-mermaid');
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
}

async function renderMermaid(scope, slideWidth) {
  for (const node of scope.querySelectorAll('.sf-mermaid')) {
    try {
      const id = `sfmermaid${++mermaidSerial}`;
      const source = prepareMermaidSource(node.dataset.source);
      const flowchart = /^\s*(?:flowchart|graph)\b/i.test(source);
      if (flowchart) node.classList.add('sf-mermaid-flowchart');
      const result = await mermaid.render(id, source);
      node.innerHTML = result.svg;
      const svg = node.querySelector('svg');
      if (svg) {
        if (!svg.hasAttribute('viewBox')) {
          const width = Number.parseFloat(svg.getAttribute('width'));
          const height = Number.parseFloat(svg.getAttribute('height'));
          if (width > 0 && height > 0) svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        const viewBox = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
        if (flowchart && viewBox?.length === 4) {
          const fitted = fitDiagram(viewBox[2], viewBox[3], Math.min(slideWidth * 0.78, 900), 460);
          if (fitted) svg.style.setProperty('--sf-diagram-width', `${fitted.width}px`);
        }
      }
      result.bindFunctions?.(node);
    } catch (error) {
      node.textContent = `Error en Mermaid: ${error.message}`;
      console.error('SlideForge Mermaid:', error);
    }
  }
}

function mountNavigationControls(config, slideCount) {
  revealRoot.querySelector('.sf-navigation-controls')?.remove();
  if (!config.controls) return;
  const controls = document.createElement('nav');
  controls.className = 'sf-navigation-controls';
  controls.setAttribute('aria-label', 'Navegación de la presentación');
  controls.innerHTML = `
    <button type="button" data-nav="previous" title="Diapositiva anterior (←)" aria-label="Diapositiva anterior">←</button>
    <button type="button" data-nav="home" title="Primera diapositiva (Home)">Home</button>
    <button type="button" data-nav="end" title="Última diapositiva (End)">End</button>
    <button type="button" data-nav="next" title="Diapositiva siguiente (→)" aria-label="Diapositiva siguiente">→</button>`;
  const go = action => {
    if (!deck) return;
    if (action === 'previous') deck.prev();
    if (action === 'next') deck.next();
    if (action === 'home') deck.slide(0, 0, 0);
    if (action === 'end') goToEnd();
  };
  controls.addEventListener('click', event => {
    const button = event.target.closest('button[data-nav]');
    if (button) go(button.dataset.nav);
  });
  controls.addEventListener('keydown', event => {
    const actions = { ArrowLeft: 'previous', ArrowRight: 'next', Home: 'home', End: 'end' };
    if (!actions[event.key]) return;
    event.preventDefault();
    event.stopPropagation();
    go(actions[event.key]);
  });
  const update = () => {
    const index = deck?.getIndices().h || 0;
    controls.querySelector('[data-nav="previous"]').disabled = index <= 0;
    controls.querySelector('[data-nav="home"]').disabled = index <= 0;
    controls.querySelector('[data-nav="next"]').disabled = index >= slideCount - 1;
    controls.querySelector('[data-nav="end"]').disabled = index >= slideCount - 1;
  };
  deck.on('slidechanged', update);
  revealRoot.append(controls);
  update();
}

function reportOverflow() {
  const overflow = [...slideRoot.children].map((section, index) => {
    const inner = section.querySelector('.sf-slide-inner');
    if (!inner) return null;
    const bounds = section.getBoundingClientRect();
    const childBoxes = [...inner.children].map(element => ({ element, box: element.getBoundingClientRect() }));
    const horizontal = section.scrollWidth > section.clientWidth + 3 || inner.scrollWidth > inner.clientWidth + 3 || childBoxes.some(({ box }) => box.right > bounds.right + 3 || box.left < bounds.left - 3);
    const vertical = section.scrollHeight > section.clientHeight + 3 || inner.scrollHeight > inner.clientHeight + 3 || childBoxes.some(({ box }) => box.bottom > bounds.bottom + 3 || box.top < bounds.top - 3);
    section.toggleAttribute('data-content-overflow', horizontal || vertical);
    if (!horizontal && !vertical) return null;
    const elements = childBoxes.filter(({ box }) => {
      return box.right > bounds.right + 3 || box.bottom > bounds.bottom + 3 || box.left < bounds.left - 3;
    }).slice(0, 4).map(({ element }) => element.getAttribute('aria-label') || element.className?.toString().split(' ')[0] || element.tagName.toLowerCase());
    return { index, horizontal, vertical, elements };
  }).filter(Boolean);
  window.__slideforgeOverflow = overflow;
  if (window.parent !== window) window.parent.postMessage({ type: 'slideforge:diagnostics', overflow }, location.origin);
}

function scheduleOverflowReport() {
  requestAnimationFrame(() => requestAnimationFrame(reportOverflow));
  document.fonts?.ready.then(reportOverflow);
}
window.addEventListener('resize', scheduleOverflowReport);

async function draw(projectInput) {
  const project = normalizeProject(projectInput);
  currentProject = project;
  const { config } = project;
  activeSlideCount = project.slides.length;
  window.__slideforgeDiagnostics ||= { fullRenders: 0, incrementalRenders: 0 };
  window.__slideforgeDiagnostics.fullRenders++;
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
    renderSection(section, slide, project);
    slideRoot.append(section);
  });
  const width = config.ratio === '4:3' ? 960 : 1280;
  await renderMermaid(slideRoot, width);
  deck = new Reveal(revealRoot, { view: 'slide', scrollActivationWidth: null, width, height: 720, margin: 0.06, minScale: 0.2, maxScale: 2, controls: false, progress: !!config.progress, slideNumber: !!config.slideNumber, transition: config.transition, hash: !window.frameElement, plugins: [RevealHighlight, RevealNotes, RevealSearch, RevealZoom] });
  await deck.initialize();
  mountNavigationControls(config, project.slides.length);
  deck.layout();
  scheduleOverflowReport();
  if (config.enableCustomJs && config.customJs) {
    try { new Function('deck', 'root', 'project', config.customJs)(deck, slideRoot, project); }
    catch (error) { console.error('SlideForge custom JavaScript:', error); }
  }
}

async function patchSlide({ index, slide, assets = {} }) {
  if (!deck || !currentProject || !currentProject.slides[index]) return;
  Object.assign(currentProject.assets, assets);
  currentProject.slides[index] = { ...currentProject.slides[index], ...slide };
  const section = slideRoot.children[index];
  if (!section) return;
  const state = ['past', 'present', 'future'].filter(name => section.classList.contains(name));
  const indices = deck.getIndices();
  renderSection(section, currentProject.slides[index], currentProject);
  section.classList.add(...state);
  const width = currentProject.config.ratio === '4:3' ? 960 : 1280;
  await renderMermaid(section, width);
  deck.sync();
  deck.slide(indices.h, indices.v, indices.f);
  deck.layout();
  window.__slideforgeDiagnostics ||= { fullRenders: 0, incrementalRenders: 0 };
  window.__slideforgeDiagnostics.incrementalRenders++;
  lastProjectSignature = JSON.stringify(currentProject);
  scheduleOverflowReport();
}

async function processQueue() {
  if (rendering) return;
  rendering = true;
  while (pendingProject || pendingSlideUpdates.size) {
    try {
      if (pendingProject) {
        const next = pendingProject;
        pendingProject = null;
        pendingSlideUpdates.clear();
        await draw(next);
      } else {
        const [index, update] = pendingSlideUpdates.entries().next().value;
        pendingSlideUpdates.delete(index);
        await patchSlide(update);
      }
    } catch (error) { console.error('SlideForge preview:', error); }
  }
  rendering = false;
}

function queueDraw(project, revision) {
  if (Number.isInteger(revision) && revision === lastProjectRevision) return;
  const signature = JSON.stringify(project);
  if (signature === lastProjectSignature) return;
  if (Number.isInteger(revision)) lastProjectRevision = revision;
  lastProjectSignature = signature;
  pendingProject = project;
  processQueue();
}
function queueSlideUpdate(update) { pendingSlideUpdates.set(update.index, update); processQueue(); }

window.addEventListener('message', event => {
  if (event.origin !== location.origin) return;
  if (event.data?.type === 'slideforge:project') queueDraw(event.data.project, event.data.revision);
  if (event.data?.type === 'slideforge:slide-update') queueSlideUpdate(event.data);
  if (event.data?.type === 'slideforge:navigate') {
    const actions = { ArrowLeft: () => deck?.prev(), ArrowRight: () => deck?.next(), Home: () => deck?.slide(0, 0, 0), End: goToEnd };
    actions[event.data.key]?.();
  }
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
  const target = event.target;
  const editing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (editing || event.ctrlKey || event.metaKey || event.altKey) return;
  const actions = {
    ArrowLeft: () => deck?.prev(),
    ArrowRight: () => deck?.next(),
    Home: () => deck?.slide(0, 0, 0),
    End: goToEnd
  };
  if (actions[event.key]) {
    event.preventDefault();
    event.stopImmediatePropagation();
    actions[event.key]();
  } else if (event.key === 'f') {
    document.documentElement.requestFullscreen?.();
  }
}, true);
