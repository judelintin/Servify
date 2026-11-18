# Stage 10B — Mobile-app marketing website

Implemented from `f7cfc00a3996518624781b7e195e2304a26c4264`. Ready for visual review; no commit, push or deployment.

## Direction and scope

The primary reference, https://appdebut.framer.website/, was inspected in a browser. Its large split hero, prominent phone presentation, generous section rhythm, compact benefit cards, dark journey section, expandable FAQ and closing app CTA informed the composition. No reference artwork, fonts, colours, copy, testimonials, waitlist counts or functionality were copied.

Inter Tight, the Servify wordmark, existing brand tokens, category icons and editorial imagery are retained. New public styles use existing token values and derived tints, without a new palette. No dependency was added. The old marketing walkthrough implementation and its styles remain available; the new public experience does not embed legacy website marketplace workflows.

- **Home:** editorial app hero; customer/professional value proposition; three benefit cards; keyboard-accessible audience tabs with genuine app captures; guided request explanation; four-step marketplace journey; six provisional service categories; professional feature; credible trust context; native FAQ; honest app availability.
- **About Us:** purpose, mission, Ibadan-first positioning, product principles, existing editorial photography and app availability.
- **Contact:** clear contact-availability panel, invited-tester guidance, app information and links to the product story. No verified public channel was available, so no address, phone number, email, contact form or successful-submission simulation was invented.
- **Shared architecture:** existing public header/footer/navigation retained and visually refined through the public stylesheet. Home/About/Contact remain the only primary public navigation routes.

The website does not offer customer/professional sign-in, registration, job posting or other marketplace transactions. Store URLs remain null. Availability tiles are non-interactive status information, not fake download buttons. Copy distinguishes current controlled testing from public launch, and reviews/profile completeness from identity verification. No user counts, endorsements, guaranteed coverage or work guarantees are claimed.

## Genuine app assets

Three 390 × 844 captures were taken from the existing Expo web preview using an independent signed-out browser context: Customer Home, empty Professional Home and the first job-posting step. No real account or seeded personal record appears in them. The context's introduction marker was set solely to reach the existing workspace; the user's actual browser/phone data was not accessed or reset. Professional mode switching occurred only in that isolated context.

Copies live in `public/images/app/`, with provenance in its README. Their device-local labels are retained deliberately. Nearby website captions explain that these starter workflows are local and that shared marketplace activity requires an invited authenticated account. These are visual previews, not embedded working forms. Original mobile files are unchanged.

Screenshots are imported statically through Next Image, providing content-hashed URLs and responsive optimization. This also resolved stale optimizer output during capture review. Editorial photographs retain attribution and accessible descriptions. Decorative category icons and composition details are hidden from assistive technology where appropriate.

## Interaction and accessibility

- Audience tabs support click, Left/Right, Home/End, visible focus, roving tab index and associated panel labels. The phone and copy change together without a material layout jump.
- FAQ uses native details/summary controls with keyboard support.
- Existing mobile menu supports Enter, Escape and focus restoration; the global skip link targets the main landmark.
- Phone screenshots preserve their actual aspect ratio. Decorative chips are not interactive, and image loading reserves dimensions.
- Entrance animations are finite; no autoplay carousel, polling, scroll listener or backend request was added. Reduced-motion mode disables animation and transitions. Essential public content/navigation remains usable without JavaScript.
- An inherited workspace `.service-tile` style initially conflicted with public cards. The new class was renamed to `.marketing-service-tile`; no workspace style or component was modified.
- Contact step numbers were given a fixed small flex basis to prevent narrow-screen digit wrapping. The closing decorative arrow is omitted on mobile to avoid crowding text.

## Verification

