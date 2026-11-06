# Mobile Stage 05 — Job lifecycle, scheduling and messaging

Built on `1e657748e42badba3e09f92b3160d57a06668677`. Approved by the user after iPhone testing for the local checkpoint `feat: complete Servify mobile job lifecycle and messaging`. Next.js website, Netlify, Expo account/configuration, dependencies and existing photo namespaces remain unchanged.

## Lifecycle and permissions

The mobile delivery model, parser and action rules are adapted from web `src/features/delivery/model.ts` and `src/data/local-delivery.ts`, without modifying those files. Stable job/offer references connect each selected opportunity to exactly one delivery and one conversation. The original request and accepted offer are preserved.

| Current state | Action | Role | Result |
| --- | --- | --- | --- |
| awaiting_confirmation | Accept / decline | Selected professional | confirmed / cancelled |
| awaiting_confirmation | Cancel with reason | Customer | cancelled |
| confirmed or scheduled | Cancel with reason | Either participant | cancelled |
| confirmed or scheduled | Propose future appointment | Either participant | Same state, pending proposal |
| confirmed or scheduled | Confirm pending proposal | Other participant | scheduled |
| confirmed or scheduled | Withdraw pending proposal | Its proposer | Same state |
| confirmed or scheduled | Start, with no pending proposal | Professional | in_progress |
| in_progress | Request completion, optional notes | Professional | completion_requested |
| completion_requested | Confirm completion | Customer | completed |
| confirmed, scheduled, in_progress, completion_requested | Report unresolved issue | Customer | issue_reported |

`confirmed` means the professional explicitly accepted and scheduling is pending. Web parity deliberately allows starting accepted work without a formal appointment, but never while a proposal remains pending. Selection alone never implies acceptance, scheduling, work or completion. Cancellation/decline reasons require 10–1,000 characters. Completion notes are optional, up to 1,000 characters. Important actions require a confirmation dialog. Stale revisions or repeated transitions are rejected without contradictory updates.

## Scheduling

Proposals have stable IDs, date, start/end HH:mm, optional notes (up to 1,000 characters), proposer identity, timestamps and pending/confirmed/superseded/withdrawn status. Dates must be real, the start strictly in the future and the end after the start. Validation explicitly uses Ibadan/WAT (`+01:00`), independently of device time zone. Native date selection reuses the existing platform picker; browser date entry uses one labelled YYYY-MM-DD field. Time inputs state their required 24-hour WAT format.

Only the other role can confirm. Expired proposals cannot be confirmed; the proposer can withdraw or either role propose a future window. A replacement supersedes the previous pending proposal. The last agreed appointment stays current until the replacement is confirmed, then becomes historical. Schedule and event history retain proposer/confirmer attribution. No calendar integration or actual appointment notification is created.

## Conversations

Messages tab lists actual selected-job conversations, latest message preview, sender and timestamp. Job detail and selected-offer/request screens also link to the same job and conversation. Customer and professional role identities are explicit and derive from the current local mode; records are restricted to the fixed local participants, not invented accounts.

The conversation has an inset-aware, multiline composer (up to 2,000 characters), first-invalid focus, bounded bubbles, timestamps in WAT and an honest empty state. It uses existing keyboard avoidance. Scrolling follows new content when already near the bottom, and follows an explicitly sent message; reading older messages does not force repeated jumps. No fabricated replies, delivery/read receipts, attachments, calls or real notifications are shown. Message text and history remain on this device. A stable retry identifier and synchronous tap guard prevent repeated sends; failed writes retain the composer text. Messages remain accessible in historical jobs, as on the web. Opening a conversation never generates replies or asserts that the other person read it.

## Progress, completion and issues

My Jobs retains source drafts and published opportunities, adding actual delivery cards with status filtering, selected professional, confirmed schedule and job navigation. Find Jobs links to Active Jobs. Active Jobs includes selected/accepted and historical work, status filters, scheduling, conversations and permitted progress actions. Home screens add compact real progress summaries without changing the approved hero or introducing earnings/activity metrics.

Professional completion requests record notes/history and wait for explicit customer confirmation. No rating or review is generated. Issue categories match web: work quality, unfinished/different work, timing/attendance, other. Only the customer can report in the eligible states; description requires 15–2,000 characters and review/confirmation. Reporting records an unresolved local case, transitions the job to issue_reported and withdraws pending scheduling proposals. No support agent, refund, payment dispute or mediation is implied; no admin resolution UI is implemented.

## Persistence and compatibility

