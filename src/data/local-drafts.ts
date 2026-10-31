import { parseLocalDraft, type LocalDraft } from "@/features/customer/draft-model";

export class DraftConflictError extends Error { constructor() { super("This draft changed or was deleted in another tab. Your edits have not overwritten it. Save a separate copy or reload the latest version."); this.name = "DraftConflictError"; } }
export class DraftCapacityError extends Error { constructor() { super("You have 25 local drafts. Delete an old draft before starting another."); this.name = "DraftCapacityError"; } }
type Snapshot = { ready: boolean; mode: "browser" | "memory"; drafts: LocalDraft[]; warning: string; error: string };
const serverSnapshot: Snapshot = { ready: false, mode: "browser", drafts: [], warning: "", error: "" };
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();
let database: IDBDatabase | null = null;
let initialization: Promise<void> | undefined;
let channel: BroadcastChannel | null = null;
const storageTimeoutMs = 4000;
function emit(patch: Partial<Snapshot>) { snapshot = { ...snapshot, ...patch }; listeners.forEach((listener) => listener()); }
export const getDraftSnapshot = () => snapshot;
export const getServerDraftSnapshot = () => serverSnapshot;
export function subscribeDrafts(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
const storageError = (error: unknown) => error instanceof DraftConflictError || error instanceof DraftCapacityError ? error.message : "Your changes could not be saved. Device storage may be full or unavailable. Keep this page open and try again; your current answers are still here.";

async function refresh() {
  if (!database) return;
  const records = await new Promise<unknown[]>((resolve, reject) => {
    const transaction = database!.transaction("drafts", "readonly");
    const request = transaction.objectStore("drafts").getAll();
    // Opening can succeed while this read queues behind a stalled transaction.
    // Bound the read too, so every subscriber can leave its loading state.
    const timer = setTimeout(() => {
      reject(new Error("Draft read timed out"));
      try { transaction.abort(); } catch { /* The transaction may already have finished. */ }
    }, storageTimeoutMs);
    transaction.oncomplete = () => { clearTimeout(timer); resolve(request.result as unknown[]); };
    transaction.onerror = () => { clearTimeout(timer); reject(transaction.error); };
    transaction.onabort = () => { clearTimeout(timer); reject(transaction.error); };
  });
  const drafts = records.map(parseLocalDraft).filter((draft): draft is LocalDraft => draft !== null).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  emit({ drafts, warning: records.length !== drafts.length ? "Some saved drafts could not be read. Those records have been left untouched." : "" });
}
export function initializeDrafts(): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      database = await new Promise<IDBDatabase>((resolve, reject) => {
        if (!globalThis.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
        const request = indexedDB.open("servify-local-drafts", 1);
        let abandoned = false;
        const timer = setTimeout(() => { abandoned = true; reject(new Error("Storage timed out")); }, storageTimeoutMs);
        request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("drafts")) request.result.createObjectStore("drafts", { keyPath: "id" }); };
        request.onsuccess = () => { clearTimeout(timer); if (abandoned) request.result.close(); else resolve(request.result); };
        request.onerror = () => { clearTimeout(timer); reject(request.error); };
        request.onblocked = () => { abandoned = true; clearTimeout(timer); reject(new Error("Storage blocked")); };
      });
      database.onversionchange = () => { database?.close(); database = null; emit({ error: "Draft storage changed in another tab. Reload this page before making further changes." }); };
      await refresh();
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("servify-drafts-changed");
        channel.onmessage = () => { void refresh().catch(() => emit({ error: "Could not refresh drafts from another tab. Reload before editing." })); };
      }
      window.addEventListener("focus", () => { void refresh().catch(() => emit({ error: "Could not refresh local drafts. Keep your current edits open." })); });
      emit({ ready: true, mode: "browser" });
    } catch {
      database?.close(); database = null;
      emit({ ready: true, mode: "memory", warning: "Browser storage is unavailable. Temporary mode keeps drafts in this tab only. Reloading or closing it will lose them. Existing saved drafts are left untouched; reload when storage is available to access them. Nothing is sent to providers." });
    }
  })();
  return initialization;
}

export async function writeLocalDraft(draft: LocalDraft, expectedRevision: number): Promise<LocalDraft> {
  await initializeDrafts();
  try {
    const candidate = { ...draft, revision: expectedRevision + 1, updatedAt: new Date().toISOString() };
    const valid = parseLocalDraft(candidate);
    if (!valid) throw new Error("Invalid draft record");
    if (snapshot.mode === "memory") {
      const existing = snapshot.drafts.find((item) => item.id === draft.id);
      if ((existing?.revision ?? 0) !== expectedRevision) throw new DraftConflictError();
      if (!existing && snapshot.drafts.length >= 25) throw new DraftCapacityError();
      emit({ drafts: [valid, ...snapshot.drafts.filter((item) => item.id !== draft.id)], error: "" });
      return valid;
    }
    if (!database) throw new Error("Storage closed");
    await new Promise<void>((resolve, reject) => {
      const transaction = database!.transaction("drafts", "readwrite");
      const store = transaction.objectStore("drafts");
      let conflict = false; let failure: unknown;
      const request = store.get(draft.id);
      request.onsuccess = () => {
        const old = request.result === undefined ? null : parseLocalDraft(request.result);
        if ((old?.revision ?? 0) !== expectedRevision || (request.result !== undefined && !old)) { conflict = true; transaction.abort(); return; }
        const count = store.count();
        count.onsuccess = () => {
          if (!old && count.result >= 25) { failure = new DraftCapacityError(); transaction.abort(); return; }
          try { store.put({ ...valid, createdAt: old?.createdAt ?? valid.createdAt }); }
          catch (error) { failure = error; transaction.abort(); }
        };
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(conflict ? new DraftConflictError() : failure ?? transaction.error ?? new Error("Save interrupted"));
    });
    // Commit succeeded: update the local snapshot even if a subsequent refresh fails.
    emit({ drafts: [valid, ...snapshot.drafts.filter((item) => item.id !== valid.id)], error: "" });
    channel?.postMessage("refresh");
    return valid;
  } catch (error) { emit({ error: storageError(error) }); throw error; }
}

export async function deleteLocalDraft(id: string, expectedRevision: number): Promise<void> {
  await initializeDrafts();
  try {
    if (snapshot.mode === "memory") {
      if (snapshot.drafts.find((draft) => draft.id === id)?.revision !== expectedRevision) throw new DraftConflictError();
    } else {
      if (!database) throw new Error("Storage closed");
      await new Promise<void>((resolve, reject) => {
        const transaction = database!.transaction("drafts", "readwrite");
        const store = transaction.objectStore("drafts"); let conflict = false;
        const request = store.get(id);
        request.onsuccess = () => { if (parseLocalDraft(request.result)?.revision !== expectedRevision) { conflict = true; transaction.abort(); } else store.delete(id); };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(conflict ? new DraftConflictError() : transaction.error);
      });
    }
    emit({ drafts: snapshot.drafts.filter((draft) => draft.id !== id), error: "" });
    channel?.postMessage("refresh");
  } catch (error) { emit({ error: storageError(error) }); throw error; }
}
