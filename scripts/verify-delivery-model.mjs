import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url), ts = require("typescript"), cache = new Map();
let state, parse;
class MarketplaceError extends Error {}
const serviceStub = { MarketplaceError, mutateMarketplace: async action => { const next = structuredClone(state), result = action(next); next.revision++; const valid = parse(next); assert(valid, "Every mutation must preserve the complete graph"); state = valid; return result; } };
function load(relative) {
  const filename = path.resolve(relative);
  if (filename === path.resolve("src/data/local-marketplace.ts")) return serviceStub;
  if (cache.has(filename)) return cache.get(filename).exports;
  const record = { exports: {} }; cache.set(filename, record);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = specifier => specifier.startsWith("@/") ? load(`src/${specifier.slice(2)}.ts`) : specifier.startsWith(".") ? load(path.resolve(path.dirname(filename), `${specifier}.ts`)) : require(specifier);
  new Function("require", "module", "exports", source)(localRequire, record, record.exports); return record.exports;
}
const market = load("src/features/marketplace/model.ts"), model = load("src/features/delivery/model.ts"), service = load("src/data/local-delivery.ts"); parse = market.parseMarketplace;
const id = () => crypto.randomUUID(), now = new Date().toISOString(), jobId = id(), providerId = id(), otherProviderId = id(), offerId = id();
const profile = { id: "local-provider", schemaVersion: 1, revision: 2, createdAt: now, updatedAt: now, lastStep: 5, reviewed: true, content: { type: "individual", name: "Synthetic lifecycle model fixture", photo: null, categories: ["plumbing"], specializations: [], experience: "5", areas: ["bodija"], bio: "Synthetic isolated model test profile. This is not a real professional.", portfolio: [] } };
const draft = { id: jobId, schemaVersion: 1, revision: 3, createdAt: now, updatedAt: now, lastStep: 6, reviewed: true, status: "draft", content: { category: "plumbing", title: "Synthetic lifecycle model request", description: "Synthetic isolated request for testing lifecycle actions and messaging transitions.", photos: [], area: "bodija", timing: "flexible", preferredDate: "", budgetMode: "quotes", budgetMin: "", budgetMax: "" } };
const legacy = { id: "local-marketplace", schemaVersion: 1, revision: 8, jobs: [{ id: jobId, sourceDraftId: jobId, sourceRevision: 3, revision: 2, publishedAt: now, status: "provider_selected", selectedOfferId: offerId, request: draft }], providers: [{ id: providerId, createdAt: now, profile }, { id: otherProviderId, createdAt: now, profile }], offers: [{ id: offerId, jobId, providerId, revision: 2, status: "selected", createdAt: now, updatedAt: now, submittedAt: now, content: { price: "15000", priceType: "estimate", scope: "Synthetic scope covering tap inspection and repair.", availability: "Next suitable morning", conditions: "" } }], selections: [{ id: id(), jobId, offerId, providerId, selectedAt: now }], activeProviderId: providerId };
const original = structuredClone(legacy), customer = { role: "customer", id: "local-customer" }, provider = { role: "provider", id: providerId }, other = { role: "provider", id: otherProviderId };
const reset = () => { state = parse(structuredClone(legacy)); assert(state); };
const delivery = () => state.deliveries[0];
const update = (actor, action, reason = "") => service.changeJobState(jobId, actor, delivery().revision, action, reason);
async function rejected(task, message) { const before = structuredClone(state); await assert.rejects(task, MarketplaceError, message); assert.deepEqual(state, before, "Rejected action is atomic and leaves every record unchanged"); }
const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10), windowFor = n => ({ date: day(n), startTime: "09:00", endTime: "11:00" });
reset(); assert.equal(state.schemaVersion, 4); assert.equal(delivery().status, "awaiting_confirmation"); assert.equal(delivery().history.length, 1); assert.deepEqual(legacy, original); console.log("PASS non-destructive schema-1 adaptation; no inferred provider acceptance");
await rejected(() => update(customer, "confirm")); await rejected(() => update(other, "confirm")); await rejected(() => update(provider, "start")); await rejected(() => update(provider, "complete")); await rejected(() => update(provider, "decline", "short"));
await update(provider, "confirm"); assert.equal(delivery().status, "confirmed"); await rejected(() => service.changeJobState(jobId, customer, 1, "cancel", "Synthetic stale cancellation"));
await rejected(() => service.proposeSchedule(jobId, customer, delivery().revision, { date: "2000-01-01", startTime: "09:00", endTime: "11:00" }));
await rejected(() => service.proposeSchedule(jobId, customer, delivery().revision, { date: "2060-02-30", startTime: "09:00", endTime: "11:00" }));
await rejected(() => service.proposeSchedule(jobId, customer, delivery().revision, { ...windowFor(2), endTime: "08:00" }));
const revision = delivery().revision; await service.proposeSchedule(jobId, customer, revision, windowFor(2)); const pending = delivery().schedules[0].id;
await rejected(() => service.resolveSchedule(jobId, customer, delivery().revision, pending, "confirm")); await rejected(() => service.proposeSchedule(jobId, provider, revision, windowFor(3))); await rejected(() => update(provider, "start"));
await service.resolveSchedule(jobId, provider, delivery().revision, pending, "confirm"); assert.equal(delivery().status, "scheduled");
await service.proposeSchedule(jobId, provider, delivery().revision, windowFor(3)); assert.equal(delivery().confirmedScheduleId, pending); const second = delivery().schedules.at(-1).id;
await service.resolveSchedule(jobId, customer, delivery().revision, second, "confirm"); assert.equal(delivery().schedules[0].status, "superseded"); assert.equal(delivery().confirmedScheduleId, second);
await service.proposeSchedule(jobId, customer, delivery().revision, windowFor(4)); await rejected(() => service.resolveSchedule(jobId, provider, delivery().revision, delivery().schedules.at(-1).id, "withdraw")); await service.resolveSchedule(jobId, customer, delivery().revision, delivery().schedules.at(-1).id, "withdraw");
await update(provider, "start"); assert.equal(delivery().status, "in_progress"); await rejected(() => update(customer, "cancel", "Synthetic late cancellation")); await rejected(() => update(provider, "complete")); console.log("PASS role ownership, impossible transitions, stale changes, schedule validation, confirmation, rescheduling and withdrawal");
await rejected(() => service.sendJobMessage(jobId, other, id(), "Wrong provider fixture")); await rejected(() => service.sendJobMessage(jobId, customer, id(), "  ")); await rejected(() => service.sendJobMessage(jobId, customer, id(), "x".repeat(2001)));
const messageId = id(); await service.sendJobMessage(jobId, customer, messageId, "Synthetic customer message"); await service.sendJobMessage(jobId, customer, messageId, "Synthetic customer message"); assert.equal(delivery().messages.length, 1);
await Promise.all([service.sendJobMessage(jobId, provider, id(), "Synthetic provider message"), service.sendJobMessage(jobId, customer, id(), "Synthetic second customer message")]); assert.deepEqual(delivery().messages.map(m => m.sequence), [1, 2, 3]);
await service.markConversationRead(jobId, provider, 3); await service.markConversationRead(jobId, provider, 1); assert.equal(delivery().read.provider, 3); assert.equal(model.unreadCount(delivery(), "customer"), 1); console.log("PASS participant checks, safe text limits, idempotent message retries, deterministic ordering and monotonic read positions");
await update(provider, "request_completion"); await rejected(() => update(provider, "complete")); await rejected(() => service.reportJobIssue(jobId, provider, delivery().revision, "quality", "Synthetic unresolved work description.")); await service.reportJobIssue(jobId, customer, delivery().revision, "scope", "Synthetic unfinished work: the tap is still leaking after the repair."); assert.equal(delivery().status, "issue_reported"); await rejected(() => update(customer, "complete")); assert.equal(delivery().issues.length, 1); assert.equal(delivery().messages.length, 3); console.log("PASS customer issue reporting preserves history and prevents conflicting completion");
reset(); await update(provider, "confirm"); await update(provider, "start"); await update(provider, "request_completion"); await update(customer, "complete"); assert.equal(delivery().status, "completed"); await rejected(() => update(customer, "complete")); assert.deepEqual(state.offers, legacy.offers); assert.deepEqual(state.jobs, legacy.jobs); assert.deepEqual(state.providers, legacy.providers);
const corrupted = structuredClone(state); corrupted.deliveries[0].history.at(-1).actor = provider; assert.equal(parse(corrupted), null); const missing = structuredClone(state); missing.deliveries = []; assert.equal(parse(missing), null); console.log("PASS two-sided completion, immutable prior-stage records and corrupted/missing relationship rejection");
reset(); await update(provider, "decline", "Synthetic decline: outside current availability."); assert.equal(delivery().status, "cancelled"); assert.match(delivery().history.at(-1).note, /outside current availability/); await rejected(() => update(provider, "confirm"));
reset(); await update(customer, "cancel", "Synthetic customer cancellation before acceptance."); assert.equal(delivery().status, "cancelled"); console.log("PASS explicit provider decline and permitted early cancellation; no automatic reopening");

export { load, state, reset, jobId, customer, provider, other, update };
