export const PALETTE = Object.freeze({ dark: '#3a1467', primary: '#542e91', soft: '#644a98', orange: '#f37121', yellow: '#ffd54c', white: '#ffffff' });
export const KINDS = ['cover', 'section', 'content', 'columns', 'image', 'question', 'activity', 'data', 'quote', 'conclusions', 'closing'];
export const POSITIONS = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
export const MODES = ['all', 'ends', 'none'];

export function uid() { return globalThis.crypto?.randomUUID?.() || `s${Date.now()}${Math.random().toString(36).slice(2)}`; }

export function newSlide(kind = 'content') {
  const examples = {
    cover: '# Título de la clase\n\nSubtítulo o tema central',
    section: '# 01\n\n## Nueva sección',
    content: '# Nuevo concepto\n\nExplica aquí la idea principal.\n\n- Primer punto\n- Segundo punto',
    columns: '# Comparación\n\n:::columns\n### Concepto A\nDescripción.\n---\n### Concepto B\nDescripción.\n:::',
    image: '# Imagen y explicación\n\n![Descripción de la imagen](assets/imagen.png)\n\nExplicación breve.',
    question: '# Pregunta para la clase\n\n¿Qué opinan sobre este tema?',
    activity: '# Actividad\n\n:::quiz\nquestion: ¿Cuál opción es correcta?\n- [ ] Opción A\n- [x] Opción B\nfeedback: ¡Correcto!\n:::',
    data: '# Resultados\n\n## 85 %\n\nParticipación del grupo',
    quote: '# Una idea para recordar\n\n> La tecnología cobra sentido cuando ayuda a las personas.\n\n— Autor',
    conclusions: '# Conclusiones\n\n1. Primera idea\n2. Segunda idea\n3. Próximo paso',
    closing: '# Gracias\n\nPreguntas y comentarios'
  };
  return { id: uid(), kind, name: ({ cover: 'Portada', closing: 'Cierre', section: 'Sección' })[kind] || 'Nueva diapositiva', content: examples[kind], notes: '' };
}

export function createProject() {
  return {
    version: 1,
    config: { title: 'Mi clase', author: '', course: '', institution: '', theme: 'institutional', transition: 'slide', ratio: '16:9', controls: true, progress: true, slideNumber: true, customCss: '', customJs: '', enableCustomJs: false, branding: { logo: '', logoPosition: 'bottom-right', logoMode: 'all', colors: { ...PALETTE } } },
    slides: [newSlide('cover'), newSlide('content'), newSlide('activity'), newSlide('closing')],
    assets: {}
  };
}

export function normalizeProject(input) {
  const fresh = createProject();
  if (!input || typeof input !== 'object') throw new Error('Proyecto JSON no válido.');
  const config = { ...fresh.config, ...(input.config || {}) };
  config.branding = { ...fresh.config.branding, ...(input.config?.branding || {}) };
  config.branding.colors = { ...PALETTE, ...(input.config?.branding?.colors || {}) };
  if (!POSITIONS.includes(config.branding.logoPosition)) config.branding.logoPosition = 'bottom-right';
  if (!MODES.includes(config.branding.logoMode)) config.branding.logoMode = 'all';
  if (!['16:9', '4:3'].includes(config.ratio)) config.ratio = '16:9';
  if (!['slide', 'fade', 'convex', 'concave', 'zoom', 'none'].includes(config.transition)) config.transition = 'slide';
  const slides = Array.isArray(input.slides) ? input.slides.map(s => ({ id: s.id || uid(), kind: KINDS.includes(s.kind) ? s.kind : 'content', name: String(s.name || 'Diapositiva'), content: String(s.content || ''), notes: String(s.notes || '') })) : fresh.slides;
  return { version: 1, config, slides: slides.length ? slides : [newSlide()], assets: input.assets && typeof input.assets === 'object' ? input.assets : {} };
}

export function serializeMarkdown(project) {
  return project.slides.map(s => `<!-- slideforge:${s.kind}:${encodeURIComponent(s.name)} -->\n${s.content}${s.notes ? `\n\nNotes:\n${s.notes}` : ''}`).join('\n\n---\n\n');
}

export function parseMarkdown(source) {
  const parts = [];
  let current = [];
  let block = false;
  let fence = false;
  for (const line of source.replace(/\r\n/g, '\n').split('\n')) {
    if (/^```/.test(line.trim())) fence = !fence;
    if (!fence && /^:::[a-z]+\s*$/.test(line.trim())) block = true;
    else if (!fence && /^:::\s*$/.test(line.trim())) block = false;
    if (!block && !fence && /^\s*---\s*$/.test(line)) { parts.push(current.join('\n')); current = []; }
    else current.push(line);
  }
  parts.push(current.join('\n'));
  return parts.map(part => {
    let content = part.trim();
    const meta = content.match(/^<!-- slideforge:([a-z]+):([^>]+) -->\s*\n?/);
    if (meta) content = content.slice(meta[0].length);
    const notes = content.match(/(?:^|\n)Notes:\s*\n([\s\S]*)$/i);
    if (notes) content = content.slice(0, notes.index).trim();
    const slide = newSlide(meta && KINDS.includes(meta[1]) ? meta[1] : 'content');
    slide.content = content.trim();
    slide.notes = notes?.[1]?.trim() || '';
    slide.name = meta ? decodeURIComponent(meta[2]) : (content.match(/^#{1,2}\s+(.+)$/m)?.[1] || 'Diapositiva');
    return slide;
  }).filter(s => s.content);
}
