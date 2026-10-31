import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SERVIFY_PLAYWRIGHT_PATH || "playwright");
const base = process.env.SERVIFY_PREVIEW_URL || "http://127.0.0.1:3000";
const output = "artifacts/stage-04"; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.SERVIFY_BROWSER_PATH ? { executablePath: process.env.SERVIFY_BROWSER_PATH } : { channel: "msedge" }) });
const errors = [], requests = [], results = [];
const widths = process.env.SERVIFY_SMOKE ? [390] : [1440, 1366, 1024, 768, 430, 390, 320];
async function pageFor(context) {
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", request => { if (!request.url().startsWith("blob:")) requests.push({ url: request.url(), method: request.method() }); });
  return page;
}
async function saved(page) { await page.waitForFunction(() => /^(Saved on this browser|Kept in this tab)$/.test(document.querySelector(".provider-save-status")?.textContent ?? "")); }
async function next(page) { await page.getByRole("button", { name: "Next", exact: true }).click(); }
async function step(page, index) { await page.waitForFunction(n => document.querySelector('.wizard-step-content > .eyebrow')?.textContent?.startsWith(`Step ${n}`), index); }
async function layout(page, label, width) {
  await page.evaluate(() => document.fonts.ready);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label} ${width}: no overflow`);
  assert.equal(await page.locator("main").count(), 1); assert.equal(await page.locator("h1").count(), 1);
  assert(await page.locator(".wizard-step-content").evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === "none")), "Reduced motion disables step animation");
  if ([1440, 390, 320].includes(width)) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: `${output}/${label}-${width}.png`, fullPage: true }); }
}
async function records(page) { return page.evaluate(() => new Promise((resolve, reject) => { const request = indexedDB.open("servify-local-drafts"); request.onsuccess = () => { const db = request.result, tx = db.transaction("providerProfiles"); const read = tx.objectStore("providerProfiles").getAll(); tx.oncomplete = () => { db.close(); resolve(read.result); }; tx.onerror = () => reject(tx.error); }; request.onerror = () => reject(request.error); })); }
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: "reduce" });
    const page = await pageFor(context);
    await page.goto(`${base}/provider/dashboard`); await page.getByText("Make a start with about you.", { exact: true }).waitFor();
    await layout(page, "dashboard-empty", width);
    if (width < 1024) { const menu = page.getByRole("button", { name: "Open workspace menu" }); await menu.focus(); await page.keyboard.press("Enter"); assert.equal(await page.locator("#workspace-mobile-navigation .nav-link:visible").count(), 7); await page.keyboard.press("Escape"); assert(await menu.evaluate(e => e === document.activeElement)); }
    else { await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click(); await page.getByRole("button", { name: "Expand sidebar", exact: true }).click(); }
    await page.getByRole("link", { name: "Complete your profile", exact: true }).click(); await page.getByRole("form", { name: "Local provider profile" }).waitFor();
    await next(page); await page.locator(".wizard-errors:focus").waitFor(); assert.equal(await page.locator('.wizard-step-content [aria-invalid="true"]').count(), 1);
    const individual = page.getByRole("radio", { name: /Individual professional/ }); await individual.focus(); await page.keyboard.press("Space");
    const name = `Local preview workshop ${width}`;
    await page.getByLabel("Professional or business name").fill(name);
    const fixture = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 240; canvas.height = 180; const ctx = canvas.getContext("2d"); ctx.fillStyle = "#3155c8"; ctx.fillRect(0, 0, 240, 180); ctx.fillStyle = "#F59E0B"; ctx.fillRect(40, 40, 60, 70); return canvas.toDataURL("image/png").split(",")[1]; });
    const image = { name: "local-preview-fixture.png", mimeType: "image/png", buffer: Buffer.from(fixture, "base64") };
    await page.locator("#profile-photos").setInputFiles(image); await page.getByRole("button", { name: "Remove profile photo", exact: true }).waitFor();
    await saved(page); await page.reload(); await step(page, 1); assert.equal(await page.getByLabel("Professional or business name").inputValue(), name);
    await layout(page, "onboarding-about", width);
    await next(page); await step(page, 2); await next(page); await page.locator(".wizard-errors:focus").waitFor();
    await page.getByRole("checkbox", { name: /^Plumbing/ }).check();
    await page.getByRole("checkbox", { name: "Taps & fittings", exact: true }).check();
    await page.getByLabel("Years of experience").fill("-1"); await next(page); await page.getByText("Enter whole years of experience from 0 to 60.", { exact: true }).first().waitFor();
    await page.getByLabel("Years of experience").fill("5"); await layout(page, "onboarding-services", width);
    await next(page); await step(page, 3); await next(page); await page.locator(".wizard-errors:focus").waitFor();
    await page.getByRole("checkbox", { name: "Bodija", exact: true }).check(); await page.getByRole("checkbox", { name: "Akobo", exact: true }).check();
    await layout(page, "onboarding-coverage", width);
    await next(page); await step(page, 4); await next(page); await page.locator(".wizard-errors:focus").waitFor();
    await page.getByLabel("Professional introduction").fill("Local preview fixture: plumbing repairs, careful preparation and clear communication about the work.");
    await layout(page, "onboarding-introduction", width);
    await next(page); await step(page, 5);
    if (width === widths[0]) {
      await page.locator("#portfolio-photos").setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("<svg/>") }); await page.getByText(/Choose a real JPG/).waitFor();
      await page.locator("#portfolio-photos").setInputFiles({ name: "too-big.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(6 * 1024 * 1024) }); await page.getByText(/smaller than 5 MB/).waitFor();
      await page.locator("#portfolio-photos").setInputFiles(Array.from({ length: 9 }, () => image)); await page.getByText(/Keep up to 8 work samples/).waitFor();
    }
    await page.locator("#portfolio-photos").setInputFiles([image, image]); await page.getByLabel("Work sample 2 caption (optional)").waitFor();
    await page.getByLabel("Work sample 1 caption (optional)").fill("Local preview fixture — work sample");
    await page.getByLabel("Replace work sample 1", { exact: true }).setInputFiles(image);
    await page.getByRole("button", { name: "Remove work sample 2", exact: true }).click();
    await saved(page); await page.reload(); await step(page, 5);
    assert.equal(await page.getByLabel("Work sample 1 caption (optional)").inputValue(), "Local preview fixture — work sample");
    await page.waitForFunction(() => [...document.querySelectorAll('.photo-editor img')].every(image => image.naturalWidth > 0));
    await layout(page, "onboarding-portfolio", width);
    await next(page); await step(page, 6); await layout(page, "onboarding-review", width);
    await page.getByRole("button", { name: "Edit professional name", exact: true }).click(); await step(page, 1);
    await page.getByLabel("Professional or business name").fill(`${name} revised`);
    await page.getByRole("button", { name: "6. Review", exact: true }).click();
    await page.getByRole("button", { name: "Save profile & view", exact: true }).click(); await page.waitForURL(`${base}/provider/profile`);
    await page.getByRole("heading", { name: `${name} revised`, exact: true }).waitFor();
    await page.getByText("Reviewed locally · not published", { exact: true }).waitFor();
    assert.equal((await records(page)).length, 1); assert.equal((await records(page))[0].reviewed, true);
    await layout(page, "profile-saved", width);
    await page.reload(); await page.getByRole("heading", { name: `${name} revised`, exact: true }).waitFor();
    await page.getByRole("link", { name: "Edit profile", exact: true }).click(); await step(page, 6);
    await page.getByRole("button", { name: "Edit introduction", exact: true }).click(); await page.getByLabel("Professional introduction").fill("Local preview fixture: a revised introduction describing skills, service approach and practical experience.");
    await page.getByRole("button", { name: "Save & exit", exact: true }).click(); await page.waitForURL(`${base}/provider/profile`);
    await page.getByText("Draft profile · local only", { exact: true }).waitFor();
    await page.goto(`${base}/provider/dashboard`); await page.getByText("Take a moment to review your profile.", { exact: true }).waitFor(); await layout(page, "dashboard-saved", width);
    await page.goto(`${base}/provider/verification`);
    assert.equal(await page.locator('input[type="file"], input[type="text"]').count(), 0, "No sensitive evidence input exists");
    await page.getByRole("button", { name: "Preview requirements", exact: true }).click(); await page.locator(".wizard-errors:focus").waitFor();
    await page.getByLabel("Review type to explore").selectOption("identity"); await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Preview requirements", exact: true }).click(); await page.locator(".provider-verification-result:focus").waitFor();
    await page.getByText("Not submitted", { exact: true }).waitFor(); await layout(page, "verification-preview", width);
    await page.reload(); assert.equal(await page.getByLabel("Review type to explore").inputValue(), "");
    for (const route of ["/provider/jobs", "/provider/offers", "/provider/active-jobs", "/provider/messages"]) { assert.equal((await page.goto(`${base}${route}`)).status(), 200); if (route === "/provider/jobs") await page.getByText("No preview opportunities here yet.", { exact: true }).waitFor(); else if (route === "/provider/offers") await page.getByText("Room for your next proposal.", { exact: true }).waitFor(); else await noLive(page); }
    results.push({ width, lifecycle: "pass", verification: "not submitted", portfolio: "add/replace/remove/reload pass" });
    console.log(`PASS ${width}px: provider onboarding, validation, profile edit/reload, portfolio, dashboard, verification and navigation`);
    await context.close();
  }
  const optional = await browser.newContext({ viewport: { width: 320, height: 960 } });
  const optionalPage = await pageFor(optional); await optionalPage.goto(`${base}/provider/onboarding`);
  await optionalPage.getByRole("radio", { name: /Small business/ }).check(); await optionalPage.getByLabel("Professional or business name").fill("Optional photo preview fixture"); await next(optionalPage);
  await optionalPage.getByRole("checkbox", { name: /^Plumbing/ }).check(); await optionalPage.getByRole("checkbox", { name: "Taps & fittings", exact: true }).check();
  await optionalPage.getByRole("checkbox", { name: /^Plumbing/ }).uncheck(); await optionalPage.getByRole("checkbox", { name: /^Cleaning/ }).check();
  assert.equal(await optionalPage.getByRole("checkbox", { name: "Taps & fittings", exact: true }).count(), 0);
  await optionalPage.getByLabel("Years of experience").fill("0"); await next(optionalPage);
  await optionalPage.getByRole("checkbox", { name: "Bodija", exact: true }).check(); await next(optionalPage);
  await optionalPage.getByLabel("Professional introduction").fill("Local preview fixture: a small cleaning business introducing its services without any photos."); await next(optionalPage); await next(optionalPage);
  await optionalPage.getByRole("button", { name: "Save profile & view", exact: true }).click(); await optionalPage.waitForURL(`${base}/provider/profile`);
  await optionalPage.getByText("Reviewed locally · not published", { exact: true }).waitFor();
  const optionalRecord = (await records(optionalPage))[0]; assert.equal(optionalRecord.content.photo, null); assert.equal(optionalRecord.content.portfolio.length, 0); assert.deepEqual(optionalRecord.content.specializations, []);
  await optional.close(); console.log("PASS small business, optional photos, zero years and specialization pruning");
  // Upgrade a genuine Stage 03 schema, then prove provider writes leave its draft unchanged.
  const legacy = await browser.newContext();
  await legacy.addInitScript(() => {
    if (sessionStorage.getItem("legacy-fixture-created")) return;
    sessionStorage.setItem("legacy-fixture-created", "yes");
    const request = indexedDB.open("servify-local-drafts", 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore("drafts", { keyPath: "id" });
      store.put({ id: "11111111-1111-4111-8111-111111111111", schemaVersion: 1, revision: 3, createdAt: "2026-10-30T10:00:00.000Z", updatedAt: "2026-10-30T10:00:00.000Z", lastStep: 1, reviewed: false, status: "draft", content: { category: "plumbing", title: "Legacy local draft fixture", description: "An existing local draft fixture which must survive the additive storage upgrade.", photos: [], area: "bodija", timing: "flexible", preferredDate: "", budgetMode: "quotes", budgetMin: "", budgetMax: "" } });
    };
    request.onsuccess = () => request.result.close();
  });
  const legacyPage = await pageFor(legacy); await legacyPage.goto(`${base}/provider/onboarding`);
  await legacyPage.getByRole("radio", { name: /Small business/ }).check(); await legacyPage.getByLabel("Professional or business name").fill("Local upgrade fixture");
  await legacyPage.getByRole("button", { name: "Save & exit", exact: true }).click(); await legacyPage.waitForURL(`${base}/provider/profile`);
  await legacyPage.goto(`${base}/customer/jobs`); await legacyPage.getByRole("heading", { name: "Legacy local draft fixture", exact: true }).waitFor();
  const legacyRecord = await legacyPage.evaluate(() => new Promise(resolve => { const request = indexedDB.open("servify-local-drafts"); request.onsuccess = () => { const db = request.result, tx = db.transaction("drafts"); const read = tx.objectStore("drafts").get("11111111-1111-4111-8111-111111111111"); tx.oncomplete = () => { resolve({ version: db.version, revision: read.result.revision, updatedAt: read.result.updatedAt }); db.close(); }; }; }));
  assert.deepEqual(legacyRecord, { version: 3, revision: 3, updatedAt: "2026-10-30T10:00:00.000Z" });
  await legacy.close(); console.log("PASS additive v1 → v3 migration and unchanged existing customer draft");
  // Local persistence failures and conflicts are exercised without touching the review profile.
  for (const failure of ["unavailable", "read-stalled", "write-failed", "malformed", "conflict"]) {
    const context = await browser.newContext();
    if (failure === "unavailable") await context.addInitScript(() => Object.defineProperty(window, "indexedDB", { value: undefined }));
    if (failure === "read-stalled") await context.addInitScript(() => { IDBObjectStore.prototype.getAll = function () { const hold = () => { this.get("test-lock").onsuccess = hold; }; hold(); return {}; }; });
    if (failure === "write-failed") await context.addInitScript(() => { const put = IDBObjectStore.prototype.put; window.restoreProviderPut = () => { IDBObjectStore.prototype.put = put; }; IDBObjectStore.prototype.put = function () { throw new DOMException("Quota fixture", "QuotaExceededError"); }; });
    const page = await pageFor(context); await page.goto(`${base}/provider/onboarding`);
    await page.getByRole("form", { name: "Local provider profile" }).waitFor();
    await page.getByRole("radio", { name: /Small business/ }).check(); await page.getByLabel("Professional or business name").fill("Local storage test fixture");
    if (failure === "write-failed") {
      await page.getByRole("button", { name: "Save & exit", exact: true }).click(); await page.getByText("Your profile has not been saved.", { exact: true }).waitFor();
      assert.equal(await page.getByLabel("Professional or business name").inputValue(), "Local storage test fixture"); assert.equal((await records(page)).length, 0);
      await page.evaluate(() => window.restoreProviderPut());
      await page.getByRole("button", { name: "Save & exit", exact: true }).click(); await page.waitForURL(`${base}/provider/profile`);
      assert.equal((await records(page))[0].content.name, "Local storage test fixture");
    } else {
      await saved(page);
      if (["unavailable", "read-stalled"].includes(failure)) {
        await page.getByText("Temporary profile · this tab only", { exact: true }).waitFor();
      } else if (failure === "malformed") {
        await page.evaluate(() => new Promise(resolve => { const request = indexedDB.open("servify-local-drafts"); request.onsuccess = () => { const db = request.result, tx = db.transaction("providerProfiles", "readwrite"); tx.objectStore("providerProfiles").put({ id: "local-provider", schemaVersion: 99 }); tx.oncomplete = () => { db.close(); resolve(true); }; }; }));
        await page.reload(); await page.getByRole("heading", { name: "Your saved profile needs attention.", exact: true }).waitFor(); assert.equal((await records(page))[0].schemaVersion, 99);
      } else {
        const other = await pageFor(context); await other.goto(`${base}/provider/onboarding`); await other.getByLabel("Professional or business name").waitFor();
        await page.getByLabel("Professional or business name").fill("First tab wins this revision"); await saved(page);
        await other.getByLabel("Professional or business name").fill("Stale tab must not overwrite"); await other.getByText(/This profile changed in another tab/).first().waitFor();
        assert.equal((await records(page))[0].content.name, "First tab wins this revision");
      }
    }
    await context.close(); console.log(`PASS provider ${failure} storage handling`);
  }
  assert.deepEqual(errors, [], "No browser runtime/console errors");
  assert.equal(requests.filter(request => !["127.0.0.1", "localhost"].includes(new URL(request.url).hostname)).length, 0);
  assert.equal(requests.filter(request => request.method === "POST").length, 0);
  await writeFile(`${output}/${process.env.SERVIFY_SMOKE ? "smoke-" : ""}results.json`, JSON.stringify({ results, errors, remoteMutations: 0 }, null, 2));
} finally { await browser.close(); }
async function noLive(page) { await page.getByText(/This part of Servify is being prepared/).waitFor(); }
