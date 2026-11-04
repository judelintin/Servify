# Servify Mobile Stage 03 — Professional onboarding, profile and portfolio

## Stage 02 checkpoint

Before Stage 03 implementation, the approved customer request flow and final Photos refinement were reviewed and committed locally on `main` as `b2bc3da43314842baa376a14511b83fa29534193`:

`feat: complete Servify mobile customer job posting`

The working tree was clean immediately after that checkpoint. It contains only Mobile Stage 02 source, necessary Expo dependencies, tests and documentation. Existing successful static, bundle and browser verification was reused. No secrets, screenshots, generated bundles, runtime records, website changes or hosting configuration were committed. Nothing was pushed or deployed.

## Implemented experience

The existing `/professional-setup` route is now a real six-step local editor. The web product model was inspected first; mobile follows its actual sequence rather than moving experience away from services.

| Step | Mobile behavior |
| --- | --- |
| About you | Individual/small-business choice, professional display name, optional separate business name, optional profile photo. |
| Services | Multiple selections from the same six categories; whole years of experience; optional expandable specialties and service descriptions. Deselection removes specialties/notes for that service. |
| Coverage | Multiple general Ibadan areas from the shared catalogue. No GPS or exact residential address. Not a claim of validated launch coverage. |
| Introduction | Professional biography plus optional self-reported qualifications/training. No credential files or identity-document collection. |
| Portfolio | Up to eight real work samples; image, project title, description and offered-service category. A focused modal edits project context without crowding the gallery. |
| Review | All details, avatar and work samples; section-specific editing; final validation and Finish profile. Finishing creates a local profile, not a public listing or verification application. |

Professional Profile replaces the professional placeholder inside the existing Profile tab. It shows the professional’s actual entered name/business, introduction, services, areas, experience, qualifications, gallery, completeness and edit actions. Avatar upload/replacement/removal works directly on Profile as well as in onboarding. Missing images show initials or a neutral fallback, never an invented identity.

Professional Home retains the approved hero composition, colors, spacing styles and navigation. It now derives progress, next required step, service/area counts and entered name from the real profile. Complete your profile remains primary until required details are complete and reviewed. Afterwards View your profile is primary; Find Jobs remains in navigation. Offers, Active Jobs, discovery and messaging remain honest placeholders without fabricated records.

Customer Home JSX and the Stage 02 Photos screen presentation are unchanged. The approved Customer Home image-sizing correction is documented below; other Home layout styles are preserved. The customer Profile branch, request forms and draft data model are preserved. The website is untouched.

## Completeness and verification

The percentage matches the web’s six-item calculation: four required sections (professional details, services/experience, coverage, introduction) and two optional extras (profile photo, at least one complete work sample). Each contributes one sixth, rounded. Required details can be complete at 67%; the UI explicitly explains optional extras. A reviewed required profile is not reset merely because an optional portfolio image is being edited. Incomplete optional projects remain labelled and editable; new onboarding cannot finish with partially entered project details.

Every checklist row is actionable and opens the corresponding step, including completed and optional sections. The next-step recommendation uses actual validation results, not a hardcoded onboarding percentage.

Verification guidance states that information and work samples are self-reported, verification is not available, and the profile is not published or searchable. There are no verified badges, customer ratings, invented work history, credentials, identity uploads or verification API calls. Unknown persisted trust fields are discarded by the parser rather than copied into writes.

## Local model and persistence

`src/domain/professional.ts` defines a versioned `ProfessionalProfile` with fixed local ID, revision, created/updated timestamps, active step, reviewed flag and professional content. Content includes type, display name, optional business name/avatar, categories, specializations, service notes, whole years of experience, general areas, bio, qualifications and portfolio entries. Each portfolio entry has a stable local ID, title, description, service category and nullable image reference. A missing image is permitted in autosaved draft metadata so removing an image does not destroy project context; completing that entry requires a replacement image.

The singleton store uses AsyncStorage key `servify.mobile.professional.v1`, independently of `servify.mobile.requests.v1` and the existing mode/starter key. Role changes do not clear either data set. Browser and website records are not synchronized, and mode switching is not authentication or secure account isolation.

Autosave debounces for 350ms. Step changes, explicit saving, backgrounding and unmount flush pending changes. The route tracks the current step so reload restores the active editor section. Captured edits are serialized; revisions reject stale screens, and disk-baseline comparisons stop external-window changes from being silently overwritten. These are best-effort local checks, not cross-process database transactions.

Reads and writes have four-second bounds. Malformed or future-schema data is left untouched. Session-only changes remain available in memory with explicit notices, including in dashboard/profile copy. Retry professional storage verifies the disk baseline before writing. Malformed or externally changed records block automatic replacement and explain why. No persistent success message is shown for a failed write. As with Stage 02, an OS-killed process during a debounce/write can lose the latest unfinished keystrokes; timeouts cannot cancel underlying native storage operations.

## Images and portfolio

