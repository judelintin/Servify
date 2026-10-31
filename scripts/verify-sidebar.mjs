import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SERVIFY_PLAYWRIGHT_PATH || "playwright");
const base = process.env.SERVIFY_PREVIEW_URL || "http://127.0.0.1:3000";
const output = "artifacts/sidebar";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.SERVIFY_BROWSER_PATH ? { executablePath: process.env.SERVIFY_BROWSER_PATH } : { channel: "msedge" }) });
const errors = [], results = [];
let holdingHydration = false;
const roles = [["customer", 6], ["provider", 7], ["admin", 7]];
async function pageFor(context) {
  const page = await context.newPage();
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !(holdingHydration && m.text().includes("net::ERR_FAILED"))) errors.push(m.text()); });
  return page;
}
async function assertWidth(page, width) { await page.waitForFunction(w => Math.abs(document.querySelector(".sidebar").getBoundingClientRect().width - w) < 1, width); }
async function noOverflow(page) { assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await pageFor(context);
  for (const width of [1440, 1366, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [role, count] of roles) {
      await page.goto(`${base}/${role}/dashboard`);
      if (await page.getByRole("button", { name: "Expand sidebar", exact: true }).count()) await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
      await assertWidth(page, width < 1200 ? 224 : 248);
      const expandedContent = await page.locator(".workspace-body").boundingBox();
      assert.equal(await page.locator(".sidebar .nav-link:visible").count(), count);
      assert.equal(await page.locator(".sidebar .nav-link-label:visible").count(), count + 1);
      assert.equal(await page.locator(".sidebar-tip:visible").count(), 1);
      const brand = await page.locator(".sidebar-header .brand:not(.brand-compact)").boundingBox();
      const control = await page.getByRole("button", { name: "Collapse sidebar", exact: true }).boundingBox();
      assert(brand.x >= 0 && brand.x + brand.width <= expandedContent.x, "Expanded branding fits");
      assert(control.x + control.width <= expandedContent.x, "Collapse control fits");
      if (width === 1440) await page.screenshot({ path: `${output}/${role}-expanded.png`, fullPage: true });
      await page.getByRole("button", { name: "Collapse sidebar", exact: true }).focus();
      await page.keyboard.press("Enter"); await assertWidth(page, 80);
      const collapsedContent = await page.locator(".workspace-body").boundingBox();
      assert(collapsedContent.width > expandedContent.width);
      assert.equal(await page.locator(".sidebar-tip:visible").count(), 0);
      assert.equal(await page.locator(".sidebar .brand-compact:visible").count(), 1);
      assert.equal(await page.locator(".sidebar .nav-link-label:visible").count(), 0);
      assert.equal(await page.locator('.sidebar .nav-link[aria-current="page"]').count(), 1);
      for (const link of await page.locator(".sidebar .nav-link, .sidebar-home").all()) {
        const name = await link.getAttribute("aria-label"); assert(name);
        await link.focus();
        await page.getByRole("tooltip", { name, exact: true }).waitFor();
        assert.equal(await link.evaluate(e => getComputedStyle(e).outlineStyle), "solid");
        await page.keyboard.press("Escape"); await page.getByRole("tooltip").waitFor({ state: "hidden" });
      }
      await page.locator(".sidebar .nav-link").first().hover();
      await page.getByRole("tooltip").waitFor();
      await page.getByRole("tooltip").hover(); assert(await page.getByRole("tooltip").isVisible());
      await page.mouse.move(700, 100); await page.getByRole("tooltip").waitFor({ state: "hidden" });
      await page.reload(); await assertWidth(page, 80);
      await page.getByRole("button", { name: "Expand sidebar", exact: true }).waitFor();
      // The saved rail applies even when hydration scripts are held back.
      holdingHydration = true;
      await page.route(/\/_next\/static\/.*\.js/, route => route.abort());
      await page.reload({ waitUntil: "domcontentloaded" }); await assertWidth(page, 80);
      await page.unrouteAll(); await page.reload(); holdingHydration = false;
      const second = page.locator(".sidebar .nav-link").nth(1); const target = await second.getAttribute("href");
      await second.click(); await page.waitForURL(`${base}${target}`); await assertWidth(page, 80);
      await noOverflow(page);
      if (width === 1440) await page.screenshot({ path: `${output}/${role}-collapsed.png`, fullPage: true });
      await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
      await assertWidth(page, width < 1200 ? 224 : 248);
      await page.reload(); await page.getByRole("button", { name: "Collapse sidebar", exact: true }).waitFor();
      await noOverflow(page);
      results.push(`${role} ${width}: expanded/collapsed, labels, tooltips, persistence, width`);
    }
  }
  // Short viewports: scrollbar is hidden, but native wheel and keyboard scroll remain.
  await page.setViewportSize({ width: 1366, height: 360 });
  for (const collapsed of [false, true]) {
    await page.goto(`${base}/admin/dashboard`);
    if (collapsed) await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
    const sidebar = page.locator(".sidebar");
    assert(await sidebar.evaluate(e => e.scrollHeight > e.clientHeight));
    assert.equal(await sidebar.evaluate(e => getComputedStyle(e).overflowY), "auto");
    assert.equal(await sidebar.evaluate(e => getComputedStyle(e).scrollbarWidth), "none");
    assert.equal(await sidebar.evaluate(e => getComputedStyle(e, "::-webkit-scrollbar").display), "none");
    await sidebar.evaluate(e => { e.scrollTop = 0; }); await sidebar.hover(); await page.mouse.wheel(0, 260);
    await page.waitForFunction(() => document.querySelector(".sidebar").scrollTop > 0);
    await sidebar.evaluate(e => { e.scrollTop = 0; }); await sidebar.focus(); await page.keyboard.press("PageDown");
    await page.waitForFunction(() => document.querySelector(".sidebar").scrollTop > 0);
    await page.locator(".sidebar-home").focus();
    const end = await page.locator(".sidebar-home").boundingBox(); assert(end.y >= 0 && end.y < 360);
  }
  results.push("short viewport: native wheel, keyboard scrolling and last-link access");
  for (const [role] of roles) {
    await page.goto(`${base}/${role}/dashboard`); await assertWidth(page, 80);
  }
  results.push("one collapsed preference shared across all roles");
  for (const width of [768, 430, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [role, count] of roles) {
      await page.goto(`${base}/${role}/dashboard`);
      assert.equal(await page.locator(".sidebar:visible").count(), 0);
      const menu = page.getByRole("button", { name: "Open workspace menu" });
      await menu.focus(); await page.keyboard.press("Enter");
      assert.equal(await page.locator("#workspace-mobile-navigation .nav-link:visible").count(), count);
      assert.equal(await page.locator("#workspace-mobile-navigation .nav-link-label:visible").count(), count);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), "visible");
      await noOverflow(page); await page.keyboard.press("Escape");
      assert.equal(await menu.getAttribute("aria-expanded"), "false"); assert(await menu.evaluate(e => e === document.activeElement));
    }
  }
  await context.close();
  const touch = await browser.newContext({ viewport: { width: 1366, height: 360 }, hasTouch: true });
  const touchPage = await pageFor(touch); await touchPage.goto(`${base}/admin/dashboard`);
  const cdp = await touch.newCDPSession(touchPage);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 150, y: 300 }] });
  for (const y of [270, 230, 190, 150, 100]) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 150, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await touchPage.waitForFunction(() => document.querySelector(".sidebar").scrollTop > 0);
  await touch.close(); results.push("native touch pan scrolls the sidebar");
  const blocked = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Unavailable", "SecurityError"); } }));
  const blockedPage = await pageFor(blocked);
  await blockedPage.goto(`${base}/customer/dashboard`);
  await blockedPage.getByRole("button", { name: "Collapse sidebar", exact: true }).click(); await assertWidth(blockedPage, 80);
  await blockedPage.locator(".sidebar .nav-link").nth(1).click(); await blockedPage.waitForURL(`${base}/customer/jobs`); await assertWidth(blockedPage, 80);
  await blockedPage.reload(); await blockedPage.getByRole("button", { name: "Collapse sidebar", exact: true }).waitFor();
  await blocked.close();
  // Expected failed requests from the deliberate pre-hydration JS hold are excluded.
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ results, mobile: "all roles, 768/430/390/320", unavailableStorage: "pass", errors }, null, 2));
  console.log("PASS shared sidebar: all roles, desktop/mobile, tooltips, keyboard, hidden scrollbars, native scrolling, persistence and blocked storage");
} finally { await browser.close(); }
