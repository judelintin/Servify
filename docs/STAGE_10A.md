# Stage 10A — Mobile-first website architecture

Implemented from main 5cd929fe470ef3771b51d21068606f1722b85a7c. Uncommitted for review. No deployment, purchase, service upgrade, Supabase change or mobile application change.

## Audit and preservation

The Next.js website previously exposed Customer/Professional browser-local workflows directly. The Admin layout was a visual workspace shell with local preview confirmations, not an authenticated private boundary. Existing Supabase private administrator membership/MFA rules were not connected to that web UI. There was no functioning web Admin sign-in implementation to reuse; /auth pages are presentation-only stubs.

All Customer/Professional/Admin page implementations, feature/business logic, data repositories, schema formats, image handling and original records remain in place. Route layout wrappers now enforce the website policy before presenting retained screens. The workspace shell's only shared API addition is an optional main landmark ID for the private desktop wrapper. No desktop marketplace feature or data was deleted or automatically migrated. Browser records remain available at their original origin for a future explicitly approved restoration.

Installed Next.js 16.4.3 guides for proxy, layouts, not-found and authentication were read before coding. The supported src/proxy.ts convention is used; no deprecated middleware file. Proxy restrictions apply before HTML/RSC rendering, with additional server guards in legacy/private layouts. Client navigation hiding is not the access boundary.

## Runtime route policy

