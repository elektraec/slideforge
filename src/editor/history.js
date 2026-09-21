export function createHistory(initial, limit = 100) {
  let entries = [structuredClone(initial)];
  let cursor = 0;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  return {
    push(value) {
      if (same(entries[cursor], value)) return;
      entries = entries.slice(0, cursor + 1);
      entries.push(structuredClone(value));
      if (entries.length > limit) entries.shift();
      cursor = entries.length - 1;
    },
    undo() {
      if (cursor <= 0) return null;
      return structuredClone(entries[--cursor]);
    },
    redo() {
      if (cursor >= entries.length - 1) return null;
      return structuredClone(entries[++cursor]);
    },
    reset(value) { entries = [structuredClone(value)]; cursor = 0; },
    get canUndo() { return cursor > 0; },
    get canRedo() { return cursor < entries.length - 1; }
  };
}
