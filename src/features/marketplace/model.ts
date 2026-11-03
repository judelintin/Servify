import {emptyOperations,parseOperations,type Operations} from "@/features/operations/model";
import { emptyTrust, parseTrust, type Trust } from "@/features/trust/model";
import { firstIncompleteStep, isDraftId, nairaToKobo, parseLocalDraft, type LocalDraft } from "@/features/customer/draft-model";
import { nextProviderStep, parseProviderProfile, type LocalProviderProfile } from "@/features/provider/profile-model";
import { createDelivery, parseDeliveries, type JobDelivery } from "@/features/delivery/model";

export type PreviewJobStatus = "preview_published" | "provider_selected";
export type OfferStatus = "draft" | "submitted" | "withdrawn" | "selected" | "unavailable";
export interface PreviewJob { id: string; revision: number; sourceDraftId: string; sourceRevision: number; publishedAt: string; status: PreviewJobStatus; selectedOfferId: string | null; request: LocalDraft }
export interface PreviewProvider { id: string; createdAt: string; profile: LocalProviderProfile }
export interface OfferContent { price: string; priceType: "estimate" | "fixed"; scope: string; availability: string; conditions: string }
export interface PreviewOffer { id: string; jobId: string; providerId: string; revision: number; status: OfferStatus; createdAt: string; updatedAt: string; submittedAt: string | null; content: OfferContent }
export interface PreviewSelection { id: string; jobId: string; offerId: string; providerId: string; selectedAt: string }
export interface Marketplace { id: "local-marketplace"; schemaVersion: 4; revision: number; jobs: PreviewJob[]; providers: PreviewProvider[]; offers: PreviewOffer[]; selections: PreviewSelection[]; activeProviderId: string | null; deliveries: JobDelivery[]; trust: Trust; operations: Operations }
export const emptyMarketplace = (): Marketplace => ({ id: "local-marketplace", schemaVersion: 4, revision: 0, jobs: [], providers: [], offers: [], selections: [], activeProviderId: null, deliveries: [], trust: emptyTrust(), operations: emptyOperations() });
export const emptyOffer = (): OfferContent => ({ price: "", priceType: "estimate", scope: "", availability: "", conditions: "" });
export type OfferErrors = Partial<Record<keyof OfferContent, string>>;
export function validateOffer(c: OfferContent): OfferErrors {
  const errors: OfferErrors = {};
  if (nairaToKobo(c.price) === null) errors.price = "Enter a positive NGN amount up to 100,000,000, with at most 2 decimal places.";
  if (!["estimate", "fixed"].includes(c.priceType)) errors.priceType = "Choose a fixed price or estimate.";
  if (c.scope.trim().length < 20 || c.scope.trim().length > 3000) errors.scope = "Describe the work in 20 to 3,000 characters.";
  if (c.availability.trim().length < 3 || c.availability.trim().length > 200) errors.availability = "Add availability or a timeframe in 3 to 200 characters.";
  if (c.conditions.length > 1200) errors.conditions = "Keep conditions within 1,200 characters.";
  return errors;
}
export const activeOffer = (offer: PreviewOffer) => offer.status === "draft" || offer.status === "submitted";
export const jobStatusLabel = (status: PreviewJobStatus) => status === "preview_published" ? "Preview published" : "Provider selected · preview";
export const offerStatusLabel = (status: OfferStatus) => ({ draft: "Draft offer", submitted: "Submitted · preview", withdrawn: "Withdrawn", selected: "Selected · preview", unavailable: "Unavailable" })[status];
export const formatNaira = (price: string) => { const amount = nairaToKobo(price); return amount === null ? "Amount not set" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(amount / 100); };
export const matchesProvider = (job: PreviewJob, provider?: PreviewProvider) => !!provider && provider.profile.content.categories.includes(job.request.content.category) && provider.profile.content.areas.includes(job.request.content.area);
export const nairaToKoboForSort = (job: PreviewJob, sort: string) => { const amount = job.request.content.budgetMode === "range" ? nairaToKobo(job.request.content.budgetMin) : null; return amount === null ? Number.MAX_SAFE_INTEGER : sort === "budget-high" ? -amount : amount; };
const date = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
const positiveRevision = (value: unknown) => Number.isInteger(value) && Number(value) > 0;
function offerContent(value: unknown): value is OfferContent {
  if (!value || typeof value !== "object") return false;
  const c = value as OfferContent;
  return typeof c.price === "string" && c.price.length <= 12 && ["estimate", "fixed"].includes(c.priceType) && typeof c.scope === "string" && c.scope.length <= 3000 && typeof c.availability === "string" && c.availability.length <= 200 && typeof c.conditions === "string" && c.conditions.length <= 1200;
}
/** Validate the complete relationship graph; unknown/future records never become editable state. */
export function parseMarketplace(value: unknown): Marketplace | null {
  if (!value || typeof value !== "object") return null;
  const m = value as Omit<Marketplace, "schemaVersion"> & { schemaVersion: number };
  if (m.id !== "local-marketplace" || ![1, 2, 3, 4].includes(m.schemaVersion) || !Number.isInteger(m.revision) || m.revision < 0 || !Array.isArray(m.jobs) || m.jobs.length > 50 || !Array.isArray(m.providers) || m.providers.length > 10 || !Array.isArray(m.offers) || m.offers.length > 200 || !Array.isArray(m.selections) || m.selections.length > 50) return null;
  const jobs: PreviewJob[] = [], providers: PreviewProvider[] = [], offers: PreviewOffer[] = [], selections: PreviewSelection[] = [];
  for (const job of m.jobs) {
    if (!job || !isDraftId(job.id) || job.sourceDraftId !== job.id || !positiveRevision(job.revision) || !positiveRevision(job.sourceRevision) || !date(job.publishedAt) || !["preview_published", "provider_selected"].includes(job.status)) return null;
    const request = parseLocalDraft(job.request);
    // A valid published date may pass; historical records must remain readable.
    const content = request?.content;
    if (content?.timing === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(content.preferredDate) || !Number.isFinite(Date.parse(content.preferredDate)) || new Date(`${content.preferredDate}T12:00:00Z`).toISOString().slice(0, 10) !== content.preferredDate)) return null;
    if (!request || request.id !== job.id || request.revision !== job.sourceRevision || firstIncompleteStep({ ...request.content, timing: request.content.timing === "date" ? "flexible" : request.content.timing }) !== 6 || (job.selectedOfferId !== null && !isDraftId(job.selectedOfferId))) return null;
    jobs.push({ id: job.id, revision: job.revision, sourceDraftId: job.sourceDraftId, sourceRevision: job.sourceRevision, publishedAt: job.publishedAt, status: job.status, selectedOfferId: job.selectedOfferId, request });
  }
  for (const provider of m.providers) {
    if (!provider || !isDraftId(provider.id) || !date(provider.createdAt)) return null;
    const profile = parseProviderProfile(provider.profile);
    if (!profile || nextProviderStep(profile.content) !== 5) return null;
    providers.push({ id: provider.id, createdAt: provider.createdAt, profile });
  }
  for (const offer of m.offers) {
    if (!offer || !isDraftId(offer.id) || !jobs.some(job => job.id === offer.jobId) || !providers.some(provider => provider.id === offer.providerId) || !positiveRevision(offer.revision) || !date(offer.createdAt) || !date(offer.updatedAt) || !["draft", "submitted", "withdrawn", "selected", "unavailable"].includes(offer.status) || !offerContent(offer.content)) return null;
    if ((offer.submittedAt !== null && !date(offer.submittedAt)) || (["submitted", "selected"].includes(offer.status) && (offer.submittedAt === null || Object.keys(validateOffer(offer.content)).length))) return null;
    offers.push({ id: offer.id, jobId: offer.jobId, providerId: offer.providerId, revision: offer.revision, status: offer.status, createdAt: offer.createdAt, updatedAt: offer.updatedAt, submittedAt: offer.submittedAt, content: { price: offer.content.price, priceType: offer.content.priceType, scope: offer.content.scope, availability: offer.content.availability, conditions: offer.content.conditions } });
  }
  for (const selection of m.selections) {
    if (!selection || !isDraftId(selection.id) || !date(selection.selectedAt)) return null;
    const job = jobs.find(job => job.id === selection.jobId), offer = offers.find(offer => offer.id === selection.offerId);
    if (!job || !offer || job.selectedOfferId !== offer.id || offer.jobId !== job.id || offer.providerId !== selection.providerId || offer.status !== "selected") return null;
    selections.push({ id: selection.id, jobId: selection.jobId, offerId: selection.offerId, providerId: selection.providerId, selectedAt: selection.selectedAt });
  }
  if ([jobs, providers, offers, selections].some(records => new Set(records.map(record => record.id)).size !== records.length) || new Set(selections.map(selection => selection.jobId)).size !== selections.length) return null;
  const active = offers.filter(activeOffer);
  if (new Set(active.map(offer => `${offer.jobId}:${offer.providerId}`)).size !== active.length) return null;
  for (const job of jobs) {
    const selected = offers.filter(offer => offer.jobId === job.id && offer.status === "selected");
    if (job.status === "provider_selected" ? selected.length !== 1 || selected[0]?.id !== job.selectedOfferId || !selections.some(selection => selection.jobId === job.id) || active.some(offer => offer.jobId === job.id) : selected.length !== 0 || job.selectedOfferId !== null || selections.some(selection => selection.jobId === job.id)) return null;
  }
  if (m.activeProviderId !== null && !providers.some(provider => provider.id === m.activeProviderId)) return null;
  // Legacy selections imply only selection, never provider acceptance. Read-time
  // adaptation is non-destructive; persistence happens on the next explicit change.
  const deliveries = parseDeliveries(m.schemaVersion === 1 ? selections.map(createDelivery) : m.deliveries, selections);
  if (!deliveries) return null;
  const result: Marketplace = { id: "local-marketplace", schemaVersion: 4, revision: m.revision, jobs, providers, offers, selections, activeProviderId: m.activeProviderId, deliveries, trust: emptyTrust(), operations: emptyOperations() };
  const trust = parseTrust(m.schemaVersion < 3 ? emptyTrust() : m.trust, result); if (!trust) return null; result.trust = trust; const operations=parseOperations(m.schemaVersion<4?emptyOperations():m.operations,result);if(!operations)return null;result.operations=operations;return result;
}