Completed on 16 November 2026:

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS; all 48 routes retained/prepared, including Proxy and dynamic private Admin routes.
- `node scripts/verify-marketing.mjs`: PASS for Home/About/Contact at **320, 390, 430, 768, 1024 and 1440px**. Checks cover one H1, Inter Tight, loaded image decoding, no horizontal overflow, absence of marketplace and unverified contact/store links, mobile keyboard menu/Escape, skip-link focus, audience tab keyboard state/image synchronization and layout stability, FAQ activation, reduced/finite motion, no-JavaScript navigation, and absence of browser console/page errors.
- `node scripts/verify-website-access.mjs`: PASS route classification and fail-closed operator credential checks.
- `node scripts/verify-routes.mjs` with the existing Playwright runtime: PASS all 48 production routes, direct URL/RSC/prefetch/header-spoof/HEAD/POST restrictions, authorized private Admin rendering, anonymous denial, identity API denial, CSS delivery, desktop-only Admin presentation, keyboard/responsive checks and unchanged seeded IndexedDB records.
- Existing development Admin with no operator settings: HTTP 503 plus no-store, as intended. No actual credential was created or configured.
- All **44 retained legacy desktop marketplace/Auth/Admin page implementations** match the starting commit after normalizing line endings. Stage 10A Proxy, route policy, server guards and Admin gate remain unchanged.
- Git comparison confirms no changes to `apps/mobile`, `supabase`, original repositories/domain features, root design tokens, dependency manifests or lockfiles. No migration, backend configuration or user-record operation occurred.

The verification script captures ignored review artifacts under `artifacts/stage10b`; these are not application assets or commit candidates. The three intentional public app captures have separate provenance documentation. Initial full-page captures showed unrequested lazy images as empty until scrolled into view; final checks scroll/decode every image before capture and confirm successful loading.

## Review and limitations

Review locally at http://localhost:3001/, http://localhost:3001/about and http://localhost:3001/contact. The existing website and Expo server remained responding after verification; neither account/configuration nor tunnel was changed.

- Visual approval is pending. Browser checks are not physical iPhone/Safari/VoiceOver verification. Manual device and screen-reader review remains useful.
- Public contact details and real App Store/Google Play distribution URLs remain pending and intentionally inactive.
- The existing Admin operator gate is still unconfigured and fail-closed; staff identity/MFA/session integration remains a separate review. This stage does not make legacy local Admin operations live.
- No hosted preview was updated. Stage 10A restrictions and the new design are not claimed for previously deployed versions.
- Existing mobile beta, authentication email/recovery, image-inspection and external distribution limitations are unchanged.

Stop here for visual review. Do not begin another stage or create a Git checkpoint without explicit approval.

## Focused visual and motion refinement — 18 November 2026

The existing Stage 10B foundation was preserved and refined in place. All original homepage sections remain; only the requested static information strip was replaced, and the professional showcase is an additional section.

### Device presentation

Replaced the basic CSS rectangle/speaker presentation with original resolution-independent iPhone-inspired hardware artwork in `public/images/devices/iphone-frame.svg`. The reusable layered treatment includes inset glass, reflective metal edges, side buttons, a Dynamic Island-style camera/lens area, status details and a separate home indicator. CSS adds restrained perspective, contact shadows and lighting. This is custom vector product artwork, not an official Apple asset or a claim of a photographed physical device. No external template, image-generation service, licence purchase or dependency was introduced.

The three genuine application captures are unchanged and remain separate from the frame. They retain their complete 390:844 aspect ratio; the hardware/status area is outside the capture. Device dimensions reserve layout space, and screen changes animate opacity inside a fixed frame. Hero, audience previews and request explanation all reuse the same component. Device reveal and fine-pointer depth changes are finite/subtle, with reduced-motion overrides.

Existing captures are 390 × 844 source pixels. They are rendered below that CSS width, but higher-density native captures would improve extreme zoom/high-DPI scrutiny. The existing Expo HTTP preview was unavailable when checked, so no fresh captures, fabricated app UI, app modifications or user-data changes were made. Device artwork provenance is documented in its README.

### Text-focused CTAs

Removed decorative arrow icons from the rendered public header/mobile menu, hero CTAs/chips, service cards, journey steps, professional CTA, FAQ contact link, Contact CTAs and availability panel. Destinations are preserved. The request CTA is now a proper secondary button labelled **Explore How Servify Works**; other standalone CTA treatments use existing button styles. App captures retain their genuine internal navigation icons. Unused legacy walkthrough source is retained unchanged and is not rendered by these pages.

### Dual-lane motion strip

The static product strip is replaced by two opposite-direction continuous lanes. Customer wording follows the actual request/offer journey (no instant-booking or unverified trust promises); professional wording covers skills, work, discovery and reputation. A contrasting **Starting in Ibadan** chip anchors the location.

