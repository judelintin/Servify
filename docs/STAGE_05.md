# Stage 05 — Job discovery and offers

Stage 05 connects the approved customer and provider workspaces into an explicitly browser-local marketplace. No authentication, Supabase connection, cloud resources, notifications, live booking, payment or deployment is introduced. The public marketing homepage is unchanged. Dependencies are unchanged.

## Implemented journey

1. Create or resume a private request using the existing seven-step editor. Existing validation, photo preparation, autosave and conflict recovery remain in place.
2. At the final step, **Save & review for preview** saves the draft and opens a dedicated publishing review. A complete saved draft can also reach review from its detail page. Incomplete requests cannot publish.
3. Review the complete request and acknowledge the local-only boundary, then explicitly **Publish to Preview**. Existing drafts are never published automatically. Duplicate publishing is rejected.
4. In **Servify for Pros → Available jobs**, browse only published snapshots. Search title/description; filter category, general area, timing, budget preference and own active-offer state; sort by date or budget. Requests needing quotes sort after numeric budgets. Optional matching means an exact category AND general-area match with the selected preview profile.
5. Open a request, prepare an offer, optionally save an unfinished offer draft, review and acknowledge submission. Price supports a proposed fixed amount or estimate in NGN. Scope, availability/timeframe and optional conditions remain explicit. Submitted offers can be reviewed and updated while the job is open. Active offers can be withdrawn with confirmation; withdrawn offers remain in history and a new offer can be created while the request is open.
6. The customer **Offers** screen selects a published request, lists submitted offer history, opens details and compares up to three proposals. Comparison uses actual self-described profile details, coverage, price, timing, scope and conditions. No ratings, credentials or completed jobs are invented. Provider offer drafts are excluded from customer views.
7. Review a preferred provider, acknowledge the preview boundary and confirm. The job, chosen offer, other active offers and selection record update atomically. Reload preserves the result. Selection creates no real booking or agreement.

Customer Dashboard and My Jobs distinguish private drafts from preview-published requests and provider selections, with actual local counts. Published source copies are not counted a second time as standalone jobs. Provider Overview adds actual opportunity counts without removing completeness, portfolio or verification information. My Offers tracks the selected preview provider's records. Active Jobs and Messages remain future-functionality placeholders.

## Preview identity

The compact **Local preview** disclosure links the customer and provider workspaces and explains that both share this browser's records. They are roles for exploration, not secure accounts.

There is still one editable Stage 04 professional profile. A complete saved profile can be explicitly reviewed and added as a new preview-provider snapshot. Each snapshot receives a stable UUID and can be selected in the provider-context control. Adding a snapshot never overwrites the saved profile or earlier preview providers. To explore another provider, edit the saved professional profile and explicitly add another snapshot. Existing offers retain the profile that originally proposed them. No actors or requests are seeded into a normal review browser.

Offer editing pins the initial preview provider and record revisions. A background refresh cannot silently switch proposal ownership, reset unsaved answers or adopt a competing revision. Context selection is not an authorization mechanism.

## Browser-local data architecture

The existing `servify-local-drafts` IndexedDB database upgrades additively from version 2 to **3**. Its original `drafts` and `providerProfiles` stores and record formats are untouched. The new `marketplace` store contains one validated aggregate (`local-marketplace`, schema version 1):

| Model | Relationships and ownership in preview |
| --- | --- |
| `PreviewJob` | Stable job ID equals the source draft UUID. Retains source revision, publication time, its own revision/status and an immutable request snapshot including photo Blobs. |
| `PreviewProvider` | Independent UUID and creation time, with a snapshot of the explicitly chosen saved professional profile. |
| `PreviewOffer` | UUID, job ID, provider-context ID, revision, status, creation/update/submission times and proposal content. At most one active draft/submitted offer per provider/job pair. |
| `PreviewSelection` | UUID, job, chosen offer, provider and selection time. At most one selection per job. |
| `Marketplace` | Aggregate revision, the connected collections and persisted active provider-context ID. |

`src/features/marketplace/model.ts` defines contracts, graph parsing, amount/offer validation and matching helpers. `src/data/local-marketplace.ts` provides publishing, provider-context creation, offer saving/withdrawal and selection services. Components subscribe through a hydration-safe external store, following the existing data-access architecture. These service boundaries can later be replaced by authenticated server operations.

Each mutation reads the latest aggregate in a read/write transaction and validates the complete resulting relationship graph before writing. Publishing also reads the source draft in that transaction; adding a provider reads the saved profile. Revision checks reject stale sources, offers and jobs. Selection writes the entire decision in one transaction, with no intermediate partial state. BroadcastChannel and focus refresh update other tabs; transaction checks remain authoritative if refresh is delayed.

Publishing does **not** rewrite the original draft. Later private-copy edits do not change a published request or its offers. The published detail view provides explicit private-copy editing and deletion. Deleting that copy retains the published snapshot, photos and offer history. Published revisions, withdrawal of published jobs and reversal of provider selection are deferred rather than silently changing negotiated terms.

Safety limits: existing 25 source drafts; 50 preview requests; 10 user-created provider contexts; 200 offers per browser origin. Existing photo limits remain unchanged. Limits return errors instead of evicting records. Retained source copies can be explicitly deleted to free draft capacity.

## State transitions and validation

