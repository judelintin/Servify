# Stage 06 — Job lifecycle and job-specific messaging

This stage extends the approved local marketplace from selected offers through explicit provider acceptance, scheduling, work progress, customer-confirmed completion or an unresolved issue. All records remain in the same browser origin. Dependencies, authentication/database architecture, public homepage, approved onboarding forms, sidebar implementation and previous stage documents are unchanged.

## Entry points and workspace integration

- Customer: My Jobs links to `/customer/active-jobs`; a selected request or offer links to `/jobs/[jobId]/workspace`. Existing My Jobs navigation highlights these routes without adding a separate sidebar implementation or extra dashboard cards.
- Provider: the existing Active Jobs navigation now opens a functional list at `/provider/active-jobs`, with each job at `/provider/active-jobs/[jobId]`. Selected offers, request details and Overview link to this workspace.
- Both lists include active/awaiting, completed, issue-reported, cancelled and all-selected views. No records are seeded into normal browser storage. Jobs appear only after an actual local offer selection.
- Customer Dashboard retains its layout: awaiting selections remain under Provider selected; explicitly accepted/ongoing jobs appear under In progress; customer-confirmed completions appear under Completed. Counts come from local records. My Jobs and request badges reflect current delivery status.
- Customer conversations: `/conversations` and `/conversations/[jobId]`. Provider conversations: `/provider/messages` and `/provider/messages/[jobId]`. The existing conversation route parameter retains its name; its value is the stable job UUID.
- Job workspaces show the original selected offer terms, an expandable original request/photo view, scheduling, permitted role actions, issue details, a chronological history and a direct conversation link.

## Lifecycle and permitted actions

The Stage 05 job keeps `provider_selected` as its historical marketplace selection state, and the offer remains `selected`. A linked `JobDelivery` records delivery progress independently, preserving original offers and request snapshots.

| Current delivery state | Permitted action | Actor | Result |
| --- | --- | --- | --- |
| `awaiting_confirmation` | Explicitly accept | Selected provider | `confirmed` |
| `awaiting_confirmation` | Decline with a reason | Selected provider | `cancelled` |
| `awaiting_confirmation` | Cancel with a reason | Customer preview | `cancelled` |
| `confirmed`, `scheduled` | Cancel with a reason | Customer or selected provider | `cancelled` |
| `confirmed`, `scheduled` | Propose/replace/withdraw a pending time window | Either participant; only the proposer can withdraw | State retained |
| `confirmed`, `scheduled` | Confirm the other participant's pending schedule | Opposite role | `scheduled` |
| `confirmed`, `scheduled` | Explicitly mark work started | Selected provider | `in_progress` |
| `in_progress` | Request completion confirmation | Selected provider | `completion_requested` |
| `completion_requested` | Review and explicitly confirm completed work | Customer preview only | `completed` |
| `confirmed`, `scheduled`, `in_progress`, `completion_requested` | Record an unresolved issue | Customer preview only | `issue_reported` |

A pending schedule must be resolved or withdrawn before work starts. An agreed schedule is optional: a provider can explicitly mark confirmed work started without one; no date or acceptance is inferred. Cancellation after work starts is not implemented; the customer can report an issue instead. Completion requires two explicit actions from different roles. A provider cannot finalize completion.

Completed, issue-reported and cancelled jobs cannot be reopened in Stage 06. A decline does not automatically re-publish the request or select another provider. The original selection and terms remain historical records. Re-selection, cancellation policy, issue resolution and reopening require later product decisions, rather than hidden changes to existing offers.

Every lifecycle action uses an explicit review/confirmation, current delivery revision and participant check. Decline/cancel reasons require 10–1,000 characters. History retains actor, timestamp, event UUID, previous/resulting state, explanatory note and associated schedule/issue reference. Events render in saved sequence, including multiple actions with the same timestamp. No completed-work history is generated without the user's actions.

## Scheduling

Either role can propose a date and start/end time, explicitly labelled **Ibadan / WAT (UTC+01:00)**. Valid proposals require a real calendar date, a future start and an end after the start. Validation runs again when confirming, so an expired proposal cannot become a new agreement. Previously valid dates remain readable after they pass.

Each proposal has a UUID, proposer identity, creation time, time window, status and resolution time. Statuses are `pending`, `confirmed`, `superseded` and `withdrawn`. Only one pending proposal and one current confirmed schedule can exist per job. The other role must confirm; the proposer cannot self-confirm.

Rescheduling creates another proposal. An existing confirmed time stays current until the other participant explicitly confirms its replacement; the previous agreement then becomes superseded. Replacing a pending proposal requires a visible acknowledgement. Revision checks reject conflicting proposals without overwriting the stale form's answers. Schedule changes are retained in the job timeline. Cancelling or reporting an issue closes pending proposals; existing agreements remain historical. No calendar integration, notification or real appointment is created.

## Messaging and preview identity

