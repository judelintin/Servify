import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.SERVIFY_PLAYWRIGHT_PATH ?? 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.SERVIFY_MARKETING_URL ?? 'http://127.0.0.1:3001';
const output = process.env.SERVIFY_REVIEW_DIR ?? 'artifacts/stage10b';
await mkdir(output, {recursive: true});
const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try {
  const context = await browser.newContext({reducedMotion: 'reduce'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  for (const route of ['/', '/about', '/contact']) {
    for (const width of [320, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({width, height: 900});
      const response = await page.goto(base + route, {waitUntil: 'networkidle'});
      assert.equal(response.status(), 200);
      assert.equal(await page.getByRole('heading', {level: 1}).count(), 1);
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => getComputedStyle(document.body).fontFamily.toLowerCase().includes('intertight')));
      for (const image of await page.locator('main img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(img => img.decode());
        assert(await image.evaluate(img => img.naturalWidth > 0));
      }
      await page.evaluate(() => scrollTo(0, 0));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route + ' overflow at ' + width);
      const links = await page.locator('.marketing-shell a').evaluateAll(anchors => anchors.map(a => a.getAttribute('href')));
      for (const href of links) {
        assert(!/^\/(customer|provider|providers|jobs|offers|conversations|auth|admin)(\/|$)/.test(href));
        assert(!/apps\.apple\.com|play\.google\.com|mailto:/.test(href), 'No unverified contact/download URLs');
      }
      if (width < 1024) {
        const menu = page.getByRole('button', {name: 'Open menu', exact: true});
        await menu.focus(); await menu.press('Enter');
        await page.getByRole('navigation', {name: 'Public mobile navigation', exact: true}).waitFor();
        await page.keyboard.press('Escape');
        assert(await menu.evaluate(el => el === document.activeElement));
      }
      await page.getByRole('link', {name: 'Skip to content', exact: true}).focus();
      await page.keyboard.press('Enter');
      assert(await page.locator('#main-content').evaluate(el => el === document.activeElement));
      if (route === '/') {
        const customers = page.getByRole('tab', {name: 'For Customers', exact: true});
        const pros = page.getByRole('tab', {name: 'For Professionals', exact: true});
        const before = await page.locator('.app-showcase').evaluate(el => el.getBoundingClientRect().height);
        await customers.focus(); await customers.press('ArrowRight');
        assert.equal(await pros.getAttribute('aria-selected'), 'true');
        assert(await pros.evaluate(el => el === document.activeElement));
        await page.getByRole('tabpanel').getByRole('heading', {name: 'Good work deserves a proper introduction.'}).waitFor();
        const preview = page.locator('.showcase-visual .phone-capture img');
        await preview.evaluate(img => img.decode());
        assert.match(await preview.getAttribute('src'), /professional-home/);
        const after = await page.locator('.app-showcase').evaluate(el => el.getBoundingClientRect().height);
        assert(Math.abs(before - after) < 24, 'Audience change should not shift layout');
        await pros.press('Home'); assert.equal(await customers.getAttribute('aria-selected'), 'true');
        assert.equal(await page.locator('.site-hero-copy').evaluate(el => getComputedStyle(el).animationName), 'none');
        const faq = page.locator('.site-faq summary').first();
        await faq.focus(); await faq.press('Enter');
        assert(await faq.evaluate(el => el.parentElement.open));
        await faq.press('Enter');
      }
      if ([320,390,430,1440].includes(width)) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({path: path.join(output, (route === '/' ? 'home' : route.slice(1)) + '-' + width + '.png'), fullPage: true});
      }
    }
  }
  assert.deepEqual(errors, []);
  const normal = await browser.newContext({reducedMotion: 'no-preference', viewport: {width: 390, height: 844}});
  const moving = await normal.newPage(); await moving.goto(base); await moving.waitForTimeout(1000);
  assert.equal(await moving.locator('.site-hero-copy').evaluate(el => getComputedStyle(el).opacity), '1');
  assert.equal(await moving.locator('.site-hero-copy').evaluate(el => getComputedStyle(el).animationIterationCount), '1');
  const noJs = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 844}});
  const staticPage = await noJs.newPage(); await staticPage.goto(base);
  await staticPage.getByRole('heading', {level: 1}).waitFor();
  assert(await staticPage.getByRole('navigation', {name: 'Public navigation', exact: true}).isVisible());
  console.log('PASS Home/About/Contact at 320/390/430/768/1024/1440: images/fonts, overflow, truthful links, keyboard menu/skip links, audience tabs/layout stability, FAQ, reduced/finite motion, no-JS public navigation and no console/page errors.');
} finally {await browser.close();}
