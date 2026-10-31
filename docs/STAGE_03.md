# Stage 03 — Customer experience, job posting & local drafts

Implemented for the supplied Stage 03 scope, 30 October 2026. The approved Stage 02
brand, typography, tokens, icons and application shells are retained. This stage
implements customer-owned **browser-local drafts**, not marketplace transactions.
No authentication, Supabase integration, cloud resources, public publishing,
provider notifications, offers, messaging, payment or verification is implemented.

## Customer experience

- `/customer/dashboard` shows a welcoming empty state or a returning-customer-style
  heading based only on actual local drafts. It does not invent an identity. The
  primary Post a job action starts the guided flow. Draft counts and the three most
  recently saved requests are derived from the browser's own records.
- Drafts, In progress and Completed are functional overview filters. The latter
  two explain that live work is unavailable; they do not fabricate counts/activity.
  Helpful next steps and the established offer-based journey remain visible.
- `/customer/jobs` lists local drafts, searches their title/category/description,
  links to details/editing and supports explicit delete confirmation.
- `/jobs/[jobId]` displays category, title, description, photo previews, general
  area, preferred timing, budget and an unambiguous Draft · not published badge.
  It supports editing/deletion. A draft absent from this browser gets a useful
  missing-draft state; these client-only resources are not looked up on a server.
- `/jobs/[jobId]/edit` restores the saved answers and last step. The original
  `/jobs/new` route remains the entry point.

The existing mobile disclosure navigation, active states, footer and role-specific
shells are reused. The obsolete customer placeholder implementation was removed;
provider/admin compositions were not redesigned. No new dependencies were installed.
Form actions remain in normal flow so they cannot cover focused fields or review
content; the final keyboard check cycles through all six category choices.

## Guided posting

The seven steps are Service → Details → Photos → Area → Timing → Budget → Review.
Each has a descriptive heading, helper text, progress indication, Back/Next and
Save & exit. Previously reached steps remain directly editable; review has
section-specific Edit controls. Native controls and React state preserve answers
when moving backwards/forwards, including values temporarily hidden by a choice.

The final action is **Save draft & view**, or **Keep for this tab** in temporary
mode. It never publishes or contacts providers. Save & exit permits incomplete
drafts; final review validates the required answers across all steps.

`src/features/customer/config.ts` centralizes the six provisional categories from
the product specification and reused Stage 02 icon family: plumbing, electrical,
AC/refrigeration, generator/power, cleaning and appliance repair. Its general
Ibadan area choices are explicitly **preview options**, including another area
in Ibadan; their inclusion is not confirmation of launch coverage or supply. No
exact address, customer phone number or real identity is requested by the flow.

## Validation

- Require a configured category and general service area.
- Title: 10–120 trimmed characters. Description: 30–5,000 trimmed characters.
  Plain text is rendered through React; it is not interpreted as HTML.
- Photos are optional, up to 8. Reject zero-byte/oversized files above 5 MiB and
  unsupported content. Inspect file signatures for JPEG/PNG/WebP, decode the actual
  image and reject failed decoding or dimensions over 30 megapixels.
- Re-encode photos locally to JPEG on a canvas, with a maximum 1600px long edge
  and 1 MiB normalized file. Original filenames and embedded metadata are not
  retained. Photo descriptions are optional, at most 300 characters. Blob URLs are
  revoked on replacement/unmount. Nothing is uploaded or optimized by a server.
- Timing: flexible, as soon as practical, or a valid date today/in the future.
  Calendar-day validation uses Africa/Lagos; it does not reserve availability.
- Budget: choose I need quotes or a positive min/max range in NGN. Reject negative,
  exponential/non-numeric, excess-precision and reversed ranges. Maximum is
  NGN 100,000,000; conversion uses integer kobo rather than floating point naira.
  No quote is generated and no money is collected.