`local-customer` is the stable identity for the single customer preview in this browser. Provider identities are the immutable Stage 05 preview-provider UUIDs, not the editable Stage 04 profile record. The shared Local preview disclosure explains role switching and the lack of secure accounts.

There is one conversation per selected job, contained in its `JobDelivery`. Only that customer identity and its selected provider context can view and append through the UI/services. Provider operations also check the latest persisted active context inside the transaction: a stale screen cannot act after the context has switched to another provider. These guards prevent accidental cross-context actions in the prototype; they are not authentication or a security boundary against someone inspecting browser storage.

Messages contain UUID, participant identity, text, creation timestamp and a monotonically increasing sequence assigned from the latest stored conversation. Ordering follows sequence rather than assuming unique timestamps. Messages accept non-blank text up to 2,000 characters, render as escaped React text with line breaks, and never render HTML. A client message UUID makes retries idempotent; reusing an ID with different content is rejected. The composer retains unsaved text after failures and returns keyboard focus after a successful save. Ctrl/Command+Enter submits; Enter alone adds a line break.

Conversation lists show actual latest-message excerpts and incoming unread counts. Per-role local read cursors only move forward. Opening/following the latest messages updates that preview side's cursor; a reader viewing older history is not pulled to incoming notes, and can explicitly mark the conversation read. New own messages scroll into view without animation. This is browser-local read-position bookkeeping, not delivery/read receipts, online status or remote communication.

Messages remain available after completion, cancellation and issues. The same two participants may append local coordination notes in closed jobs; messages alone never change lifecycle state. There is no editing/deletion of message history in this stage. Conversation limits preserve existing messages instead of evicting them.

## Completion and unresolved issues

After the provider requests completion, the customer can review the original scope and either confirm completion or record outstanding work. Issues capture a UUID, category (work quality, unfinished/different work, timing/attendance or other), 15–2,000 character description, customer actor and timestamp. Their association with the job is through the owning delivery record. Issue details and the state transition persist together.

`issue_reported` pauses further lifecycle progress in this stage. It does not initiate dispute arbitration, support intervention, a refund or automatic resolution. Reviews and ratings remain deferred to a later stage.

## Persistence, compatibility and failure handling

The IndexedDB database stays at version **3**, using its existing `marketplace` store. Original `drafts` and `providerProfiles` stores and formats are untouched. The marketplace aggregate advances from schema **1 to 2**, adding `deliveries` alongside the existing jobs, providers, offers and selections.

Reading a valid Stage 05 aggregate adapts each existing selection to one delivery awaiting provider confirmation. The first history event reflects the real saved selection, using its ID and timestamp. Reading alone does not rewrite storage. The next explicit mutation persists schema 2. New selections create their delivery atomically in the original selection transaction. An old application version cannot interpret schema 2 and should be reloaded; its Stage 05 parser blocks unknown schemas rather than erasing them.

New contracts live in `src/features/delivery/model.ts`:

- `JobDelivery`: stable job/conversation ID, selected offer/provider IDs, customer identity, revision, delivery status, history, schedules/current confirmed schedule ID, issues, messages and per-role read cursors.
- `DeliveryEvent`, `ScheduleProposal`, `JobIssue`, `JobMessage`, `PreviewActor`: validated subordinate records owned by that delivery/job.

`src/data/local-delivery.ts` reuses the existing transactional marketplace mutation boundary. Each change reads the current aggregate, validates relationships and the resulting graph, then writes once. History-changing actions use a delivery revision; messages/read positions use atomic appends or monotonic cursor updates without unnecessarily conflicting with schedule forms. Concurrent transactions serialize, preserving independent changes.

Parsing checks one delivery per selection, participant/offer/job references, allowed history transitions, current status/history consistency, schedule references, issue relationships, unique IDs, ordered message sequences and cursor bounds. Missing or malformed schema-2 relationships block preview changes and preserve the raw data. Original private drafts and provider profiles remain independently readable.

Storage denial/blocking/stalling retains the established four-second timeout and labelled temporary tab-only fallback. Writes that fail or encounter stale state abort without partially updating the graph, changing original records or discarding form text. Alerts receive focus after rendering. Histories and safety limits are explicit: up to 150 events, 30 schedule proposals and 500 messages per job, in addition to Stage 05 limits. Reaching a limit returns a clear error; it does not delete history.

## Verification

All fixtures use isolated browser contexts or in-memory test objects. Tests do not clear, seed or overwrite review-browser data. Captures/results are under ignored `artifacts/stage-06/`.

