# Servify Mobile Stage 04 — Professional discovery and offers

Built on approved local checkpoint `e10b1f0`. Stage 04, including the Step 7 publishing correction, is approved for the local Git checkpoint `feat: complete Servify mobile job discovery and offers`. Next.js source, Netlify, Expo account ownership and authentication are unchanged. No dependencies, backend connections, EAS builds, pushes or deployments are introduced.

## Product behavior

Customer drafts remain in their original Stage 02 store. A complete, reviewed, durably saved request exposes **Publish to local preview**, followed by explicit confirmation. It creates one immutable opportunity snapshot per source draft and copies its compressed images into a separate marketplace-owned namespace. Nothing is automatically published by saving a draft. No real providers are notified, and there is no cross-device synchronization.

The source draft remains editable and deletable. Changes to it do not silently rewrite an opportunity or offers. Published requests remain accessible from My Jobs even if the source draft is deleted. Republish/update/unpublish semantics are deferred; the preview explains this snapshot boundary. Publication is idempotent by source ID. If a copy or persistence operation fails, the source draft and its images remain intact.

Professional Find Jobs includes title/description/service/area search, category, general area and timing filters, newest/oldest and budget sorting, and an opt-in match filter using the current profile's services **and** areas. All open requests can still be browsed. Quote-only budgets sort after known budgets. Preferences use a separate local key and gracefully fall back when unavailable. Incomplete profiles can browse, but a reviewed profile with four required sections complete is necessary to save or submit an offer. A service/area mismatch is explained rather than permanently hiding a request or asserting suitability.

Opportunity details show the full brief, customer-supplied photos, category, general area, timing, budget and preview state. There are no structured exact addresses, phone numbers, customer identity disclosures, ratings or verification claims. Free-form text/images remain user-controlled: the interface cautions against including sensitive details; it does not claim automatic redaction.

Offers include a positive NGN price (up to 100,000,000, up to two decimals), estimate/fixed type, 20–3,000-character scope, 3–200-character availability/timeframe and up to 1,200 optional note characters, matching web validation. Numeric entry uses a decimal keyboard. Invalid fields receive messages and first-invalid text focus. Submission and pending-offer edits require review and confirmation. A separate **Save offer draft** action allows incomplete content to be resumed after reload; typing is explicitly not autosaved. Save an offer draft before leaving. Failed saves retain entered answers in the open form.

Professional Offers shows draft, pending, selected, withdrawn and not-selected/unavailable states, with status filters and detail navigation. Eligible pending offers can be edited or withdrawn with confirmation. Submitted withdrawals remain in history; unsubmitted drafts can be explicitly discarded. There is only one actual local professional identity. Withdrawing permits a new offer while preserving the old submitted record; no fictional competitors are created.

Customers receive offer counts, stacked comparison cards and full details (price type, scope, timeframe, notes, actual professional name/business, experience and introduction). Profile information is a self-reported snapshot captured when the offer is saved, not a verification claim. Optional profile/portfolio image references are deliberately omitted from this text-only offer snapshot so historical offers do not retain references to subsequently removed profile images.

Selection is confirmed and persisted with the request/offer changes together. A selected professional is **not** an accepted job, binding booking, scheduled visit or start of work. Messaging, acceptance, scheduling, completion, issues, reviews and payments remain deferred. Professional Home preserves onboarding priority and its approved composition, adding actual matching-opportunity, pending-offer and selected-offer data only.

## Local model and transitions

- `Opportunity`: stable ID (source request ID), source ID/revision, own revision, publication time, immutable request snapshot, `preview_published | provider_selected`, nullable selected-offer ID.
- `Offer`: stable ID, opportunity reference, fixed `local-professional` reference, revision/timestamps, submitted timestamp, validated content and reviewed professional snapshot.
- `draft → submitted → selected` or `submitted → withdrawn / unavailable`. Pending submitted content can be edited with a revision increment. A draft can be discarded before submission. Historical states cannot be edited. Selection marks other submitted offers unavailable and removes any unsubmitted draft for the chosen job. Repeating the same selection is safe; contradictory selections are rejected.
- One active draft/submitted offer per opportunity and local professional. An existing selected offer also prevents a new offer. All record references, unique IDs, active-offer uniqueness and selected-job consistency are checked when parsing the aggregate. Past preferred dates remain readable in historical published records.