The existing `servify.mobile.marketplace.v1` key now holds schema 2 with deliveries inside the same aggregate. Schema 1 is adapted on read: each selected offer creates an awaiting-confirmation delivery using the stable selected job/offer IDs and selection timestamp. Reading alone does not write or delete legacy data; the next successful explicit mutation persists schema 2. Non-selected requests/offers, customer draft keys, professional profiles and photo/portfolio files remain intact. Old schema-1 application code cannot understand schema 2 and should not be used to edit migrated data.

The Stage 04 atomic aggregate writer, bounded hydration, busy guards, baseline checks, explicit retry and uncertain-write handling remain in use. Delivery revision guards protect status/schedule changes. The parser checks ownership, IDs, schedule consistency, message sequences, valid history transitions and selection relationships. Unsupported/malformed data is preserved and blocks automatic replacement. A failed save never replaces the last confirmed in-memory state. Input remains visible for retry; unsent text and unsaved scheduling/issue notes are not promised to survive force-killing the app.

Limits inherited from web: 50 selected deliveries, 150 events/job, 30 schedule proposals/job, 20 issues/job and 500 messages/conversation, plus the Stage 04 aggregate-size cap. Limit errors preserve existing records. Local storage is not a database CAS across processes, and native timeouts cannot cancel indefinitely pending writes. No automatic reset or destructive recovery is offered.

## Verification

- `verify:delivery`: passes legacy selection migration, role and invalid-transition guards, schedule/reschedule ownership, pending-proposal start prevention, message ID idempotency, conflicting retries, denied-write recovery, completion/restart and independent customer issue reporting.
- Existing `verify:marketplace`, `verify:requests`, `verify:professional` pass compatibility regressions.
- `verify:delivery-browser` passes at 320/390/430px: legacy selected request, professional acceptance, cross-role scheduling, both message identities, empty-send validation, work start, completion request, customer completion and reload persistence. Selected offer is preserved, no page errors or horizontal overflow. Screenshots inspected.
- Final 390px smoke passed after the date-input refinement. `verify-delivery-navigation.mjs` passes Messages-tab context navigation, empty conversation, Active Jobs filtering and Home links.
- Independent browser context at 390×640 passes issue validation/submission/reload and failed-message storage: retained text, explicit retry, one persisted message and one issue. Synthetic records are seeded only in isolated browser contexts; reviewer data is not touched.
- Final mobile lint (zero warnings), TypeScript and web/Android/iOS-Hermes exports pass. Initial type errors were stale generated route types during Expo startup; regenerated types resolve the new routes without casts. An invalid ScrollView instance type was corrected to the React Native 0.88 component-ref type. Lint import ordering was corrected.

## Native acceptance and dependencies

The user approved Stage 05 after iPhone testing. Codex has no direct iPhone framebuffer or iOS simulator; the exact device-test coverage was not separately reported. Browser screenshots and native bundles alone do not establish native approval. Continued device acceptance coverage includes: native date picker and WAT time entry; composer keyboard opening/closing; long message scrolling and sending; confirmation dialogs; safe areas; fixed tab navigation; role switching; schedule replacement; issue path; and restart persistence with your existing drafts/profile/portfolio intact. Existing HEIC/limited-photo-library, Android hardware-back and force-kill acceptance checks remain outstanding.

No dependencies added/upgraded and lockfile unchanged. The recorded audit baseline remains 19 moderate, zero high and zero critical (existing glob/minimatch-related Expo/ESLint paths). This is the previous audit finding, not a fresh registry scan; no incompatible downgrade was applied.

## Deferred backend migration

Future integration must replace mode-based identities with authenticated ownership and server-enforced access control, RLS and foreign keys; validate transitions and schedule times server-side; transactionally commit status/history/issues; enforce unique job conversations and idempotency keys; paginate message histories; establish retention/privacy policies and moderation; and explicitly migrate device-local records/media with consent. Real-time delivery, read receipts, notifications and infrastructure are deferred. No Supabase connection, cloud resources, payments, reviews, deployment, Git commit or push is included.

## Local review

The old Expo process had stopped. Expo was restarted using the existing command `npm start -- --go --tunnel`, without changing account ownership. Browser: `http://127.0.0.1:8081/`. Fresh tunnel: `exp://c-lintin-23gwt2-mw4ykjcwx82r57jm.on.expo.app`. Scan the fresh terminal QR or review PNG. SDK 58-compatible Expo Go must use the same Expo account as the CLI. Data is not synchronized between phones; use role switching on one device for the complete journey. Keep this computer and tunnel online. Stage 05 is approved for the requested local Git checkpoint; no push or deployment is authorized.
