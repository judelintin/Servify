import type { DraftPhoto } from "@/features/customer/draft-model";
import { isDraftId } from "@/features/customer/draft-model";
import { providerAreas, providerCategories, specializations } from "./config";
export type ProviderPhoto = DraftPhoto;
export interface ProviderContent {
  type: "" | "individual" | "business";
  name: string;
  photo: ProviderPhoto | null;
  categories: string[];
  specializations: string[];
  experience: string;
  areas: string[];
  bio: string;
  portfolio: ProviderPhoto[];
}
/** One editable local profile per browser origin. Not an authenticated ProviderProfile. */
export interface LocalProviderProfile {
  id: "local-provider"; schemaVersion: 1; revision: number;
  createdAt: string; updatedAt: string; lastStep: number; reviewed: boolean; content: ProviderContent;
}
export const emptyProvider = (): ProviderContent => ({ type: "", name: "", photo: null, categories: [], specializations: [], experience: "", areas: [], bio: "", portfolio: [] });
export type ProviderErrors = Partial<Record<keyof ProviderContent, string>>;
export function validateProviderStep(c: ProviderContent, step: number): ProviderErrors {
  const errors: ProviderErrors = {};
  if (step === 0) {
    if (!["individual", "business"].includes(c.type)) errors.type = "Choose an individual or small-business profile.";
    if (c.name.trim().length < 2 || c.name.trim().length > 100) errors.name = "Use a professional or business name between 2 and 100 characters.";
  }
  if (step === 1) {
    if (!c.categories.length || c.categories.some(slug => !providerCategories.some(item => item.slug === slug))) errors.categories = "Choose at least one service category.";
    if (!/^\d{1,2}$/.test(c.experience) || Number(c.experience) > 60) errors.experience = "Enter whole years of experience from 0 to 60.";
    if (c.specializations.some(value => !c.categories.some(slug => specializations[slug]?.includes(value)))) errors.specializations = "Choose specializations from your selected services.";
  }
  if (step === 2 && (!c.areas.length || c.areas.some(slug => !providerAreas.some(item => item.slug === slug)))) errors.areas = "Choose at least one general service area in Ibadan.";
  if (step === 3 && (c.bio.trim().length < 30 || c.bio.trim().length > 1200)) errors.bio = "Introduce your work in 30 to 1,200 characters. Leave out private contact details.";
  return errors;
}
export function nextProviderStep(content: ProviderContent): 0 | 1 | 2 | 3 | 5 { return ([0, 1, 2, 3] as const).find(step => Object.keys(validateProviderStep(content, step)).length) ?? 5; }
export function providerCompleteness(c: ProviderContent) {
  const items = [
    { label: "Professional details", step: 0, done: !Object.keys(validateProviderStep(c, 0)).length },
    { label: "Services & experience", step: 1, done: !Object.keys(validateProviderStep(c, 1)).length },
    { label: "Service coverage", step: 2, done: !Object.keys(validateProviderStep(c, 2)).length },
    { label: "Professional introduction", step: 3, done: !Object.keys(validateProviderStep(c, 3)).length },
    { label: "Profile photo (optional)", step: 0, done: !!c.photo },
    { label: "Work samples (optional)", step: 4, done: c.portfolio.length > 0 },
  ];
  return { items, percent: Math.round(items.filter(item => item.done).length / items.length * 100) };
}
export const providerSignature = (content: ProviderContent, step: number) => JSON.stringify({ ...content, photo: content.photo && { id: content.photo.id, alt: content.photo.alt }, portfolio: content.portfolio.map(({ id, alt }) => ({ id, alt })), step });
function validPhoto(p: unknown): p is ProviderPhoto {
  if (!p || typeof p !== "object") return false;
  const v = p as ProviderPhoto;
  return typeof v.id === "string" && isDraftId(v.id) && typeof v.alt === "string" && v.alt.length <= 300 && v.blob instanceof Blob && v.blob.type === "image/jpeg" && v.blob.size > 0 && v.blob.size <= 1024 * 1024;
}
export function parseProviderProfile(value: unknown): LocalProviderProfile | null {
  if (!value || typeof value !== "object") return null;
  const p = value as LocalProviderProfile, c = p.content;
  if (p.id !== "local-provider" || p.schemaVersion !== 1 || !Number.isInteger(p.revision) || p.revision < 1 || !Number.isInteger(p.lastStep) || p.lastStep < 0 || p.lastStep > 5 || typeof p.reviewed !== "boolean" || !c) return null;
  if ([p.createdAt, p.updatedAt].some(date => typeof date !== "string" || !Number.isFinite(Date.parse(date)))) return null;
  if (!["", "individual", "business"].includes(c.type) || typeof c.name !== "string" || c.name.length > 100 || typeof c.experience !== "string" || c.experience.length > 2 || typeof c.bio !== "string" || c.bio.length > 1200) return null;
  if ([c.categories, c.areas, c.specializations].some(list => !Array.isArray(list) || list.length > 30 || list.some(item => typeof item !== "string" || item.length > 100) || new Set(list).size !== list.length)) return null;
  if ((c.photo !== null && !validPhoto(c.photo)) || !Array.isArray(c.portfolio) || c.portfolio.length > 8 || c.portfolio.some(photo => !validPhoto(photo))) return null;
  const photos = [...(c.photo ? [c.photo] : []), ...c.portfolio];
  if (new Set(photos.map(photo => photo.id)).size !== photos.length || (p.reviewed && nextProviderStep(c) !== 5)) return null;
  // Whitelist the local contract; do not carry arbitrary persisted fields into writes.
  return { id: "local-provider", schemaVersion: 1, revision: p.revision, createdAt: p.createdAt, updatedAt: p.updatedAt, lastStep: p.lastStep, reviewed: p.reviewed, content: { type: c.type, name: c.name, photo: c.photo && { id: c.photo.id, blob: c.photo.blob, alt: c.photo.alt }, categories: [...c.categories], areas: [...c.areas], specializations: [...c.specializations], experience: c.experience, bio: c.bio, portfolio: c.portfolio.map(({ id, blob, alt }) => ({ id, blob, alt })) } };
}