Errors appear beside their fields and in a focused summary. Text inputs, textarea,
date and select link their errors/hints using accessible descriptions. Radio groups
use fieldset/legend semantics and native keyboard behavior. Validation is a draft
interface contract, not a substitute for the future server validation/RLS plan.

## Persistence and architecture

| File | Responsibility |
| --- | --- |
| `src/data/local-drafts.ts` | IndexedDB adapter, transactions, subscriptions, read validation and temporary fallback |
| `src/features/customer/draft-model.ts` | Versioned local model, validation and display helpers |
| `src/features/customer/use-local-drafts.ts` | Hydration-safe subscribed browser state |
| `src/features/customer/job-wizard.tsx` | Guided form, autosave, serialized writes and recovery |
| `src/features/customer/draft-components.tsx` | Shared storage disclosure, list, summary, photo previews and deletion |
| `src/features/customer/photos.ts` | Bounded local image processing |
| `src/features/customer/customer.css` | Feature-scoped layouts using existing design tokens |

Local drafts are deliberately distinct from the initial authenticated `JobRequest`
contract. They have no invented customer profile, offer, provider assignment or
production ownership. The production database architecture and domain models are
unchanged. The browser adapter is an explicit local exception in the existing
data-access boundary, not a Supabase implementation.

IndexedDB database `servify-local-drafts`, version 1, contains a `drafts` store keyed
by UUID. Each record has `schemaVersion: 1`, a revision, client timestamps, status
`draft`, last step, review marker, form answers and normalized photo Blobs. Up to
25 drafts are allowed per browser. No app secrets or identity credentials are stored.

Draft creation uses a fresh ID and never reuses the last record. Changes autosave
after about 650ms; Next and explicit save actions also save progress. After the
first successful save on `/jobs/new`, its URL receives `?draft=<id>` so reload can
restore that draft and step. An initial untouched visit creates no record. Pending
changes get an unload warning and a best-effort flush when leaving the editor.
Wait for the Saved on this browser indication or use Save & exit before closing.

Writes are serialized within an editor. A read/compare/write IndexedDB transaction
checks the expected revision; other tabs cannot silently replace newer changes or
resurrect a deleted draft. Conflicts preserve the current form and offer an explicit
separate copy or reload/discard action. Deletion checks the revision captured when
confirmation opened, protecting changes saved after that confirmation. Broadcast
notifications and window-focus refresh keep lists current; revision checks remain
effective even if BroadcastChannel is unavailable.

Records are structurally validated before display or mutation. Malformed/future
schema records are reported and left untouched rather than reset or overwritten.
The storage limit includes unreadable records. A later schema change needs an
explicit migration/recovery design; none is performed silently here.

## Failure handling and privacy limits

If browser storage cannot open, is blocked or takes too long, the app switches to
clearly labeled **temporary tab-only mode**. This permits the interface to remain
usable, but reloading/closing loses those temporary drafts. A late-opened abandoned
database connection is closed. A write failure after opening does not falsely switch
to successful persistence: the editor keeps the answers, shows recovery guidance
and does not navigate away on failed explicit save. Synchronous clone/quota errors
and aborted transactions are caught. A successful commit updates the local view
without relying on a later read to succeed.

Browser storage is not an account, backup, private vault or cross-device sync.
It is scoped to this browser profile and site origin: different domains or ports
(including localhost versus 127.0.0.1) do not share these drafts.
Anyone using the same browser profile may see drafts. Browser-data clearing,
private-session expiry, eviction or device loss can remove them. Do not include
private contact details, exact addresses, faces or identity documents in descriptions
or photos. Re-encoding removes metadata but cannot redact sensitive visible content.
The UI makes these limits clear. Client records remain untrusted if later imported
into any authenticated system; no such import exists now.

## Verification and review

Final production results:

