# Stage 08 — Admin operations and marketplace oversight

This stage replaces the remaining operational Admin placeholders with a browser-local overview, provider directory and explicit profile-review queue, published-job monitoring, job-issue cases and unified administrative activity. Existing Stage 07 review moderation remains the sole review/report system. No dependencies, cloud resources, authentication, payments, identity documents or production verification were introduced. Customer/provider workflows and existing source records are preserved.

## Routes and navigation

The existing shared Admin shell now lists Overview, Providers, Verification, Jobs, Issues, Reviews & Reports and Activity History. Its collapse controls, saved preference, icon labels, hidden scrollbar and mobile menu are unchanged. Existing customer/category admin routes are retained but are outside this operational navigation; no unrelated functionality was built there.

- `/admin/dashboard`: action links for pending profile assessments, open issue cases and pending review reports, followed by actual marketplace counters.
- `/admin/providers` and `/admin/providers/[recordId]`: searchable provider snapshots with category/area information, completeness, portfolio, reputation and administrative assessment status.
- `/admin/verification`: only explicit requests; status filters and request-date sorting. Providers with no request remain Not submitted, not pending verification.
- `/admin/jobs` and `/admin/jobs/[recordId]`: published requests only, search, lifecycle filters, date ordering, job snapshot, offer count, selected provider, acceptance, schedules, progress, issues and chronological lifecycle history. Overview status links initialize the job filter.
- `/admin/reports` and `/admin/reports/[recordId]`: actual Stage 06 customer issues and separate internal administrative case records. Content-review reports remain at `/admin/reviews`.
- `/admin/activity`: filterable, searchable, date-sorted Stage 08 activity plus existing Stage 07 moderation audit entries, displayed in place rather than copied into another system.

## Metric definitions and monitoring boundaries

Metrics use the same validated aggregate as detail screens. Provider counts refer to explicitly added marketplace participant snapshots, not inferred real accounts. The one editable Stage 04 local profile is shown separately in the directory, including readiness/work samples; it is not counted again as another participant. Assessment attention means an explicitly requested profile assessment that is not complete. Published jobs means requests still open for offers; awaiting acceptance means selected deliveries still awaiting explicit provider confirmation. Active work includes confirmed, scheduled, in-progress and completion-requested deliveries. Open issues means recorded job issues without a closed internal case. Completed jobs means customer-confirmed completion. Pending review reports come directly from Stage 07.

Private customer drafts are not loaded into the job directory. Admin inspection exposes general service areas and preview participant identifiers, not exact addresses. Job monitoring is read-only: no admin business-state editor is provided. Conversation content is excluded; the detail view shows only its message count and preserves the job-specific participant boundary.

## Provider assessment workflow

The existing provider verification preview now includes a separate, explicit administrative profile-review request. The user must first choose an existing provider preview context, then confirm sharing that already-stored snapshot. It does not submit identity documents or perform real verification. Duplicate requests for the same provider context are rejected. Existing Stage 04 requirements/verification preview is preserved.

The request records stable provider ID, request time, revision and Profile review requested status. Admin can inspect the safe self-described details and work samples, then record Under preview review, Additional information requested or Preview assessment complete, with a required note. Further review can explicitly move an assessed profile back to review. Additional-information requests should concern services, experience, coverage or permitted work samples; they are notes visible on the provider preview panel, not external notifications. No Verified badge, identity approval, restriction or sanction is generated.

Provider contexts are immutable snapshots, as established in Stage 05. Editing the separate Stage 04 source profile does not silently rewrite the snapshot being assessed. Updating/replacing a snapshot or re-submission policy is a future product decision; reviewers can inspect the preserved editable source separately. No old verification submission or admin action is invented when reading existing records.

## Administrative issue cases

Existing issue UUIDs are the stable case IDs. Until an admin first saves follow-up, New is a derived queue state; no historical case event is backfilled. Creating a case requires a real issue belonging to the linked delivery/job. There is at most one administrative case per issue.

Internal statuses are New, Under review, Awaiting information, Follow-up recorded and Closed. The first saved action can move New to a non-New state. Open cases can move among those follow-up states or close with a reviewed confirmation/note. A closed case can only reopen to Under review before further changes. Repeated closure and stale revisions are rejected. Same-status updates on open cases can record another deliberate note.

Outcome categories are Not assessed, Information requested, Follow-up documented and No further preview action. These describe internal tracking only, not resolution of the underlying work or legal/financial decisions. Closing/reopening a case never changes delivery status, selected offers, schedules, messages, completion, reviews or compensation. The customer's Issue reported lifecycle remains intact. Each action records its note and outcome alongside previous/new administrative status.

## Persistence and audit integrity

