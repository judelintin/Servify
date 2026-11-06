# Servify Mobile

Native Expo/React Native preview for customers and professionals. Mobile Stage 02 adds seven-step customer requests and local draft management. Mobile Stage 03 adds professional onboarding, profile editing and portfolio management.

```powershell
npm install
npm start
```

Browser: `http://127.0.0.1:8081/`. Use `npm run web` to open it, or `npm start -- --lan` for a compatible Expo Go device on the same network.

`npm run lint`, `npm run typecheck`, `npm run verify:domain`, `npm run verify:requests`, `npm run verify:professional`. Existing external Playwright tooling can run `npm run verify:browser`, `npm run verify:professional-browser` and `node scripts/verify-request-edges.mjs` with `SERVIFY_PLAYWRIGHT_PATH` set. Use `SERVIFY_MOBILE_SMOKE=1` for the customer browser suite's focused 390px run. Build local platform bundles with `npx expo export --platform all`.

See [Mobile Stage 01](../../docs/MOBILE_STAGE_01.md) for the approved foundation and [Mobile Stage 02](../../docs/MOBILE_STAGE_02.md) for requests, photos, storage recovery, verification and native-device limitations. This app has separate local data; it does not authenticate, publicly publish jobs or synchronize with the website.

See [Mobile Stage 03](../../docs/MOBILE_STAGE_03.md) for professional model/completeness rules, isolated image storage, onboarding and portfolio verification. Profile completion does not grant verification or make a profile visible to customers.

`node scripts/verify-professional-edges.mjs` checks optional-image skipping, small-business details and missing-image recovery in a short mobile viewport.

See [Mobile Stage 04](../../docs/MOBILE_STAGE_04.md) for explicit device-local publication, professional discovery, offer drafts/submission/editing/withdrawal, customer comparison/selection and persistence safeguards. Run `npm run verify:marketplace`, `npm run verify:marketplace-browser` and `node scripts/verify-marketplace-edges.mjs` for focused checks. All activity remains on the current device; offer typing is not autosaved, so use Save offer draft before leaving.

See [Mobile Stage 05](../../docs/MOBILE_STAGE_05.md) for selected-job acceptance, WAT scheduling, job-specific conversations, work progress, completion and local issues. Run `npm run verify:delivery` and `npm run verify:delivery-browser`. No real notifications or cross-device delivery are provided.

See [Mobile Stage 06](../../docs/MOBILE_STAGE_06.md) for completed-job reviews, accessible ratings, versioned professional responses, reputation and moderation visibility. Run `npm run verify:trust` and `npm run verify:trust-browser`. Feedback stays device-local; use Preview and Confirm before leaving.

See [Mobile Stage 07](../../docs/MOBILE_STAGE_07.md) for first-launch welcome, role selection and read-only existing-user migration. Run `npm run verify:welcome`, `npm run verify:welcome-browser` and `node scripts/verify-welcome-layout.mjs`. Returning users bypass the introduction; `/welcome` replays it without clearing records.