| Check | Result |
| --- | --- |
| ESLint | PASS, zero errors/warnings |
| TypeScript | PASS |
| Production build | PASS |
| Production routes | PASS, 28 pages and the missing-page 404 |
| Customer flow | PASS at all seven requested viewport widths |
| Save/restore/edit/delete | PASS, including normalized photo persistence |
| Revision conflicts | PASS, explicit copy recovery and stale-delete protection |
| Storage failures | PASS, unavailable storage, failed writes/copy retries and unreadable records |
| Accessibility/responsiveness | PASS focused keyboard, error-focus, reduced-motion and overflow checks |
| Browser errors / remote mutations | None recorded / zero |
| Review artifacts | 30 screenshots and machine-readable results saved locally |

Representative production screenshots were inspected. These are focused browser
checks, not a full WCAG/assistive-technology certification or a production security
assessment. Review fixtures are clearly draft records in isolated test browsers.

Commands:

```sh
npm run lint
npm run typecheck
npm run build
npm run verify:routes
npm run verify:customer
```

`verify:customer` uses an existing Playwright installation (the bundled runtime in
this session), without adding dependencies. See `STAGE_02.md` for the optional
SERVIFY_PLAYWRIGHT_PATH, SERVIFY_BROWSER_PATH and SERVIFY_PREVIEW_URL settings.
SERVIFY_SMOKE=1 runs a single 390px flow for focused iteration; the final suite
uses all seven widths.

The suite covers **1440, 1366, 1024, 768, 430, 390 and 320px** across the empty and
populated dashboard, every wizard step and draft details. It exercises required-field
errors, native keyboard radio selection, focused summaries, previous-answer edits,
date/budget validation, quote preference, file rejection/limits, photo reloads,
distinct creation, search and confirmed/cancelled deletion. Additional cases cover
competing tab edits, save-as-copy, stale deletion, unavailable storage, failed writes
and unknown-schema records. Reduced motion and horizontal overflow are checked.
Browser runtime/console errors and requests are collected; there must be no third-party
request or POST/upload/publishing/auth mutation.

All browser fixtures are created in isolated contexts and closed after testing.
They do not seed fictional data into the normal review browser. Screenshots for
1440/390/320px and machine-readable results are stored under ignored
`artifacts/stage-03/`. The unchanged public/provider/admin/auth/design-system routes
are also checked; HTTP verification covers every page and a genuine 404.

Preview is left running at **http://127.0.0.1:3000/customer/dashboard**.
Start posting at `/jobs/new`; manage drafts at `/customer/jobs`. This is a local
production preview, not a deployment. `next dev` generated a framework `AGENTS.md`;
its bundled route/client guidance was read and no commit was made.

## Before the next stage

The approved design system needs no new brand decisions. Authentication and account
ownership, OTP delivery/cost/recovery, confirmed launch taxonomy/coverage, provider
verification/privacy and retention policy, cancellations and dispute operations
remain unresolved. Implementing any live marketplace workflow needs its own server
validation, authorization, RLS and concurrency tests. Do not treat browser drafts
as already published, approved coverage, accepted jobs or authenticated records.

The original README and repository history are preserved. Nothing is committed,
pushed or deployed; no other repository or Figma file was modified.

## Loading-state investigation — 31 October 2026

The dashboard, My jobs and Post a job labels are hydration-safe server previews.
They should disappear after client hydration and the first IndexedDB read. Two
persistent-loading conditions were reproduced and fixed:

1. **Development-origin mismatch.** `npm run dev` starts with `localhost`, while
   the documented review link uses `127.0.0.1`. Next 16.4.3 rejected the latter's
   `/_next/hmr` WebSocket as an unapproved development origin. The server returned
   HTTP 200 and scripts loaded, but the page remained unhydrated and storage
   initialization never ran. A fresh Chrome context reproduced the dashboard
   timeout and repeated WebSocket handshake errors. `next.config.ts` now explicitly
   allows `127.0.0.1` for development endpoints. No wildcard or production access
   rule was added. The dev server automatically restarted with the configuration.
