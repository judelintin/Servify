# Mobile Stage 06 — Reviews, ratings and professional reputation

Built on `19bf2553ab5949ad7dbd2b6976444c1f5020c730`. Stage 06 and its iPhone review are approved by the user for the local checkpoint `feat: complete Servify mobile reviews and reputation`. Website, Netlify, Expo account/configuration, existing drafts, profiles, portfolio images and conversations remain unchanged. No dependencies or cloud resources are introduced.

## Eligibility and product rules

The review model and actions are adapted from web Stage 07 (`src/features/trust/model.ts`, `src/data/local-trust.ts`). A review requires a delivery in `completed`, with its last history event being an explicit customer `complete`. A selected offer, professional completion request, cancellation or issue report alone never makes a job reviewable. The job customer and selected professional identities come from that delivery; mode switching is a local preview identity, not authentication.

Ratings are required integers 1–5. Written feedback is optional and limited to 2,000 characters, including rating-only reviews. One review record is allowed per job. Customer corrections append versions rather than creating another review. Web parity permits up to 30 review versions with no local edit deadline, retains the initial submission timestamp and does not change visibility when editing. Stale revision or duplicate initial submissions are rejected. Adding a review never changes job state, completion history, accepted offer or source request.

Completed-job details and My Jobs progress cards expose Leave a review or View completed-job review. Customer Home surfaces actual eligible jobs without feedback. The review screen names the job and actual selected professional, provides keyboard/screen-reader-labelled stars with visible selection/focus states, optional feedback guidance, validation, preview/confirmation and success only after a durable write. Existing comments, rating, latest date, original submitted date and retained-version count are shown. Private addresses/contact details are discouraged; no automatic redaction is promised.

## Professional responses and reputation

The professional Profile contains a dedicated Reviews & reputation section. The Reviews route lists genuine locally saved feedback with service category, customer-preview attribution, timestamps and distinct professional-response treatment. Professional Home shows reputation only when eligible visible reviews actually exist, preserving onboarding and work-progress priority. No five-star placeholder, fake testimonial, fictional customer, earnings, real-world verification or marketplace activity is introduced.

Average rating uses the latest rating version from every eligible, non-hidden review for the fixed local professional identity, displayed to one decimal. Count uses that same eligible set. With no eligible visible reviews, the average is null and the interface says No reviews yet. Profile completeness and reputation are explicitly separate. A response does not affect the rating or count. Rating distribution is intentionally omitted as optional scope.

Only the selected professional can respond to a visible review. Response text requires 3–2,000 characters. Initial response and edits use the parent review revision, maintain one response, preserve its stable ID and timestamps, and append up to 30 versions. Response edits follow web rules, including retaining a hidden response's visibility. New mobile response records have an explicit stable ID; web's nested response shape without a separate ID is accepted for compatibility. Reopening a restricted response editor as its author can show the author's own text; customers do not see hidden response text.

## Visibility and reporting compatibility

Hidden reviews are excluded from provider-wide lists and reputation. Within an owned customer job, a hidden-review notice replaces the card's content, while the customer may correct their own feedback under the web rule; corrections do not restore visibility. Professionals cannot respond to hidden reviews. Hidden responses have a neutral placeholder and do not expose their text to the customer. Their parent review still contributes if the review itself is visible.

The compatible trust aggregate retains reports and audit records. Participants may create a clearly labelled local report against a review/response using the web reasons and up to 1,000 explanation characters. One pending report per actor/target is allowed. A pending report does **not** automatically hide content or remove a rating, matching web behavior. Saving a report explicitly states that no moderation team was notified and visibility is unchanged. There is no mobile admin dashboard or moderation mutation API. Existing hidden flags/report statuses/audit history are preserved; no claim of real moderation is made.

## Persistence and migration

The established `servify.mobile.marketplace.v1` key now stores schema 3 with `trust: {reviews,reports,audit}` beside the existing jobs, offers and deliveries. Schema 1 and 2 load non-destructively, adapting legacy selected jobs as before and supplying empty trust arrays. No read-time reset or write occurs; a subsequent successful explicit mutation persists schema 3. Older application versions cannot edit schema 3 and must not be used to downgrade its records.

