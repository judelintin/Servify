# Servify Mobile Stage 02 — Customer requests

Implemented locally on `main`, following Mobile Stage 01 checkpoint `fe6b73f`. No commit, push, deployment, backend connection or website changes. The existing Professional Home, guidance, tabs and role selection are preserved. Customer drafts never appear as professional opportunities.

## Completed experience

The existing `/post-job` route now supports all seven steps. The approved service cards, photography, brand, navigation and reduced-motion behavior remain in place.

| Step | Inputs and behavior |
| --- | --- |
| Service | Existing six categories, one required; blue selection, checked state and keyboard support preserved. |
| Details | Title: 10–120 characters; description: 30–5,000 characters. Labelled inputs, examples, counters, multiline input and field errors. No contact information or exact address required. |
| Photos | Optional, up to eight. Add, preview, replace and remove; cancelled selections leave existing photos intact. |
| Area | Configurable web-aligned Ibadan catalogue, including “Another area in Ibadan”. General areas only; options do not promise launch coverage. No GPS permission. |
| Timing | As soon as practical, next few days, flexible, or a preferred date. Calendar-valid date must be today or later in Africa/Lagos. Native date picker, explicit iOS confirmation/cancel; labelled date text entry on web. Not a confirmed booking. |
| Budget | Quotes or NGN range. Positive amounts up to NGN 100,000,000, at most two decimal places, maximum at least minimum. Numeric keyboard and formatted review; no suggested market prices. |
| Review | Full details and compact photos, section-specific editing, final validation and local-save confirmation. No publishing or provider delivery. |

Progress updates per step. Back, header back and Android hardware back retain progress; at the first step they save and leave for My Jobs. Save & exit is available throughout. Backgrounding and unmount flush pending changes. Form actions sit outside the scrolling content and respect bottom safe-area insets; keyboard avoidance uses iOS padding/Android height. Invalid category/title/description/budget fields receive focus; other invalid steps focus the heading and announce errors. The first error also remains visible above bottom actions, so it cannot disappear below long content.

My Jobs shows actual local drafts, category, area, update date, draft status, progress and a viewing action. Search covers title, description, service and area. Details support full wrapping text, compact photos, specific-step editing and confirmed deletion. Customer Home uses recent drafts sorted by update time; its approved hero and service navigation are unchanged. Empty states remain honest about local-only functionality.

## Model and persistence

`src/domain/requests.ts` contains portable content, photo and draft types, validation and labels. Each draft has a stable local ID, revision, timestamps, `status: draft`, active step, reviewed flag and content. Incomplete records are valid autosave data; final saving checks all required steps again. Maximum 50 drafts.

Metadata uses AsyncStorage at `servify.mobile.requests.v1` with an explicit versioned envelope. The existing `servify.mobile.preview.v1` mode/starter store remains intact. When no request envelope exists, Stage 01 starters are adapted without changing IDs, creation/update timestamps or category. Hydration does not rewrite their original raw storage. Subsequent edits use the new envelope; deletion persists an empty/list envelope, so legacy starters are not reimported on ordinary reload. The legacy source remains a compatibility backup, not an active duplicate list.

Changes debounce for 350ms; navigation, explicit saves, backgrounding and unmount flush immediately. A serialized queue and stable form ID prevent repeated saves from creating duplicates. The draft ID is added to the route after creation, fixing a confirmed issue where reloading a newly started request previously opened a blank form instead of its saved active step.

Writes update in-memory records first. Revision checks reject stale edits/deletions. Before each write the store compares current disk content with its last known baseline; an external change switches to session-only mode rather than silently replacing other records. These are best-effort guards, not a cross-process atomic database transaction.

Reads/writes have four-second bounds. Unreadable/unknown versions remain untouched. Failure retains current data in memory, shows session-only feedback, and exposes Retry device storage. Retry verifies the disk baseline before persisting; malformed records or changed baselines block automatic overwrite and explain why. A successful persistent-save confirmation appears only after a successful write. Timed-out native operations cannot be cancelled; an uncertain late write or changed baseline requires preserving the session and reconciling records rather than forcing replacement. A process killed during a debounce or OS write can lose the latest unfinished keystrokes; autosave is not a backup service.

## Photos

The approved final Photos-step refinement groups each fixed-size preview, numbered label and compact Replace/Remove actions in one card. A lighter Add photos action, count, shorter guidance and tighter lower spacing preserve all original form/storage handlers. Focused checks at 320/390/430px passed add, multiple selection, replacement, removal, restoration, keyboard focus, 44px touch targets, stable preview dimensions and Save & exit/Back/Next. No overflow or console errors were observed. Other screens were unchanged by this refinement.

Necessary Expo-compatible additions: `expo-image-picker ~58.0.10`, `expo-image-manipulator ~58.0.16`, explicit `expo-file-system ~58.0.13` (already an Expo transitive dependency), and `@react-native-community/datetimepicker 9.2.1`. The only new supporting package is Expo image loader. Expo dependency compatibility check passes. No forced upgrades or audit overrides.

The system photo picker opens only after an upload action. Modern scoped selection avoids an upfront broad-library permission request. Camera and microphone permission additions are explicitly disabled in app configuration. Cancellation is silent; selection/preparation failures show an error and leave the form usable. Real OS permission/restricted-library behavior still needs physical-device testing.

