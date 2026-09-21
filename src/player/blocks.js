import { marked } from 'marked';
import katex from 'katex';
import createDOMPurify from 'dompurify';

const purifier = typeof window === 'undefined' ? null : createDOMPurify(window);
const sanitizeHtml = html => purifier ? purifier.sanitize(html, { USE_PROFILES: { html: true } }) : html;

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const lines = body => body.trim().split('\n').map(s => s.trim()).filter(Boolean);
const field = (body, key, fallback = '') => body.match(new RegExp(`^${key}:\\s*(.*)$`, 'mi'))?.[1]?.trim() || fallback;
const items = body => lines(body).filter(s => /^-\s/.test(s)).map(s => s.replace(/^-\s*/, ''));
const md = value => {
  const equations = [];
  const prepared = String(value || '').replace(/\$\$([\s\S]+?)\$\$|(?<!\$)\$([^\n$]+)\$(?!\$)/g, (_, display, inline) => {
    const token = `SLIDEFORGEMATH${equations.length}END`;
    try { equations.push(katex.renderToString(display || inline, { displayMode: !!display, throwOnError: false, output: 'mathml' })); }
    catch { equations.push(esc(display || inline)); }
    return token;
  });
  let result = sanitizeHtml(marked.parse(prepared, { breaks: true }));
  equations.forEach((html, i) => { result = result.replace(`SLIDEFORGEMATH${i}END`, html); });
  return result;
};

