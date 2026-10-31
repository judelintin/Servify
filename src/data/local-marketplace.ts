import { firstIncompleteStep, parseLocalDraft } from "@/features/customer/draft-model";
import { nextProviderStep, parseProviderProfile } from "@/features/provider/profile-model";
import { activeOffer, emptyMarketplace, parseMarketplace, validateOffer, type Marketplace, type OfferContent, type PreviewOffer } from "@/features/marketplace/model";
import { openLocalDatabase, readLocalRecords, storageTimeoutMs } from "./browser-storage";
import { getDraftSnapshot } from "./local-drafts";
import { getProviderSnapshot } from "./local-provider";
import { createDelivery } from "@/features/delivery/model";

export class MarketplaceError extends Error {}
type Snapshot = { ready: boolean; mode: "browser" | "memory"; data: Marketplace; error: string; warning: string; blocked: boolean };
const serverSnapshot: Snapshot = { ready: false, mode: "browser", data: emptyMarketplace(), error: "", warning: "", blocked: false };
let snapshot = serverSnapshot, database: IDBDatabase | null = null, channel: BroadcastChannel | null = null;
let initialization: Promise<void> | undefined;
const listeners = new Set<() => void>();
const emit = (patch: Partial<Snapshot>) => { snapshot = { ...snapshot, ...patch }; listeners.forEach(listener => listener()); };
export const getMarketplaceSnapshot = () => snapshot;
export const getServerMarketplaceSnapshot = () => serverSnapshot;
export function subscribeMarketplace(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
async function refresh() {
  if (!database) return;
  const records = await readLocalRecords(database, "marketplace");
  const data = records.length === 0 ? emptyMarketplace() : records.length === 1 ? parseMarketplace(records[0]) : null;
  if (!data) { emit({ blocked: true, warning: "A marketplace record could not be read. It has been left untouched. Reload after storage recovery; preview changes are blocked to protect it." }); return; }
  emit({ data, blocked: false, warning: "" });
}
export function initializeMarketplace(): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      database = await openLocalDatabase();
      database.onversionchange = () => { database?.close(); database = null; emit({ blocked: true, error: "Local storage changed in another tab. Reload before making preview changes." }); };
      await refresh();
      const synchronize = () => { void refresh().catch(() => emit({ error: "Could not refresh the marketplace. Keep current answers open and reload before changing records." })); };
      try { channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("servify-marketplace-changed") : null; } catch { /* Focus refresh and atomic checks remain available. */ }
      if (channel) channel.onmessage = synchronize;
      window.addEventListener("focus", synchronize); emit({ ready: true });
    } catch {
      database?.close(); database = null;
      emit({ ready: true, mode: "memory", warning: "Storage is unavailable or blocked. This marketplace is temporary in this tab; reload loses its changes. Existing saved data is untouched. Close older Servify tabs and reload to retry." });
    }
  })();
  return initialization;
}
type Source = { draftId?: string; provider?: boolean };
type Action<T> = (data: Marketplace, source: { draft: unknown; profile: unknown }) => T;
export async function mutateMarketplace<T>(action: Action<T>, source: Source = {}): Promise<T> {
  await initializeMarketplace();
  try {
    if (snapshot.blocked) throw new MarketplaceError("This preview is read-only until storage recovers. Your saved records have not been replaced.");
    let result!: T; let updated!: Marketplace;
    function apply(raw: unknown, draft: unknown, profile: unknown) {
      const current = raw === undefined ? emptyMarketplace() : parseMarketplace(raw);
      if (!current) throw new MarketplaceError("Saved marketplace data is unreadable. It has not been overwritten.");
      result = action(current, { draft, profile }); current.revision += 1;
      const valid = parseMarketplace(current);
      if (!valid) throw new MarketplaceError("This preview change failed validation. No records were changed.");
      updated = valid;
    }
    if (snapshot.mode === "memory") apply(structuredClone(snapshot.data), getDraftSnapshot().drafts.find(draft => draft.id === source.draftId), getProviderSnapshot().profile);
    else {
      if (!database) throw new MarketplaceError("Storage is closed. Reload before making changes.");
      await new Promise<void>((resolve, reject) => {
        const stores = ["marketplace", ...(source.draftId ? ["drafts"] : []), ...(source.provider ? ["providerProfiles"] : [])];
        const tx = database!.transaction(stores, "readwrite");
        const requests = [tx.objectStore("marketplace").get("local-marketplace"), ...(source.draftId ? [tx.objectStore("drafts").get(source.draftId)] : []), ...(source.provider ? [tx.objectStore("providerProfiles").get("local-provider")] : [])];
        let completed = 0, failure: unknown;
        const timer = setTimeout(() => { failure = new MarketplaceError("The preview save timed out. Keep your answers open and retry after storage recovers."); try { tx.abort(); } catch {} }, storageTimeoutMs);
        requests.forEach(request => { request.onsuccess = () => {
          if (++completed !== requests.length) return;
          try { apply(requests[0]!.result, source.draftId ? requests[1]!.result : undefined, source.provider ? requests.at(-1)!.result : undefined); tx.objectStore("marketplace").put(updated); }
          catch (error) { failure = error; tx.abort(); }
        }; });
        tx.oncomplete = () => { clearTimeout(timer); resolve(); };
        tx.onerror = tx.onabort = () => { clearTimeout(timer); reject(failure ?? tx.error ?? new Error("Save interrupted")); };
      });
    }
    emit({ data: updated, error: "" }); try { channel?.postMessage("refresh"); } catch { /* Commit remains successful. */ }
    return result;
  } catch (error) {
    const message = error instanceof MarketplaceError ? error.message : "The preview change could not be saved. Storage may be full or unavailable. Your current answers are still here; try again.";
    emit({ error: message }); throw new MarketplaceError(message);
  }
}
const mutate = mutateMarketplace;
export function publishPreviewJob(draftId: string, expectedRevision: number) {
  return mutate((data, source) => {
    const draft = parseLocalDraft(source.draft);
    if (!draft || draft.revision !== expectedRevision) throw new MarketplaceError("This draft changed or was deleted. Reload and review the latest version before publishing.");
    if (firstIncompleteStep(draft.content) !== 6) throw new MarketplaceError("Complete all required job details before publishing to preview.");
    if (data.jobs.some(job => job.id === draft.id)) throw new MarketplaceError("This request is already in the local preview. It was not published again.");
    if (data.jobs.length >= 50) throw new MarketplaceError("This browser has reached the 50 preview-request limit.");
    data.jobs.unshift({ id: draft.id, sourceDraftId: draft.id, sourceRevision: draft.revision, request: draft, revision: 1, status: "preview_published", selectedOfferId: null, publishedAt: new Date().toISOString() });
    return draft.id;
  }, { draftId });
}
export function addPreviewProvider(expectedRevision: number) {
  return mutate((data, source) => {
    const profile = parseProviderProfile(source.profile);
    if (!profile || profile.revision !== expectedRevision || nextProviderStep(profile.content) !== 5) throw new MarketplaceError("Complete and save your professional profile, then review it again before adding a preview provider.");
    if (data.providers.length >= 10) throw new MarketplaceError("This preview supports up to 10 user-created provider contexts.");
    const id = crypto.randomUUID(); data.providers.push({ id, createdAt: new Date().toISOString(), profile }); data.activeProviderId = id; return id;
  }, { provider: true });
}
export function changePreviewProvider(id: string) { return mutate(data => { if (!data.providers.some(provider => provider.id === id)) throw new MarketplaceError("This provider context is no longer available."); data.activeProviderId = id; }); }
export function savePreviewOffer(input: { id?: string; jobId: string; jobRevision: number; providerId: string; expectedRevision: number; content: OfferContent; submit: boolean }) {
  return mutate(data => {
    const job = data.jobs.find(job => job.id === input.jobId), provider = data.providers.find(provider => provider.id === input.providerId);
    if (!job || job.status !== "preview_published" || job.revision !== input.jobRevision) throw new MarketplaceError("This job changed or a provider was selected. Reload the latest request before changing an offer.");
    if (!provider) throw new MarketplaceError("Choose a valid preview provider context first.");
    const old = input.id ? data.offers.find(offer => offer.id === input.id) : undefined;
    if (input.id && (!old || old.revision !== input.expectedRevision || old.jobId !== job.id || old.providerId !== provider.id || !activeOffer(old))) throw new MarketplaceError("This offer changed or is no longer editable. Reload the latest offer; your answers have not overwritten it.");
    if (!input.id && (input.expectedRevision !== 0 || data.offers.some(offer => offer.jobId === job.id && offer.providerId === provider.id && activeOffer(offer)))) throw new MarketplaceError("This preview provider already has an active offer for this request. Open that offer to edit it.");
    if (!old && data.offers.length >= 200) throw new MarketplaceError("This browser has reached the 200-offer preview limit.");
    if (old?.status === "submitted" && !input.submit) throw new MarketplaceError("Review and submit updates to a submitted offer; it cannot silently become a draft.");
    if (input.submit && Object.keys(validateOffer(input.content)).length) throw new MarketplaceError("Complete the offer's price, scope and availability before submitting.");
    const now = new Date().toISOString();
    const offer: PreviewOffer = { id: old?.id ?? crypto.randomUUID(), jobId: job.id, providerId: provider.id, revision: (old?.revision ?? 0) + 1, status: input.submit ? "submitted" : "draft", createdAt: old?.createdAt ?? now, updatedAt: now, submittedAt: input.submit ? now : null, content: input.content };
    data.offers = [offer, ...data.offers.filter(item => item.id !== offer.id)]; return offer.id;
  });
}
export function withdrawPreviewOffer(id: string, expectedRevision: number) {
  return mutate(data => {
    const offer = data.offers.find(offer => offer.id === id), job = data.jobs.find(job => job.id === offer?.jobId);
    if (!offer || offer.revision !== expectedRevision || !activeOffer(offer) || job?.status !== "preview_published") throw new MarketplaceError("This offer changed or can no longer be withdrawn. Reload the latest preview state.");
    offer.status = "withdrawn"; offer.revision += 1; offer.updatedAt = new Date().toISOString();
  });
}
export function selectPreviewOffer(id: string, expectedOfferRevision: number, expectedJobRevision: number) {
  return mutate(data => {
    const offer = data.offers.find(offer => offer.id === id), job = data.jobs.find(job => job.id === offer?.jobId);
    if (!offer || !job || offer.status !== "submitted" || offer.revision !== expectedOfferRevision || job.revision !== expectedJobRevision || job.status !== "preview_published" || job.selectedOfferId !== null) throw new MarketplaceError("This offer changed, was withdrawn, or a provider has already been selected. Reload to review the current preview state.");
    const now = new Date().toISOString(); job.status = "provider_selected"; job.selectedOfferId = offer.id; job.revision += 1;
    for (const other of data.offers.filter(other => other.jobId === job.id && activeOffer(other))) { other.status = other.id === offer.id ? "selected" : "unavailable"; other.revision += 1; other.updatedAt = now; }
    const selection = { id: crypto.randomUUID(), jobId: job.id, offerId: offer.id, providerId: offer.providerId, selectedAt: now };
    data.selections.push(selection); data.deliveries.push(createDelivery(selection));
  });
}