| Paths | Website behavior |
| --- | --- |
| /, /about, /contact | Public marketing/information pages with one shared header/footer/navigation configuration. |
| /#app | Mobile app information and availability; no functioning App Store/Google Play link while URLs are unset. |
| /customer/*, /provider/*, /providers/* | Server 307 to /#app, regardless of customer/professional cookies or operator credentials. |
| /jobs/*, /offers/*, /conversations/* | Same restriction, including direct dynamic/detail/edit/publish/review/workspace URLs. |
| /auth/* | Same restriction; source implementations are retained. No public website account creation/sign-in flow. |
| /admin/* | Server-only operator authentication on every request; unavailable when unconfigured, 401 for missing/invalid credentials when configured. Existing Admin contents are desktop-only at widths >=1024px. |
| /design-system | Private operator gate; internal reference source retained, not linked publicly. |
| /api/beta/session | Existing authenticated identity-only API remains unchanged: signed-out/unconfigured requests deny with 401/503 and never grant Admin authority. |
| Next static/image/font assets | Remain accessible so route controls do not cause an unstyled website. |
| Unknown routes | Existing branded 404. |

Proxy and server layout guards do not trust role cookies, URL parameters, x-servify-admin, user metadata or client-side flags. Request/prefetch/RSC headers do not exempt a route. Restrictions remain in place for HEAD and POST. Private responses and redirects use no-store/noindex headers. Future server actions/APIs would need their own near-data authorization; none was added in this stage.

Desktop sizing is a presentation constraint, not authentication. Changing viewport/user agent cannot authenticate an operator. The mobile app has no Admin functionality added.

## Private Admin access

A minimal server-only HTTP Basic operator gate now protects the retained browser-local Admin interface. This corrects the confirmed public-access gap without creating or changing any Supabase account or role.

- SERVIFY_ADMIN_USERNAME and SERVIFY_ADMIN_PASSWORD_SHA256 are server-only settings, documented blank in .env.example.
- The digest is SHA-256 hex of an independently generated high-entropy password (recommend at least 32 random bytes), not a normal low-entropy human password. Compare fixed-size hashes with timingSafeEqual.
- Never reuse Expo, Supabase or personal account credentials. Store the independent password in an approved password manager and the configuration only in ignored local/server secret settings; never NEXT_PUBLIC_, chat, logs or Git.
- Use HTTPS for any network-accessible deployment, or loopback-only local review. Do not transmit Basic credentials across an unencrypted LAN.
- No actual operator credential was generated, stored or configured for the running website. It therefore intentionally returns 503 for Admin/internal reference access until the owner configures it securely.
- Production/browser tests used an ephemeral random secret passed only to an isolated loopback test process in memory; it was not written to project files or printed.
- The operator gate grants access only to the retained local UI. Its preview confirmations remain. It does not grant a Supabase administrator role, bypass backend RLS, or replace the existing private.admin_members + verified active membership + aal2 backend requirements.
- A production staff identity/session/SSO/MFA and shared Admin operations integration remains a separate authorization design. A single operator secret is not per-person accountability or a claim that real marketplace moderation is connected.

Admin functionality was verified with temporary valid credentials across every retained Admin page. Anonymous/forged credentials were denied. Desktop navigation remains available after authentication; small screens receive an accessible desktop-required message instead of the application controls. Skip-link IDs remain unique.

## Public architecture and copy

PublicHeader, PublicFooter and PublicShell reuse src/lib/public-website.ts navigation: Home, About Us, Contact. Header/footer and homepage calls to action no longer lead to web sign-up, login, job posting or dashboards. Categories point to app information. The approved homepage imagery, asymmetric composition, typography, colors, marketing CSS, illustrative workflow and brand tokens were retained; no visual redesign.

About and Contact use existing layout/card primitives as basic structural pages. Contact clearly states that verified public channels are pending and does not invent an email address, collect information or simulate sending a message.

AppAvailability uses explicit null distribution URLs. Store availability is plain non-interactive text until real approved URLs are supplied. The site does not imply that a publicly downloadable release or unrestricted mobile registration exists; controlled mobile testing remains the actual status.

## Verification

- ESLint, TypeScript and production build: PASS.
- Access-policy unit checks: PASS mobile-only roots, encoded/case variations, path boundaries, invalid paths, missing configuration, malformed/wrong credentials and valid ephemeral operator credentials.
- Production test: PASS all 48 retained/prepared page routes. Home/About/Contact 200; legacy routes redirect before returning their UI; Admin/design system reject anonymous requests and render for the authorized operator. Existing authenticated identity API still denies anonymous/unconfigured callers. Unknown route 404 and CSS assets 200 with CSS MIME type.
- Direct dynamic URLs, RSC/prefetch requests, forged role/auth/admin hints, subrequest headers, HEAD/POST and operator-authenticated legacy requests: PASS restriction tests.
- Chrome browser checks at 320, 390, 430, 768, 1024 and 1440px: PASS public page rendering, no horizontal overflow, reduced-motion context, menu keyboard activation/Escape/focus restoration, skip links and no page errors.
- Authenticated Admin desktop navigation and mobile desktop-required message: PASS.
- IndexedDB preservation: PASS seeded draft/provider-profile/marketplace rows and photo-byte sentinels remain byte-for-byte unchanged after public navigation and a blocked legacy URL. Tests use a separate browser context/origin; actual user records were not reset or opened.
- Test corrections only: relative Next.js Location values are resolved against the test origin; the unchanged optional identity API's unconfigured 503 is treated as denial alongside 401. No application rule was weakened to pass checks.
- Git diff confirms no changes under apps/mobile, supabase, src/data or src/features. Original marketplace/Admin page files remain unchanged except route layout guards; dependencies/lockfiles, mobile auth, Expo owner/configuration and Supabase settings are unchanged.
- Source security scan: PASS across all 25 candidate source/example/test/documentation files. No actual environment file, credential, generated build/cache or test artifact is a checkpoint candidate. Operator setting names are absent from client build assets. All 44 retained marketplace/Admin/auth page implementations match their Git baseline after normalizing Windows line endings.

The existing website remains on http://localhost:3001, with /about and /contact ready for local review. Restored Expo Go route: exp://c-kodlinsteam-qg883e-mwj8h05tns4sck4c.on.expo.app/--/beta. Metro and the tunnel returned HTTP 200; its current QR is in the running Expo terminal. During final checks Expo was unresponsive with no running process/listener; it was restored using its existing Expo Go tunnel command and unchanged configuration. Native/mobile feature tests were not repeated for website-only changes; prior approved mobile functionality/data formats were not touched.

## Remaining gates and next checkpoint

1. Configure independent server-only operator credentials securely before using Admin; fail-closed behavior is intentional until then. Review production staff identity/MFA needs before connecting shared administrative operations.
2. Supply approved public contact channels and real App Store/Google Play distribution URLs when available. No fake links/forms are present.
3. This change is local source only. Existing hosted previews were not updated and may retain their old routes. Before any separately approved deployment, verify hosted Next.js Proxy support, forwarded Authorization headers, HTTPS, no-store behavior, anonymous denial and asset delivery on the actual host. No protection is claimed for an old deployment.
4. Existing mobile beta limitations (physical-device/Expo account access, SMTP/recovery, password protection and media inspection) remain as documented in BETA_STAGE_09.md. Website route gating does not attest that an external Supabase REST client is a mobile device; backend RLS remains authoritative.
5. Future desktop restoration requires an explicit policy/guard change and authorization review. Legacy feature/test source is preserved; older UI tests expecting publicly accessible workspace pages describe historical behavior. npm run verify:routes now tests the current architecture.

Next checkpoint: review Stage 10A access policy, operator-gate trade-off, public page structure and verification, then explicitly authorize any Git checkpoint or later visual-design stage. No commit, push or deployment in this stage.