The Stage 02 Expo image picker, resize/compression and app-managed file adapter are reused. All existing customer calls retain their default namespace and original file locations. Professional images use a separate native document directory (`servify-professional-photos`) and web key prefix (`servify.mobile.professional.photo.`). Customer photos remain in `servify-request-photos` / `servify.mobile.photo.`. Customer cleanup therefore cannot delete professional files, and professional cleanup cannot delete customer files.

Input/output limits and platform behavior remain the Stage 02 rules: supported decodable image types, reported input size up to 10 MB, at most 60 megapixels, proportional resize to a 1,600px longest edge, JPEG quality 0.78 and output up to 1 MB. Source metadata sizes can be unavailable; output validation still applies. Browser preview stores JPEG data through AsyncStorage; native copies images into the app document directory and reconstructs URIs from IDs. No temporary picker URI is persisted as the durable photo reference, and nothing uploads remotely.

Portfolio cards group thumbnails, project text and accessible Edit/Replace/Remove image/Delete controls. Removing only an image preserves title, description and category across reload. Deleting an entire entry requires confirmation. Replacement/removal retires a file only after successful metadata persistence and a current-reference check. Conservative orphan cleanup considers only that role’s own namespace, excludes referenced files and waits seven days. Failed/interrupted saves retain files for recovery rather than deleting photos still referenced by durable metadata.

## Validation and navigation

- Professional/business type and a 2–100-character professional name are required. Optional business name is limited to 100 characters.
- At least one of the established services, whole years 0–60 and at least one configured general area are required. Specialties must belong to offered services; service notes are optional, up to 200 characters each.
- Introduction is 30–1,200 characters. Optional qualifications are limited to 500 characters and marked self-reported.
- Work samples are optional, capped at eight. Added entries need an image, a 3–100-character title and one of the offered services. Description is optional, up to 500 characters. Removing a service can require reassigning affected portfolio entries before finishing.
- Errors are field-level and announced; the first error stays visible above bottom actions. Required text fields receive focus, other steps focus the heading. Portfolio editing validates context before its Save project details action closes the editor.
- Existing shared input/focus primitives, reduced-motion behavior, scroll containers and safe-area/keyboard avoidance remain in use. Checkbox/choice states have semantic roles and keyboard activation. Controls use at least 44px targets.
- Header Back, bottom Back and Android hardware back retain progress. Save & exit returns to the Profile tab. Portfolio modal back preserves partial metadata rather than silently discarding it.

## Web/mobile alignment and deferred migration

Web/mobile share type/name, selected category and area slugs, specializations, experience, biography, six-step sequence and six-item completeness. Mobile extends the web model with a separate business name, qualifications text, service notes and project metadata around each image. Web portfolio storage currently holds Blob photos; mobile holds owned file references and can retain unfinished project context. Future backend integration must map local IDs to authenticated users/resource IDs, reconcile these additions, validate data on the server and explicitly migrate media with ownership and retention policies. No implicit cross-device or web synchronization is promised.

Deferred: authentication, remote profiles/storage, public search/listings, RLS/ownership enforcement, real verification, discovery, offers, messaging, reviews/ratings and payments. Launch coverage, OTP delivery/costs, privacy/verification rules, cancellations, disputes and support policies remain product decisions.

## Verification

All browser records/images use isolated synthetic contexts; reviewer profiles, role preferences and customer drafts are not seeded, cleared or replaced. Screenshots, fixtures, results and exports remain ignored runtime artifacts under `artifacts/mobile-stage-03` or `apps/mobile/dist`.

- Mobile ESLint (zero warnings) and TypeScript checks pass.
- `npm run verify:professional` passes model validation, specialization parity with web, percentages/optional extras, reviewed-profile handling, edit/restart, stale revision and external-write conflicts, customer/mode independence, malformed/future data preservation, denied/interrupted storage and explicit retry. Unknown trust attributes are not retained.
- `npm run verify:professional-browser` passes at 320, 390 and 430px: all six steps, required validation and keyboard selection/focus, profile photo add/replace/remove/reload, portfolio add/context/edit/image replacement/image removal with retained text/reload/deletion confirmation, review/finish, actionable completeness, dashboard changes and role switching. Existing synthetic customer draft and aged photo values remain byte-for-byte unchanged. Browser read/write failures recover through Retry professional storage. Picker cancellation, simulated denial and malformed-image recovery pass. No console/page errors or horizontal overflow were observed; screenshots were reviewed.
- `node scripts/verify-professional-edges.mjs` passes small-business naming, zero experience, skipping both optional image sections, 320×540 bottom actions and recovery after a synthetic missing photo is replaced. Real native keyboard/permissions remain outstanding below.
- Focused customer regression at 390px (`SERVIFY_MOBILE_SMOKE=1 npm run verify:requests-browser`) passes the complete seven-step flow, photo management/restoration, edits/search/delete, quotes without photos, role switching and storage read/write retry. `npm run verify:requests` also passes unchanged customer-domain/storage behavior.
- Web, Android and iOS/Hermes Expo exports passed for the Stage 03 implementation before the subsequent hero-only correction; the corrected iOS development bundle was also verified below. These verify platform bundles, not APK/IPA installation or physical-device interaction.
- Final header/portfolio checks at 320/390/430px confirm no overflow, visible compact header and accessible bottom actions. Customer Home JSX matches the Stage 02 checkpoint; its later approved image-sizing correction is documented below. Website source/root dependencies are unchanged; unrelated website audits were not repeated.