Equal-width repeated groups make the transform loop seamless, including viewports wider than the text's natural width. Visual duplicates are hidden from assistive technology. Pause/Resume is keyboard accessible; hover and focus pause motion, and IntersectionObserver suspends it off-screen. Both reduced-motion and no-JavaScript modes show useful wrapped static lists with duplicates and the inactive pause control removed. No timers, polling, backend calls or scroll-event loops were added.

### Additional professional showcase

Added **Meet Trusted Professionals** without replacing the existing professional campaign, trust section or categories. Three editorial cards use the already-attributed electrician, craftsperson and cleaning photographs. A central foreground card and rotated side cards provide the desktop fan; mobile uses a compact layered center-plus-two composition with readable labels. Staggered entry and small hover separation are disabled for reduced motion.

The adjacent disclosure explicitly says these are illustrative professions/editorial images, not Servify accounts or verified professionals. There are no names, invented ratings, reviews, live availability, locations or verification badges. The craftsmanship photograph does not add carpentry to the launch taxonomy. The CTA leads to the existing app preview, not a fictional public directory.

### Motion architecture and confirmed corrections

`MarketingMotion` progressively enhances off-screen public sections using a single observer and finite opacity/translate transitions. It reinitializes on public route changes and disconnects listeners/observers on cleanup. All content is visible without JS, observer support or reduced-motion enhancement. Keyboard focus reveals its containing section immediately. Hero/inner-page headlines, audience screen transitions, journey steps, card groups, About and Contact receive restrained motion. Existing fonts, colours, design tokens and underlying page structure are unchanged.

Confirmed visual corrections: the right-hand fan caption was obscured by overlap and is now aligned to the exposed edge; mobile editorial labels were shortened for legibility. At 1024px, the inherited rotated app-preview background extended half a pixel past the viewport and created a one-pixel horizontal scrollbar. Its tablet/desktop bounds were tightened while preserving the existing mobile inset. No global overflow hiding was used to mask that defect.

Test-only corrections: load/decode off-screen lazy images before measuring natural dimensions; scroll the marquee fully out of view when testing suspension (at 1440px, part of the strip can still be visible below the hero). These did not require weakening any application behaviour.

### Final refinement verification

- Lint and TypeScript: PASS.
- Production build: PASS, all 48 routes preserved. The installed Next.js version reports an existing security advisory. Some invocations stopped after completing compilation to show its upgrade reminder; retrying the unchanged build succeeded. No dependency upgrade or security configuration change was made. This warning remains an outstanding maintenance item and is not a claim of a vulnerability fixed by this UI work.
- `node scripts/verify-marketing-motion.mjs`: PASS source screenshot ratios/no CSS-size upscaling, preserved sections plus the added showcase, arrow removal/text CTAs, opposite marquee movement, equal-width loop seam, explicit pause/resume/hover, off-screen suspension, all six viewport widths, reduced-motion static content and route-change reveal initialization.
- `node scripts/verify-marketing.mjs`: PASS Home/About/Contact at 320, 390, 430, 768, 1024 and 1440px; images/fonts, keyboard menus/tabs/FAQ/skip links, stable audience layouts, reduced/finite motion, no-JavaScript navigation, honest inactive contact/store links and no browser console/page errors.
- Access-policy and production route regressions: PASS 48 public/retained routes, anonymous/private Admin denial, temporary isolated authorized Admin rendering, direct URL/RSC/prefetch/header-spoof/method restrictions, private identity endpoint, CSS assets and IndexedDB preservation checks.
- Source comparison: all 44 retained desktop page implementations match the starting Git checkpoint. Mobile, Supabase, data/domain repositories, route/Admin security, root tokens and dependency manifests/lockfiles are unchanged. Original user data and app captures were not reset or migrated.

Normal-motion desktop/mobile detail captures and six-width review artifacts are under ignored `artifacts/stage10b/`. These are review artifacts, not checkpoint source assets.

Remaining limitations: physical Safari/VoiceOver and lower-powered real-device performance require manual review; current genuine screenshot source resolution is noted above; the Next.js security advisory needs a separately scoped upgrade review. Existing Admin configuration, public contact, app distribution and mobile beta limitations remain unchanged. The website stays available at http://localhost:3001. No commit, push, deployment, service change or Stage 10C work was performed.

## Latest targeted visual review — 18 November 2026