2. **Unbounded initial read.** Opening IndexedDB already had a four-second timeout,
   but `getAll()` could queue indefinitely behind another read/write transaction.
   An isolated browser test held a real transaction open and reproduced a stuck
   loading state beyond ten seconds. Reads now also time out after four seconds
   and abort their read-only transaction. Initialization then settles into the
   existing explicit temporary mode. Its notice clarifies that persisted drafts
   remain untouched and become accessible by reloading after storage recovers.
   A late transaction completion cannot replace the fallback snapshot.

No schema, stored record, revision check, autosave interval, form component,
responsive CSS or approved design token changed. Tests use disposable browser
contexts and never clear the review browser's storage. Drafts still belong to
their original hostname/port; changing localhost to 127.0.0.1 does not migrate them.

Sidebar duplication was not reproduced. There is one `.sidebar`, with six customer
navigation links. It is visible at desktop widths and hidden below 1024px; the
mobile disclosure menu is separate. Browser DOM/visibility checks across all seven
widths and a rendered desktop screenshot showed no duplicate visible sidebar.
The earlier screenshot alone cannot establish the cause of its apparent duplication.

Regression coverage is in `scripts/verify-draft-initialization.mjs`. Run it with
`node scripts/verify-draft-initialization.mjs`, using the existing optional
SERVIFY_PLAYWRIGHT_PATH, SERVIFY_BROWSER_PATH and SERVIFY_PREVIEW_URL settings.
It checks direct loads and reloads on both loopback names; all three reported
pages; sidebar visibility and overflow at every requested width; unavailable
storage; stalled opens; stalled reads; failed reads; and recovery of a previously
saved draft after each failure. Each check waits for the usable empty state or
seven-step form rather than treating HTTP 200 as successful initialization.

Verification: ESLint, TypeScript, production build and all 28 production route
checks plus 404 passed. The customer browser suite covers the seven steps, field
errors, keyboard/reduced-motion behavior, autosave, photo persistence, reload,
editing, distinct drafts, search, deletion, revision conflicts, failed writes and
unreadable records. Development checks run at 1440, 1366, 1024, 768, 430, 390 and
320px; focused production browser checks use 390px. Initialization regression
checks run against both development and production servers. No browser runtime
or console errors are accepted. No dependencies were added.

The review development server remains at
`http://127.0.0.1:3000/customer/dashboard`; job posting is `/jobs/new`.

## Final targeted UI/UX review — 31 October 2026

No additional application defect was confirmed, so the approved UI, validation,
data adapter and persistence behavior were retained. Added the focused browser
check `scripts/verify-stage-03-refinement.mjs` and documented these findings:

- **Sidebar:** the DOM contains exactly one `.sidebar-tip` and one `.sidebar-home`.
  Both remain single at the top, mid-page and bottom of the live desktop page.
  Paired viewport and full-page screenshots show that capturing a scrolled page
  displaces the sticky sidebar within the full-document image. The viewport itself
  remains correct. An actual second card/link was not reproduced; the full-page
  capture behavior is not evidence of duplicate UI. No sticky-positioning change
  was warranted. For visual review, capture at scroll position zero and compare
  viewport captures when investigating sticky elements.
- **Category selection:** the existing selected card has primary-blue border and
  inset outline, a pale blue background, and a native checked radio with blue
  accent. Keyboard focus adds a solid 3px blue ring. Space selects; arrow keys move
  the single selection. Returning from Details preserves the selected category.
  No new selection control or card-layout change was necessary.
- **Required category:** Next without a category stays on Service, displays
  “Choose the service that best matches your job.” and focuses the alert summary.
  With a valid category, Next reaches Details and focuses its heading. The existing
  validation and focus behavior meet the requirement and were left unchanged.
- **Mobile progress:** at 430, 390 and 320px, the seven steps occupy one row within
  a 93px progress block, above the form without overlap or horizontal scrolling.
  Buttons retain 44px height; the current step and numeric progress remain exposed
  accessibly. The existing mobile layout needs no further compaction.