- `scripts/verify-delivery.mjs`: actual UI journey at **1440, 1366, 1024, 768, 430, 390 and 320px**. Creates a request, preview-publishes, configures a provider, discovers/submits an offer, selects, explicitly accepts, proposes/confirms a schedule, starts work, exchanges messages, requests completion, customer-confirms, reloads and verifies both workspaces/dashboard. Includes empty states, past-date rejection, rescheduling, keyboard confirmation/focus, safe HTML-like message text, unread counts, mobile menu/sidebar preference, responsive layout and preservation of draft/profile/offer/selection records. No horizontal overflow, console/runtime errors or remote requests were reported.
- `scripts/verify-delivery-model.mjs`: actual model/service functions through an isolated atomic test boundary, using the already-installed TypeScript compiler. Covers incompatible roles, impossible and stale transitions, real/past/invalid dates, pending proposal conflicts, opposite-role confirmation, withdrawal/rescheduling, message validation/ordering/idempotency, monotonic reads, two-sided completion, issues, decline/cancellation and invalid relationship/history rejection.
- `scripts/verify-delivery-resilience.mjs`: actual IndexedDB/browser checks for non-writing legacy adaptation, exact preservation of source image bytes, stale scheduling with answers retained, context changes between review and commit, wrong-provider thread access, issue validation/reload, quota failure/retry, concurrent messages, composer focus and scroll preservation, malformed/missing delivery records, explicit decline/cancellation, retained conversations and unavailable storage.
- Focused Stage 03–05 regressions retain draft autosave/photo/edit/delete recovery, provider profile/portfolio/verification handling, offer drafting/editing/withdrawal/comparison/selection and storage recovery. Legacy provider tests now expect functional Active Jobs and Messages empty states.
- PASS: ESLint (zero warnings), TypeScript, production build and all **37 production page routes**, plus the unknown-route 404 response. The final conversation/composer layout was also checked at every requested width after making its mobile action full-width; scrolling and keyboard-focus checks passed.

The initial mobile development run exposed a stale server/client navigation label after the new route match was added. A clean restart of the verified development server resolved it; the subsequent complete seven-width run reported no hydration errors. The shared sidebar was not redesigned. Repeated production builds encountered the previously documented OneDrive read-only/reparse-point cache issue under generated `.next/server` and `.next/static` output. Clearing only that verified production output restored successful build/route verification, preserving the separate `.next/dev` server output. No application or build-configuration workaround was added.

### Approved checkpoint review

Reviewed the 29 Stage 06 source, test and documentation files against checkpoint `f276c58`. Existing dependency files, original draft/profile models and persistence services, product specification and README are unchanged. Generated output, screenshots, diagnostic captures and runtime fixtures remain ignored; the checkpoint secret-pattern scan found no matches.

The previously observed Next.js development **1 Issue** indicator could not be reproduced in a fresh isolated browser across 11 routes: customer dashboard/My Jobs/active jobs, provider dashboard/active jobs, both conversation lists, and customer/provider selected-job workspaces and threads. Dev Tools showed no issue indicator, and the browser recorded no console or runtime errors. The selected-job fixture existed only in the isolated context, which was closed after inspection.

The existing development log contains older hydration warnings about an extra `location="127.0.0.1"` attribute on `<body>`. Neither the root layout nor served HTML contains that attribute, and no application source writes it. This is consistent with external browser DOM modification; the specific injector was not identified. No application defect was reproduced, and no interface change or additional hydration-warning suppression was introduced. Existing passing lint, TypeScript, production-build, 37-route and comprehensive browser/regression results remain applicable because checkpoint work changes only this documentation.

Commands: `node scripts/verify-delivery.mjs`, `node scripts/verify-delivery-model.mjs`, `node scripts/verify-delivery-resilience.mjs`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:routes`, plus the focused existing regression scripts. Browser scripts support the existing `SERVIFY_PLAYWRIGHT_PATH`, `SERVIFY_BROWSER_PATH`, `SERVIFY_PREVIEW_URL` and `SERVIFY_SMOKE=1` conventions. No package was installed.

## Product boundaries and future backend requirements

No remote authentication, secure account isolation, messaging infrastructure, WebSockets, SMS/email/push, payments/escrow/wallets/subscriptions, verification, dispute arbitration, public conversations, external calendars or ratings/reviews are introduced. Exact addresses are not required. Clearing site data still removes local records, and different origins/devices do not synchronize.

Production needs authenticated customer/provider IDs and RLS; normalized lifecycle/events/schedule/message/issue tables; foreign keys and unique selected-job/conversation constraints; server-validated transitions, atomic scheduling/completion operations and idempotency; controlled message access, retention/deletion and moderation; reliable delivery/read semantics; scheduling/timezone policies; cancellation/re-selection and issue-resolution policies. Existing OTP delivery/cost, launch coverage and verification/privacy decisions remain unresolved. None of these are represented as production capabilities in Stage 06.

## Local review

Use **http://127.0.0.1:3000** consistently. Start at `/customer/jobs`, `/customer/active-jobs`, `/conversations`, `/provider/active-jobs` or `/provider/messages`. Job workspace and thread links appear after selecting an offer. For an existing Stage 05 selection, switch to its provider context and explicitly accept or decline. The development server remains available. Stage 06 is approved for a local Git checkpoint; pushing, deployment and Stage 07 remain out of scope.
