import { customerAreas, customerCategories } from "./config";

export interface DraftPhoto { id: string; blob: Blob; alt: string }
/** Browser-local form state. Deliberately separate from authenticated JobRequest. */
export interface DraftContent {
  category: string;
  title: string;
  description: string;
  photos: DraftPhoto[];
  area: string;
  timing: "" | "flexible" | "soon" | "date";
  preferredDate: string;
  budgetMode: "" | "quotes" | "range";
  budgetMin: string;
  budgetMax: string;
}
export interface LocalDraft {
  id: string; schemaVersion: 1; revision: number; createdAt: string; updatedAt: string;
  status: "draft"; lastStep: number; reviewed: boolean; content: DraftContent;
}
export type DraftErrors = Partial<Record<"category" | "title" | "description" | "photos" | "area" | "timing" | "preferredDate" | "budgetMode" | "budgetMin" | "budgetMax", string>>;
export const emptyContent = (): DraftContent => ({ category: "", title: "", description: "", photos: [], area: "", timing: "", preferredDate: "", budgetMode: "", budgetMin: "", budgetMax: "" });
export const isDraftId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function localToday(): string { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function nairaToKobo(value: string): number | null {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole = "0", fraction = ""] = value.trim().split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 100_000_000_00 ? amount : null;
}
export function validateStep(content: DraftContent, step: number): DraftErrors {
  const errors: DraftErrors = {};
  if (step === 0 && !customerCategories.some((item) => item.slug === content.category)) errors.category = "Choose the service that best matches your job.";
  if (step === 1) {
    if (content.title.trim().length < 10 || content.title.trim().length > 120) errors.title = "Give your request a clear title between 10 and 120 characters.";
    if (content.description.trim().length < 30 || content.description.trim().length > 5000) errors.description = "Add a little more detail: use between 30 and 5,000 characters.";
  }
  if (step === 2 && content.photos.length > 8) errors.photos = "Keep up to 8 photos for this request.";
  if (step === 3 && !customerAreas.some((item) => item.slug === content.area)) errors.area = "Select a general area in Ibadan. An exact address is not needed.";
  if (step === 4) {
    if (!content.timing) errors.timing = "Choose when you would like the work done.";
    if (content.timing === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(content.preferredDate) || Number.isNaN(Date.parse(content.preferredDate)) || new Date(`${content.preferredDate}T12:00:00Z`).toISOString().slice(0, 10) !== content.preferredDate || content.preferredDate < localToday())) errors.preferredDate = "Choose today or a future date.";
  }
  if (step === 5) {
    if (!content.budgetMode) errors.budgetMode = "Enter a budget range or choose ‘I need quotes’.";
    if (content.budgetMode === "range") {
      const min = nairaToKobo(content.budgetMin); const max = nairaToKobo(content.budgetMax);
      if (min === null) errors.budgetMin = "Enter a positive NGN amount up to 100,000,000, with at most 2 decimal places.";
      if (max === null) errors.budgetMax = "Enter a positive NGN amount up to 100,000,000, with at most 2 decimal places.";
      if (min !== null && max !== null && max < min) errors.budgetMax = "The maximum should be the same as or more than the minimum.";
    }
  }
  return errors;
}
export const firstIncompleteStep = (content: DraftContent) => [0, 1, 2, 3, 4, 5].find((step) => Object.keys(validateStep(content, step)).length) ?? 6;
export function contentSignature(content: DraftContent, step: number): string { return JSON.stringify({ ...content, photos: content.photos.map(({ id, alt }) => ({ id, alt })), step }); }
export function timingLabel(content: DraftContent): string {
  if (content.timing === "flexible") return "I’m flexible";
  if (content.timing === "soon") return "As soon as practical";
  if (content.timing === "date" && /^\d{4}-\d{2}-\d{2}$/.test(content.preferredDate) && Number.isFinite(Date.parse(content.preferredDate))) return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(`${content.preferredDate}T12:00:00Z`));
  return "Not selected";
}
export function budgetLabel(content: DraftContent): string {
  if (content.budgetMode === "quotes") return "I need quotes";
  const min = nairaToKobo(content.budgetMin); const max = nairaToKobo(content.budgetMax);
  const format = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: amount % 100 ? 2 : 0 }).format(amount / 100);
  return min !== null && max !== null && max >= min ? `${format(min)} – ${format(max)}` : "Not specified";
}

/** Structural validation for untrusted IndexedDB records; incomplete drafts are valid. */
export function parseLocalDraft(value: unknown): LocalDraft | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Partial<LocalDraft>; const c = d.content;
  if (d.schemaVersion !== 1 || d.status !== "draft" || typeof d.id !== "string" || !isDraftId(d.id) || !Number.isInteger(d.revision) || (d.revision ?? 0) < 1 || !Number.isInteger(d.lastStep) || (d.lastStep ?? -1) < 0 || (d.lastStep ?? 7) > 6 || typeof d.reviewed !== "boolean" || typeof d.createdAt !== "string" || !Number.isFinite(Date.parse(d.createdAt)) || typeof d.updatedAt !== "string" || !Number.isFinite(Date.parse(d.updatedAt)) || !c) return null;
  const strings: [keyof DraftContent, number][] = [["category", 80], ["title", 120], ["description", 5000], ["area", 80], ["preferredDate", 10], ["budgetMin", 32], ["budgetMax", 32]];
  if (strings.some(([key, max]) => typeof c[key] !== "string" || (c[key] as string).length > max) || !["", "flexible", "soon", "date"].includes(c.timing) || !["", "quotes", "range"].includes(c.budgetMode) || !Array.isArray(c.photos) || c.photos.length > 8) return null;
  if (c.photos.some((p) => !p || typeof p.id !== "string" || !isDraftId(p.id) || typeof p.alt !== "string" || p.alt.length > 300 || !(p.blob instanceof Blob) || p.blob.type !== "image/jpeg" || p.blob.size > 1024 * 1024 || p.blob.size === 0) || new Set(c.photos.map((p) => p.id)).size !== c.photos.length) return null;
  return { id: d.id, schemaVersion: 1, revision: d.revision!, createdAt: d.createdAt, updatedAt: d.updatedAt, status: "draft", lastStep: d.lastStep!, reviewed: d.reviewed, content: { category: c.category, title: c.title, description: c.description, photos: c.photos.map(({ id, blob, alt }) => ({ id, blob, alt })), area: c.area, timing: c.timing, preferredDate: c.preferredDate, budgetMode: c.budgetMode, budgetMin: c.budgetMin, budgetMax: c.budgetMax } };
}
