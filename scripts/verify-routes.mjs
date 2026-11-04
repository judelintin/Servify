import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.SERVIFY_VERIFY_PORT ?? 3199);
assert(Number.isInteger(port) && port > 0 && port < 65536, "Invalid verification port");
const base = `http://127.0.0.1:${port}`;
const manifest = JSON.parse(await readFile(new URL("../.next/server/app-paths-manifest.json", import.meta.url), "utf8"));
const routes = Object.keys(manifest)
  .filter((route) => route.endsWith("/page") && !route.startsWith("/_"))
  .map((route) => route.replace(/\/\([^/]+\)/g, "").slice(0, -5).replace(/\[([^\]]+)\]/g, "example-$1") || "/");
const originalRoutes = ["/", "/customer/dashboard", "/jobs/new", "/jobs/example-jobId", "/provider/onboarding", "/provider/dashboard", "/offers", "/conversations", "/conversations/example-conversationId", "/admin/dashboard", "/auth/sign-in", "/auth/sign-up"];
for (const route of originalRoutes) assert(routes.includes(route), `Stage 01 route preserved: ${route}`);
assert(routes.includes("/design-system"), "Design-system review route exists");

// Refuse an occupied port so a different server cannot yield false positives.
const { createServer } = await import("node:net");
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(port, "127.0.0.1", resolve);
});
await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
let output = "";
server.stdout.on("data", (chunk) => { output = (output + chunk).slice(-8000); });
server.stderr.on("data", (chunk) => { output = (output + chunk).slice(-8000); });
let spawnError;
server.on("error", (error) => { spawnError = error; });
const exited = new Promise((resolve) => server.once("exit", resolve));

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for production server startup. */ }
    await delay(300);
  }
  assert(ready, `Production server did not become ready: ${output}`);
  for (const route of routes) {
    const response = await fetch(`${base}${route}`, { signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200, `${route}: HTTP status`);
    const html = await response.text();
    assert.match(html, /<h1\b/, `${route}: page heading`);
    assert.match(html, /id="main-content"/, `${route}: main landmark`);
    assert.match(html, /Skip to content/, `${route}: skip link`);
    assert.match(html, /Marketplace services are not available yet|Local prototype · Records stay in this browser|Local product preview\. No live marketplace/, `${route}: preview disclosure`);
    assert.doesNotMatch(html, /<form[^>]*action=["']https?:/i, `${route}: no external form submission`);
    console.log(`PASS ${route}`);
  }
  const missing = await fetch(`${base}/stage-01-missing-page`, { signal: AbortSignal.timeout(10000) });
  assert.equal(missing.status, 404, "Unknown route returns 404");
  console.log("PASS missing route → 404");
  console.log(`Verified ${routes.length} page routes and the 404 response.`);
} finally {
  server.kill();
  await Promise.race([exited, delay(5000)]);
}
