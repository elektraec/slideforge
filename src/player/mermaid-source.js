// Mermaid wraps Markdown-string labels, while ordinary quoted labels stay on one line.
// Apply this only to long rectangular flowchart nodes so authors can keep simple syntax.
export function prepareMermaidSource(source) {
  if (!/^\s*(?:flowchart|graph)\b/i.test(source)) return source;
  return source.replace(/\b([A-Za-z_][\w-]*)\[(?:"([^"\n]+)"|([^\]\n]+))\]/g, (whole, id, quoted, plain) => {
    const label = quoted ?? plain;
    if (label.length < 30 || /[`\[\]<>]/.test(label)) return whole;
    return `${id}["\`${label.trim()}\`"]`;
  });
}
