import type { Marketplace } from "@/features/marketplace/model";
import { isDraftId } from "@/features/customer/draft-model";
export type TrustActor = { role: "customer" | "provider" | "admin"; id: string };
export interface Version { text: string; rating: number; at: string }
export interface Review { id: string; jobId: string; providerId: string; customerId: string; revision: number; hidden: boolean; versions: Version[]; response: { hidden: boolean; versions: Version[] } | null }
export interface Report { id: string; reviewId: string; target: "review" | "response"; actor: TrustActor; reason: string; explanation: string; at: string; status: "pending" | "reviewed" | "dismissed" }
export interface Audit { id: string; reportId: string; action: "reviewed" | "dismissed" | "hide" | "restore"; note: string; at: string; actor: TrustActor }
export interface Trust { reviews: Review[]; reports: Report[]; audit: Audit[] }
export const emptyTrust = (): Trust => ({ reviews: [], reports: [], audit: [] });
export const reasons = ["Abuse or harassment", "Personal information", "Misleading or irrelevant", "Spam", "Other"];
export const eligible = (m: Marketplace, jobId: string) => m.deliveries.find(d => d.jobId === jobId && d.status === "completed" && d.history.at(-1)?.kind === "complete" && d.history.at(-1)?.actor.role === "customer");
export function reputation(m: Marketplace, providerId: string) { const reviews = m.trust.reviews.filter(r => r.providerId === providerId && !r.hidden && eligible(m, r.jobId)); return { reviews, average: reviews.length ? (reviews.reduce((n,r) => n + r.versions.at(-1)!.rating,0) / reviews.length).toFixed(1) : null }; }
export function parseTrust(v: unknown, m: Marketplace): Trust | null {
 const t = v as Trust; if (!t || !Array.isArray(t.reviews) || !Array.isArray(t.reports) || !Array.isArray(t.audit) || t.reviews.length > 50 || t.reports.length > 500 || t.audit.length > 1000) return null;
 const date = (s: string) => typeof s === "string" && Number.isFinite(Date.parse(s));
 const actor = (a: TrustActor) => a && (a.role === "customer" ? a.id === "local-customer" : a.role === "admin" ? a.id === "local-admin" : a.role === "provider" && m.providers.some(p => p.id === a.id));
 const versions = (a: Version[], response = false) => Array.isArray(a) && a.length > 0 && a.length <= 30 && a.every(x => x && typeof x.text === "string" && x.text.length <= 2000 && (!response || x.text.trim().length >= 3) && Number.isInteger(x.rating) && (response ? x.rating === 0 : x.rating >= 1 && x.rating <= 5) && date(x.at));
 for (const r of t.reviews) { const d = eligible(m,r?.jobId); if (!r || !d || !isDraftId(r.id) || r.providerId !== d.providerId || r.customerId !== d.customerId || !Number.isSafeInteger(r.revision) || r.revision < 1 || typeof r.hidden !== "boolean" || !versions(r.versions) || (r.response !== null && (!r.response || typeof r.response.hidden !== "boolean" || !versions(r.response.versions,true)))) return null; }
 if (new Set(t.reviews.map(r => r.jobId)).size !== t.reviews.length) return null;
 for (const r of t.reports) if (!r || !isDraftId(r.id) || !actor(r.actor) || r.actor.role === "admin" || !t.reviews.some(x => x.id === r.reviewId && (r.target === "review" || (r.target === "response" && x.response))) || !reasons.includes(r.reason) || typeof r.explanation !== "string" || r.explanation.length > 1000 || !date(r.at) || !["pending","reviewed","dismissed"].includes(r.status)) return null;
 const pending = t.reports.filter(r => r.status === "pending"); if (new Set(pending.map(r => `${r.reviewId}:${r.target}:${r.actor.role}:${r.actor.id}`)).size !== pending.length) return null;
 for (const a of t.audit) if (!a || !isDraftId(a.id) || !t.reports.some(r => r.id === a.reportId) || !actor(a.actor) || a.actor.role !== "admin" || !["reviewed","dismissed","hide","restore"].includes(a.action) || typeof a.note !== "string" || a.note.trim().length < 3 || a.note.length > 1000 || !date(a.at)) return null;
 if ([t.reviews,t.reports,t.audit].some(a => new Set(a.map(x=>x.id)).size !== a.length)) return null;
 return structuredClone(t);
}
