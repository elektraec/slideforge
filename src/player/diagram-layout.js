export function fitDiagram(width, height, maxWidth, maxHeight) {
  if (![width, height, maxWidth, maxHeight].every(value => Number.isFinite(value) && value > 0)) return null;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