Reviews carry stable ID, job/professional/customer references, revision, hidden flag, versioned ratings/text and an optional versioned response. The parser validates completed-job eligibility, ownership, one review per job, unique record IDs, field/version limits and report/audit relationships. It preserves history and existing job/media records. Limits remain web-compatible: 50 reviews, 30 versions per review/response, 500 reports and 1,000 audit entries, plus aggregate metadata limits.

All mutations reuse the atomic aggregate writer: busy/tap guards, baseline and revision checks, bounded reads/writes, confirmed-state publication only after persistence and explicit storage retry. Failed saves leave the previous confirmed review/reputation unchanged and retain editor input. Retrying after an uncertain write reads/adopts valid disk records before allowing further changes; a committed/stale revision cannot silently overwrite feedback. Malformed/unsupported stored data is preserved and blocks automatic replacement. These are device-local best-effort protections, not cross-process database transactions. Unsaved typing is not autosaved and may be lost on app termination; use Preview/Confirm feedback before leaving.

## Verification

- `verify:trust` passes eligibility, invalid ratings/text, rating-only reviews, role/ownership guards, duplicate/stale submissions, versioned customer edits, response creation/edits and stable response IDs, failed-save recovery, hidden-review reputation, pending report behavior, schema migration/restart and unchanged lifecycle state/history.
- Existing delivery and marketplace domain suites pass compatibility regression checks. Existing request/profile suites also pass; final lint (zero warnings), TypeScript and web/Android/iOS-Hermes exports pass.
- `verify:trust-browser` passes in isolated synthetic contexts at 320/390/430px, exercising customer completion, star keyboard selection/validation, rating-only submission, customer edits, professional profile/reputation, response/edit, mode switching and reload. Separate contexts check denied-save recovery, hidden content/reputation and incomplete-job restriction. All final browser cases pass with no captured page/console errors or horizontal overflow; screenshots were inspected. No genuine user records are seeded or modified.
- Screenshot review identified and corrected stray JSX whitespace under native Views and a stale rating-validation message after valid selection. The affected browser checks and platform bundles were rerun successfully.
- Screenshots, browser fixtures/results and exports remain ignored runtime artifacts. No test data is installed in the reviewer's storage.

## Native review and dependency limitations

The user approved the Stage 06 iPhone review for this checkpoint. Codex had no direct physical-device framebuffer or iOS simulator, and detailed device/accessibility coverage was not separately reported. Browser checks and native bundles alone do not establish native approval. Remaining detailed acceptance coverage includes VoiceOver and star announcements, larger text, keyboard/scroll and safe-area variations, back navigation and force-kill restoration. Stage 05's Android hardware back and HEIC/limited-photo-library checks remain documented. Approval is user-reported; no additional device-test results are inferred.

No dependencies installed/upgraded; lockfile unchanged. The recorded dependency-audit baseline remains 19 moderate, zero high and zero critical, covering the existing glob/minimatch-related Expo/ESLint paths. This is the prior finding, not a fresh registry scan. No incompatible downgrade is applied.

## Deferred backend work and local review

Future backend integration must authenticate job participants, enforce completed-job eligibility and ownership server-side/RLS, require a unique job review, transactionally append versions and update revision, derive reputation only from eligible visible records, preserve response/report/audit relationships, implement moderation authorization and retention/privacy policy, and explicitly migrate local records/media with consent. No Supabase connection, live notifications, cross-device sync, admin interface or payments are implemented.

Existing Expo Go server/tunnel remains available: `http://127.0.0.1:8081/` and `exp://c-lintin-23gwt2-mw4ykjcwx82r57jm.on.expo.app`. The public iOS manifest returned HTTP 200 with SDK 58 during final verification. Reload the current app or scan the Stage 05 QR, using the same SDK 58-compatible Expo Go/account as before. No account ownership changes, pushes or deployments are included; only the requested local checkpoint is authorized. Keep this computer and tunnel online; each phone has separate local records.