IndexedDB remains database version 3 and uses the existing marketplace store/atomic mutation boundary. The marketplace record advances from schema 1–3 to schema 4, adding `operations: { assessments, cases, events }`. Reading old valid data adapts it in memory without writing or inventing assessments, cases or audit history. A later explicit mutation persists the new schema. Original stores and all prior record arrays are retained. Older application versions block unknown schemas instead of dropping new data.

`src/features/operations/model.ts` defines the contracts, shared metric definitions, issue relationships and parser. `src/data/local-operations.ts` implements explicit requests and atomic assessment/case-plus-audit updates. Each administrative change requires the explicit `local-admin` preview identity, a review confirmation and a 3–1,500 character note. The form captures the reviewed record revision; another saved action causes a stale confirmation to fail without discarding notes. Provider requests require that provider's current preview context. Neither mechanism authenticates or securely authorizes a real user.

Audit events contain UUID, assessment/case target ID, action kind, local-admin actor, timestamp, previous/new status, note and outcome. The parser validates links, uniqueness, bounds, status chains and final administrative state. Events are append-only through these services; they are not tamper-resistant against someone editing browser data. Stage 07 moderation audit timestamps, notes and actor records remain untouched and are displayed alongside new operations without fabricating unavailable previous states.

Limits are 10 assessment records (matching the existing provider-context cap), 1,000 cases and 2,000 operations events. Limits and malformed data fail safely rather than evicting history. Storage denial/stalling uses the existing bounded initialization and labelled temporary mode. Failed writes abort atomically and keep form answers; malformed aggregate records are left untouched and preview writes are blocked. The original draft/profile stores remain independent.

## Verification

Tests run only in isolated browser contexts or in-memory fixtures. No review-browser records are cleared or seeded. Screenshots and machine-readable results stay under ignored `artifacts/stage-08/`.

- `scripts/verify-operations-model.mjs`: actual service/model rules through the existing isolated transaction test boundary. Covers explicit requests, invalid actors, duplicate requests/cases, stale revisions, assessment/information/completion, case close/reopen, invalid transitions, dangling issue links and exact preservation of business-state arrays. Existing lifecycle model rules also pass with the current schema.
- `scripts/verify-operations.mjs`: real browser/IndexedDB administration over realistic legacy provider/selected-job fixtures. Requests assessment through the provider UI; searches the directory; records assessments; accepts/starts a job and reports an issue through the existing participant UI; follows up, closes/reopens and reloads the case; checks unchanged jobs/offers/deliveries/reviews; checks actual attention counts, status/query filters and date-order controls. All ten main/detail/moderation admin views and confirmation forms are checked at 1440, 1366, 1024, 768, 430, 390 and 320px, including overflow, keyboard focus, desktop preference and mobile navigation.
- `scripts/verify-operations-resilience.mjs`: competing administrative confirmations retain notes and reject stale writes; quota failures preserve answers and prior saved records; corrupted operations block writes; denied storage resolves to a labelled temporary state rather than a stuck loader.
- The existing Stage 07 end-to-end smoke regression passes at 390px: real UI request creation/publication, offer, selection, acceptance, schedule, messaging, customer completion, review/edit/response/reporting, admin hiding/restoration and recalculated rating persistence. This reuses prior-stage flows without repeating their comprehensive audits.
- ESLint, TypeScript, production build and all 46 page routes plus 404 are verified. No package installation, real verification or remote marketplace operation is performed.

Commands: `node scripts/verify-operations-model.mjs`, `node scripts/verify-operations.mjs`, `node scripts/verify-operations-resilience.mjs`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:routes`. Browser checks use the established Playwright runtime environment variables; dependencies are unchanged.

## Deferred production requirements and policy decisions

Production requires authenticated staff/provider identities, scoped server authorization and RLS, server-enforced transitions/uniqueness, normalized transactional records, privacy and retention policies, access-controlled internal notes, durable tamper-resistant audit storage, moderation governance and appeals. Real provider verification additionally needs explicit consent, a justified lawful identity-handling policy, secure restricted/encrypted document transport/storage if approved, trained human reviewers, evidence standards, retention/deletion rules and accountable decisions. Stage 08 does not collect those documents or claim that process exists.

Assessment re-submission/update policy, case assignment and escalation, reopening authority, retention periods, and the meaning/approval of real operational outcomes remain product decisions. There is no real arbitration, mediation, compensation, refund, automatic sanction or provider verification. No future-stage features are introduced.

## Local review

Use http://127.0.0.1:3000 consistently. Start with `/admin/dashboard`, `/admin/providers`, `/admin/verification`, `/admin/jobs`, `/admin/reports`, `/admin/reviews` or `/admin/activity`. Provider review requests are explicitly initiated at `/provider/verification` for an existing chosen preview provider. Empty queues are intentional when no user-created records exist. The development server remains running. Stage 08 is approved for a local Git checkpoint; pushing, deployment and Stage 09 remain out of scope.
