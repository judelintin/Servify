# Stage 04 — Provider onboarding, profiles & workspace

Implemented locally on 31 October 2026, starting from approved checkpoint
`cb51c754`. The approved public/customer experiences, shared sidebar, mobile
navigation, Inter Tight, icons and design tokens are retained. No dependencies,
cloud resources, authentication, remote database/storage operations or marketplace
transactions were added. No commit, push or deployment was performed.

## Provider experience

- `/provider/dashboard` prioritizes the next incomplete section or profile review.
  Service/coverage summaries, work-sample counts and completeness come only from
  this browser's saved profile. There are no ratings, completed-job statistics,
  customer testimonials, live job feeds, offers or verification claims.
- `/provider/onboarding` has six guided steps: About you → Services → Coverage →
  Introduction → Portfolio → Review. Back/Next, reachable-step buttons, field
  hints, focused validation summaries and section-specific review edits preserve
  entered answers. The URL follows the active step so a stale entry query cannot
  send a reload back to an earlier step. Heading focus moves after navigation.
- `/provider/profile` displays the actual local draft or self-reviewed profile:
  professional name/type, optional photo, services/specializations, experience,
  general Ibadan coverage, introduction and work samples. Incomplete profiles
  remain editable. A fresh browser gets a helpful empty state.
- `/provider/verification` is an ephemeral requirements preview. It exposes only
  review-type selection and an acknowledgement checkbox. There are **no document
  inputs, identification-number fields, evidence uploads or real submission**.
  Selecting Preview requirements never changes **Not submitted** or
  **Verification unavailable in preview**, and never creates a badge. Choices are
  not persisted and reset on reload. Final requirements remain undecided.
- Existing available-jobs, offers, active-jobs and messages routes remain clear
  placeholders. The shared expanded/collapsed rail and saved preference are
  unchanged; no role-specific sidebar implementation was added.

The one local provider profile is a preview shared by people using the same browser
profile and origin. It is not an authenticated provider account, a public listing
or an application to join the live marketplace. Another hostname/port/device has
different storage. Clearing/evicting browser data can remove it.

## Fields, validation & portfolio

Required for final profile review: individual/small-business type; professional
name (2–100 trimmed characters); at least one configured service; whole years of
experience from 0 to 60; at least one general service area; introduction of
30–1,200 trimmed characters. Invalid steps do not advance and focus moves to the
error summary. Incomplete answers can still be saved with Save & exit.

Specializations are optional, configured per service, and removed when their
parent service is deselected. General service areas and categories reuse the
existing provisional catalogue via `features/provider/config.ts`. Neither these
options nor a provider's selection confirms launch coverage or actual supply.
No exact address, phone number, real identity evidence or identification number
is requested.

One profile photo and up to eight portfolio images are optional. Reuse the existing
local photo processor: JPEG/PNG/WebP signature inspection, nonzero file size up to
5 MiB, actual decode, maximum 30 megapixels, local JPEG re-encoding with 1600px long
edge and 1 MiB output cap. Original filenames/embedded metadata are not stored.
Visible sensitive details cannot be automatically removed: the picker explains
permission/privacy limits and excludes IDs from the intended content. Nothing is
uploaded. Photos can be previewed, replaced and removed; portfolio captions are
optional and limited to 300 characters. Replacement preserves the caption.
Existing Blob URL lifecycle management revokes URLs on replacement/unmount.

Completeness measures six visible sections: professional details, services and
experience, coverage, introduction, optional photo and optional portfolio. Four
required sections are sufficient to save/review without photos; optional images
increase the indicator but are not mandatory. The marker “Reviewed locally”
means the user finished the local review step, not that Servify approved anything.
Subsequent saves return the profile to an editable draft marker.

## Local data architecture

| File | Responsibility |
| --- | --- |
| `src/data/browser-storage.ts` | Shared IndexedDB open/schema and bounded record reads |
| `src/data/local-provider.ts` | Provider subscriptions, validated reads, revisions, transactions and fallback |
| `src/features/provider/profile-model.ts` | Versioned local profile contract, structural validation, completeness and form rules |
| `src/features/provider/use-provider-profile.ts` | Hydration-safe subscribed state |
| `src/features/provider/provider-onboarding.tsx` | Guided editing, serialized autosave and review |
| `src/features/provider/provider-components.tsx` | Shared provider notices, completeness, summaries and image management |
| `src/features/provider/provider-workspace.tsx` | Actual-data dashboard and profile presentations |
| `src/features/provider/provider-verification.tsx` | Non-sensitive, non-persisted requirements preview |
| `src/features/provider/provider.css` | Feature-scoped layouts with approved tokens |

The **same IndexedDB database** `servify-local-drafts` is upgraded additively from
version 1 to 2, adding `providerProfiles` alongside `drafts`. No existing customer
record, key, revision, Blob or schema is rewritten. Customer initialization/reads
reuse the extracted shared primitives; its forms, writes/deletion and data model
are unchanged. Browser test inspection opens the current version rather than
requesting a downgrade to version 1. There is no production database migration.