This review supersedes the earlier split hero, two-lane strip, older device presentation and labelled editorial cards described above. It is a targeted continuation of the same uncommitted Stage 10B work; other sections and interactions remain preserved.

### Changes

- **Centered hero:** a typography-led two-line Servify headline, concise centered description and one primary app-information CTA. The phone, chips and large illustration composition are completely removed from the hero. A restrained blue/orange tint uses existing brand tokens. There are no invented endorsements, customer counts or ratings.
- **Navigation:** existing logo left, Home/About Us/Contact centered in a rounded pill, meaningful app-information CTA right. Existing active-page semantics, keyboard focus, mobile menu and no-JavaScript navigation remain functional. No account or marketplace links were introduced.
- **Plumbing only:** a new original generated plumbing detail is layered into the existing service card with a controlled dark overlay. Icon, heading, description, dimensions and destination are preserved. The other five cards are unchanged. The subtle photo hover respects reduced motion.
- **Professional cards:** replaced the three old images with new original generated professional scenes featuring African/Nigerian representation in believable work environments. Face/hand/tool details and consistent crop space were inspected. The three-card fan, prominent center, titles, descriptions and mobile layering remain. EDITORIAL IMAGE was removed entirely from all card captions with no replacement label. The nearby disclosure transparently identifies the scenes as AI-generated illustrations, not real Servify accounts or verification evidence.
- **One-row marquee:** Customer/Professional phrases now share one continuous sequence. The extra lane, visual heading row and persistent visible Pause motion control are removed. Repeated groups remain equal-width with an assistive-technology-hidden duplicate. Hover/focus, off-screen suspension and readable static reduced-motion/no-JavaScript alternatives remain. A keyboard-focus-only Pause/Resume animation button is retained to provide accessible control without a normally visible button; touch users can tap the strip to pause/resume. Instant-booking language was not introduced.
- **iPhone 11 style:** both remaining device compositions now use a wider, shorter notched frame with no Dynamic Island, matched to approximately the published iPhone 11 physical width/height ratio. The original vector hardware is separately documented. New genuine high-density app captures improve sharpness without changing the app or fabricating its interface. Device perspective remains restrained; the complete screenshot aspect ratio is preserved.

### Assets and provenance

Four built-in-image-generator outputs are saved as optimized website JPEG assets under `public/images/marketing/portraits/`: craftsperson-original.jpg, electrician-original.jpg, cleaner-original.jpg and plumbing-original.jpg. Original generated PNGs remain outside Git. The README explains their illustrative status and the complete prompt set is retained in `generation-prompts.json`. Existing Pexels assets remain intact for the other approved sections. No paid image service, account, mockup package or new dependency was used.

New `*-hd.png` captures in `public/images/app/` are 1170 × 2316 pixels, taken at a 390 × 772 CSS viewport with scale factor 3 from the unchanged Expo web app. The original screenshots remain intact. A separate local-only capture server on unused port 8082 was used and stopped afterward. All captures used a fresh signed-out storage context: no personal profiles, customer records or seeded marketplace activity. Only that disposable context's welcome marker was set. No real first-launch preference or local record was reset.

