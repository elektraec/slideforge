const labels = {
  quiz: 'Quiz', truefalse: 'Verdadero/Falso', flashcards: 'Flashcards', tabs: 'Tabs',
  accordion: 'Acordeón', sort: 'Ordenar', match: 'Relacionar', slider: 'Slider',
  mermaid: 'Mermaid', answer: 'Mostrar respuesta', iframe: 'Iframe'
};

export const visualTypes = Object.keys(labels);
export const visualTypeLabel = type => labels[type] || type;

export function findComponent(source, caret = 0) {
  const pattern = /^:::([a-z]+)\s*$([\s\S]*?)^:::\s*$/gmi;
  for (const match of source.matchAll(pattern)) {
    const start = match.index;
    const end = start + match[0].length;
    if (caret >= start && caret <= end) {
      return { type: match[1].toLowerCase(), body: match[2].trim(), start, end };
    }
  }
  return null;
}

const field = (name, label, value = '', kind = 'input') => ({ name, label, value, kind });
export function componentFields(type, body = '') {
  const value = key => body.match(new RegExp(`^${key}:\\s*(.*)$`, 'mi'))?.[1]?.trim() || '';
  const lines = body.split('\n').filter(line => /^\s*-\s+/.test(line)).map(line => line.replace(/^\s*-\s+/, ''));
  if (type === 'quiz') return [field('question', 'Pregunta', value('question')), field('items', 'Opciones (marca la correcta con *)', lines.map(line => `${/\[x\]/i.test(line) ? '*' : ''}${line.replace(/^\[[ x]\]\s*/i, '')}`).join('\n'), 'textarea'), field('feedback', 'Feedback', value('feedback'), 'textarea')];
  if (type === 'truefalse') return [field('question', 'Afirmación', value('question'), 'textarea'), field('answer', 'Respuesta (true o false)', value('answer') || 'true'), field('feedback', 'Feedback', value('feedback'), 'textarea')];
  if (['flashcards','tabs','accordion','match'].includes(type)) return [field('items', 'Elementos, uno por línea: título | contenido', lines.join('\n'), 'textarea')];
  if (type === 'sort') return [field('items', 'Elementos en el orden correcto', lines.join('\n'), 'textarea')];
  if (type === 'slider') return [field('label', 'Etiqueta', value('label')), field('min', 'Mínimo', value('min') || '0'), field('max', 'Máximo', value('max') || '100'), field('value', 'Valor inicial', value('value') || '50')];
  if (type === 'iframe') return [field('url', 'URL', value('url'))];
  if (type === 'mermaid') return [field('source', 'Código Mermaid', body, 'textarea')];
  return [field('content', 'Contenido', body, 'textarea')];
}

export function buildComponent(type, values) {
  let body = '';
  if (type === 'quiz') body = `question: ${values.question}\n${values.items.split('\n').filter(Boolean).map(line => `- [${line.startsWith('*') ? 'x' : ' '}] ${line.replace(/^\*/, '')}`).join('\n')}\nfeedback: ${values.feedback}`;
  else if (type === 'truefalse') body = `question: ${values.question}\nanswer: ${values.answer}\nfeedback: ${values.feedback}`;
  else if (['flashcards','tabs','accordion','sort','match'].includes(type)) body = values.items.split('\n').filter(Boolean).map(line => `- ${line}`).join('\n');
  else if (type === 'slider') body = `label: ${values.label}\nmin: ${values.min}\nmax: ${values.max}\nvalue: ${values.value}`;
  else if (type === 'iframe') body = `url: ${values.url}`;
  else body = values.source ?? values.content ?? '';
  return `:::${type}\n${body.trim()}\n:::`;
}
