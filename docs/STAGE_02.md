# Stage 02 — Design system & application shell

Implemented 30 October 2026 in the existing Servify repository. This stage follows
the supplied Stage 02 brief: interface foundations and presentation only. The
identity/schema work described as future work in the Stage 01 roadmap has not been
performed or implicitly approved. The original README, domain contracts, database
plan and Git history remain intact.

## Design decisions

The public shell uses warm white, an editorial wordmark, a compact introduction,
an offer-based journey summary and six category previews. The application shells
use the quieter #F7F8FA background, white surfaces, a desktop sidebar and mobile
navigation disclosure. Provider and administrator labels and task navigation are
distinct; their tokens and components remain shared. There are no invented users,
job records, provider reviews, verification badges or operational metrics.

- Colors: ink #151A2D, primary blue #3155C8, navy #172554, orange #F59E0B,
  warm white #FFFBF5, white #FFFFFF and application background #F7F8FA.
- Supporting tokens: muted text #5E6578, surface borders #E3E6ED and stronger
  control borders #8992A6. Orange is reserved for small brand/journey accents and
  the documented accent button, always with dark text.
- A 4px spacing unit and 8px/12px/16px radii replace the initial Stage 01 radius
  placeholders. Subtle surface shadows, no decorative motion or UI packages.
- Inter Tight is genuinely loaded through `next/font/local`, with a variable
  100–900 font from the [official Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/intertight).
  The SIL OFL license is included beside the font in `src/assets/fonts/OFL.txt`.
  There is no runtime Google request or build-time font download. The source TTF
  is about 568 KiB; a licensed WOFF2 subset is a future performance improvement,
  not a prerequisite for reviewing this shell. Bundled font subsetting tooling
  was unavailable; no font-processing dependency was installed.
- The wordmark is typographic with a restrained orange terminal accent. The
  small favicon is a letter S; category/tool imagery is never used as the logo.

## Shared implementation

| Location | Responsibility |
| --- | --- |
| `src/app/globals.css` | Tailwind v4 tokens, typography, responsive layout and component states |
| `src/components/ui/primitives.tsx` | Buttons/links, inputs, cards, badges, headings, empty/loading/feedback states |
| `src/components/ui/icon.tsx` | Original consistent navigation/action icon family |
| `src/components/shells/` | Public containers/navigation/footer and role-aware application frame |
| `src/lib/navigation.ts` | Role navigation, exact and nested active-state matching |
| `src/components/workspace-dashboards.tsx` | Customer, provider and admin shell entry views with empty states |
| `src/components/auth-presentation.tsx` | Disabled sign-in/registration presentation and native role-selection controls |
| `src/app/design-system/page.tsx` | Local review gallery for tokens, typography and component states |
| `public/icons/services/` | Six provisional original service SVGs with provenance note |

Server-rendered pages and layouts compose the shells. Client code is limited to
navigation disclosure, pathname-based active states, local role selection and the
component gallery's feedback demo. No new dependencies were installed. The existing
Next/React/Tailwind/TypeScript/ESLint versions and lockfile are preserved. Stage 01's
documented ESLint 9 support constraint remains; no forced peer overrides were added.

## Figma inspection and asset limitation

