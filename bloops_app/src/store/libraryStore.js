import { writable, get } from 'svelte/store';
import {
  listProjects,
  createProject,
  duplicateProject,
  deleteProject,
  renameProject as renameProjectRecord,
  loadProject,
  saveProjectData,
  getCurrentProjectId,
  setCurrentProjectId
} from '../lib/persistence.js';
import { project } from './projectStore.js';

const AUTOSAVE_DEBOUNCE = 600;
const DEFAULT_NAME = project.defaultSnapshot().name ?? 'Untitled loop';

const sanitizeName = (name) => {
  if (typeof name !== 'string') return DEFAULT_NAME;
  const trimmed = name.trim();
  return trimmed.length ? trimmed : DEFAULT_NAME;
};

const generateUniqueName = (desiredName, existingProjects) => {
  const safeName = sanitizeName(desiredName);
  const taken = new Set((existingProjects ?? []).map((project) => project.name));
  if (!taken.has(safeName)) {
    return safeName;
  }

  let suffix = 2;
  let candidate = `${safeName} (${suffix})`;
  while (taken.has(candidate)) {
    suffix += 1;
    candidate = `${safeName} (${suffix})`;
  }

  return candidate;
};

const createLibraryStore = () => {
  const store = writable({
    projects: [],
    currentId: null,
    loading: true,
    status: 'idle'
  });

  const { subscribe, set, update } = store;

  let autosaveTimer = null;
  let lastSnapshotHash = '';
  let initialized = false;
  let unsubscribeProject = null;
  let initializationPromise = null;

  const computeHash = (snapshot) => JSON.stringify(snapshot);

  const refreshProjects = async (currentId) => {
    const projects = await listProjects();
    update((state) => ({ ...state, projects, currentId: currentId ?? state.currentId }));
  };

  const loadIntoStore = async (projectId) => {
    if (!projectId) return false;
    const record = await loadProject(projectId);
    if (record?.data) {
      const loaded = project.load(record.data);
      if (!loaded) return false;
    }
    project.setName(record?.name ?? DEFAULT_NAME);
    await setCurrentProjectId(projectId);
    update((state) => ({ ...state, currentId: projectId }));
    return true;
  };

  const queueAutosave = (snapshot) => {
    if (!snapshot) return;
    const projectId = get(store).currentId;
    if (!projectId) return;
    const signature = computeHash(snapshot);
    if (signature === lastSnapshotHash) return;
    lastSnapshotHash = signature;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async () => {
      update((state) => ({ ...state, status: 'saving' }));
      await saveProjectData(projectId, snapshot, { name: snapshot.name });
      await refreshProjects(projectId);
      update((state) => ({ ...state, status: 'idle' }));
    }, AUTOSAVE_DEBOUNCE);
  };

  const subscribeToProject = () => {
    unsubscribeProject?.();
    unsubscribeProject = project.subscribe((value) => {
      if (!initialized) return;
      if (value?.playing) return;
      const snapshot = project.toSnapshot();
      queueAutosave(snapshot);
    });
  };

  return {
    subscribe,
    async initialize() {
      if (initializationPromise) {
        await initializationPromise;
        return;
      }
      initializationPromise = (async () => {
        if (initialized) return;
        initialized = true;
        set((state) => ({ ...state, loading: true }));
        subscribeToProject();
        let currentId = await getCurrentProjectId();
        await refreshProjects(currentId);
        const currentState = get(store);
        if (!currentId && currentState.projects.length > 0) {
          currentId = currentState.projects[0].id;
        }
        if (!currentId) {
          const snapshot = project.toSnapshot();
          const created = await createProject({ name: snapshot.name, data: snapshot });
          currentId = created.id;
        }
        await loadIntoStore(currentId);
        await refreshProjects(currentId);
        set((state) => ({ ...state, loading: false }));
      })();
      await initializationPromise;
      initializationPromise = null;
    },
    async selectProject(id) {
      if (!id) return;
      await loadIntoStore(id);
      await refreshProjects(id);
    },
    async createNew() {
      if (initializationPromise) {
        await initializationPromise;
      }
      const state = get(store);
      const snapshot = project.defaultSnapshot();
      const name = generateUniqueName(snapshot.name, state.projects);
      const preparedSnapshot = { ...snapshot, name };
      const created = await createProject({ name, data: preparedSnapshot });
      await loadIntoStore(created.id);
      await refreshProjects(created.id);
    },
    async duplicateCurrent() {
      const currentId = get(store).currentId;
      if (!currentId) return;
      const duplicated = await duplicateProject(currentId);
      const record = await loadProject(currentId);
      if (record?.data) {
        await saveProjectData(duplicated.id, record.data, { name: duplicated.name });
      }
      await loadIntoStore(duplicated.id);
      await refreshProjects(duplicated.id);
    },
    async deleteCurrent() {
      const state = get(store);
      if (!state.currentId || state.projects.length <= 1) return;
      const index = state.projects.findIndex((p) => p.id === state.currentId);
      await deleteProject(state.currentId);
      const next = state.projects[index + 1] ?? state.projects[index - 1];
      await refreshProjects(next?.id);
      await loadIntoStore(next?.id);
    },
    async renameCurrent(name) {
      const desiredName = sanitizeName(name);
      project.setName(desiredName);
      const finalName = project.getName();

      if (initializationPromise) {
        await initializationPromise;
        if (project.getName() !== finalName) {
          project.setName(finalName);
        }
      }

      const state = get(store);
      if (!state.currentId) {
        const snapshot = project.toSnapshot();
        const created = await createProject({ name: finalName, data: snapshot });
        await loadIntoStore(created.id);
        await refreshProjects(created.id);
        return;
      }

      await renameProjectRecord(state.currentId, finalName);
      await refreshProjects(state.currentId);
    },
    dispose() {
      unsubscribeProject?.();
      unsubscribeProject = null;
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
        autosaveTimer = null;
      }
      initialized = false;
      lastSnapshotHash = '';
      initializationPromise = null;
    }
  };
};

export const library = createLibraryStore();

