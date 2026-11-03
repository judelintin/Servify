# Stage 07 — Reviews, ratings and trust

Stage 07 adds browser-local completed-job reviews, provider responses, reports and admin-preview moderation. Existing requests, offers, selections, deliveries, messages, schedules, profile images and drafts remain intact. No packages, authentication, cloud resources or external moderation services were added.

## Review policy and integrity

A review references the existing job and selected provider. Eligibility requires a completed delivery whose final event is customer completion; the existing lifecycle parser validates that event and its participant. Only its `local-customer` actor can submit or edit the review. Provider-role submission is rejected. There is one review per job, including hidden reviews. A required integer rating of 1–5 and an optional comment (maximum 2,000 characters) are reviewed before saving. No sample reviews are seeded in review-browser storage.

Local editing has no time deadline and retains up to 30 versions. Editing updates the same record, retains all earlier rating/text timestamps and preserves moderation visibility. A pinned revision prevents a background update from silently overwriting unfinished edits. These are preview policy choices, not production eligibility guarantees.

The provider associated with the selected offer can add or edit one response, with 3–2,000 characters and up to 30 retained versions. Its current active preview context is checked inside the transaction. It cannot alter the customer's rating or text. Responses never change numeric reputation.

## Reputation and visibility

All views use the same calculation: visible, valid reviews connected to completed jobs for the exact immutable preview-provider ID. The average is displayed to one decimal place alongside the actual count. Empty or fully hidden histories show **No reviews yet**, not zero stars. Provider profiles/dashboard and offer summaries link to the provider's history. Customer review cards use **Completed-job review · local preview**. The editable Stage 04 profile is distinct from the explicitly selected preview-provider snapshot; the reputation panel labels this distinction.

There is no Trust Score or independent identity/work verification. Any future score needs defined evidence (eligible job outcomes, moderation and verification policies), bias/abuse assessment, appeal rules and transparent limitations before implementation.

## Reports and moderation

Customers and valid provider preview identities can report a review or response for abuse, personal information, misleading content, spam or another concern. Explanations are optional and capped at 1,000 characters. Reports preserve target, actor, reason, timestamp and pending/reviewed/dismissed state. Duplicate pending reports by the same actor for the same target are rejected. Submission never hides content automatically.

`/admin/reviews` provides the review count, pending queue, report history, reported content, linked completed-job context, edit history and moderation audit. An explicit checkbox enables `local-admin` preview actions; it is not secure administrator authentication. Moderators can mark reviewed, dismiss, hide or restore reported content with a 3–1,000 character note. Every action records an immutable audit entry and timestamp. Hiding a review removes its rating and response from public-facing views; hiding only a response leaves numeric reputation unchanged. Restore recalculates from the same original review. Admin operations use the latest reviewed aggregate revision and reject stale actions.

## Data and recovery

The IndexedDB database remains version 3. The existing marketplace aggregate advances from record schema 1/2 to schema 3 by non-writing read adaptation, adding a `trust` object with reviews, reports and audit entries. Original stores and record relationships are unchanged. The next explicit mutation persists the adapted aggregate. Older application parsers block unknown future schemas instead of overwriting them.

`src/features/trust/model.ts` defines contracts, eligibility, reputation and validation. `src/data/local-trust.ts` uses the existing atomic marketplace transaction boundary. Rating/text versions, response ownership, unique job reviews and pending reports, actor identities and references are validated before persistence. Invalid records block preview changes through existing recovery notices, without deleting saved data. Quota and stale failures retain form answers. Limits are 50 reviews, 500 reports, 1,000 audit entries and 30 versions per review/response; reaching limits does not evict history.

All content renders as escaped React text. Exact addresses, contact information and identity documents are not requested. Local identities and role controls do not establish secure account isolation, independently verified customers, production-grade moderation or real-world purchases. Clearing browser data removes local records, and devices/origins do not synchronize.

## Verification

- `scripts/verify-trust.mjs` extends the existing real UI lifecycle journey: request → publish → offer → select → accept → schedule → work → completion → rating/comment → edit → provider response → reports → admin hide/restore → reputation recalculation → reload. Uses isolated contexts at 1440, 1366, 1024, 768, 430, 390 and 320px, retaining the existing lifecycle preservation assertions.
- `scripts/verify-trust-model.mjs` checks actual services through the established isolated atomic test boundary: ineligible jobs, wrong roles/providers/jobs, invalid ratings, duplicate/stale submissions, optional comments, edit history, response ownership, duplicate reports, admin/stale checks, hidden averages, restoration and malformed relationships. It also runs the existing lifecycle model rules with the current aggregate schema.
- PASS: full journey at all seven requested widths; model integrity checks; the existing Stage 05 marketplace regression; focused browser stale-edit, quota rollback and malformed-trust recovery. Review/report forms, provider responses, offer reputation and admin views were checked for overflow at all seven widths, with 320px captures visually inspected.
- `scripts/verify-trust-resilience.mjs` reuses isolated legacy fixtures and checks incomplete-job denial, competing editors retaining answers, failed saves retaining the composer, persisted-original recovery and corrupted trust relationships.
- PASS: ESLint, TypeScript, production build and all 42 page routes plus 404. Browser checks capture console/runtime errors and remote requests. Runtime fixture data and captures stay under ignored artifacts.

## Review and deferred decisions

Local preview: http://127.0.0.1:3000. Customer history: `/customer/reviews`; completed-job review: `/jobs/[jobId]/review`; provider profile: `/provider/profile`; provider response workspace: `/provider/reviews`; customer-facing history: `/providers/[providerId]/reviews`; admin queue: `/admin/reviews`. Start from a completed job to create real local feedback. The development server remains running; Stage 07 is approved for a local Git checkpoint; pushing, deployment and Stage 08 remain out of scope.

Production still requires authenticated ownership/RLS, server-side completed-job eligibility, unique constraints and idempotency, durable audit/version tables, rate limits, abuse detection, privacy retention/deletion, moderation standards and appeals. Edit deadlines, anonymization, report repeat policy and moderator authority remain product-policy decisions. No production backend, verification, moderation API, deployment or Stage 08 work is included.