Target: [existing Servify file, Page 1](https://www.figma.com/design/g0oK2Z56TczYWL8jyhJwVz/servify?node-id=0-1).
The connected Figma plugin was used first, with a read-only session. Requesting
context for the page returned “nothing selected”; the follow-up metadata and
specific plumbing-frame context requests reported the connected Starter plan's
MCP tool-call limit. The Windows desktop fallback also failed on initialization
and once after retry, returning “trusted Node process exited unexpectedly”.

Consequently **no fresh visual inspection or Figma vector export was possible**.
The Stage 01 metadata inventory remains the evidence available: a website screenshot
and category variants for plumbing, electrical, AC, generator, cleaning and appliance
work, plus other image references. It does not establish an editable component
library, approved visual patterns, or asset licensing. No Figma file mutation was made.

The six local SVGs are original 24px monoline assets, not exported or traced from
Figma. They share 1.7px rounded strokes, primary-blue treatment and visible text
labels; decorative images have empty alt text. Revisit the Figma variants and
source licenses when access is restored before approving final category artwork.
The website reference's branding, content and layout were not copied. The UI uses
original public and workspace compositions based on the supplied Servify brief.

## Routes and navigation

All original 12 URLs remain available. Extra destinations are presentation-only
and prevent the shell menus from linking to missing pages.

- Public: `/`, plus `/design-system` for local interface review.
- Customer: `/customer/dashboard`, `/customer/jobs`, `/customer/profile`,
  `/jobs/new`, `/jobs/[jobId]`, `/offers`, `/conversations`,
  `/conversations/[conversationId]`.
- Pros: `/provider/dashboard`, `/provider/jobs`, `/provider/offers`,
  `/provider/active-jobs`, `/provider/messages`, `/provider/profile`,
  `/provider/verification`; existing `/provider/onboarding` remains intact.
- Admin: `/admin/dashboard`, `/admin/providers`, `/admin/verification`,
  `/admin/customers`, `/admin/jobs`, `/admin/reports`, `/admin/categories`.
- Auth presentation: `/auth/sign-in`, `/auth/sign-up`.

Legacy `/offers` and `/conversations` routes use the customer shell. Provider task
navigation uses explicit provider URLs; no current-session role is inferred.
Layouts are **not authorization**. There is no protected data to expose in this
preview. Admin screens do not grant privileges. Future authorization must follow
the existing architecture and RLS plan.

## Interaction and accessibility

At 1024px and above, role navigation is a desktop sidebar. Below 1024px, public
and role navigation use labeled buttons with expanded state and an in-flow menu.
Menus work with Enter/Space, normal Tab navigation and Escape; Escape returns focus
to the toggle, and selecting a route closes the menu. The disclosure is not a modal
and does not trap focus. Navigation has accessible labels and `aria-current=page`;
exact routes take precedence over nested matches (for example `/jobs/new`).

Each page has one h1 and main landmark, a working skip link, visible keyboard focus,
readable labels and meaningful empty-state text. Buttons, mobile menu controls,
wordmarks and key navigation targets have 44px minimum hit areas. Inputs associate
descriptions/errors with their label; radio groups use native fieldset semantics.
Loading uses a text label and status role, with a spinner that stops under reduced
motion. Feedback components opt into live announcements only when state changes.
No accessibility claim is inferred from color or icons alone.

Measured contrast examples (sRGB): primary blue/white 6.43:1; muted text/app
background 5.48:1; muted text/warm white 5.64:1; ink/orange 8.03:1. Control borders
were darkened from the initial draft to exceed 3:1 against white. Dark auth-surface
focus uses orange rather than blue. These checks and keyboard tests are focused
verification, not a full assistive-technology or WCAG certification.

Auth fields and continuation buttons are disabled and collect nothing. Role
selection is local UI state only; it does not persist, authenticate, select an SMS
provider or assign roles. No admin self-selection exists. Gallery feedback is
explicitly labeled as a component demo, not a marketplace action.

## Verification and local review

Final results after the font, control-contrast and hit-area refinements:

| Check | Result |
| --- | --- |
| `npm run lint` | PASS, zero errors/warnings |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run verify:routes` | PASS, 27 pages plus missing-page 404 |
| `npm run verify:ui` | PASS, 49 viewport/surface checks, 24 linked destinations and interaction checks |
| Browser runtime/console errors | None recorded |
| Review artifacts | 21 resting-state screenshots and `results.json` saved locally |
| README/history | Unchanged; HEAD remains `5d03b98`, no commit/push/deployment |

- ESLint with zero-warning policy, TypeScript checks and optimized production build.
- Production HTTP verification covers all 27 pages, original Stage 01 destinations,
  required landmarks/disclosure and a genuine missing-route 404; the favicon is an
  additional asset route.
- Browser suite checks seven surfaces (public, customer, provider, admin, sign-in,
  sign-up and design system) at **1440, 1366, 1024, 768, 430, 390 and 320px**:
  49 viewport/surface combinations. Includes no horizontal overflow, local font
  loading, skip-link focus, active navigation, keyboard menu opening/closing and
  expanded-menu reflow.
- Additional checks: actual mobile route transitions for all three roles, menu
  closure, keyboard radio selection, disabled registration/credential inputs,
  gallery feedback, reduced-motion behavior, 24 linked destinations and six local
  SVG responses. Browser runtime/console errors are collected.
- Screenshots at 1440/390/320px and machine-readable results are saved in ignored
  `artifacts/stage-02/`. The output is available locally without adding generated
  images to the repository. Representative renders were visually inspected.

The preview is served locally at **http://127.0.0.1:3000** and is left running for
review. Useful entry points: `/customer/dashboard`, `/provider/dashboard`,
`/admin/dashboard`, `/auth/sign-up`, and `/design-system`.

Reproduce core checks:

```sh
npm run lint
npm run typecheck
npm run build
npm run verify:routes
```

For the browser suite, start `npm run start -- --hostname 127.0.0.1` separately.
`npm run verify:ui` uses an existing Playwright installation and Edge by default;
the bundled runtime was used in this session without installing test packages.
Optional environment settings:

```powershell
$env:SERVIFY_PLAYWRIGHT_PATH = 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:SERVIFY_BROWSER_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:SERVIFY_PREVIEW_URL = 'http://127.0.0.1:3000'
npm run verify:ui
```

## Before Stage 03

Restore Figma access and complete the visual/icon comparison; approve the current
provisional icon family or replace it with licensed reviewed exports. Confirm
launch coverage and taxonomy, OTP delivery/cost/recovery, verification and privacy
policies, retention, cancellation and dispute operations in the stages that implement
them. None of those choices has been silently finalized by this shell. Coordinate
the supported ESLint/Next plugin upgrade when available. Optimize the font payload
before performance-sensitive launch work.

No Supabase connection, schema/migration change, live account, payment, offer
acceptance, messaging, commit, push or deployment is included in Stage 02.