The provider store contains one record keyed `local-provider`, with `schemaVersion:
1`, revision, timestamps, last step, local review marker and whitelisted content.
Structural validation accepts incomplete drafts, limits arrays/text/media and
strips unknown fields. Malformed/future-schema records are left untouched and the
editor is blocked rather than overwriting them. This local contract remains
separate from the future authenticated `ProviderProfile` domain type.

Changes autosave after approximately 650ms; Next and Save & exit also persist.
Writes are serialized and check the expected revision within the read/write
transaction. A stale tab cannot overwrite newer changes. Conflicts keep current
answers visible and require reloading the latest profile. BroadcastChannel and
focus refresh keep other views current; revision checks do not depend on broadcasts.
Wait for Saved on this browser or use Save & exit before closing. Unsaved edits
and photo processing install an unload warning; leaving the editor attempts a
best-effort flush.

Open/read operations have four-second timeouts, as do provider writes. Unavailable,
blocked or stalled storage settles into explicitly temporary tab-only mode; reload
loses temporary edits but does not erase existing persisted profiles/drafts. Older
open tabs may block an additive upgrade; close them and reload to retry. A late
abandoned connection is closed. Failed writes keep answers in the editor, report
failure, and do not navigate or claim success. Successful retry clears the error.
Cross-tab schema changes close connections and ask the user to reload.

## Secure verification plan for a later stage

Before collecting evidence, resolve acceptable documents, purpose/consent, reviewer
policy, eligibility, retention/deletion, correction/appeal routes and user-facing
verification claims. Confirm authentication/account recovery and OTP delivery,
cost and regional availability first; SMS is not assumed available or free.

A future authenticated backend would authorize provider ownership server-side,
validate all fields/files, and keep evidence separate from public profile media.
Use private Supabase Storage with restrictive RLS, short-lived authorized access
and minimal reviewer permissions; never public URLs, browser-local ID copies,
client-side service-role keys or document contents in logs. Validate decoded content,
limits and allowed formats server-side, quarantine/scan uploads where appropriate,
and record authorized review actions in an auditable history. Enforce retention
and deletion through backend processes. Only an authorized, recorded decision
could set a future verification status. The present frontend cannot make one.
Verification must not be described as a guarantee of skill, safety or job quality.

Launch coverage/taxonomy, privacy/retention, real ownership, verification operations,
cancellations and disputes remain product decisions. Moving any data into a live
system requires a separate authorized design, server validation and RLS tests;
browser-local records are untrusted and are not automatically imported.

## Verification & local review

`scripts/verify-provider.mjs` uses existing bundled Playwright; no test dependency
is installed. It covers onboarding progression and required-field focus, profile
save/edit/reload, photo/caption persistence, replace/remove and invalid/count/size
rejection, dashboard summaries, verification safety/states, preserved placeholder
routes, mobile disclosure and desktop collapse controls. Viewports: **1440, 1366,
1024, 768, 430, 390 and 320px**. Assertions check overflow and main/heading landmarks;
reduced-motion contexts and representative screenshot review cover layouts.
Additional cases cover unavailable storage, stalled reads, failed writes/retry,
malformed records, competing-tab conflicts, and preservation of a genuine version-1
customer draft after provider writes to version 2. Browser fixtures are isolated
and closed, leaving the review browser's records untouched. Screenshots/results
live under ignored `artifacts/stage-04/`.

Checks: ESLint, TypeScript, production build, production routes; provider browser
suite across seven widths; focused production provider/customer flows; existing
customer posting/autosave/restore/edit/delete/failure regression; and shared
sidebar checks. No browser runtime/console errors, third-party requests or POST
mutations are accepted. This is focused verification, not full WCAG certification.

Final results: **PASS** for all checks above, including customer initialization
regressions on both loopback hostnames. Zero browser runtime/console errors and
zero remote mutations were recorded. The optional-photo/zero-experience
small-business path, specialization pruning and failed-write retry also passed.
There are no remaining Stage 04 implementation blockers; the live-service product
and security decisions described above remain prerequisites for a later stage.

```powershell
npm run lint
npm run typecheck
npm run build
npm run verify:routes
# Use the same SERVIFY_PLAYWRIGHT_PATH / SERVIFY_BROWSER_PATH settings as Stage 03.
node scripts/verify-provider.mjs
# SERVIFY_SMOKE=1 runs the provider lifecycle at 390px for focused iteration.
```

Review: **http://127.0.0.1:3000/provider/dashboard**. Onboarding is
`/provider/onboarding`, profile `/provider/profile`, and verification preview
`/provider/verification`. The development server remains running for visual review.

## Targeted control refinement — 31 October 2026

The approved dashboard, six-step onboarding, professional profile and persistence
behavior are retained. Only these presentation controls changed:

- The shared sidebar toggle uses panel-left-close/open SVGs in the existing icon
  system, matching the weight and geometry of the approved icons. No icon package
  was added. The button is borderless with a subtle blue hover/focus surface, a
  visible keyboard focus ring, its existing expanded state/control relationship,
  and focus/hover tooltips in both states. Customer, provider and admin all use the
  same control; navigation, saved preference and mobile disclosure are unchanged.
