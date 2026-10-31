import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SERVIFY_PLAYWRIGHT_PATH || "playwright");
const base = process.env.SERVIFY_PREVIEW_URL || "http://127.0.0.1:3000";
const output = "artifacts/stage-03-refinement";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.SERVIFY_BROWSER_PATH ? { executablePath: process.env.SERVIFY_BROWSER_PATH } : { channel: "msedge" }) });
const errors = [], results = [];
try {
  for (const width of [1440, 1366, 1024, 768, 430, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    for (const route of ["/customer/dashboard", "/customer/jobs"]) {
      await page.goto(`${base}${route}`);
      await page.getByRole("heading", { name: "Your next project starts here.", exact: true }).waitFor();
      await page.reload();
      await page.getByRole("heading", { name: "Your next project starts here.", exact: true }).waitFor();
      assert.doesNotMatch(await page.locator("main").innerText(), /Finding .*drafts/);
    }
    await page.goto(`${base}/jobs/new`);
    const form = page.getByRole("form", { name: "Local job draft" });
    await form.waitFor();
    assert.equal(await page.getByRole("radio").count(), 6);
    assert.equal(await page.locator('.category-option input:checked').count(), 0);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.locator(".wizard-errors:focus").waitFor();
    assert.match(await page.locator(".wizard-errors").innerText(), /Choose the service that best matches your job/);
    assert.match(await page.locator(".wizard-step-content > .eyebrow").innerText(), /Step 1/i);
    const plumbing = page.getByRole("radio", { name: /Plumbing/ });
    await plumbing.focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.category-option:has(input:checked)')).borderTopColor === 'rgb(49, 85, 200)');
    assert(await plumbing.isChecked());
    const state = await plumbing.evaluate(input => {
      const card = getComputedStyle(input.closest(".category-option")), focus = getComputedStyle(input);
      return { background: card.backgroundColor, border: card.borderColor, shadow: card.boxShadow, accent: focus.accentColor, outline: focus.outlineStyle, outlineWidth: focus.outlineWidth, outlineColor: focus.outlineColor, focusVisible: input.matches(":focus-visible") };
    });
    assert.equal(state.background, "rgb(242, 245, 255)");
    assert.equal(state.accent, "rgb(49, 85, 200)");
    assert.equal(state.outline, "solid"); assert.equal(state.outlineWidth, "3px");
    assert.equal(state.outlineColor, "rgb(49, 85, 200)"); assert(state.focusVisible);
    assert.notEqual(state.shadow, "none");
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator('.category-option input:checked').count(), 1);
    assert(!(await plumbing.isChecked()));
    await page.keyboard.press("ArrowLeft");
    assert(await plumbing.isChecked());
    if ([1440, 390, 320].includes(width)) await page.screenshot({ path: `${output}/category-selected-${width}.png`, fullPage: true });
    const progress = await page.locator(".wizard-sidebar").boundingBox();
    const buttons = await page.locator(".wizard-steps button").evaluateAll(es => es.map(e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height, left: r.left, right: r.right }; }));
    if (width < 768) {
      assert(progress.height <= 110, `Compact mobile progress: ${progress.height}px`);
      assert(buttons.every(button => button.height >= 44 && button.left >= 0 && button.right <= width));
      assert(buttons.every(button => Math.abs(button.top - buttons[0].top) < 1), "Seven steps in one row");
      const card = await page.locator(".wizard-card").boundingBox();
      assert(progress.y + progress.height <= card.y, "Progress does not overlap form");
    }
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.locator(".wizard-step-content > h2:focus").waitFor();
    assert.match(await page.locator(".wizard-step-content > .eyebrow").innerText(), /Step 2/i);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    assert(await plumbing.isChecked());
    await page.getByRole("button", { name: "Save & exit", exact: true }).click();
    await page.waitForURL(/\/jobs\/[0-9a-f-]{36}$/);
    for (const route of ["/customer/dashboard", "/customer/jobs"]) {
      await page.goto(`${base}${route}`); await page.getByRole("heading", { name: "Untitled request", exact: true }).waitFor();
      await page.reload(); await page.getByRole("heading", { name: "Untitled request", exact: true }).waitFor();
      assert.doesNotMatch(await page.locator("main").innerText(), /Finding .*drafts/);
      assert.equal(await page.locator(".sidebar").count(), 1);
      assert.equal(await page.locator(".sidebar-tip").count(), 1);
      assert.equal(await page.locator(".sidebar-home").count(), 1);
      for (const position of [0, 500, 100000]) {
        await page.evaluate(y => scrollTo(0, y), position);
        assert.equal(await page.locator(".sidebar-tip:visible").count(), width >= 1024 ? 1 : 0);
        assert.equal(await page.locator(".sidebar-home:visible").count(), width >= 1024 ? 1 : 0);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    if (width === 1440) {
      await page.goto(`${base}/customer/dashboard`); await page.getByRole("heading", { name: "Untitled request", exact: true }).waitFor();
      await page.screenshot({ path: `${output}/sidebar-top-viewport.png` });
      await page.screenshot({ path: `${output}/sidebar-top-full.png`, fullPage: true });
      await page.evaluate(() => scrollTo(0, 600));
      await page.screenshot({ path: `${output}/sidebar-scrolled-viewport.png` });
      await page.screenshot({ path: `${output}/sidebar-scrolled-full.png`, fullPage: true });
      assert.equal(await page.locator(".sidebar-tip").count(), 1);
      assert.equal(await page.locator(".sidebar-home").count(), 1);
    }
    results.push({ width, category: state, progressHeight: progress.height, sidebar: "single", initialization: "empty/populated/reload pass" });
    console.log(`PASS ${width}px: selected state, keyboard, validation focus, progress, sidebar, empty/saved drafts`);
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
} finally { await browser.close(); }
