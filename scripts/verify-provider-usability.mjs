import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SERVIFY_PLAYWRIGHT_PATH || "playwright");
const base = process.env.SERVIFY_PREVIEW_URL || "http://127.0.0.1:3000";
const output = "artifacts/provider-usability"; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.SERVIFY_BROWSER_PATH ? { executablePath: process.env.SERVIFY_BROWSER_PATH } : { channel: "msedge" }) });
const errors = [], results = [];
async function saved(page) { await page.waitForFunction(() => document.querySelector(".provider-save-status")?.textContent === "Saved on this browser"); }
async function choose(page, control, file, touch) {
  const chooser = page.waitForEvent("filechooser", { timeout: 5000 });
  if (touch) await control.tap(); else await control.click();
  const picker = await chooser; await picker.setFiles(file);
}
try {
  for (const width of [1440, 390, 320]) {
    const touch = width < 1024;
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: "reduce", hasTouch: touch, isMobile: touch });
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${base}/provider/dashboard`); await page.getByText("Make a start with about you.", { exact: true }).waitFor();
    const iconIsLinked = await page.locator(".provider-check").first().evaluate(e => !!e.closest("a"));
    if (!process.env.SERVIFY_BASELINE) {
      assert(iconIsLinked, "The indicator belongs to the checklist link");
      for (const [index, step] of [0, 1, 2, 3, 0, 4].entries()) {
        const indicator = page.locator(".provider-check").nth(index);
        if (touch) await indicator.tap(); else await indicator.click();
        await page.waitForURL(`${base}/provider/onboarding?step=${step}`);
        await page.waitForFunction(n => document.querySelector(".wizard-step-content > .eyebrow")?.textContent?.startsWith(`Step ${n + 1}`), step);
        await page.goto(`${base}/provider/dashboard`); await page.getByText("Make a start with about you.", { exact: true }).waitFor();
      }
      const link = page.locator(".provider-completeness li a").first(); await link.focus(); await page.keyboard.press("Enter");
      await page.waitForURL(`${base}/provider/onboarding?step=0`);
    } else await page.goto(`${base}/provider/onboarding?step=0`);
    const fixture = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 120; canvas.height = 80; const ctx = canvas.getContext("2d"); ctx.fillStyle = "#3155c8"; ctx.fillRect(0, 0, 120, 80); return canvas.toDataURL("image/png").split(",")[1]; });
    const photo = { name: "synthetic-profile-fixture.png", mimeType: "image/png", buffer: Buffer.from(fixture, "base64") };
    const upload = page.getByRole("button", { name: "Upload profile photo", exact: true });
    await upload.waitFor();
    await choose(page, upload, photo, touch);
    await page.getByRole("button", { name: "Remove profile photo", exact: true }).waitFor(); await saved(page);
    await page.reload(); await page.getByRole("button", { name: "Remove profile photo", exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector(".provider-avatar-editor img")?.naturalWidth > 0);
    if (process.env.SERVIFY_BASELINE) {
      results.push({ width, iconIsLinked, freshPicker: "opens", primaryUploadDisabledAfterReload: await page.getByRole("button", { name: "Upload profile photo", exact: true }).isDisabled() });
      console.log(JSON.stringify(results.at(-1))); await context.close(); continue;
    }
    const change = page.getByRole("button", { name: "Change profile photo", exact: true }); assert(await change.isEnabled());
    await choose(page, change, photo, touch); await saved(page);
    await choose(page, page.getByRole("button", { name: "Replace profile photo", exact: true }), photo, touch); await saved(page);
    // Invalid replacement must leave the previous stored image intact.
    await choose(page, change, { name: "invalid.png", mimeType: "image/png", buffer: Buffer.from("<svg/>") }, touch);
    await page.getByText(/Choose a real JPG/).waitFor(); assert.equal(await page.locator(".provider-avatar-editor img").count(), 1);
    await choose(page, change, { name: "oversized.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(6 * 1024 * 1024) }, touch);
    await page.getByText(/smaller than 5 MB/).waitFor();
    await page.getByRole("radio", { name: /Individual professional/ }).check(); await page.getByLabel("Professional or business name").fill("Synthetic usability fixture");
    await page.getByRole("button", { name: "Save & exit", exact: true }).click(); await page.waitForURL(`${base}/provider/profile`);
    await page.getByRole("heading", { name: "Synthetic usability fixture", exact: true }).waitFor();
    await page.reload(); await page.waitForFunction(() => document.querySelector(".provider-avatar img")?.naturalWidth > 0);
    const complete = page.locator(".provider-completeness li a").first(); assert.match(await complete.innerText(), /added/); assert.equal(await complete.locator(".is-done").count(), 1);
    await complete.focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab"); assert.equal(await complete.evaluate(e => getComputedStyle(e).outlineStyle), "solid");
    await complete.locator(".provider-check").click(); await page.waitForURL(`${base}/provider/onboarding?step=0`);
    await page.getByRole("button", { name: "Remove profile photo", exact: true }).click(); await saved(page); await page.reload();
    assert.equal(await page.locator(".provider-avatar-editor img").count(), 0); await page.getByRole("button", { name: "Upload profile photo", exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    results.push({ width, checklist: "icon/row/keyboard pass", picker: touch ? "native touch chooser pass" : "native mouse chooser pass", replacement: "pass", validation: "pass", profileReload: "pass" });
    console.log(`PASS ${width}px: actionable checklist, actual native picker, synthetic photo add/replace/reload/remove and validation`);
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/${process.env.SERVIFY_BASELINE ? "baseline" : "results"}.json`, JSON.stringify({ results, errors }, null, 2));
} finally { await browser.close(); }
