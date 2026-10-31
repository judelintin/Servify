import { MarketplaceError, mutateMarketplace } from "./local-marketplace";
import { belongsTo, canReportIssue, canSchedule, issueCategories, messageError, nextStatus, scheduleLabel, validSchedule, type DeliveryEvent, type JobAction, type JobDelivery, type PreviewActor, type ScheduleInput } from "@/features/delivery/model";
import type { Marketplace } from "@/features/marketplace/model";
import { isDraftId } from "@/features/customer/draft-model";

function owned(data: Marketplace, jobId: string, actor: PreviewActor, revision?: number) {
  const d = data.deliveries.find(d => d.jobId === jobId);
  if (!d || !["customer", "provider"].includes(actor.role) || !belongsTo(d, actor) || (actor.role === "provider" && data.activeProviderId !== actor.id)) throw new MarketplaceError("This job is not available in the current preview identity. Choose the selected provider context or return to your workspace.");
  if (revision !== undefined && d.revision !== revision) throw new MarketplaceError("This job changed in another view. Your answers have not overwritten it. Reload or review the latest job before trying again.");
  return d;
}
function event(d: JobDelivery, actor: PreviewActor, kind: DeliveryEvent["kind"], note: string, to = d.status, scheduleId: string | null = null, issueId: string | null = null) {
  if (d.history.length >= 150) throw new MarketplaceError("This preview job has reached its 150-event history limit. Existing history is preserved.");
  d.history.push({ id: crypto.randomUUID(), at: new Date().toISOString(), actor, kind, from: d.status, to, note, scheduleId, issueId }); d.status = to; d.revision++;
}
export function changeJobState(jobId: string, actor: PreviewActor, revision: number, action: JobAction, reason = "") {
  return mutateMarketplace(data => {
    const d = owned(data, jobId, actor, revision), to = nextStatus(d.status, action, actor.role);
    if (!to) throw new MarketplaceError("That action is not allowed at this job's current stage or for this preview role.");
    if (["cancel", "decline"].includes(action) && (reason.trim().length < 10 || reason.length > 1000)) throw new MarketplaceError("Explain the cancellation or decline in 10 to 1,000 characters.");
    if (action === "start" && d.schedules.some(s => s.status === "pending")) throw new MarketplaceError("Resolve or withdraw the pending schedule proposal before starting work.");
    const notes: Record<JobAction, string> = { confirm: "Selected provider explicitly confirmed the preview job.", decline: `Provider declined: ${reason.trim()}`, cancel: `Job cancelled in preview: ${reason.trim()}`, start: "Provider marked work as started in preview.", request_completion: "Provider marked work finished and requested customer confirmation.", complete: "Customer explicitly confirmed completion in preview." };
    if (to === "cancelled") for (const s of d.schedules.filter(s => s.status === "pending")) { s.status = "withdrawn"; s.resolvedAt = new Date().toISOString(); }
    event(d, actor, action, notes[action], to);
  });
}
export function proposeSchedule(jobId: string, actor: PreviewActor, revision: number, input: ScheduleInput) {
  return mutateMarketplace(data => {
    const d = owned(data, jobId, actor, revision);
    if (!canSchedule(d)) throw new MarketplaceError("Confirm the selected job before scheduling. Scheduling is closed once work starts.");
    if (!validSchedule(input)) throw new MarketplaceError("Choose a valid future date and time window, with the end after the start. Times use Ibadan / WAT.");
    if (d.schedules.length >= 30) throw new MarketplaceError("This preview has reached its 30 schedule-proposal limit.");
    const now = new Date().toISOString();
    for (const s of d.schedules.filter(s => s.status === "pending")) { s.status = "superseded"; s.resolvedAt = now; }
    const id = crypto.randomUUID(); d.schedules.push({ id, ...input, proposedBy: actor, createdAt: now, status: "pending", resolvedAt: null });
    event(d, actor, "schedule_proposed", `Proposed ${scheduleLabel(input)}. Any previous pending proposal was superseded; an agreed schedule stays current until the other role confirms.`, d.status, id);
  });
}
export function resolveSchedule(jobId: string, actor: PreviewActor, revision: number, proposalId: string, action: "confirm" | "withdraw") {
  return mutateMarketplace(data => {
    if (!["confirm", "withdraw"].includes(action)) throw new MarketplaceError("Choose whether to confirm or withdraw this schedule proposal.");
    const d = owned(data, jobId, actor, revision), s = d.schedules.find(s => s.id === proposalId && s.status === "pending");
    if (!canSchedule(d) || !s) throw new MarketplaceError("This schedule proposal is no longer pending. Review the current job.");
    if (action === "confirm" ? s.proposedBy.role === actor.role : s.proposedBy.role !== actor.role) throw new MarketplaceError("The other preview role must confirm a proposal. Only its proposer can withdraw it.");
    if (action === "confirm" && !validSchedule(s)) throw new MarketplaceError("The proposed time has passed. Propose a new future time window.");
    const now = new Date().toISOString();
    if (action === "confirm") { for (const old of d.schedules.filter(p => p.status === "confirmed")) { old.status = "superseded"; old.resolvedAt = now; } s.status = "confirmed"; d.confirmedScheduleId = s.id; }
    else s.status = "withdrawn";
    s.resolvedAt = now;
    event(d, actor, action === "confirm" ? "schedule_confirmed" : "schedule_withdrawn", `${action === "confirm" ? "Both preview roles agreed on" : "Proposer withdrew"} ${scheduleLabel(s)}. No real appointment was booked.`, action === "confirm" ? "scheduled" : d.status, s.id);
  });
}
export function reportJobIssue(jobId: string, actor: PreviewActor, revision: number, category: keyof typeof issueCategories, description: string) {
  return mutateMarketplace(data => {
    const d = owned(data, jobId, actor, revision);
    if (actor.role !== "customer" || !canReportIssue(d)) throw new MarketplaceError("Only the customer can report unresolved work on a confirmed, active or completion-requested job.");
    if (!Object.hasOwn(issueCategories, category) || description.trim().length < 15 || description.length > 2000) throw new MarketplaceError("Choose an issue category and describe what remains unresolved in 15 to 2,000 characters.");
    const id = crypto.randomUUID(); d.issues.push({ id, category, description: description.trim(), actor, createdAt: new Date().toISOString() });
    for (const s of d.schedules.filter(s => s.status === "pending")) { s.status = "withdrawn"; s.resolvedAt = new Date().toISOString(); }
    event(d, actor, "issue_reported", `${issueCategories[category]}: ${description.trim()}`, "issue_reported", null, id);
  });
}
export function sendJobMessage(jobId: string, actor: PreviewActor, id: string, text: string) {
  return mutateMarketplace(data => {
    const d = owned(data, jobId, actor), error = messageError(text);
    if (error || !isDraftId(id)) throw new MarketplaceError(error || "This message identifier is invalid.");
    const existing = d.messages.find(m => m.id === id);
    if (existing) { if (existing.actor.role !== actor.role || existing.actor.id !== actor.id || existing.text !== text.trim()) throw new MarketplaceError("That message changed. Review the current conversation before sending again."); return existing.sequence; }
    if (d.messages.length >= 500) throw new MarketplaceError("This conversation has reached its 500-message preview limit. Existing messages are preserved.");
    const sequence = d.messages.length + 1;
    d.messages.push({ id, sequence, actor, text: text.trim(), createdAt: new Date().toISOString() }); return sequence;
  });
}
export function markConversationRead(jobId: string, actor: PreviewActor, through: number) {
  return mutateMarketplace(data => { const d = owned(data, jobId, actor); if (!Number.isSafeInteger(through) || through < 0 || through > d.messages.length) throw new MarketplaceError("The conversation changed. Reload before marking messages read."); d.read[actor.role] = Math.max(d.read[actor.role], through); });
}
