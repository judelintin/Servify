import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SERVIFY_PLAYWRIGHT_PATH || "playwright");
const base = process.env.SERVIFY_PREVIEW_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, ...(process.env.SERVIFY_BROWSER_PATH ? { executablePath: process.env.SERVIFY_BROWSER_PATH } : { channel: "msedge" }) });
const routes = ["/customer/dashboard", "/customer/jobs", "/jobs/new"];
const errors = [];
async function ready(page, route) {
  if (route === "/jobs/new") await page.getByRole("form", { name: "Local job draft" }).waitFor();
  else await page.getByRole("heading", { name: "Your next project starts here.", exact: true }).waitFor();
  assert.doesNotMatch(await page.locator("main").innerText(), /Finding (?:your local drafts|drafts on this browser)|Preparing your local draft/);
}
async function newPage(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  return page;
}
try {
  // Both documented loopback names must hydrate in development; HTTP 200 is insufficient.
  for (const origin of new Set([base, base.replace("127.0.0.1", "localhost")])) {
    const context = await browser.newContext();
    const page = await newPage(context);
    for (const route of routes) {
      await page.goto(`${origin}${route}`);
      await ready(page, route);
      assert.equal(await page.locator(".sidebar").count(), 1);
      for (const width of [1440, 1366, 1024, 768, 430, 390, 320]) {
        await page.setViewportSize({ width, height: 960 });
        assert.equal(await page.locator(".sidebar:visible").count(), width >= 1024 ? 1 : 0);
        assert.equal(await page.locator(".sidebar nav a:visible").count(), width >= 1024 ? 6 : 0);
        assert.equal(await page.locator("#workspace-mobile-navigation:visible").count(), 0);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      await page.reload(); await ready(page, route);
    }
    await context.close();
    console.log(`PASS ${origin}: direct load/reload, fresh storage, one responsive sidebar`);
  }

  for (const failure of ["unavailable", "open-stalled", "read-stalled", "read-failed"]) {
    const context = await browser.newContext();
    await context.addInitScript((failure) => {
      if (!location.search.includes("storage-test")) return;
      if (failure === "unavailable") Object.defineProperty(window, "indexedDB", { value: undefined });
      if (failure === "open-stalled") indexedDB.open = () => ({});
      if (failure === "read-failed") IDBObjectStore.prototype.getAll = () => { throw new DOMException("Read denied", "UnknownError"); };
      if (failure === "read-stalled") {
        const open = indexedDB.open.bind(indexedDB);
        indexedDB.open = (...args) => {
          const request = open(...args);
          request.addEventListener("success", () => {
            // A real queued read: hold a read/write transaction ahead of initialization.
            const transaction = request.result.transaction("drafts", "readwrite");
            const store = transaction.objectStore("drafts");
            function hold() { store.get("test-lock").onsuccess = hold; }
            hold();
            window.releaseDraftTestLock = () => transaction.abort();
          });
          return request;
        };
      }
    }, failure);
    const page = await newPage(context);
    // Save a real incomplete draft in this isolated profile before injecting failures.
    await page.goto(`${base}/jobs/new`);
    await page.getByRole("radio", { name: /Plumbing/ }).check();
    await page.getByRole("button", { name: "Save & exit", exact: true }).click();
    await page.waitForURL(/\/jobs\/[0-9a-f-]{36}$/);
    const savedUrl = page.url();
    for (const route of routes) {
      await page.goto(`${base}${route}?storage-test=1`);
      await ready(page, route);
      await page.getByText("Temporary drafts · this tab only", { exact: true }).waitFor();
      if (failure === "read-stalled") await page.evaluate(() => window.releaseDraftTestLock());
    }
    // Recovery must not reset, rewrite, or erase the existing persisted draft.
    await page.goto(savedUrl);
    await page.getByRole("heading", { name: "Untitled request", exact: true }).waitFor();
    assert.equal(await page.getByText("Temporary drafts · this tab only", { exact: true }).count(), 0);
    await context.close();
    console.log(`PASS ${failure}: every loading state settles, form accessible, existing draft preserved`);
  }
  assert.deepEqual(errors, [], "No hydration, runtime or console errors");
  console.log("PASS draft initialization regression checks");
} finally { await browser.close(); }
