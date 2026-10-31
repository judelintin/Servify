import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SERVIFY_PLAYWRIGHT_PATH || "playwright");
const base = process.env.SERVIFY_PREVIEW_URL || "http://127.0.0.1:3000";
const output = path.resolve("artifacts/stage-03");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.SERVIFY_BROWSER_PATH ? { executablePath: process.env.SERVIFY_BROWSER_PATH } : { channel: "msedge" }) });
const widths = process.env.SERVIFY_SMOKE ? [390] : [1440, 1366, 1024, 768, 430, 390, 320];
const consoleErrors = []; const requests = []; const results = [];
function observe(page) {
  page.setDefaultTimeout(20000);
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("request", (request) => { if (!request.url().startsWith("blob:")) requests.push({ method: request.method(), url: request.url() }); });
}
async function checkLayout(page, label) {
  await page.evaluate(() => document.fonts.ready);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${label}: no horizontal overflow`);
  assert.equal(await page.locator("main").count(), 1, `${label}: main landmark`);
  assert.equal(await page.locator("h1").count(), 1, `${label}: h1`);
}
async function saved(page) { await page.waitForFunction(() => /^(Saved on this browser|Kept in this tab)$/.test(document.querySelector(".wizard-save-status")?.textContent ?? "")); }
async function next(page) { await page.getByRole("button", { name: "Next", exact: true }).click(); }
async function step(page, name) { await page.locator(".wizard-step-content > .eyebrow").filter({ hasText: name }).waitFor(); }
async function records(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("servify-local-drafts");
    request.onsuccess = () => { const db = request.result; const tx = db.transaction("drafts"); const read = tx.objectStore("drafts").getAll(); tx.oncomplete = () => { resolve(read.result.map((d) => ({ id: d.id, title: d.content?.title, status: d.status, revision: d.revision, photoCount: d.content?.photos?.length, photoType: d.content?.photos?.[0]?.blob?.type }))); db.close(); }; tx.onerror = () => reject(tx.error); };
    request.onerror = () => reject(request.error);
  }));
}
async function capture(page, label, width) {
  if ([1440, 390, 320].includes(width)) {
    await page.locator(":focus").evaluateAll((elements) => elements.forEach((element) => element.blur()));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, `${label}-${width}.png`), fullPage: true });
  }
}
let retained;
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: "reduce" });
    const page = await context.newPage(); observe(page);
    await page.goto(`${base}/customer/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Drafts 0", exact: true }).waitFor();
    await checkLayout(page, `${width} empty dashboard`); await capture(page, "dashboard-empty", width);
    await page.getByRole("button", { name: "In progress", exact: true }).click();
    assert.match(await page.locator("main").textContent(), /Live jobs aren’t available/);
    if (width < 1024) {
      const menu = page.getByRole("button", { name: "Open workspace menu" }); await menu.focus(); await page.keyboard.press("Enter");
      assert.equal(await page.locator("#workspace-mobile-navigation").isVisible(), true);
      await page.keyboard.press("Escape"); assert.equal(await menu.getAttribute("aria-expanded"), "false");
    }
    await page.getByRole("link", { name: "Post a job", exact: true }).last().click();
    await page.getByRole("form", { name: "Local job draft" }).waitFor();
    await checkLayout(page, `${width} service`); await capture(page, "wizard-service", width);
    await next(page); await page.locator(".wizard-errors").waitFor();
    assert.match(await page.locator(".wizard-errors").textContent(), /Choose the service/);
    await page.waitForFunction(() => document.activeElement?.classList.contains("wizard-errors"));
    const plumbing = page.getByRole("radio", { name: /Plumbing/ }); await plumbing.focus();
    for (let option = 0; option < 6; option++) {
      const focus = await page.locator(":focus").boundingBox(); const actions = await page.locator(".wizard-actions").boundingBox();
      assert(focus.y + focus.height + 4 <= actions.y || focus.y >= actions.y + actions.height, `${width}: category focus ring is not covered by actions`);
      await page.keyboard.press("ArrowRight");
    }
    await page.keyboard.press("Space");
    await next(page); await step(page, "Details");
    await next(page); assert.equal(await page.locator("[aria-invalid=true]").count(), 2);
    const title = `Fix a leaking kitchen tap (${width}px)`;
    const description = "The kitchen tap keeps dripping even when it is fully closed. I would like the leak checked and the fitting repaired.";
    await page.getByLabel("Give your request a title").fill(title);
    await page.getByLabel("Describe what you need").fill(description);
    await saved(page);
    const restoringUrl = page.url(); assert.match(restoringUrl, /\/jobs\/new\?draft=[0-9a-f-]{36}$/);
    await page.reload({ waitUntil: "networkidle" }); await step(page, "Details");
    assert.equal(await page.getByLabel("Give your request a title").inputValue(), title);
    assert.equal(await page.getByLabel("Describe what you need").inputValue(), description);
    await checkLayout(page, `${width} details`); await capture(page, "wizard-details", width);
    await next(page); await step(page, "Photos");
    if (width === widths[0]) {
      await page.locator("#job-photos").setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("<svg onload='alert(1)'/>") });
      await page.getByText(/not added.*Choose a real JPG/).last().waitFor();
      assert.equal(await page.locator(".photo-editor").count(), 0);
      await page.locator("#job-photos").setInputFiles({ name: "oversized.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(6 * 1024 * 1024) });
      await page.getByText(/not added.*smaller than 5 MB/).last().waitFor();
    }
    const fixture = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 240; const ctx = canvas.getContext("2d"); ctx.fillStyle = "#d9e4f7"; ctx.fillRect(0, 0, 320, 240); ctx.fillStyle = "#3155c8"; ctx.fillRect(110, 60, 100, 120); return canvas.toDataURL("image/png").split(",")[1]; });
    if (width === widths[0]) {
      await page.locator("#job-photos").setInputFiles(Array.from({ length: 9 }, (_, index) => ({ name: `photo-${index}.png`, mimeType: "image/png", buffer: Buffer.from(fixture, "base64") })));
      await page.getByText(/You can add up to 8 photos/).last().waitFor();
    }
    await page.locator("#job-photos").setInputFiles({ name: "job-photo.png", mimeType: "image/png", buffer: Buffer.from(fixture, "base64") });
    await page.getByLabel("Photo 1 description (optional)").fill("The fitting that needs attention");
    await saved(page); await page.reload({ waitUntil: "networkidle" }); await step(page, "Photos");
    await page.waitForFunction(() => document.querySelector(".draft-photo-image")?.naturalWidth > 0);
    assert.equal(await page.getByLabel("Photo 1 description (optional)").inputValue(), "The fitting that needs attention");
    await checkLayout(page, `${width} photos`); await capture(page, "wizard-photos", width);
    await next(page); await step(page, "Area"); await next(page);
    assert.match(await page.locator(".wizard-errors").textContent(), /Select a general area/);
    await page.getByLabel("General service area").selectOption("bodija");
    await checkLayout(page, `${width} area`); await capture(page, "wizard-area", width);
    await next(page); await step(page, "Timing"); await next(page);
    assert.match(await page.locator(".wizard-errors").textContent(), /Choose when/);
    await page.getByRole("radio", { name: /I have a date in mind/ }).check();
    await page.getByLabel("Preferred date", { exact: true }).fill("2020-01-01"); await next(page);
    assert.match(await page.locator(".wizard-errors").textContent(), /today or a future date/);
    const date = await page.evaluate(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 14 * 86400000)));
    await page.getByLabel("Preferred date", { exact: true }).fill(date);
    await checkLayout(page, `${width} timing`); await capture(page, "wizard-timing", width);
    await next(page); await step(page, "Budget"); await next(page);
    assert.match(await page.locator(".wizard-errors").textContent(), /budget range/);
    await page.getByRole("radio", { name: /I have a budget range/ }).check();
    await page.getByLabel("Minimum (NGN)").fill("25000"); await page.getByLabel("Maximum (NGN)").fill("15000"); await next(page);
    assert.match(await page.locator(".wizard-errors").textContent(), /same as or more/);
    await page.getByLabel("Minimum (NGN)").fill("-10"); await next(page);
    assert.match(await page.locator(".wizard-errors").textContent(), /positive NGN/);
    await page.getByLabel("Minimum (NGN)").fill("15000.50"); await page.getByLabel("Maximum (NGN)").fill("25000.75");
    await checkLayout(page, `${width} budget`); await capture(page, "wizard-budget", width);
    await next(page); await step(page, "Review");
    assert.match(await page.locator(".draft-summary").textContent(), /Bodija, Ibadan/);
    assert.match(await page.locator(".draft-summary").textContent(), /15,000.50/);
    if (width === widths[0]) {
      await page.getByRole("button", { name: "Edit budget", exact: true }).click();
      await page.getByRole("radio", { name: /I need quotes/ }).check(); await next(page); await step(page, "Review");
      assert.match(await page.locator(".draft-summary").textContent(), /I need quotes/);
    }
    await page.getByRole("button", { name: "Edit request title", exact: true }).click(); await step(page, "Details");
    await page.getByLabel("Give your request a title").fill(`${title} — revised`);
    await page.getByRole("button", { name: "7. Review", exact: true }).click(); await step(page, "Review");
    assert.match(await page.locator(".draft-summary").textContent(), /— revised/);
    await checkLayout(page, `${width} review`); await capture(page, "wizard-review", width);
    assert.equal(await page.locator(".wizard-step-content").evaluate((element) => getComputedStyle(element).animationName), "none");
    await page.getByRole("button", { name: "Save draft & view", exact: true }).click();
    await page.waitForURL(/\/jobs\/[0-9a-f-]{36}$/); const id = page.url().split("/").at(-1);
    await page.getByText("Draft · not published", { exact: true }).waitFor();
    await checkLayout(page, `${width} draft detail`); await capture(page, "job-details", width);
    const stored = await records(page); assert.equal(stored.length, 1); assert.equal(stored[0].status, "draft"); assert.equal(stored[0].photoType, "image/jpeg");
    await page.goto(`${base}/customer/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Drafts 1", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Let's get things done.", exact: true }).waitFor();
    await page.getByRole("heading", { name: `${title} — revised`, exact: true }).waitFor();
    await checkLayout(page, `${width} saved dashboard`); await capture(page, "dashboard-saved", width);
    // A separate creation must never replace the existing draft.
    await page.getByRole("link", { name: "Post a job", exact: true }).last().click(); await page.getByRole("radio", { name: /Cleaning/ }).check();
    await page.getByRole("button", { name: "Save & exit", exact: true }).click(); await page.waitForURL(/\/jobs\/[0-9a-f-]{36}$/);
    assert.equal((await records(page)).length, 2); assert.notEqual(page.url().split("/").at(-1), id);
    await page.getByRole("button", { name: "Delete draft", exact: true }).click();
    await page.getByRole("button", { name: "Keep draft", exact: true }).click(); assert.equal((await records(page)).length, 2);
    await page.getByRole("button", { name: "Delete draft", exact: true }).click(); await page.getByRole("button", { name: "Yes, delete draft", exact: true }).click();
    await page.waitForURL(`${base}/customer/jobs`); assert.equal((await records(page)).length, 1);
    await page.getByLabel("Find a request").fill("no-such-request"); await page.getByRole("heading", { name: "No matching drafts." }).waitFor();
    await page.getByLabel("Find a request").fill(""); await page.getByRole("heading", { name: `${title} — revised`, exact: true }).waitFor();
    results.push({ width, flow: "pass", persistence: "pass", editDelete: "pass", overflow: false });
    console.log(`PASS ${width}px: seven steps, errors, keyboard, photo/reload persistence, review editing, unique drafts, deletion and list search`);
    if (!retained) retained = { context, page, id }; else await context.close();
  }

  const { context, page, id } = retained;
  const other = await context.newPage(); observe(other);
  await page.goto(`${base}/jobs/${id}/edit`); await other.goto(`${base}/jobs/${id}/edit`);
  await page.getByRole("button", { name: "Edit request title", exact: true }).click();
  await page.getByLabel("Give your request a title").fill("The first tab’s saved request"); await saved(page);
  await other.getByRole("button", { name: "Edit request title", exact: true }).click();
  await other.getByLabel("Give your request a title").fill("The second tab’s separate request");
  await other.getByText(/This draft changed or was deleted in another tab/).waitFor();
  assert.equal((await records(page)).find((draft) => draft.id === id).title, "The first tab’s saved request");
  await other.evaluate(() => { window.__servifyCopyPut = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function () { throw new DOMException("Copy quota test", "QuotaExceededError"); }; });
  await other.getByRole("button", { name: "Save a separate copy", exact: true }).click();
  await other.getByText(/Your separate copy could not be saved/).waitFor();
  assert.equal((await records(other)).length, 1, "Failed copy does not change the original or create a false saved record");
  await other.evaluate(() => { IDBObjectStore.prototype.put = window.__servifyCopyPut; delete window.__servifyCopyPut; });
  await other.getByRole("button", { name: "Save a separate copy", exact: true }).click(); await other.waitForURL(/\/jobs\/[0-9a-f-]{36}$/);
  assert.equal((await records(other)).length, 2);
  console.log("PASS two-tab revision conflict and explicit save-as-copy recovery");
  await page.goto(`${base}/jobs/${id}`);
  await page.getByRole("button", { name: "Delete draft", exact: true }).click();
  await other.goto(`${base}/jobs/${id}/edit`);
  await other.getByLabel("Give your request a title").fill("Newer changes must survive stale deletion"); await saved(other);
  await page.getByRole("button", { name: "Yes, delete draft", exact: true }).click();
  await page.getByText(/This draft changed or was deleted in another tab/).waitFor();
  assert.equal((await records(other)).find((draft) => draft.id === id).title, "Newer changes must survive stale deletion");
  console.log("PASS stale delete confirmation cannot remove a newer draft revision");
  for (const route of ["/", "/provider/dashboard", "/admin/dashboard", "/auth/sign-in", "/design-system"]) {
    assert.equal((await page.goto(`${base}${route}`, { waitUntil: "networkidle" })).status(), 200);
    await checkLayout(page, `preserved ${route}`);
  }
  await context.close();

  // Isolated failure injection: no app/test packages or live service are involved.
  const temporary = await browser.newContext({ viewport: { width: 320, height: 900 } });
  await temporary.addInitScript(() => Object.defineProperty(window, "indexedDB", { value: undefined }));
  const memoryPage = await temporary.newPage(); observe(memoryPage);
  await memoryPage.goto(`${base}/jobs/new`); await memoryPage.getByRole("radio", { name: /Plumbing/ }).check();
  await memoryPage.getByRole("button", { name: "Save & exit", exact: true }).click(); await memoryPage.waitForURL(/\/jobs\/[0-9a-f-]{36}$/);
  await memoryPage.getByText(/Reloading or closing this tab will lose/).first().waitFor();
  await memoryPage.reload({ waitUntil: "networkidle" }); await memoryPage.getByRole("heading", { name: "Draft not found", exact: true }).waitFor();
  await checkLayout(memoryPage, "temporary mode at 320px"); await temporary.close();
  console.log("PASS unavailable storage → explicitly temporary tab-only drafts");

  const failure = await browser.newContext();
  await failure.addInitScript(() => { IDBObjectStore.prototype.put = function () { throw new DOMException("Test quota failure", "QuotaExceededError"); }; });
  const failurePage = await failure.newPage(); observe(failurePage);
  await failurePage.goto(`${base}/jobs/new`); await failurePage.getByRole("radio", { name: /Plumbing/ }).check();
  await failurePage.getByRole("button", { name: "Save & exit", exact: true }).click();
  await failurePage.getByText("Your last save needs attention", { exact: true }).waitFor();
  assert(await failurePage.getByRole("radio", { name: /Plumbing/ }).isChecked());
  assert.match(failurePage.url(), /\/jobs\/new$/); assert.equal((await records(failurePage)).length, 0);
  await failure.close(); console.log("PASS failed storage write preserves answers and does not report a saved draft");

  const corrupted = await browser.newContext(); const corruptedPage = await corrupted.newPage(); observe(corruptedPage);
  await corruptedPage.goto(`${base}/customer/dashboard`); await corruptedPage.getByRole("button", { name: "Drafts 0", exact: true }).waitFor();
  await corruptedPage.evaluate(() => new Promise((resolve) => {
    const request = indexedDB.open("servify-local-drafts");
    request.onsuccess = () => { const db = request.result; const tx = db.transaction("drafts", "readwrite"); tx.objectStore("drafts").put({ id: "unsupported-future-record", schemaVersion: 99 }); tx.oncomplete = () => { db.close(); resolve(true); }; };
  }));
  await corruptedPage.reload({ waitUntil: "networkidle" });
  await corruptedPage.getByText(/Some saved drafts could not be read/).waitFor();
  assert.equal((await records(corruptedPage)).length, 1, "Unknown-schema record is preserved, not silently erased");
  await corrupted.close(); console.log("PASS malformed/future-schema storage is reported and left untouched");

  assert.deepEqual(consoleErrors, [], "No browser console errors or uncaught exceptions");
  assert.equal(requests.filter((request) => !new URL(request.url).hostname.match(/^(127\.0\.0\.1|localhost)$/)).length, 0, "No third-party requests");
  assert.equal(requests.filter((request) => request.method === "POST").length, 0, "No publishing, uploads, auth or other remote mutations");
  await writeFile(path.join(output, process.env.SERVIFY_SMOKE ? "smoke-results.json" : "results.json"), JSON.stringify({ results, revisionConflict: "pass", memoryFallback: "pass", failedWrite: "pass", preservedRoutes: "pass", consoleErrors, remoteMutations: 0 }, null, 2));
  console.log("PASS all Stage 03 browser checks. Test drafts exist only in isolated, closed browser contexts.");
} finally { await browser.close(); }
