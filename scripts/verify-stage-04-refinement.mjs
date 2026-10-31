import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SERVIFY_PLAYWRIGHT_PATH || "playwright");
const base = process.env.SERVIFY_PREVIEW_URL || "http://127.0.0.1:3000";
const output = "artifacts/stage-04-refinement"; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.SERVIFY_BROWSER_PATH ? { executablePath: process.env.SERVIFY_BROWSER_PATH } : { channel: "msedge" }) });
const errors = [], results = [];
try {
  for (const width of [1440, 1366, 1024, 768, 430, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: "reduce" });
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    if (width >= 1024) for (const role of ["customer", "provider", "admin"]) {
      await page.goto(`${base}/${role}/dashboard`);
      if (await page.getByRole("button", { name: "Expand sidebar", exact: true }).count()) await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
      const close = page.getByRole("button", { name: "Collapse sidebar", exact: true }); await close.waitFor();
      assert.equal(await close.evaluate(e => getComputedStyle(e).borderTopWidth), "0px");
      assert.match(await close.locator("svg path").getAttribute("d"), /m7-12-3 3 3 3/);
      if (role === "provider") {
        assert.equal(await page.locator(".sidebar-header .brand-addon").count(), 0);
        assert.match(await page.locator(".sidebar-header .brand:not(.brand-compact)").innerText(), /^servify$/);
        assert.equal((await page.locator(".sidebar .workspace-label").innerText()).toUpperCase(), "SERVIFY FOR PROS");
        assert.equal(await page.locator(".sidebar-header .brand-dot").first().evaluate(e => getComputedStyle(e).backgroundColor), "rgb(245, 158, 11)");
      }
      await close.hover(); await page.getByRole("tooltip", { name: "Collapse sidebar", exact: true }).waitFor();
      assert.equal(await close.evaluate(e => getComputedStyle(e).backgroundColor), "rgb(237, 241, 255)");
      await close.focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
      assert.equal(await close.evaluate(e => getComputedStyle(e).outlineStyle), "solid");
      await page.keyboard.press("Escape"); await page.getByRole("tooltip").waitFor({ state: "hidden" });
      if (width === 1440) await page.locator(".sidebar-header").screenshot({ path: `${output}/${role}-header.png` });
      await page.keyboard.press("Enter"); const open = page.getByRole("button", { name: "Expand sidebar", exact: true }); await open.waitFor();
      assert.match(await open.locator("svg path").getAttribute("d"), /m5-12 3 3-3 3/);
      await open.evaluate(e => e.blur()); await open.focus(); await page.getByRole("tooltip", { name: "Expand sidebar", exact: true }).waitFor();
      await page.reload(); await page.getByRole("button", { name: "Expand sidebar", exact: true }).waitFor();
      await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
    }
    await page.goto(`${base}/provider/onboarding?step=0`);
    await page.getByRole("form", { name: "Local provider profile" }).waitFor();
    if (width < 1024) {
      assert.equal(await page.locator(".sidebar-toggle:visible").count(), 0);
      const menu = page.getByRole("button", { name: "Open workspace menu" }); await menu.focus(); await page.keyboard.press("Enter");
      assert.equal(await page.locator("#workspace-mobile-navigation .nav-link:visible").count(), 7); await page.keyboard.press("Escape");
    }
    const input = page.getByLabel("Upload profile photo", { exact: true });
    assert.equal(await input.isVisible(), false);
    const uploadButton = page.getByRole("button", { name: "Upload profile photo", exact: true });
    assert(await uploadButton.evaluate(e => e.getBoundingClientRect().height >= 44));
    await uploadButton.focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
    assert.equal(await page.locator(".provider-upload-action .button").first().evaluate(e => getComputedStyle(e).outlineStyle), "solid");
    assert(await uploadButton.evaluate(e => e === document.activeElement), "Keyboard returns to the visible upload action");
    const chooser = page.waitForEvent("filechooser"); await uploadButton.press("Space"); const picker = await chooser;
    const fixture = await page.evaluate(() => { const c = document.createElement("canvas"); c.width = 80; c.height = 80; const ctx = c.getContext("2d"); ctx.fillStyle = "#3155c8"; ctx.fillRect(0, 0, 80, 80); return c.toDataURL("image/png").split(",")[1]; });
    const photo = { name: "local-refinement-fixture.png", mimeType: "image/png", buffer: Buffer.from(fixture, "base64") };
    await picker.setFiles(photo);
    await page.getByRole("button", { name: "Remove profile photo", exact: true }).waitFor();
    const replace = page.getByLabel("Replace profile photo", { exact: true });
    assert.equal(await replace.isVisible(), false);
    await replace.setInputFiles(photo);
    await page.waitForFunction(() => document.querySelector(".provider-save-status")?.textContent === "Saved on this browser");
    await page.reload(); await page.getByRole("button", { name: "Remove profile photo", exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector(".provider-avatar-editor img")?.naturalWidth > 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if ([1440, 390, 320].includes(width)) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: `${output}/profile-photo-${width}.png`, fullPage: true }); }
    await page.getByRole("button", { name: "Remove profile photo", exact: true }).click();
    const upload = page.getByLabel("Upload profile photo", { exact: true });
    await upload.setInputFiles({ name: "invalid.png", mimeType: "image/png", buffer: Buffer.from("<svg/>") }); await page.getByText(/Choose a real JPG/).waitFor();
    await upload.setInputFiles({ name: "too-big.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(6 * 1024 * 1024) }); await page.getByText(/smaller than 5 MB/).waitFor();
    results.push({ width, controls: "pass", keyboardUpload: "pass", imageValidation: "pass", photoReload: "pass" });
    console.log(`PASS ${width}px: shared panel controls, provider branding, keyboard picker, image replace/reload/remove and validation`);
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
} finally { await browser.close(); }
