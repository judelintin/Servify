# Servify Mobile

Native Expo/React Native preview for customers and professionals. Mobile Stage 02 adds seven-step customer requests and local draft management.

```powershell
npm install
npm start
```

Browser: `http://127.0.0.1:8081/`. Use `npm run web` to open it, or `npm start -- --lan` for a compatible Expo Go device on the same network.

`npm run lint`, `npm run typecheck`, `npm run verify:domain`, `npm run verify:requests`. Existing external Playwright tooling can run `npm run verify:browser` and `node scripts/verify-request-edges.mjs` with `SERVIFY_PLAYWRIGHT_PATH` set. Build local platform bundles with `npx expo export --platform all`.

See [Mobile Stage 01](../../docs/MOBILE_STAGE_01.md) for the approved foundation and [Mobile Stage 02](../../docs/MOBILE_STAGE_02.md) for requests, photos, storage recovery, verification and native-device limitations. This app has separate local data; it does not authenticate, publish jobs or synchronize with the website.
