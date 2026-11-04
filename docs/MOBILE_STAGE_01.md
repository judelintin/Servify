# Servify Mobile — Stage 01

## Scope and repository boundary

The React Native application lives in `apps/mobile`. It is an independent npm package with its own package-lock, Expo configuration, TypeScript, lint and preview scripts. No workspace manager, hoisting, shared React installation, backend, Figma work or repository restructure was introduced.

The approved Next.js application remains at the repository root. Its source, interfaces, root package.json and root lockfile are unchanged from web checkpoint `8a29f20`. The only root configuration changes exclude `apps/mobile` from Next TypeScript/ESLint checks and ignore Expo/export output. These exclusions prevent native types and dependencies from entering the web build. Existing web browser records are untouched.

```text
apps/mobile/
  src/app/                 Expo Router routes and layouts
    (tabs)/                home, jobs, activity, messages, profile
    post-job/              category selection and explicit stage boundary
    switch-mode.tsx        shared customer/professional selector
    professional-setup.tsx read-only plan for later profile editing
  src/ui/                  typography, buttons, input, cards, progress, navigation
  src/theme/tokens.ts       colours, spacing and radii
  src/domain/              portable catalogue and mobile preview contracts
  src/data/                AsyncStorage adapter and testable persistence core
  assets/                  local Inter Tight, editorial photo and app icon
  scripts/                 domain/storage and isolated browser verification
```

## Technology and compatibility

Current stable versions were checked against npm and official Expo documentation during implementation. Expo SDK `58.0.23` selects React Native `0.88.1`, React/React DOM `19.3.0`, Expo Router `58.0.30`, React Native Web `0.21.4`, TypeScript `6.0.3` and the compatible safe-area/screens/linking/font/status-bar packages. `npx expo install --check` passes. Supported Node versions follow the installed SDK: 22.13+, 24.3+, 26+, or a newer supported major as specified in package.json.

AsyncStorage `2.2.0` supplies mobile-compatible local persistence. Feather comes from Expo's compatible vector-icons package; no additional icon or animation library was installed. Navigation uses the current Expo Router tab contract (`emitter` and `navigateToTab`), not obsolete React Navigation tab-bar props. Native view refs use React's component-ref type for RN 0.88 host elements.

The provisional six-service catalogue mirrors the web's slugs, labels and descriptions. A parity check protects it from drift. Mobile reuses the pure web `UserRole` contract through a type-only import, which is erased from native bundles. No Next components, browser storage adapters or web routing are imported at runtime. More shared domain extraction can wait until a real mobile workflow needs it.

## Design and completed screens

This is a native component implementation using View, Text, Pressable, Image, ScrollView and native navigation. It does not embed the website in a WebView. Inter Tight, ink, warm white, blue and navy establish continuity; orange is restricted to accents. Cards, compact service tiles, clear press/focus feedback and generous spacing follow mobile conventions. Touch controls generally provide 44–52px or larger targets. The browser preview centres the app on wide displays while native screens use device width and safe-area insets.

- **Customer Home:** neutral welcome without an invented identity; strong Post a Job action; local editorial electrician image; all six services; actual saved request starters or a helpful empty state; practical next-step guidance.
- **Professional Home:** distinct navy introduction and profile-first primary action while the profile is incomplete; honest 0-of-4 profile guidance because profile editing is not implemented; services/coverage marked unset; empty opportunities and clearly unfinished offers/delivery summaries. Find Jobs remains in the tab bar. No fabricated clients, ratings or jobs.
- **My Jobs:** saved mobile request starters, meaningful empty state and navigation back into their category selection. These are not complete or published requests.
- **Find Jobs / Offers / Messages:** purposeful, labelled stage boundaries. No sample job feed, offer submissions, message delivery or synchronization is simulated.
- **Profile:** current preview identity, role switch, device/session persistence explanation and explicit absence of authentication or secure isolation.
- **Mode selector:** Customer and Professional options, checked state and local persistence. Both modes share the same application and catalogue.
- **Post a Job:** actual first-step selection, seven-segment progress, native scroll/safe-area treatment, selected indicators, Back/Next and field validation. Invalid Next displays an alert, focuses the first category in the browser and announces the error on native accessibility services.
- **Stage boundary:** Next saves the chosen service, then explains that Details and the remaining six steps are not implemented. Change service preserves the same starter; Save for later returns home; discard uses explicit confirmation. Nothing is published.
- **Professional setup / missing route:** useful read-only setup plan and recovery screen, without implying unfinished functionality is operational.

The local photograph is copied unchanged from the approved web assets with provenance in `apps/mobile/assets/README.md`. It is labelled editorial, not a listed provider. The compact app icon is a local Servify blue `s` treatment with the orange accent; its SVG source is retained. No user photographs or portfolio data were copied.