`iphone-11-frame.svg` has a 454 × 906 exterior and a 390 × 844 screen. The full 390 × 772 app capture fits between separate 48px status/notch and 24px home-indicator areas. No app content is stretched or covered by the notch. See `public/images/devices/README.md` and [Apple's published iPhone 11 specifications](https://support.apple.com/en-us/111865) for provenance and proportion notes. This is decorative vector hardware with a genuine Expo-web capture, not an official Apple asset or physical-iPhone screenshot claim.

### Verification and preservation

- Lint, TypeScript and production build: PASS. All 48 routes remain available/protected according to Stage 10A.
- Focused tests at 320, 390, 430, 768, 1024 and 1440px: PASS two-line hero, absent hero device, unchanged Plumbing/adjacent card dimensions, centered desktop pill navigation, professional asset references, complete removal of image labels, single seamless moving lane, accessible pause/hover/off-screen states, original app screenshot ratio and delivered optimized screenshot resolution sufficient for 2× rendering.
- The image-density test uses decoded file metadata, not HTML naturalWidth, because responsive images report density-corrected natural dimensions. Delivered image pixels were verified directly; no image quality expectation was weakened.
- Existing public-page browser tests: PASS loaded images/fonts, no horizontal overflow, audience-tab stability, keyboard menu/Escape, tabs, FAQ, skip links, reduced/finite motion, no-JavaScript navigation and no console/page errors.
- Access/security regression: PASS all 48 production page routes, direct URL/RSC/prefetch/header/method bypass rejection, private Admin authorization, authenticated identity boundary and synthetic isolated IndexedDB preservation.
- Source comparison: all 44 legacy desktop page implementations remain unchanged. Mobile source/configuration/dependencies, Supabase, domain repositories, root brand tokens and Admin/route-security source are unchanged. No account, database, actual user data or live environment was modified.

Local review remains http://localhost:3001/. No commit, staging, push, deployment or Stage 10C work. Remaining limitations are physical Safari/VoiceOver testing, visual approval, truthful use of illustrative generated imagery, pending public contact/distribution URLs and the previously documented Next.js security maintenance advisory. Temporary Expo browser captures are not physical-device verification.

## Approved Stage 10B checkpoint review — 18 November 2026

All 32 original pending files were reviewed against the visually approved implementation. Four superseded unreferenced assets (three low-density app captures and the old device frame) were preserved with matching SHA-256 hashes in ignored `artifacts/stage10b/checkpoint-archive/`, rather than published. The checkpoint therefore contains 28 intended source, test, documentation and optimized marketing-asset files. Generated originals, review screenshots, caches, dependencies, environment files and runtime artifacts are excluded. No approved application behaviour was changed during checkpoint review.

Prior lint, TypeScript, build, six-width browser, motion, image, keyboard and production access tests remain applicable: runtime/test/active-asset hashes match the final verified review snapshot. Only documentation and removal of unused public assets differ. All 44 legacy desktop pages and mobile/backend/domain/security/dependency sources remain unchanged from the starting checkpoint.

### Next.js advisory severity

Installed Next.js remains **16.4.3**. Read-only npm audit reports **8 Moderate package findings, 0 High and 0 Critical**, including these two direct Next.js advisories:

| Advisory | Vendor severity | Conditions | First patched 16.x |
| --- | --- | --- | --- |
| [GHSA-mfr8-8qww-v76h](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h) | Moderate, CVSS 4.0 6.3 | A `use cache` function reading root params is called both directly and through `unstable_cache()` during a cold-fill race | 16.4.5 |
| [GHSA-vc7v-qv4w-wrv8](https://github.com/vercel/next.js/security/advisories/GHSA-vc7v-qv4w-wrv8) | Moderate, CVSS 4.0 6.3 | Cache Components plus nested `use cache`, root params and delayed stream metadata | 16.4.5 |

No `use cache`, `unstable_cache`, root-parameter cache integration or enabled Cache Components setting is present in Servify's application/configuration. This lowers applicability of those specific paths; it is not a certification that an unpatched framework is vulnerability-free. The vendor's [November advisory list](https://github.com/vercel/next.js/security/advisories) also includes other conditional Moderate findings, including SVG optimizer handling, self-hosted fetched-response forwarding and Edge-route cookie headers. Servify uses trusted local marketing assets, no configured remote image sources, no unchanged upstream-response forwarding and no Edge route handler. No exploitation or load testing was performed.

The npm fix recommendation currently resolves to Next.js 16.4.6; vendor advisories first patch the listed issues in 16.4.5. A separately scoped framework/security dependency update should be reviewed before a future public deployment. No dependency, authentication, configuration or service upgrade was made for this checkpoint. Historical Critical advisories patched before this installed version are not being reported as current Critical findings. Passing UI/access tests does not remove dependency warnings.

### Deployment inspection

The existing `servify-website-preview` Netlify site was inspected through read-only account API requests. It has no repository provider/path/branch configured, no repository URL and no build hooks. Its most recent deployment remains a ready deploy-preview from 4 November 2026, without a Git commit reference; none of its listed previews is published as production. There is no GitHub Actions deployment workflow tracked in this repository. No Netlify setting, build, hook or deployment was created or changed. The GitHub push is a source checkpoint, not a manual application deployment; deployment metadata is checked again after pushing.

Physical Safari/VoiceOver review, public contact/store URLs, staff identity/MFA integration and the existing mobile beta limitations remain outstanding. No Stage 10C work or Supabase modification is included.