The customer-facing request state is the opportunity projection; original `RequestDraft.status` remains `draft` to preserve the Stage 02 schema. My Jobs separates published snapshots from source drafts. Received offers exclude unsubmitted drafts, while withdrawals remain visible as history.

## Persistence and media safeguards

`servify.mobile.marketplace.v1` stores a versioned aggregate (`schemaVersion`, revision, opportunities and offers). Hydration is bounded and always resolves to ready or an explained error. Mutations use a busy guard, clone the last confirmed state, check the stored baseline, validate the complete candidate and write one aggregate key. Screens receive success only after the write resolves; selection cannot persist a job state separately from its offer state. Stale offer revisions are rejected. Repeated UI taps are guarded synchronously as well as by the store.

On storage failure, the prior confirmed state remains visible and current form input is retained. **Retry marketplace storage** reads and validates disk before further writes, adopting the latest valid aggregate instead of overwriting it. A timed-out write is retained and must settle before retry proceeds. Malformed/unknown schemas are preserved and block replacement; no reset/delete recovery is offered. Local baseline checks are best effort, not a database compare-and-swap across concurrent processes. An indefinitely unresolved native write requires leaving the screen open or inspecting storage; a timeout cannot cancel native storage operations.

Discovery preference key: `servify.mobile.discovery.v1`. Failed preference persistence never blocks navigation. Late preference reads cannot overwrite answers after the bounded initialization window.

Published photos use native directory `servify-marketplace-photos` / browser prefix `servify.mobile.marketplace.photo.`. Customer and professional namespaces and their cleanup rules remain intact. Publication copies images before committing metadata; subsequent source replacement/removal/deletion cannot remove preview images. Failed publication may leave unreferenced local copies; they are retained conservatively rather than risking deletion after an uncertain write. Marketplace deletion/media reclamation is deferred. The aggregate is capped at 100 opportunities, 500 offers and 5 MB of metadata. Images consume additional device storage; this preview does not promise unlimited storage.

## Verification

Focused verification results follow. All synthetic records and fixtures use isolated test contexts; existing reviewer drafts, profiles and photos are not cleared or overwritten. Runtime fixtures, screenshots, results and exports remain ignored.

- `npm run verify:marketplace`: passed publication validation/idempotency, incomplete-profile rejection, offer draft/submission/edit/withdrawal/history, duplicate and stale actions, failed-write rollback, atomic selection, repeated selection, restart, discovery matching/search/filtering, malformed/unknown schema preservation, external writes, timeout/retry and customer/profile independence.
- Existing `verify:requests` and `verify:professional`: passed focused model/store regressions after the shared photo namespace extension.
- `npm run verify:marketplace-browser`: passed at 320/390/430px: explicit publication, immutable source metadata, copied photo rendering, service filtering/no matches, search and match preference restoration, keyboard validation focus, offer draft/reload/submission/edit/withdraw/resubmission, customer stacked comparison/confirmed selection, role switching and restart persistence. Customer drafts, professional records and original photo data remain byte-for-byte unchanged in these isolated journey contexts. No page/console errors or horizontal overflow; screenshots were inspected.
- Existing customer browser smoke at 390px passed seven-step validation, photos/add/replace/remove/reload, editing/search/deletion, optional photos/quotes, role switching and read/write failure recovery.
- `verify-marketplace-edges.mjs`: passed empty/incomplete-profile guidance, 320×600 layout, malformed-record preservation, read/write failure notices, retained form answers and retry recovery at 390×600. An additional ownership check passed actual publication-copy creation, source draft deletion and original-photo cleanup; the copied photo and published opportunity remain accessible after reload.
- Final mobile ESLint (zero warnings) and TypeScript: passed. The React component review checked unconditional hooks, validated props/state, visible keyboard focus, semantic roles, disabled/busy controls and native-safe bounded image layout.
- Web, Android and iOS/Hermes exports passed for the initial Stage 04 implementation. After the Step 7 correction, TypeScript, focused lint, web export and the updated iOS development bundle check also passed. Initial sandbox execution denied access to the existing Hermes executable; rerunning with normal process permissions passed without compiler/dependency/configuration changes.