Supported inputs: JPEG, PNG, WebP, HEIC/HEIF and AVIF, subject to platform decoding support. Reported source sizes above 10 MB and dimensions above 60 megapixels are rejected. Unreadable images are rejected. Images resize proportionally to at most 1,600px on the longest edge, without upscaling, and convert to JPEG at 0.78 quality. Stored output must be nonempty and no more than 1 MB. Unknown source file sizes cannot be checked before decoding; the output limit still applies. The picker/manipulator does not request EXIF metadata for application storage.

Native photos are copied into the app-owned document directory `servify-request-photos/<id>.jpg`. Metadata stores an ID and accessible description, not a temporary picker URI or absolute iOS container path. Preview resolves the current document path. Web preview uses a separate `.web.ts` adapter that persists JPEG data in AsyncStorage photo keys; shared/native code imports no browser-only API. Browser quota failures reject photo additions clearly. This fallback is for local preview, not a production media database.

Replacement/removal/deletion removes retired files only after metadata persistence succeeds and only if no current draft references the photo. Failed multi-image preparation rolls back newly created files. Conservative orphan cleanup only considers files in this feature’s own namespace older than seven days and excludes current draft references; it is skipped in session-only mode. Crash-abandoned files can remain until a later successful session. Failed deletions retain files for later cleanup. Existing photos and unrelated app files are never broadly purged.

## Alignment and deferred work

Categories, general areas, title/description lengths, naira validation and local-draft terminology align with the website. Tests assert catalogue parity. Mobile adds the explicit “next few days” timing choice; web currently uses soon/flexible/date. Mobile local IDs, photo-file references, request envelope and role store differ from web UUID/IndexedDB Blob records. Reconcile these through a future authenticated backend model and explicit migration, not by importing browser persistence. Mobile and website drafts are independent and are not synced.

Deferred: authentication, ownership/RLS, shared database, remote media, real publishing, discovery, offers, messaging, payments and professional onboarding. Launch coverage, OTP costs/delivery, verification/privacy policies, cancellation and dispute processes remain unresolved product decisions. Device-local storage is not encrypted account storage; anyone with access to the app/browser profile may see drafts. App removal or clearing storage can erase them.

## Verification

All browser checks use isolated contexts and synthetic images/records, never the reviewer’s drafts or mode settings. Screenshots, fixtures, exports and audit output stay in ignored `artifacts/mobile-stage-02` or `apps/mobile/dist`.

- Mobile ESLint with zero-warning requirement and TypeScript checks pass.
- Existing `verify:domain` passes: original starter/mode persistence and failure behavior.
- `verify:requests` passes: legacy/raw preservation, area parity, multiple IDs, edit/restart/delete, revisions, external-write conflicts, session retention/retry, malformed/unknown data, denied/interrupted storage, dates and amounts.
- `verify:browser` / `verify:requests-browser` passes at 320, 390 and 430px: all seven steps, real synthetic picker selection, photo replacement/removal/reload, validation/focus, final save, details, search, editing, deletion and file cleanup, optional photos/quotes, role preservation and reduced motion. No horizontal page/internal scroll overflow, clipped action bar or browser console errors observed. Viewport screenshots were inspected.
- `node scripts/verify-request-edges.mjs` passes: Stage 01 starter restoration and original raw/timestamp preservation, multiple drafts, 5,000-character description, long unbroken title, 320×540 action visibility, cancelled picker, simulated picker denial and malformed-photo recovery. An additional browser check rejects a synthetic image larger than 10 MB without disabling navigation.
- Browser metadata read/write failures recover through explicit retry and persist the retained category. No false durable-save confirmation.
- Expo web, Android and iOS/Hermes exports pass. These are JavaScript bundle compatibility checks, not APK/IPA builds or native UI tests.
- The Next.js website, root packages and website data-access code are unchanged; unrelated web regression suites were not rerun.

No Android SDK/emulator/ADB or iOS simulator/physical-device session was available. Real Android/iOS photo permission denial, HEIC conversion, picker cancellation, hardware back, software keyboard behavior, safe-area insets and process-kill restoration remain device acceptance checks. Browser focus, shorter viewport, reload, cancellation and denial simulations do not substitute for those checks.

## Dependency audit

The recorded Stage 01 baseline was 18 moderate findings. Current `npm audit` reports **19 moderate, zero high and zero critical**. It still reports two underlying advisory families: glob AbortSignal cancellation traversal ([GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)) and minimatch globparts amplification ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)). Most reported packages are propagated Expo CLI/fingerprint and ESLint toolchain dependencies.

The additional reported package is the production-declared date picker, whose audit `via` is `expo`; the report lists no independent picker advisory. Expo is also production-declared but the affected glob paths are tooling dependencies, not this request form’s input processing. No new advisory family was introduced. Suggested broad fixes include incompatible downgrades to Expo 51/date picker 8.4; they were not applied. Track compatible upstream fixes and reassess before distribution. These findings are recorded limitations for the local preview, not a claim of production security clearance.

## Local review

Expo stays running at `http://127.0.0.1:8081/`. Current Wi-Fi host: `192.168.1.200`, Expo Go address `exp://192.168.1.200:8081` for a compatible client on the same reachable network. No cloud resources or credentials were configured. Working changes are limited to `apps/mobile` and this document, pending visual approval.