## Navigation and accessibility

One Expo Router Stack contains one shared five-tab workspace. Customer tabs are Home, My Jobs, Post Job, Messages and Profile. Professional tabs are Home, Find Jobs, Offers, Messages and Profile. The central customer action opens the posting Stack without creating a redirect/back loop. Mode changes update navigation and home content; route labels use the same customer/provider terminology as the domain contracts.

Tab history and Stack back actions are delegated to Expo Router. Back from the stage boundary retains the selected service and starter identity. Header back has a home fallback for deep entry. The discard modal handles native back dismissal. Hardware/predictive back still requires device verification; browser-history checks are not claimed as hardware tests.

SafeAreaProvider, SafeAreaView and bottom inset padding protect native system areas. KeyboardAvoidingView supplies iOS keyboard handling, although this first step intentionally contains no text fields. A reusable labelled input primitive is prepared for later steps. Reduced-motion preferences disable Stack transitions; no continuous decorative animation is used. Native accessibility states and current React Native Web ARIA aliases are both provided, so selected tabs and radio cards expose their state correctly. Browser focus rings are explicit and visible. React Native Web's default Pressable handles Space for button roles but not radio roles; the web-only keyboard adapter adds Space activation for service/mode radio cards using the current native-event signature. Enter uses the standard Pressable behavior. No DOM or browser-storage APIs are imported into application screens.

## Local data and recovery

The mobile-owned key is `servify.mobile.preview.v1`. Schema 1 contains only mode and service-selected request starters with local IDs, category, timestamps and stage. It does not contain authenticated identities, addresses, contact details, complete jobs, offers or messages. IDs are local preview identifiers, not production account/resource IDs. Web IndexedDB and mobile data do not synchronize.

Initial reads are bounded to four seconds. Schema/category/ID/date checks reject malformed, future or oversized data. Failed reads resolve to a usable session-only state; original unreadable data is not overwritten. Writes are serialized to preserve rapid mode/starter changes. Failed or stalled writes retain in-memory choices and expose explicit session-only feedback, including on request cards and detail views. There is no eviction or silent replacement of another starter. Only an explicit discard removes a selected starter. Storage is not encrypted or an authorization boundary; no secrets should be entered.

## Start and test

From the repository root:

```powershell
cd apps/mobile
npm install       # only when restoring dependencies
npm start         # Metro / Expo on port 8081
```

- Browser preview: `http://127.0.0.1:8081/` (or run `npm run web`). This is the Expo React Native Web preview, separate from the approved website on port 3000.
- Compatible device: keep the computer and phone on the same network, run `npm start -- --lan`, and use the terminal QR/Expo URL with an Expo Go build compatible with SDK 58. LAN/firewall and phone compatibility must be checked on the actual device. No tunnel account or cloud build was configured.
- Android emulator, when installed: `npm run android`.
- iOS simulator requires a Mac/Xcode environment: `npm run ios` there.
- `npm run typecheck`, `npm run lint`, `npm run verify:domain`.
- Browser tests: set `SERVIFY_PLAYWRIGHT_PATH` to an existing Playwright installation, optionally `SERVIFY_BROWSER_PATH`, then `npm run verify:browser`. They use isolated contexts, not the review browser's records.
- All local bundles: `npx expo export --platform all --output-dir dist --max-workers 2` or `npm run export:all`. `npm run export:web` exports the browser target only. Export output is ignored and is not an APK, IPA, signed build or deployment.

## Final Stage 01 UI refinements

Customer Home's heading/copy/hero spacing was reviewed at 320, 390 and 430px and retained: its initial viewport screenshots are pixel-identical to the pre-refinement baselines. Photography, discovery cards, recent starters and the customer navigation are unchanged.

Professional Home now leads with **Complete your profile**, explicitly names **Professional introduction** as the next setup section, and retains a visible note that setup is a preview and editing comes in a later stage. The existing read-only setup destination is reused; no onboarding form or new profile data was introduced. The navy card uses slightly tighter padding and internal spacing (287px high in the tested viewports). Its Find Jobs CTA and the repeated opportunity-card Find Jobs CTA were removed; Find Jobs stays accessible through the existing five-tab navigation. A small presentation-only `professionalGuidance(profileComplete)` policy can return the discovery action when a future stage supplies actual profile completion. Stage 01 always supplies `false`; it does not invent completed profiles.

Post a Job's detailed category cards now use a 148px minimum height instead of 160px and a 12px icon-to-label gap instead of 14px. At 320px, content naturally expands longer cards to 156–157px; descriptions, icons, text sizes, blue borders, subtle selected backgrounds, checks and focus styling are retained. Home discovery cards are unaffected.