- The provider **desktop sidebar header** keeps the Servify wordmark and orange
  accent without the redundant “for Pros” suffix. The SERVIFY FOR PROS workspace
  label below it is retained. Mobile branding and other role branding are unchanged.
- Profile-photo add/replace actions are styled secondary buttons with an upload
  icon. Real native buttons open the existing native file chooser through a hidden
  file input, supporting pointer and keyboard activation and an explicit focus
  ring. Disabled/busy states and privacy/format/size hints are preserved. The
  existing image-processing handler, previews, validation, file-size limits,
  local autosave/storage and removal are unchanged. Portfolio controls were not
  redesigned.

Focused coverage lives in `scripts/verify-stage-04-refinement.mjs`: both panel
states and tooltips across desktop roles, provider wordmark/section label,
keyboard upload-dialog activation, image add/replace/reload/remove, invalid file
and size rejection, mobile disclosure and overflow at all seven requested widths.
Artifacts are ignored under `artifacts/stage-04-refinement/`. Run with the same
bundled Playwright environment settings as the Stage 04 suite. Lint, TypeScript
and production build checks cover the changed files; unrelated comprehensive
audits were not repeated. No dependencies, commits, pushes or deployments.

Final refinement results: **PASS** at 1440, 1366, 1024, 768, 430, 390 and
320px. Space-key activation opens the native file chooser; photo add/replace,
reload, removal and invalid-file/size rejection pass. Shared control hover/focus
tooltips, icon states, saved preference and mobile disclosure pass. Focused lint,
TypeScript and production build pass; browser runtime/console errors: zero.

## Checklist & photo-action usability fixes — 31 October 2026

Two confirmed causes were reproduced in isolated Chrome desktop and mobile-touch
contexts before changing the controls:

1. The completeness row's text was a link, but its adjacent plus/check indicator
   was a sibling outside the link. Clicking the indicator therefore did nothing.
   The icon, text and added/not-added accessible status now belong to one link
   targeting the existing onboarding step. The same 44px row target covers both
   incomplete and completed entries; the existing visual indicators are preserved.
2. A fresh profile's upload action already opened the native file chooser. After
   saving a photo, however, the primary action was disabled by the one-photo
   capacity rule. A separate replacement action existed farther down the page,
   making the prominent Upload action appear broken. The primary action now reads
   **Change profile photo** when a photo exists, remains enabled unless processing,
   and replaces the existing photo through the same validated handler. The separate
   Replace action still works. The one-photo limit is preserved. No broken input
   association, obstructing overlay, hidden-input defect or JavaScript error was
   reproduced; the native picker mechanism did not need replacement.

`scripts/verify-provider-usability.mjs` records the baseline with
`SERVIFY_BASELINE=1` and runs the fixed regression checks without that flag, using
the existing bundled Playwright settings. Actual native chooser events are tested
by mouse click at 1440px and touch tap in mobile-emulated contexts at 390/320px;
synthetic images are selected through the chooser, rather than assigning files
directly to an input. Checks cover all six incomplete indicators and correct
step destinations, completed indicators, keyboard link activation/focus, initial
photo preview, primary and secondary replacement actions, invalid/oversized files,
save/reload of the professional profile, and removal. All passed, with zero browser
runtime/console errors and no overflow. Results live under ignored
`artifacts/provider-usability/`.

Focused ESLint and TypeScript checks also passed.

Only provider checklist/picker presentation and their small gap rule changed.
No storage schema, saved provider/customer records, processing limits, completeness
calculations, routes, or other marketplace workflows changed. Test records stay
in isolated browser contexts; existing review data is untouched. No dependencies,
commits, pushes or deployments.

## Final local checkpoint review — 31 October 2026

Reviewed the complete Stage 04 diff on `main` against the approved Stages 01–03
checkpoint `cb51c754`. It contains the provider feature, additive local storage
support, provider routes, shared sidebar/icon refinements, regression scripts and
this documentation. The latest full-row completeness links and active primary
Change profile photo action are included. No Stage 05 work is included.

The previously observed Next.js development “1 Issue” indicator was **not
reproduced**. A fresh isolated browser inspected development tool buttons and
captured warnings, console errors and uncaught exceptions on provider dashboard,
onboarding, profile and verification, plus customer dashboard and job posting.
It also created a synthetic profile/photo, reloaded the profile, followed a
completeness icon and opened the native replacement picker. Only the normal
Open Next.js Dev Tools button was present; no issue badge/overlay, console warning,
console error or runtime exception was recorded. There is no evidence identifying
the historical indicator's cause, so no speculative application fix or diagnostic
suppression was made. Diagnostic output remains in ignored artifacts.

Existing Stage 04 responsive, persistence, migration, accessibility, lint and
TypeScript results were retained rather than rerunning comprehensive suites.
The final production build verifies the latest interaction changes. Browser checks
used disposable contexts and did not clear or alter review-browser profiles or
customer drafts. Staged whitespace and credential-pattern checks are required
before the local checkpoint; environment files, screenshots, build output and
temporary diagnostics remain ignored. This checkpoint does not push or deploy.
