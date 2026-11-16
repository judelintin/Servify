import { today as localToday } from "./requests";
export const isDraftId=(v:unknown):v is string=>typeof v==="string"&&/^[a-z0-9-]{8,80}$/.test(v);
interface PreviewSelection {id:string;jobId:string;offerId:string;providerId:string;selectedAt:string}
interface Marketplace {activeProviderId:string|null}

export const customerPreviewId = "local-customer";
export type PreviewActor = { role: "customer"; id: typeof customerPreviewId } | { role: "provider"; id: string };
export const deliveryLabels = { awaiting_confirmation: "Awaiting provider confirmation", confirmed: "Confirmed", scheduled: "Scheduled", in_progress: "In progress", completion_requested: "Completion requested", completed: "Completed", issue_reported: "Issue reported", cancelled: "Cancelled" } as const;
export type DeliveryStatus = keyof typeof deliveryLabels;
export type JobAction = "confirm" | "decline" | "cancel" | "start" | "request_completion" | "complete";
export const issueCategories = { quality: "Work quality", scope: "Unfinished or different work", timing: "Timing or attendance", other: "Other unresolved issue" } as const;
export interface ScheduleInput { date: string; startTime: string; endTime: string; notes?: string }
export interface ScheduleProposal extends ScheduleInput { id: string; proposedBy: PreviewActor; createdAt: string; status: "pending" | "confirmed" | "superseded" | "withdrawn"; resolvedAt: string | null }
export interface JobIssue { id: string; category: keyof typeof issueCategories; description: string; createdAt: string; actor: PreviewActor }
export type HistoryKind = "selected" | JobAction | "schedule_proposed" | "schedule_confirmed" | "schedule_withdrawn" | "issue_reported";
export interface DeliveryEvent { id: string; at: string; actor: PreviewActor; kind: HistoryKind; from: DeliveryStatus | null; to: DeliveryStatus; note: string; scheduleId: string | null; issueId: string | null }
export interface JobMessage { id: string; sequence: number; actor: PreviewActor; text: string; createdAt: string }
export interface JobDelivery { id: string; jobId: string; offerId: string; providerId: string; customerId: typeof customerPreviewId; revision: number; status: DeliveryStatus; history: DeliveryEvent[]; schedules: ScheduleProposal[]; confirmedScheduleId: string | null; issues: JobIssue[]; messages: JobMessage[]; read: { customer: number; provider: number } }
export const isOpenDelivery = (d: JobDelivery) => !["completed", "cancelled", "issue_reported"].includes(d.status);
export const canSchedule = (d: JobDelivery) => ["confirmed", "scheduled"].includes(d.status);
export const canReportIssue = (d: Pick<JobDelivery, "status">) => ["confirmed", "scheduled", "in_progress", "completion_requested"].includes(d.status);
export const validTimestamp = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));
const status = (v: unknown): v is DeliveryStatus => typeof v === "string" && Object.hasOwn(deliveryLabels, v);
export function createDelivery(selection: PreviewSelection): JobDelivery {
  return { id: selection.jobId, jobId: selection.jobId, offerId: selection.offerId, providerId: selection.providerId, customerId: customerPreviewId, revision: 1, status: "awaiting_confirmation", history: [{ id: selection.id, at: selection.selectedAt, actor: { role: "customer", id: customerPreviewId }, kind: "selected", from: null, to: "awaiting_confirmation", note: "Provider selected in preview. Provider acceptance is still required.", scheduleId: null, issueId: null }], schedules: [], confirmedScheduleId: null, issues: [], messages: [], read: { customer: 0, provider: 0 } };
}
export function nextStatus(from: DeliveryStatus, action: JobAction, role: PreviewActor["role"]): DeliveryStatus | null {
  if (action === "confirm" && role === "provider" && from === "awaiting_confirmation") return "confirmed";
  if (action === "decline" && role === "provider" && from === "awaiting_confirmation") return "cancelled";
  if (action === "cancel" && ["awaiting_confirmation", "confirmed", "scheduled"].includes(from) && (role === "customer" || from !== "awaiting_confirmation")) return "cancelled";
  if (action === "start" && role === "provider" && ["confirmed", "scheduled"].includes(from)) return "in_progress";
  if (action === "request_completion" && role === "provider" && from === "in_progress") return "completion_requested";
  if (action === "complete" && role === "customer" && from === "completion_requested") return "completed";
  return null;
}
export function validSchedule(value: ScheduleInput, future = true): boolean {
  if (value.notes!==undefined&&(typeof value.notes!=="string"||value.notes.length>1000))return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.endTime) || value.startTime >= value.endTime) return false;
  const date = new Date(`${value.date}T12:00:00Z`), starts = Date.parse(`${value.date}T${value.startTime}:00+01:00`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.date && (!future || (value.date >= localToday() && starts > Date.now()));
}
export const scheduleLabel = (s: ScheduleInput) => `${new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(`${s.date}T12:00:00Z`))}, ${s.startTime}–${s.endTime} (Ibadan / WAT)`;
export const messageError = (text: string) => !text.trim() ? "Write a message before sending." : text.length > 2000 ? "Keep your message within 2,000 characters." : "";
export const unreadCount = (d: JobDelivery, role: PreviewActor["role"]) => d.messages.filter(m => m.actor.role !== role && m.sequence > d.read[role]).length;
export function actorFor(data: Marketplace, role: PreviewActor["role"]): PreviewActor | null { return role === "customer" ? { role, id: customerPreviewId } : data.activeProviderId ? { role, id: data.activeProviderId } : null; }
export const belongsTo = (d: JobDelivery, actor: PreviewActor) => actor.role === "customer" ? actor.id === d.customerId : actor.id === d.providerId;
export function parseDeliveries(value: unknown, selections: PreviewSelection[]): JobDelivery[] | null {
  if (!Array.isArray(value) || value.length !== selections.length || value.length > 50) return null;
  const parsed: JobDelivery[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const d = raw as JobDelivery, selection = selections.find(s => s.jobId === d.jobId);
    if (!selection || d.id !== d.jobId || d.offerId !== selection.offerId || d.providerId !== selection.providerId || d.customerId !== customerPreviewId || !Number.isSafeInteger(d.revision) || d.revision < 1 || !status(d.status)) return null;
    const actor = (a: PreviewActor): boolean => !!a && (a.role === "customer" ? a.id === d.customerId : a.role === "provider" && a.id === d.providerId);
    if (!Array.isArray(d.history) || !d.history.length || d.history.length > 150 || !Array.isArray(d.schedules) || d.schedules.length > 30 || !Array.isArray(d.issues) || d.issues.length > 20 || !Array.isArray(d.messages) || d.messages.length > 500 || !d.read || [d.read.customer, d.read.provider].some(n => !Number.isSafeInteger(n) || n < 0 || n > d.messages.length)) return null;
    const schedules: ScheduleProposal[] = [], issues: JobIssue[] = [], messages: JobMessage[] = [], history: DeliveryEvent[] = [];
    for (const s of d.schedules) {
      if (!s || !isDraftId(s.id) || !actor(s.proposedBy) || !validTimestamp(s.createdAt) || !validSchedule(s, false) || !["pending", "confirmed", "superseded", "withdrawn"].includes(s.status) || (s.status === "pending" ? s.resolvedAt !== null : !validTimestamp(s.resolvedAt))) return null;
      schedules.push({ id: s.id, proposedBy: { ...s.proposedBy }, createdAt: s.createdAt, date: s.date, startTime: s.startTime, endTime: s.endTime, notes:s.notes??"", status: s.status, resolvedAt: s.resolvedAt });
    }
    if (schedules.filter(s => s.status === "pending").length > 1 || schedules.filter(s => s.status === "confirmed").length > 1 || (d.confirmedScheduleId === null ? schedules.some(s => s.status === "confirmed") : !schedules.some(s => s.id === d.confirmedScheduleId && s.status === "confirmed"))) return null;
    for (const issue of d.issues) {
      if (!issue || !isDraftId(issue.id) || !actor(issue.actor) || issue.actor.role !== "customer" || !Object.hasOwn(issueCategories, issue.category) || typeof issue.description !== "string" || issue.description.trim().length < 15 || issue.description.length > 2000 || !validTimestamp(issue.createdAt)) return null;
      issues.push({ id: issue.id, actor: { ...issue.actor }, category: issue.category, description: issue.description, createdAt: issue.createdAt });
    }
    for (const [index, m] of d.messages.entries()) {
      if (!m || !isDraftId(m.id) || m.sequence !== index + 1 || !actor(m.actor) || typeof m.text !== "string" || messageError(m.text) || !validTimestamp(m.createdAt)) return null;
      messages.push({ id: m.id, sequence: m.sequence, actor: { ...m.actor }, text: m.text, createdAt: m.createdAt });
    }
    let previous: DeliveryStatus | null = null;
    for (const [index, event] of d.history.entries()) {
      if (!event || !isDraftId(event.id) || !actor(event.actor) || !validTimestamp(event.at) || !status(event.to) || event.from !== previous || typeof event.note !== "string" || event.note.length > 2200) return null;
      let allowed = false;
      if (index === 0) allowed = event.id === selection.id && event.kind === "selected" && event.to === "awaiting_confirmation" && event.at === selection.selectedAt && event.actor.role === "customer";
      else if (event.kind === "schedule_proposed" || event.kind === "schedule_withdrawn") { const s = schedules.find(s => s.id === event.scheduleId); allowed = !!s && s.proposedBy.role === event.actor.role && s.proposedBy.id === event.actor.id && ["confirmed", "scheduled"].includes(event.from!) && event.to === event.from; }
      else if (event.kind === "schedule_confirmed") { const s = schedules.find(s => s.id === event.scheduleId); allowed = !!s && s.proposedBy.role !== event.actor.role && ["confirmed", "scheduled"].includes(event.from!) && event.to === "scheduled"; }
      else if (event.kind === "issue_reported") allowed = event.actor.role === "customer" && !!issues.find(i => i.id === event.issueId) && ["confirmed", "scheduled", "in_progress", "completion_requested"].includes(event.from!) && event.to === "issue_reported";
      else allowed = nextStatus(event.from!, event.kind as JobAction, event.actor.role) === event.to;
      if (!allowed) return null;
      previous = event.to; history.push({ id: event.id, at: event.at, actor: { ...event.actor }, kind: event.kind, from: event.from, to: event.to, note: event.note, scheduleId: event.scheduleId, issueId: event.issueId });
    }
    if (previous !== d.status || (d.status === "scheduled" && !d.confirmedScheduleId) || (d.status === "issue_reported") !== (issues.length > 0) || schedules.some(s => !history.some(e => e.kind === "schedule_proposed" && e.scheduleId === s.id)) || issues.some(i => !history.some(e => e.issueId === i.id))) return null;
    if ([history, schedules, issues, messages].some(list => new Set(list.map(r => r.id)).size !== list.length)) return null;
    parsed.push({ id: d.id, jobId: d.jobId, offerId: d.offerId, providerId: d.providerId, customerId: d.customerId, revision: d.revision, status: d.status, history, schedules, confirmedScheduleId: d.confirmedScheduleId, issues, messages, read: { ...d.read } });
  }
  return new Set(parsed.map(d => d.id)).size === parsed.length ? parsed : null;
}