Normal viewport scrolling was inspected before changing the layout. There is no extra spacer above the fixed form actions: the ScrollView ends exactly where the footer begins. At the bottom of the form, the last text has 32px of content breathing room, followed by the action bar's 20px top padding and border. The five-tab bar likewise uses its existing safe-area spacing. Full-document screenshots do not describe independently scrolled native ScrollViews reliably; no oversized blank-space defect was reproduced in normal use, and neither the shared Page layout nor tab-bar implementation was changed.

Focused verification is available as `node scripts/verify-refinements.mjs` in `apps/mobile`, using the existing Playwright environment variables. It compares customer screenshots when local pre-refinement baselines exist; screenshots/results are ignored under `artifacts/mobile-stage-01/refinement/`. At 320, 390 and 430px it checks the profile-first route, next-step guidance, Find Jobs navigation, both mode switches, reload persistence, preservation/editing of request starters, invalid/valid category states, keyboard activation/focus, selected colours, content containment, tab count/padding, reduced motion and absence of horizontal overflow or console/page errors. A 540px-high viewport also confirms scrolling and fixed-action visibility on a shortened screen. Targeted ESLint and TypeScript pass. No full regression suite, dependency installation or bundle rebuild was needed for these limited UI changes.

Android SDK/adb/emulator remain unavailable in this environment; iOS simulator testing requires macOS/Xcode. Step 1 contains no text field and does not summon a mobile keyboard, so the shortened-browser check is not an actual OS-keyboard test. Physical safe-area insets, virtual keyboard behavior, VoiceOver/TalkBack and hardware back still require native-device review. Existing KeyboardAvoidingView and inset handling are preserved. Website files, storage schemas and persistence adapters are untouched by this refinement; no Mobile Stage 02 work was started.

## Verification results

- Expo/Metro starts and serves the application successfully on port 8081. Compatible dependencies pass the Expo version check.
- Mobile ESLint and TypeScript pass. Domain tests verify catalogue parity, role restoration across store restart, existing-starter edits without duplication, removal, serialized changes, invalid categories/roles/schemas, denied/quota/stalled storage and preservation of original malformed records.
- Chrome browser checks pass at 320, 390 and 430px: both homes, all tabs in both modes, role persistence after reload, category validation and focus, checked state, browser back with preserved selection, edit/save/reload without duplicate starters, discard confirmation, readable layouts, no horizontal overflow, visible keyboard focus and reduced-motion behavior. A final 390px smoke regression covers the keyboard adapter; category prefill, Space selection/mode switching and Enter on Next are also checked directly. Read/write failures are separately exercised with explicit session-only feedback. No page or console errors were recorded. Fixtures exist only in closed isolated browser contexts; screenshots/results remain in ignored `artifacts/mobile-stage-01/`.
- Android and iOS Hermes bundle exports, web bundle export and local assets all succeed. No emulator, simulator or physical-device UI tests were performed: Android SDK/adb/emulator were unavailable, and this Windows environment cannot run the iOS simulator. Native exports prove bundling, not installation, hardware-back behavior, keyboard behavior or device rendering.
- Root web ESLint, TypeScript and production build pass with the mobile directory present. The web source and dependency files remain unchanged from `8a29f20`; only tool-scope/ignore configuration changes were required.

## Remaining limits and next priorities

Physical Android/iOS review is required before approving native presentation: font weights, system bars, safe areas, large text, VoiceOver/TalkBack, reduced motion and hardware/predictive back. SDK 58-compatible Expo Go/native tooling must be available on the review devices. Local browser reload and store reconstruction confirm persistence; an actual device process restart is not yet tested.

The npm audit reports 18 moderate dependency findings (no high/critical findings), reconfirmed during the local checkpoint review. These arise from upstream glob/minimatch advisory chains in Expo CLI/fingerprinting and ESLint tooling. Nonbreaking audit repair did not resolve them; the suggested forced repair would downgrade Expo to an incompatible older major and was not applied. Track compatible upstream toolchain fixes before production distribution; no broad dependency override or forced downgrade was introduced.

The next mobile stage should implement professional onboarding and the remaining request steps with deliberate validation and media/storage limits, following separate approval. Live authentication, shared backend/RLS, synchronization, offer creation, messaging, verification, payments and publishing remain out of scope. Existing OTP, launch coverage, privacy, cancellations and dispute-policy decisions remain unresolved.

Mobile Stage 01 and its final UI refinements are approved for this local Git checkpoint. No push, deployment or cloud resource was created. Review remains local and the web and Expo development servers are left running.
