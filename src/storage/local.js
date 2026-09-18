const KEY = 'slideforge-project-v1';
export function saveLocal(project) { try { localStorage.setItem(KEY, JSON.stringify(project)); return true; } catch { return false; } }
export function loadLocal() { try { const value = localStorage.getItem(KEY); return value ? JSON.parse(value) : null; } catch { return null; } }
export function hasLocal() { return !!localStorage.getItem(KEY); }
