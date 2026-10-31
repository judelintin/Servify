import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

// Use existing local/bundled Playwright; no application dependency is installed.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SERVIFY_PLAYWRIGHT_PATH || "playwright");
const base = process.env.SERVIFY_PREVIEW_URL || "http://127.0.0.1:3000";
const outputDir = path.resolve("artifacts/stage-02");
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.SERVIFY_BROWSER_PATH ? { executablePath: process.env.SERVIFY_BROWSER_PATH } : { channel: "msedge" }),
});
const widths = [1440, 1366, 1024, 768, 430, 390, 320];
const pages = [
  ["public", "/"], ["customer", "/customer/dashboard"],
  ["provider", "/provider/dashboard"], ["admin", "/admin/dashboard"],
  ["sign-in", "/auth/sign-in"], ["sign-up", "/auth/sign-up"], ["design-system", "/design-system"],
];
const results = [];
const errors = [];
const internalLinks = new Set();
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

try {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    for (const [name, route] of pages) {
      const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, `${width} ${route}: status`);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("main").count(), 1, `${route}: one main landmark`);
      assert.equal(await page.locator("h1").count(), 1, `${route}: one page heading`);
      const geometry = await page.evaluate(() => ({
        viewport: window.innerWidth, content: document.documentElement.scrollWidth,
        font: getComputedStyle(document.body).fontFamily,
        localFamily: getComputedStyle(document.body).getPropertyValue("--font-inter-tight").trim(),
        loadedFonts: Array.from(document.fonts).filter((font) => font.status === "loaded").length,
      }));
      assert(geometry.content <= geometry.viewport, `${width} ${route}: overflow ${JSON.stringify(geometry)}`);
      assert(geometry.loadedFonts > 0 && geometry.localFamily && geometry.font.replaceAll('"', '').includes(geometry.localFamily.replaceAll('"', '').replaceAll("'", "")), `${route}: local Inter Tight loaded: ${JSON.stringify(geometry)}`);
      await page.keyboard.press("Tab");
      assert.equal(await page.locator(":focus").textContent(), "Skip to content", `${route}: first keyboard target`);
      assert.equal(await page.locator(":focus").evaluate((element) => getComputedStyle(element).outlineStyle), "solid", `${route}: visible focus`);
      await page.keyboard.press("Enter");
      assert.equal(await page.locator(":focus").getAttribute("id"), "main-content", `${route}: skip target`);
      const menu = page.getByRole("button", { name: /(?:Open|Close).*menu/ });
      if (width < 1024 && await menu.count()) {
        await menu.focus();
        await page.keyboard.press("Enter");
        assert.equal(await menu.getAttribute("aria-expanded"), "true", `${route}: menu expands via keyboard`);
        const mobileNav = page.locator(name === "public" || name === "design-system" ? "#public-mobile-navigation" : "#workspace-mobile-navigation");
        assert(await mobileNav.isVisible(), `${route}: mobile navigation visible`);
        const expanded = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
        assert(expanded, `${width} ${route}: expanded menu has no overflow`);
        if (["customer", "provider", "admin"].includes(name)) {
          assert.equal(await mobileNav.locator('[aria-current="page"]').count(), 1, `${route}: active mobile navigation`);
        }
        await page.keyboard.press("Tab");
        assert(await mobileNav.locator("a:focus").count(), `${route}: keyboard enters navigation`);
        await page.keyboard.press("Escape");
        assert.equal(await menu.getAttribute("aria-expanded"), "false", `${route}: Escape collapses`);
        assert(await menu.evaluate((element) => element === document.activeElement), `${route}: focus restored to toggle`);
      } else if (width >= 1024 && ["customer", "provider", "admin"].includes(name)) {
        assert.equal(await page.locator('.sidebar [aria-current="page"]').count(), 1, `${route}: active desktop navigation`);
      }
      for (const href of await page.locator('a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")))) internalLinks.add(href);
      if ([1440, 390, 320].includes(width)) {
        // Capture the resting UI after keyboard checks, without focus/scroll artifacts.
        await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: path.join(outputDir, `${name}-${width}.png`), fullPage: true });
      }
      results.push({ name, route, width, overflow: false, keyboard: "pass", localFont: "loaded" });
    }
    console.log(`PASS responsive and keyboard checks at ${width}px (${pages.length} surfaces)`);
  }

  // Exercise navigation through an actual mobile link, not just HTTP requests.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [role, destination, linkName] of [["customer", "/customer/jobs", "My jobs"], ["provider", "/provider/verification", "Verification"], ["admin", "/admin/reports", "Reports & disputes"]]) {
    await page.goto(`${base}/${role}/dashboard`);
    await page.getByRole("button", { name: "Open workspace menu" }).click();
    await page.locator("#workspace-mobile-navigation").getByRole("link", { name: linkName, exact: true }).click();
    await page.waitForURL(`${base}${destination}`);
    assert.equal(await page.getByRole("button", { name: "Open workspace menu" }).getAttribute("aria-expanded"), "false");
    await page.getByRole("button", { name: "Open workspace menu" }).click();
    assert.equal(await page.locator('#workspace-mobile-navigation [aria-current="page"]').getAttribute("href"), destination);
  }
  await page.goto(`${base}/auth/sign-up`);
  const customer = page.getByRole("radio", { name: "Find a professional" });
  await customer.focus();
  await page.keyboard.press("ArrowRight");
  assert(await page.getByRole("radio", { name: "Offer my services" }).isChecked(), "Native keyboard role selection");
  assert(await page.getByRole("button", { name: /Create account/ }).isDisabled(), "No live registration");
  assert(await page.getByLabel("Email address").isDisabled(), "No credential collection");
  await page.goto(`${base}/design-system`);
  await page.getByRole("button", { name: "Primary", exact: true }).click();
  assert.match(await page.getByRole("status").first().textContent(), /Primary button activated/, "Local component feedback");
  assert.equal(await page.locator(".spinner").evaluate((element) => getComputedStyle(element).animationName), "none", "Reduced-motion spinner");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  assert.equal(await page.locator(".spinner").evaluate((element) => getComputedStyle(element).animationName), "spin", "Normal-motion loading indicator");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const href of internalLinks) assert.equal((await context.request.get(`${base}${href}`)).status(), 200, `Navigation target ${href}`);
  for (const slug of ["plumbing", "electrical", "cooling", "generator", "cleaning", "appliance"]) {
    const response = await context.request.get(`${base}/icons/services/${slug}.svg`);
    assert.equal(response.status(), 200);
    assert.match(await response.text(), /viewBox="0 0 24 24"/, `${slug}: local vector`);
  }
  assert.deepEqual(errors, [], "No browser console errors or runtime exceptions");
  await writeFile(path.join(outputDir, "results.json"), JSON.stringify({ widths, results, navigationTargets: [...internalLinks], interactions: "pass", errors }, null, 2));
  console.log(`PASS navigation, role selection, component feedback, reduced motion and six local SVGs. ${results.length} viewport/surface checks; ${internalLinks.size} linked routes.`);
} finally {
  await context.close();
  await browser.close();
}