## Native layout and manual acceptance

New image previews use existing explicitly bounded native-safe containers (104px); there are no auto-height image rows with in-flow percentage heights. Cards use natural content height, wrapping text and stacked comparisons. Forms reuse the existing SafeAreaView, KeyboardAvoidingView, scroll view and inset-aware bottom actions. Confirmation content scrolls within a bounded modal. Existing five-tab navigation and reduced-motion support are preserved; modal animations are disabled.

Codex cannot directly view an iPhone framebuffer or run an iOS simulator here. Browser screenshots and native bundle exports are **not native visual approval**. On the physical iPhone, verify:

1. Customer: finish/save a request, publish explicitly and confirm its photo preview.
2. Switch to Professional, browse/filter, review the request and save/restore a draft offer.
3. Verify decimal keyboard, multiline scrolling and visible bottom actions; submit, edit and withdraw an offer, then submit another.
4. Switch to Customer, compare the actual offers, select one and confirm the preview-only explanation.
5. Switch to Professional and restart Expo Go; check selected status, safe areas, fixed bottom navigation, scrolling and retained customer/profile/portfolio data.

Real image-picker permission/limited-library behavior, HEIC conversion, Android hardware back, native keyboard overlap, safe areas and process-kill behavior remain device acceptance checks from earlier stages.

## Dependencies and future backend

No dependencies were installed or upgraded; the mobile lockfile is unchanged. The documented audit baseline remains **19 moderate, zero high, zero critical**, covering the existing glob/minimatch families propagated through Expo/ESLint dependencies. This is the previously recorded result, not a new registry audit. Incompatible downgrade suggestions were not applied; see Mobile Stage 02/03 documentation.

An eventual backend migration must map device IDs to authenticated customers/professionals, explicitly import snapshots/media with consent and ownership, and enforce server validation, role-based access, RLS, media retention/privacy and database foreign keys. Publication and offer selection need database transactions, a uniqueness constraint on active offers and one selected offer per job, plus idempotency keys and concurrency control. Notification delivery, availability, launch coverage, cancellations, dispute policies, OTP cost/delivery and real verification remain product decisions. No backend SDK, migrations or credentials are introduced in this stage.

## Review workflow

### Publication entry refinement

The initial Stage 04 implementation retained the Stage 02 **Save draft** action on Step 7 and placed publishing after the complete summary on request details. This made publication difficult to discover even though the underlying publisher worked. Step 7 now has an explicit **Publish to local preview** primary action with confirmation, plus separate Back and Save draft controls. Confirmation saves the validated reviewed draft durably before publishing its snapshot. Cancel and Save draft do not publish. Existing published snapshots are not silently republished when editing their source. Request details now place the publishing/offer panel above the full summary.

`node scripts/verify-publication-entry.mjs` passed at 320/390/430px: visible footer actions, keyboard activation, cancel without publication, independent draft saving, accessible details entry, publication and reload without duplicate jobs. A separate recovery run passed failed-publication preservation of the reviewed draft and explicit retry inside the confirmation dialog. TypeScript, focused ESLint and web export pass. The updated native interaction still needs manual iPhone review; browser screenshots do not establish native approval.

Existing Expo Go workflow and account are preserved. Local browser: `http://127.0.0.1:8081/`. The previously running tunnel remains `exp://c-lintin-23gwt2-mw2p78cp964argnt.on.expo.app` while this computer/server/tunnel stay online. The public HTTPS iOS manifest and updated development bundle both returned 200 during final verification. Scan its existing QR and reload the app to receive source updates. SDK 58 physical-iOS Expo Go requires the same signed-in account as the CLI; tunneling does not bypass that requirement. Do not share credentials. This is a development session, not a cloud build or distribution release.
