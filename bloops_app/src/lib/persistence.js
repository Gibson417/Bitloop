const DB_NAME = 'bloops-workspace';
const DB_VERSION = 1;
const PROJECT_STORE = 'projects';
const META_STORE = 'meta';
const CURRENT_PROJECT_KEY = 'currentProjectId';
const DEFAULT_NAME = 'Untitled loop';

const isBrowser = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

let dbPromise;
const memoryStore = {
  projects: new Map(),
  meta: new Map()
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const ensureName = (name) => {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed.length ? trimmed : DEFAULT_NAME;
};

const requestPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const openDatabase = () => {
  if (!isBrowser) return null;
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        let projectStore;
        if (!db.objectStoreNames.contains(PROJECT_STORE)) {
          projectStore = db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
        } else {
          projectStore = request.transaction.objectStore(PROJECT_STORE);
        }
        if (!projectStore.indexNames.contains('by-updated')) {
          projectStore.createIndex('by-updated', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
};

const mapRecord = (record) => ({
  id: record.id,
  name: record.name ?? DEFAULT_NAME,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt
});

const listMemoryProjects = () =>
  Array.from(memoryStore.projects.values())
    .map(mapRecord)
    .sort((a, b) => b.updatedAt - a.updatedAt);

export const listProjects = async () => {
  if (!isBrowser) {
    return listMemoryProjects();
  }
  const db = await openDatabase();
  const tx = db.transaction(PROJECT_STORE, 'readonly');
  const store = tx.objectStore(PROJECT_STORE);
  const index = store.index('by-updated');
  const records = await requestPromise(index.getAll());
  return records.sort((a, b) => b.updatedAt - a.updatedAt).map(mapRecord);
};

export const loadProject = async (id) => {
  if (!id) return null;
  if (!isBrowser) {
    return memoryStore.projects.get(id) ?? null;
  }
  const db = await openDatabase();
  const tx = db.transaction(PROJECT_STORE, 'readonly');
  const store = tx.objectStore(PROJECT_STORE);
  return requestPromise(store.get(id));
};

const putRecord = async (record) => {
  if (!isBrowser) {
    memoryStore.projects.set(record.id, record);
    return mapRecord(record);
  }
  const db = await openDatabase();
  const tx = db.transaction(PROJECT_STORE, 'readwrite');
  const store = tx.objectStore(PROJECT_STORE);
  await requestPromise(store.put(record));
  return mapRecord(record);
};

export const createProject = async ({ name = DEFAULT_NAME, data = null } = {}) => {
  const timestamp = Date.now();
  const record = {
    id: generateId(),
    name: ensureName(name),
    createdAt: timestamp,
    updatedAt: timestamp,
    data
  };
  return putRecord(record);
};

export const saveProjectData = async (id, data, { name } = {}) => {
  if (!id) return null;
  const existing = await loadProject(id);
  const timestamp = Date.now();
  const record = {
    id,
    name: ensureName(name ?? existing?.name ?? DEFAULT_NAME),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    data
  };
  return putRecord(record);
};

export const renameProject = async (id, name) => {
  if (!id) return null;
  const existing = await loadProject(id);
  if (!existing) return null;
  return putRecord({ ...existing, name: ensureName(name), updatedAt: Date.now() });
};

export const duplicateProject = async (id) => {
  const existing = await loadProject(id);
  const baseName = existing?.name ?? DEFAULT_NAME;
  return createProject({ name: `${baseName} copy`, data: existing?.data ?? null });
};

export const deleteProject = async (id) => {
  if (!id) return;
  if (!isBrowser) {
    memoryStore.projects.delete(id);
    return;
  }
  const db = await openDatabase();
  const tx = db.transaction(PROJECT_STORE, 'readwrite');
  const store = tx.objectStore(PROJECT_STORE);
  await requestPromise(store.delete(id));
};

export const getCurrentProjectId = async () => {
  if (!isBrowser) {
    return memoryStore.meta.get(CURRENT_PROJECT_KEY) ?? null;
  }
  const db = await openDatabase();
  const tx = db.transaction(META_STORE, 'readonly');
  const store = tx.objectStore(META_STORE);
  return requestPromise(store.get(CURRENT_PROJECT_KEY));
};

export const setCurrentProjectId = async (id) => {
  if (!isBrowser) {
    memoryStore.meta.set(CURRENT_PROJECT_KEY, id);
    return;
  }
  const db = await openDatabase();
  const tx = db.transaction(META_STORE, 'readwrite');
  const store = tx.objectStore(META_STORE);
  await requestPromise(store.put(id, CURRENT_PROJECT_KEY));
};

export const resetAll = async () => {
  if (!isBrowser) {
    memoryStore.projects.clear();
    memoryStore.meta.clear();
    return;
  }
  const db = await openDatabase();
  const tx = db.transaction([PROJECT_STORE, META_STORE], 'readwrite');
  await Promise.all([
    requestPromise(tx.objectStore(PROJECT_STORE).clear()),
    requestPromise(tx.objectStore(META_STORE).clear())
  ]);
};

