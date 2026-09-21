const DB_NAME = 'slideforge';
const DB_VERSION = 1;
const PROJECT_KEY = 'current';
const LEGACY_KEY = 'slideforge-project-v1';
const PROJECTS = 'projects';
const RESOURCES = 'resources';

const requestResult = request => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const transactionDone = transaction => new Promise((resolve, reject) => {
  transaction.oncomplete = resolve;
  transaction.onerror = () => reject(transaction.error);
  transaction.onabort = () => reject(transaction.error);
});

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS);
      if (!db.objectStoreNames.contains(RESOURCES)) db.createObjectStore(RESOURCES);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const resourceReference = id => ({ storage: 'indexeddb', id });
const isResourceReference = value => value?.storage === 'indexeddb' && typeof value.id === 'string';

export async function saveLocal(project) {
  try {
    if (!globalThis.indexedDB) throw new Error('IndexedDB no disponible');
    const db = await openDatabase();
    const copy = structuredClone(project);
    const resources = new Map();
    for (const [name, value] of Object.entries(copy.assets || {})) {
      if (typeof value === 'string' && value.startsWith('data:')) {
        const id = `asset:${name}`;
        resources.set(id, value);
        copy.assets[name] = resourceReference(id);
      }
    }
    const logo = copy.config?.branding?.logo;
    if (typeof logo === 'string' && logo.startsWith('data:')) {
      resources.set('branding:logo', logo);
      copy.config.branding.logo = resourceReference('branding:logo');
    }
    const transaction = db.transaction([PROJECTS, RESOURCES], 'readwrite');
    transaction.objectStore(PROJECTS).put(copy, PROJECT_KEY);
    const resourceStore = transaction.objectStore(RESOURCES);
    resourceStore.clear();
    for (const [id, value] of resources) resourceStore.put(value, id);
    await transactionDone(transaction);
    db.close();
    localStorage.removeItem(LEGACY_KEY);
    return true;
  } catch {
    try { localStorage.setItem(LEGACY_KEY, JSON.stringify(project)); return true; } catch { return false; }
  }
}

export async function loadLocal() {
  try {
    if (globalThis.indexedDB) {
      const db = await openDatabase();
      const transaction = db.transaction([PROJECTS, RESOURCES], 'readonly');
      const stored = await requestResult(transaction.objectStore(PROJECTS).get(PROJECT_KEY));
      if (stored) {
        const resources = transaction.objectStore(RESOURCES);
        for (const [name, value] of Object.entries(stored.assets || {})) if (isResourceReference(value)) stored.assets[name] = await requestResult(resources.get(value.id)) || '';
        const logo = stored.config?.branding?.logo;
        if (isResourceReference(logo)) stored.config.branding.logo = await requestResult(resources.get(logo.id)) || '';
        await transactionDone(transaction);
        db.close();
        return stored;
      }
      db.close();
    }
  } catch { /* Use the legacy fallback below. */ }
  try {
    const value = localStorage.getItem(LEGACY_KEY);
    const project = value ? JSON.parse(value) : null;
    if (project) await saveLocal(project);
    return project;
  } catch { return null; }
}

export async function hasLocal() {
  try {
    if (localStorage.getItem(LEGACY_KEY)) return true;
    if (!globalThis.indexedDB) return false;
    const db = await openDatabase();
    const transaction = db.transaction(PROJECTS, 'readonly');
    const key = await requestResult(transaction.objectStore(PROJECTS).getKey(PROJECT_KEY));
    await transactionDone(transaction);
    db.close();
    return key !== undefined;
  } catch { return false; }
}