- **Draft lists:** Dashboard and My jobs reach their helpful empty states on fresh
  storage, then show the locally saved incomplete draft after Save & exit. Both
  states survive direct navigation and reload in each isolated test profile.

Targeted checks passed at **1440, 1366, 1024, 768, 430, 390 and 320px**, including
keyboard selection, error/heading focus, no horizontal overflow, single sidebar
content, and empty/populated draft initialization. Browser runtime/console errors:
zero. Focused ESLint for the new check passed. Screenshots and measured results
are under ignored `artifacts/stage-03-refinement/`. Test profiles were closed and
did not touch drafts in the review browser. No dependencies, application source,
design tokens, persistence code or schema changed; unrelated audits were not rerun.

## Shared sidebar refinement — 31 October 2026

The existing `WorkspaceShell` now supplies the same desktop collapse behavior to
customer, provider and administrator workspaces. Expanded navigation retains its
labels, branding and active states. A labeled button near the logo toggles an 80px
icon rail; its expanded state and controlled navigation are exposed accessibly.
The rail uses the Servify “s” with orange accent, retains every navigation link
and active marker, and hides promotional content. The home link remains available.
Main content receives the released width through a short grid transition; the
existing reduced-motion override removes the transition when requested.

Icon links retain accessible names and visible keyboard focus. Tooltips appear on
hover or focus outside the scrolling sidebar, so overflow cannot clip them. They
are hoverable and dismiss on Escape, blur, scrolling or viewport resize. Mobile
continues to use the existing labeled disclosure navigation below 1024px; the
desktop rail and its controls are not shown there. No body-scroll lock was added.

The visual scrollbar is hidden with standard `scrollbar-width: none`, the WebKit
scrollbar selector and the legacy Microsoft property. `overflow-y: auto` remains;
the sidebar is keyboard-focusable and retains native wheel/touchpad, keyboard and
touch scrolling. Short viewports still allow reaching the last navigation link.

`src/lib/sidebar-preference.ts` stores only `collapsed`/`expanded` under the separate
localStorage key `servify-sidebar`. One subscribed preference is shared across
workspace roles, navigation, reloads and storage events. A small static inline
script in the root document reads it before first paint; only its root data
attribute uses hydration-warning suppression, following the installed Next.js
pre-paint guidance. This avoids an expanded-width flash during hydration. Storage
exceptions are caught: toggling and navigation continue for the current page
session, with the expanded default after a reload when persistence is unavailable.
IndexedDB draft data, its schema, validation, autosave and recovery were not changed.

The saved-draft customer dashboard headline is now **“Let's get things done.”**
Supporting copy, empty state and data presentation remain unchanged.

Verification uses `scripts/verify-sidebar.mjs` with the existing bundled Playwright
configuration. Desktop checks cover 1440, 1366 and 1024px, both sidebar states and
all three roles: active links, icon names, focus/hover tooltips, Escape dismissal,
content expansion, reload and navigation persistence, pre-hydration width, and
absence of horizontal overflow. Mobile checks cover 768, 430, 390 and 320px for
all roles, including full labels, keyboard disclosure/Escape, focus restoration
and unrestricted document scrolling. A 360px-high desktop verifies hidden-scrollbar
styling, native wheel and PageDown scrolling, and focus access to the last link;
a touch-enabled desktop context verifies native touch panning. Unavailable-storage
tests verify functional toggling and navigation without persistence.

Focused ESLint, TypeScript and the production build passed. Sidebar checks run on
development and production previews. The focused customer suite verifies all seven
posting steps, validation, exact saved-dashboard headline, autosave, photo/draft
reload, edits, deletion, revision conflicts and storage failure recovery. No browser
runtime or console errors are accepted (deliberate blocked-script requests in the
pre-hydration test are isolated). Results and visual captures are stored under
ignored `artifacts/sidebar/`. No dependencies, authentication or database changes,
commits, pushes or deployments are involved. The development review URL remains
`http://127.0.0.1:3000/customer/dashboard`.
