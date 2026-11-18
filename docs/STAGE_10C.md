# Stage 10C — final website QA and deployment readiness

Reviewed 18 November 2026 against `ff35b9dbd519772299762997b3449e1e49d56370`.

## Outcome and changes

Ready for owner review and a separately authorized hosted draft verification, **not an unconditional production sign-off**. No redesign, mobile/backend modification, Git checkpoint, push, deployment or cloud configuration change was performed.

- Updated root Next.js and matching eslint-config-next **16.4.3 → 16.4.5**, the first compatible patch for the documented advisory. Only their related lockfile entries changed; React and mobile dependencies were not upgraded.
- Added `role="group"` to the already-labelled professional portrait container so its accessible name has an appropriate semantic role. No visual change.
- Added build-only `netlify.toml`: root `npm run build`, `.next` publish directory, Node 24. Added `.netlify/` to ignored artifacts. These files do not link a site or initiate deployment.
- Added `scripts/verify-website-readiness.mjs` for production accessibility, links, fail-closed Admin, text-background contrast and synthetic performance checks. Test output stays in ignored `artifacts/stage10c/`.

## Security advisory

[GHSA-vc7v-qv4w-wrv8](https://github.com/vercel/next.js/security/advisories/GHSA-vc7v-qv4w-wrv8) is Moderate (CVSS 4.0 6.3), affecting Next.js >=16.2.0 through 16.4.4; the first patched compatible version is **16.4.5**. The described cache-key exposure requires Cache Components, nested `use cache` calls, root-parameter reads and delayed streamed metadata. No enabled Cache Components, `use cache`, `unstable_cache` or root-parameter cache use was found in Servify's application/configuration. The prerequisites were absent, but the installed affected framework was patched before deployment preparation.

Post-update npm audit: **0 production dependency findings**. Full audit retains **7 Moderate development-tool findings**, no High/Critical findings; they concern the TypeScript ESLint/minimatch chain. No unrelated tooling upgrade was introduced. An audit is a point-in-time advisory check, not proof of vulnerability absence.

## Verification

Passed on Next.js 16.4.5:

- `npm run lint`, `npm run typecheck`, `npm run build`: production build includes all **48 page routes**.
- `node scripts/verify-website-access.mjs` and `node scripts/verify-routes.mjs`: public routes, all protected routes, direct URL/RSC/prefetch, forged headers/cookies, method and authentication bypass cases; ephemeral authorized Admin session; isolated synthetic local-data preservation.
- `node scripts/verify-marketing.mjs` and `node scripts/verify-marketing-motion.mjs`: Home/About/Contact at **320, 390, 430, 768, 1024, 1440px**. Navigation, keyboard menu/Escape/focus restoration, skip links, audience tabs, FAQs, category/professional compositions, app CTAs, reduced motion, marquee pause/off-screen behaviour, no-JavaScript navigation, loaded fonts/images, no horizontal overflow or browser exceptions.
- New readiness check: **18 page/width states plus open mobile menus**, zero automatic axe WCAG A/AA/best-practice violations; all internal destination/fragment links resolve. Document language, distinct titles/descriptions and intended noindex state verified.
- Sampled contrast of hero text/CTA/notes, photo-overlay text and image captions passes relevant 3:1 or 4.5:1 thresholds (minimum sampled normal text 5.04:1). This supplements axe's incomplete gradient/image checks; it does not replace manual accessibility review. An early test measurement sampled adjacent headline glyphs as background; masking the entire heading corrected that harness artifact. Website colours were not changed.
- Genuine high-density Expo-web screen captures remain clear at expected display sizes, with full screenshot aspect ratio and approximately iPhone 11 physical proportions. These are existing app captures in illustrative hardware, **not physical-device screenshots or proof of native rendering**.
- All **44 legacy desktop page implementations** byte-equivalent after newline normalization against starting HEAD. Mobile, Supabase, domain repositories, brand tokens, route restrictions and Admin gate sources unchanged.

Readiness script uses existing installed axe/Sharp and an externally supplied Playwright runtime (`SERVIFY_PLAYWRIGHT_PATH` supports overriding the local fallback). Its isolated production server is stopped afterward. The normal website remains running at http://localhost:3001/.

### Synthetic performance (not hosted field data)

One cold browser context per page, 390×844, reduced motion, simulated 4× CPU / 1.6Mbps download / 100ms latency on local production output:

| Page | LCP | CLS | Response start | Transferred resources |
| --- | ---: | ---: | ---: | ---: |
| Home | 3.56s | 0.0020 | 103ms | 494KB |
| About | 1.62s | 0 | 102ms | 507KB |
| Contact | 2.24s | 0.0374 | 102ms | 486KB |

All three have low measured layout shift. Home LCP exceeds the 2.5s good threshold in this single synthetic run: assess hosted mobile performance and font delivery before claiming Core Web Vitals compliance. Existing local Inter Tight font is approximately 582KB; a reviewed WOFF2/subsetting opportunity remains, without changing typography. These are not p75 field measurements or a Lighthouse score. Optimized local imagery and responsive image delivery remain functional.

## Content and SEO

- Contact explicitly states that public contact channels are not available. No fake form, address, email submission success or operational support method is presented.
- Store URLs remain unset; App Store/Google Play availability is noninteractive. Marketing CTAs lead to truthful app information, not desktop marketplace or invented download destinations.
- Professional portraits are illustrations with their existing disclaimer; they do not claim real provider ratings, identities, verification or transactions.
- Three Pexels attribution links remain external provenance references. Internal links and local image delivery were tested; third-party page availability is not guaranteed by the application checks.
- Unique titles/descriptions and `en-NG` are present. **noindex, nofollow** remains intentional for preview. `robots.txt` and `sitemap.xml` currently return 404; no canonical production origin or Open Graph metadata is configured. Decide the approved production domain and indexing policy before a search-ready public launch; do not invent a domain or remove noindex automatically. Open Graph/social imagery and sitemap/robots setup remain launch tasks, not a hidden claim of SEO completion.

## Access controls and Netlify requirements

Local production verification confirms Customer/Professional/Auth workflows redirect server-side to app information, including RSC/prefetch requests. Admin and design-system access returns **503 when configuration is absent/malformed**, 401 for invalid configured authorization, and permits the isolated valid test credentials only. Private responses use no-store/noindex. Role cookies and injected headers do not grant access.

The operator gate is a server-only Basic credential wrapper around the preserved desktop prototype; it is **not Supabase staff authentication, MFA, or shared-data administration**. It must not be presented as a production staff identity system. No production credentials were generated or configured.

Read-only Netlify inspection found:

- Site `servify-website-preview`, no repository provider/URL, build hook or automatic Git deployment configuration; no site environment variables were configured.
- Existing build fields are unset. The newly added build file is local preparation only.
- Latest old ready draft is from **4 November 2026**, deployment `6aeb746d0daa715d921e73f4`. Its existing HTTPS preview returns **200 for `/customer/dashboard` and `/admin/dashboard`**. It predates Stage 10A and does not demonstrate the current guards. No live shared Admin authority was established by that old prototype, but the old preview must be replaced or retired through a separately approved action before declaring restricted hosted access complete.

For the next authorized deployment:

1. Build the **repository root website**, not `apps/mobile`, using the lockfile and matching Node 24 build environment. Use [Netlify's supported automatic Next.js/OpenNext integration](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/). It must package SSR/RSC, Proxy/middleware, image optimization, functions and static assets; do not static-export, directly upload raw `.next`, add an SPA catch-all, or pin the legacy adapter.
2. Keep manual draft deployment and Git integration disconnected unless separately approved. No custom domain or production release is authorized in this stage.
3. Marketing does not require Supabase credentials. Optional beta identity endpoint must continue failing closed when its public client configuration is absent. Never include mobile environment files, service-role keys, local environments, caches or artifacts in deployment input.
4. Leave `SERVIFY_ADMIN_USERNAME` / `SERVIFY_ADMIN_PASSWORD_SHA256` unset to keep Admin closed. If operator access is approved later, configure high-entropy server-only values through Netlify UI/API, context-specific and available to the appropriate Build/Functions scopes, never public-prefixed or committed. [Netlify runtime environment rules](https://docs.netlify.com/build/edge-functions/environment-variables/) require runtime variables through UI/CLI/API rather than assuming build-file variables reach middleware. Changes require a new deployment.
5. Current Proxy uses Node crypto without filesystem/native-addon dependencies. Adapter and runtime behaviour still require actual hosted tests: anonymous/forged/RSC access, malformed/missing configuration, authorized private responses, cache isolation, static assets/MIME, fonts/images, security headers, HTTPS and redirect behaviour. Local passing tests cannot certify an older hosted deployment.
6. Verify the updated anonymous draft URL first, then seek separate production approval. Check image/function/compute usage against the existing plan without upgrading or purchasing services.

## Blocking versus non-blocking limitations

**Before a production sign-off:** replace/retire old unrestricted preview with approval; test the approved current source on actual Netlify/OpenNext including route/Admin boundaries; settle public indexing/domain policy if launching for search. If operational public support or app distribution is expected, establish verified channels and genuine store URLs first. Their explicit unavailable states are acceptable for an informational controlled preview.

**Non-blocking for owner/local review:** Home's single-run LCP opportunity; development-only lint-tool advisories; social metadata; external attribution availability; native Safari/VoiceOver review outstanding. Perform physical Safari checks for font rendering, image crops, zoom/text resizing, orientation, sticky navigation, touch marquee pause and reduced-motion settings. VoiceOver should verify menu announcements/focus, tabs/FAQ, illustrative-image descriptions and screenshot reading order. Automated Chrome results do not certify these.

Mobile beta limitations (SMTP/recovery, image inspection, signed-link behaviour, native accessibility and physical interruption/two-phone tests) remain documented in the existing beta records and were not changed or re-tested as website deployment claims.

## Recommended next checkpoint

Owner review → separately approved Git checkpoint → authorized manual hosted draft with current source → hosted security/assets/accessibility validation and old-preview disposition → separate production release decision. No Stage 10D work started. Existing local records and active mobile environment were not reset or migrated.