Two interaction findings were corrected during implementation: optional portfolio edits no longer invalidate the four required completion sections; and professional previews remount by photo ID on replacement so a previously missing file cannot leave the replacement stuck on “Photo unavailable”. Customer Photos visuals and handlers are unchanged.

## Dependency and native-device limitations

No dependencies were added or upgraded. The lockfile is identical to the Stage 02 checkpoint. Its recorded audit baseline remains 19 moderate findings, zero high and zero critical, across the existing glob/minimatch advisory families and propagated Expo/ESLint dependencies. No new audit-family claim or forced remediation is made; the registry audit was not unnecessarily repeated for this unchanged tree. See `MOBILE_STAGE_02.md` for the dependency paths and incompatible downgrade suggestions that were not applied.

Codex has no Android SDK/ADB/emulator, iOS simulator or direct physical-device session. The user subsequently verified the corrected hero and navigation on their iPhone, as recorded below. Real OS image-permission denial/limited-library behavior, HEIC conversion, software keyboard overlap, device safe areas, Android hardware back and process-kill restoration remain device acceptance checks. Browser denial simulation, reload and bundle exports are not equivalent to native-device verification.

## Local review

Expo is available at `http://127.0.0.1:8081/`. Stage 03 and the native hero correction are approved for the local Git checkpoint. No GitHub push, cloud resources, Supabase, hosting deployment, EAS build or store release was performed.

## Native iPhone hero correction and remote review — 4 November 2026

The Customer Home photograph was an in-flow native Image with percentage height and a minimum height inside an auto-height horizontal row. This let image measurement participate in determining the same parent height it depended on; the physical iPhone showed an oversized card and squeezed photograph although React Native Web appeared correct.

The image now fills its column with absolute positioning, removing its intrinsic/percentage dimensions from the row's content measurement. The column retains its approved 30% width, explicitly does not shrink and stretches to the copy-led row height. Explicit 100% image dimensions override bundled-image intrinsic dimensions on React Native Web; they resolve within the stretched column without contributing to parent measurement. The existing 235px minimum, headline, CTA, crop, photograph description, navy treatment, radii and surrounding spacing remain unchanged. No arbitrary fixed card height or platform-specific screen redesign was introduced.

Focused inspection of Professional Home, job posting, professional onboarding, profile and portfolio found no further confirmed sizing defect. Avatar images have explicit square containers and request/portfolio previews have an explicit 104px container, unlike the former auto-height hero. Their code, navigation, safe areas and persistence were not changed.

Verification:

- Mobile ESLint and TypeScript pass. At browser widths 320/390/430, measured hero heights are 264/235/235px; photographs fill the intended columns. Keyboard activation opens job posting, Save & exit returns normally, reload restores the screen, scrolling retains fixed bottom navigation, reduced-motion rendering works, and no horizontal overflow or page errors were observed. Screenshots were inspected.
- The focused 320×540 professional check passes onboarding, optional-image skipping, portfolio editing and missing-photo replacement recovery in an isolated synthetic browser context.
- The user scanned the fresh tunnel QR on their physical iPhone and confirmed: **“Hero and navigation look correct.”** Codex has no direct device framebuffer/session; detailed native keyboard, image-permission, HEIC and process-kill checks remain outstanding as described above.
- SDK 58 matches the user's Expo Go 58.0.5 (supported SDK 58.0.0). The authenticated CLI starts with `npm start -- --go --tunnel`, using the built-in Expo tunnel without installing dependencies. Public HTTPS iOS manifest and updated iOS bundle return 200. This serves the same working source to local and remote phones; records remain device-local.
- Session URL: `exp://c-lintin-23gwt2-mw2p78cp964argnt.on.expo.app`. Fresh terminal QR and ignored PNG under `artifacts/expo-go-review/servify-expo-go-tunnel.png` are available. The URL depends on this computer, Metro and tunnel staying online and can change on restart.
- Expo's current physical-iOS policy requires the same Expo account in CLI and Expo Go, including over a tunnel: https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/ . The CLI is signed in as `lintin`. A friend signed into a different account cannot be promised access merely by scanning this QR. Do not send passwords or tokens; account-owner sign-in on a trusted device must be performed securely by the owner. Independent-account external testing needs a separately approved distribution approach; no EAS build/update or hosting deployment was created.

Existing uncommitted Stage 03 work and device data are preserved. No Next.js website source, dependency files, GitHub remote or production deployment was changed.