export function renderBlock(type, body) {
  const q = esc(field(body, 'question', 'Selecciona una respuesta'));
  const feedback = esc(field(body, 'feedback', 'Revisa la respuesta e inténtalo de nuevo.'));
  switch (type) {
    case 'quiz': case 'feedback': {
      const choices = lines(body).filter(s => /^- \[[ xX]\]/.test(s)).map(s => ({ correct: /^- \[[xX]\]/.test(s), label: s.replace(/^- \[[ xX]\]\s*/, '') }));
      return `<div class="sf-card sf-quiz"><p class="sf-question">${q}</p><div class="sf-options">${choices.map(c => `<button type="button" data-correct="${c.correct}">${esc(c.label)}</button>`).join('')}</div><p class="sf-feedback" role="status" data-message="${feedback}"></p></div>`;
    }
    case 'truefalse': return `<div class="sf-card sf-quiz"><p class="sf-question">${q}</p><div class="sf-options"><button type="button" data-correct="${field(body, 'answer', 'true') === 'true'}">Verdadero</button><button type="button" data-correct="${field(body, 'answer', 'true') !== 'true'}">Falso</button></div><p class="sf-feedback" role="status" data-message="${feedback}"></p></div>`;
    case 'flashcards': return `<div class="sf-flashcards">${items(body).map(item => { const [front, back] = item.split('|'); return `<button type="button" class="sf-flashcard" aria-label="Girar tarjeta"><span>${esc(front)}</span><span>${esc(back || '')}</span></button>`; }).join('')}</div>`;
    case 'tabs': {
      const entries = items(body).map(item => item.split('|'));
      return `<div class="sf-tabs"><div role="tablist">${entries.map(([label], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-tab="${i}">${esc(label)}</button>`).join('')}</div>${entries.map(([, content], i) => `<div role="tabpanel" ${i ? 'hidden' : ''}>${md(content || '')}</div>`).join('')}</div>`;
    }
    case 'accordion': return `<div class="sf-accordion">${items(body).map(item => { const [title, content] = item.split('|'); return `<details><summary>${esc(title)}</summary>${md(content || '')}</details>`; }).join('')}</div>`;
    case 'answer': return `<div class="sf-answer"><button type="button">Mostrar respuesta</button><div hidden>${md(body)}</div></div>`;
    case 'sort': return `<div class="sf-card sf-sort" data-order="${esc(items(body).join('|'))}"><p>Ordena los elementos con los botones ↑ y ↓.</p><ol>${items(body).reverse().map(item => `<li>${esc(item)} <button type="button" data-move="up" aria-label="Subir">↑</button><button type="button" data-move="down" aria-label="Bajar">↓</button></li>`).join('')}</ol><button type="button" data-check>Comprobar</button><p class="sf-feedback" role="status"></p></div>`;
    case 'match': {
      const pairs = items(body).map(item => item.split('|'));
      return `<div class="sf-card sf-match"><p>Relaciona cada concepto con su definición.</p>${pairs.map(([a], i) => `<label><span>${esc(a)}</span><select data-answer="${i}"><option value="">Seleccionar…</option>${pairs.map(([, b], j) => `<option value="${j}">${esc(b || '')}</option>`).join('')}</select></label>`).join('')}<button type="button" data-check>Comprobar</button><p class="sf-feedback" role="status"></p></div>`;
    }
    case 'slider': {
      const min = Number(field(body, 'min', '0')), max = Number(field(body, 'max', '100')), value = Number(field(body, 'value', String(min)));
      return `<div class="sf-card sf-slider"><label>${esc(field(body, 'label', 'Valor'))} <output>${value}</output><input type="range" min="${min}" max="${max}" value="${value}"></label></div>`;
    }
    case 'hotspot': {
      const image = esc(field(body, 'image'));
      const hotspots = items(body).map(item => item.split('|'));
      return `<div class="sf-hotspot" style="background-image:url('${image}')" role="group" aria-label="Imagen interactiva">${hotspots.map(([x, y, label, info]) => `<button type="button" style="left:${Math.max(0, Math.min(100, Number(x)))}%;top:${Math.max(0, Math.min(100, Number(y)))}%" data-info="${esc(info || '')}" aria-label="${esc(label)}">+</button>`).join('')}<p class="sf-feedback" role="status"></p></div>`;
    }
    case 'calculator': return `<div class="sf-card sf-calculator"><label>${esc(field(body, 'label', 'Valor'))} <input type="number" value="0"></label><p>${esc(field(body, 'formula', 'Resultado'))}: <output>0</output></p><small>Resultado = valor × ${esc(field(body, 'factor', '2'))}</small></div>`;
    case 'form': return `<form class="sf-card sf-form"><label>${esc(field(body, 'question', 'Tu respuesta'))}<input required></label><button>Enviar</button><p class="sf-feedback" role="status"></p></form>`;
    case 'mermaid': {
      const source = body.replace(/^(?:[ \t]|&#x20;|&#32;|&nbsp;)+/gmi, prefix => prefix.replace(/&#x20;|&#32;|&nbsp;/gi, ' ')).trim();
      return `<div class="sf-mermaid" data-source="${esc(source)}">Cargando diagrama…</div>`;
    }
    case 'columns': {
      const [left, right = ''] = body.split(/^\s*---\s*$/m);
      return `<div class="sf-columns"><div>${md(left)}</div><div>${md(right)}</div></div>`;
    }
    case 'iframe': {
      const url = field(body, 'url', body.trim());
      return /^https?:\/\//i.test(url) ? `<iframe class="sf-embed" src="${esc(url)}" title="Contenido externo" sandbox="allow-scripts allow-forms allow-presentation" referrerpolicy="no-referrer" allow="fullscreen" allowfullscreen loading="lazy"></iframe>` : '<p>URL de iframe no válida.</p>';
    }
    default: return md(`:::${type}\n${body}\n:::`);
  }
}

export function renderContent(source) {
  const blocks = [];
  const normalized = source.replace(/^```mermaid[ \t]*\n([\s\S]*?)^```[ \t]*$/gm, (_, body) => `:::mermaid\n${body.trimEnd()}\n:::`);
  const prepared = normalized.replace(/^:::([a-z]+)\s*\n([\s\S]*?)^:::\s*$/gm, (_, type, body) => {
    const token = `SLIDEFORGEBLOCK${blocks.length}END`;
    blocks.push(renderBlock(type, body));
    return `\n\n${token}\n\n`;
  });
  let html = md(prepared);
  blocks.forEach((block, i) => { html = html.replace(`<p>SLIDEFORGEBLOCK${i}END</p>`, block).replace(`SLIDEFORGEBLOCK${i}END`, block); });
  html = html.replace(/<table(?:\s[^>]*)?>[\s\S]*?<\/table>/gi, table => `<div class="sf-table-wrap">${table}</div>`);
  return html;
}
