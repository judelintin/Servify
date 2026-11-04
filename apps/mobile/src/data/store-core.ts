import { emptyPreview, isMode, parsePreview, type PreviewData, type PreviewMode, type RequestStarter } from '../domain/preview';
import { isCategory, type CategoryId } from '../domain/catalog';

export const PREVIEW_KEY = 'servify.mobile.preview.v1';
export interface StoragePort { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> }
export interface PreviewSnapshot { ready: boolean; data: PreviewData; storage: 'device' | 'session'; message: string | null; saving: boolean }

export function createPreviewStore(storage: StoragePort, timeout = 4000) {
  const initial: PreviewSnapshot = { ready: false, data: emptyPreview(), storage: 'device', message: null, saving: false };
  let snapshot = initial, hydration: Promise<void> | undefined, queue = Promise.resolve(), pending = 0;
  const listeners = new Set<() => void>();
  function publish(patch: Partial<PreviewSnapshot>) { snapshot = { ...snapshot, ...patch }; listeners.forEach(listener => listener()); }
  function bounded<T>(work: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Storage timed out.')), timeout);
      work.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
    });
  }
  function hydrate() {
    if (!hydration) hydration = (async () => {
      try {
        const raw = await bounded(storage.getItem(PREVIEW_KEY));
        try { publish({ ready: true, data: raw === null ? emptyPreview() : parsePreview(raw) }); }
        catch { publish({ ready: true, storage: 'session', message: 'Saved preview data could not be read. It is untouched; new changes stay in this session.' }); }
      } catch { publish({ ready: true, storage: 'session', message: 'Device storage is unavailable. Your changes stay in this session only.' }); }
    })();
    return hydration;
  }
  function persist(data: PreviewData): Promise<boolean> {
    if (!snapshot.ready) return Promise.reject(new Error('Preview is still loading.'));
    publish({ data });
    if (snapshot.storage === 'session') return Promise.resolve(false);
    pending++; publish({ saving: true });
    const serialized = JSON.stringify(data);
    queue = queue.then(async () => {
      if (snapshot.storage === 'device') {
        try { await bounded(storage.setItem(PREVIEW_KEY, serialized)); }
        catch { publish({ storage: 'session', message: 'This change could not be saved to your device. Keep this app open; new changes stay in this session.' }); }
      }
      pending--; publish({ saving: pending > 0 });
    });
    return queue.then(() => snapshot.storage === 'device');
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hydrate,
    setMode(mode: PreviewMode) {
      if (!isMode(mode)) throw new Error('Choose Customer or Professional mode.');
      return persist({ ...snapshot.data, mode });
    },
    async saveStarter(category: CategoryId, id?: string): Promise<RequestStarter> {
      if (!isCategory(category)) throw new Error('Choose a service category.');
      const previous = id ? snapshot.data.starters.find(s => s.id === id) : undefined;
      if (id && !previous) throw new Error('This request starter no longer exists.');
      if (!previous && snapshot.data.starters.length >= 50) throw new Error('You have 50 starters. Remove an unused one before creating another.');
      const now = new Date().toISOString();
      // Local-only identifiers, never authentication or production resource IDs.
      const starter: RequestStarter = { id: previous?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`, category, createdAt: previous?.createdAt ?? now, updatedAt: now, stage: 'service_selected' };
      await persist({ ...snapshot.data, starters: previous ? snapshot.data.starters.map(s => s.id === id ? starter : s) : [starter, ...snapshot.data.starters] });
      return starter;
    },
    removeStarter(id: string) { return persist({ ...snapshot.data, starters: snapshot.data.starters.filter(s => s.id !== id) }); },
  };
}
