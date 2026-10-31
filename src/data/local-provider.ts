import { parseProviderProfile, type LocalProviderProfile } from "@/features/provider/profile-model";
import { openLocalDatabase, readLocalRecords, storageTimeoutMs } from "./browser-storage";
export class ProviderConflictError extends Error { constructor() { super("This profile changed in another tab. Your answers have not overwritten it. Reload the latest profile before editing again."); } }
type Snapshot = { ready: boolean; mode: "browser" | "memory"; profile: LocalProviderProfile | null; warning: string; error: string; unreadable: boolean };
const serverSnapshot: Snapshot = { ready: false, mode: "browser", profile: null, warning: "", error: "", unreadable: false };
let snapshot = serverSnapshot;
let database: IDBDatabase | null = null;
let initialization: Promise<void> | undefined;
let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();
function emit(patch: Partial<Snapshot>) { snapshot = { ...snapshot, ...patch }; listeners.forEach(listener => listener()); }
export const getProviderSnapshot = () => snapshot;
export const getServerProviderSnapshot = () => serverSnapshot;
export function subscribeProvider(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
async function refresh() {
  if (!database) return;
  const records = await readLocalRecords(database, "providerProfiles");
  const raw = records.find(record => typeof record === "object" && record !== null && "id" in record && record.id === "local-provider");
  const profile = parseProviderProfile(raw);
  const unreadable = records.length > (profile ? 1 : 0);
  emit({ profile, unreadable, warning: unreadable ? "A saved provider record could not be read. It has been left untouched. Reload after storage recovery; do not replace it with a new profile." : "" });
}
export function initializeProvider(): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      database = await openLocalDatabase();
      database.onversionchange = () => { database?.close(); database = null; emit({ error: "Local storage changed in another tab. Reload before saving further changes." }); };
      await refresh();
      try { channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("servify-provider-changed") : null; } catch { /* Focus refresh and revision checks remain available. */ }
      const synchronize = () => { void refresh().catch(() => emit({ error: "Could not refresh your local profile. Keep your current answers open and reload before editing." })); };
      if (channel) channel.onmessage = synchronize;
      window.addEventListener("focus", synchronize);
      emit({ ready: true });
    } catch {
      database?.close(); database = null;
      emit({ ready: true, mode: "memory", warning: "Browser storage is unavailable or blocked by an older tab. Temporary changes stay in this tab only and are lost on reload. Existing saved profiles and customer drafts are untouched. Close older Servify tabs and reload to retry." });
    }
  })();
  return initialization;
}
export async function saveProviderProfile(profile: LocalProviderProfile, expectedRevision: number): Promise<LocalProviderProfile> {
  await initializeProvider();
  try {
    if (snapshot.unreadable) throw new Error("Unreadable profile must not be overwritten");
    const valid = parseProviderProfile({ ...profile, revision: expectedRevision + 1, updatedAt: new Date().toISOString() });
    if (!valid) throw new Error("Invalid provider profile");
    if (snapshot.mode === "memory") {
      if ((snapshot.profile?.revision ?? 0) !== expectedRevision) throw new ProviderConflictError();
    } else {
      if (!database) throw new Error("Storage closed");
      await new Promise<void>((resolve, reject) => {
        const tx = database!.transaction("providerProfiles", "readwrite");
        const store = tx.objectStore("providerProfiles");
        let failure: unknown;
        const timer = setTimeout(() => { failure = new Error("Save timed out"); try { tx.abort(); } catch {} }, storageTimeoutMs);
        const request = store.get(valid.id);
        request.onsuccess = () => {
          const old = request.result === undefined ? null : parseProviderProfile(request.result);
          if ((old?.revision ?? 0) !== expectedRevision || (request.result !== undefined && !old)) { failure = new ProviderConflictError(); tx.abort(); return; }
          try { store.put({ ...valid, createdAt: old?.createdAt ?? valid.createdAt }); } catch (error) { failure = error; tx.abort(); }
        };
        tx.oncomplete = () => { clearTimeout(timer); resolve(); };
        tx.onerror = tx.onabort = () => { clearTimeout(timer); reject(failure ?? tx.error ?? new Error("Save interrupted")); };
      });
    }
    emit({ profile: valid, error: "" });
    try { channel?.postMessage("refresh"); } catch { /* A successful local commit stays successful. */ }
    return valid;
  } catch (error) {
    emit({ error: error instanceof ProviderConflictError ? error.message : "Your profile could not be saved. Keep this editor open; your current answers are still here. Check device storage, then try Save & exit again." });
    throw error;
  }
}
