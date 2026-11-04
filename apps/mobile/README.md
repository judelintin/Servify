# Servify Mobile

Native Expo/React Native Stage 01 preview for customers and professionals.

```powershell
npm install
npm start
```

Browser: `http://127.0.0.1:8081/`. Use `npm run web` to open it, or `npm start -- --lan` for a compatible Expo Go device on the same network.

`npm run lint`, `npm run typecheck`, `npm run verify:domain`. Existing external Playwright tooling can run `npm run verify:browser` with `SERVIFY_PLAYWRIGHT_PATH` set. Build local platform bundles with `npx expo export --platform all`.

See [Mobile Stage 01](../../docs/MOBILE_STAGE_01.md) for structure, exact scope, testing and native-device limitations. This app has separate local data; it does not authenticate or synchronize with the website. Only service selection is implemented in the seven-step request journey.