- Private source: existing `draft` contract; never discoverable directly.
- Published job: `preview_published` → `provider_selected`.
- Offer: `draft` → `submitted`; either active state can become `withdrawn` while the job remains open.
- Confirming a selection changes the chosen submitted offer to `selected` and all other active offers for that job to `unavailable`. Existing withdrawn history remains withdrawn. Offer drafts made unavailable are still excluded from customer history.
- Submitted edits require another review/submission; a submitted offer cannot silently revert to a draft. Selected, withdrawn and unavailable offers cannot be edited.
- Positive NGN amounts permit at most two decimal places and a maximum of NGN 100,000,000. Submission requires scope (20–3,000 characters), availability (3–200) and conditions no longer than 1,200. Unfinished offers can be explicitly saved as drafts within structural limits.
- Graph parsing validates IDs, unique active relationships, references, schemas, revisions, status/selection consistency and profile/job snapshots. A preferred date passing after publication does not invalidate historical snapshots; the original publication still requires a current valid timing choice.

## Failure handling and accessibility

Storage opening, reading and writing are bounded by the existing four-second timeout. Initial storage denial/blocking/stalling resolves to a labelled temporary tab-only preview; it does not pretend that records were durably saved. Reload retries browser storage. Existing stored data is untouched.

Malformed or future marketplace records are preserved and preview writes are blocked. Existing private drafts and the Stage 04 profile remain independently readable. Write/quota failures abort the transaction, preserve saved records and retain current form answers. Stale updates show an actionable error instead of overwriting newer work. Offer errors and selection/publishing errors move focus after the error summary has committed; an asynchronous failure cannot race against an unmounted alert. Normal field editing does not repeatedly steal focus.

Controls use native labels, field descriptions, invalid states, keyboard-operable disclosures and checkboxes, live feedback and explicit confirmation. The approved shared sidebar, icon-only tooltips, saved collapse preference, mobile menu and reduced-motion rules are preserved. Filters collapse on demand; offer comparisons stack into readable cards on narrow screens.

## Privacy and future backend requirements

All records stay under the current browser origin. `localhost` and `127.0.0.1`, different ports, devices and browser profiles have independent data. Anyone using that browser profile can inspect the records. Clearing site data deletes local records; no remote synchronization or secure multi-user isolation is claimed. General Ibadan areas are used; exact addresses and private contact details are discouraged. Existing local image resizing and metadata removal remain in place.

A production implementation still needs authenticated stable identities; normalized PostgreSQL relationships and indexes; customer/provider ownership and RLS; server-side validation; transactional offer/selection operations; authorized Storage access and retention/deletion rules; moderation/reporting; trustworthy profile/verification policy; and deployment configuration. A database uniqueness rule must enforce one active offer per provider/job, and a server transaction or RPC must enforce one provider selection per job. Browser preview context IDs must never become production authorization claims.

OTP delivery/cost, launch services and coverage, verification/privacy consent, cancellations, disputes, offer-price expectations and the work-completion journey remain unresolved product decisions. Live communication, notifications, booking, payments/wallets/escrow/subscriptions, identity verification and completion histories remain out of scope.

## Verification

All synthetic records are created inside isolated, closed Playwright contexts. User review storage is never cleared, seeded or modified. Captures and machine-readable results are under ignored `artifacts/`.

- Full UI journey at **1440, 1366, 1024, 768, 430, 390 and 320px**: private job creation/photo, blocked incomplete publication, draft isolation, explicit review/publication, profile/portfolio creation, provider-context snapshots, search/filter/sort, offer validation, draft restoration, review/submission, withdrawal and replacement, two-provider comparison, selection and reload.
- Responsive checks: one main landmark and heading, no document horizontal overflow, visible actions, stacked mobile forms/comparison, desktop sidebar collapse/reload and mobile menu keyboard return. Desktop and narrow-screen captures were visually inspected.
- Resilience: additive v2→v3 migration with exact source revisions/timestamps and image-byte preservation; duplicate active offers; stale competing edits with answers retained; quota/write abort; competing selections; historical preferred dates; malformed graph preservation; denied and stalled storage with usable draft form and resolved loading.
- Focused Stage 03 regression at 390px: seven steps, keyboard validation, photos/reload, autosave, editing, independent drafts, deletion/search, stale edit/save-copy and stale deletion recovery, unavailable/malformed/write-failed storage.
- Focused Stage 04 regression at 390px: onboarding, optional profile images, portfolio add/replace/remove/reload, profile editing, completeness, verification preview, small business/zero experience/specializations, legacy v1→v3 migration and storage/conflict recovery.
- Private source-copy editing/deletion: confirmed the published snapshot, rendered photo and selected offer survive reload; deletion returns keyboard focus to the private-copy heading.
- PASS: dedicated shared-sidebar regression across all three roles; final ESLint (zero warnings), TypeScript and production build; all **33 production page routes** and the unknown-route 404 response. Browser journey/resilience runs reported no console/runtime errors or remote marketplace requests.

One final build retry encountered `EPERM` while cleaning a generated `.next/static` build directory marked read-only/reparse-point by OneDrive. Removing only that verified generated directory resolved it; the final build and route checks passed. No application workaround or configuration change was introduced. The development server stayed running.

Commands: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:routes`, `node scripts/verify-marketplace.mjs`, `node scripts/verify-marketplace-resilience.mjs`, and focused existing regression scripts. Browser scripts use the existing Playwright runtime through `SERVIFY_PLAYWRIGHT_PATH` and optional `SERVIFY_BROWSER_PATH`; no dependency was installed. `SERVIFY_SMOKE=1` narrows responsive lifecycle checks to 390px.

## Local review

Keep `npm run dev` running at **http://127.0.0.1:3000**. Start at `/customer/dashboard`, `/customer/jobs`, `/jobs/new`, `/offers`, `/provider/dashboard`, `/provider/jobs` or `/provider/offers`. Create records in that same origin, then use the Local preview context controls. An empty workspace is intentional until the reviewer creates records. Stage 05 is approved for a local Git checkpoint; pushing and deployment remain out of scope.
