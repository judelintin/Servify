/** Additive local-only schema. Customer drafts and their record format are unchanged. */
export const localDatabaseName = "servify-local-drafts";
export const storageTimeoutMs = 4000;
export function openLocalDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
    const request = indexedDB.open(localDatabaseName, 2);
    let abandoned = false;
    const timer = setTimeout(() => { abandoned = true; reject(new Error("Storage timed out")); }, storageTimeoutMs);
    request.onupgradeneeded = () => {
      for (const store of ["drafts", "providerProfiles"]) if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store, { keyPath: "id" });
    };
    request.onsuccess = () => { clearTimeout(timer); if (abandoned) request.result.close(); else resolve(request.result); };
    request.onerror = () => { clearTimeout(timer); reject(request.error); };
    request.onblocked = () => { abandoned = true; clearTimeout(timer); reject(new Error("Close older Servify tabs and reload to update local storage.")); };
  });
}
export function readLocalRecords(database: IDBDatabase, store: "drafts" | "providerProfiles"): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, "readonly");
    const request = transaction.objectStore(store).getAll();
    const timer = setTimeout(() => { reject(new Error("Storage read timed out")); try { transaction.abort(); } catch {} }, storageTimeoutMs);
    transaction.oncomplete = () => { clearTimeout(timer); resolve(request.result as unknown[]); };
    transaction.onerror = transaction.onabort = () => { clearTimeout(timer); reject(transaction.error); };
  });
}
