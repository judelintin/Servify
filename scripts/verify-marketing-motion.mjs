import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.SERVIFY_PLAYWRIGHT_PATH ?? 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('sharp');
const deliveredImages = new Map();
const base = process.env.SERVIFY_MARKETING_URL ?? 'http://127.0.0.1:3001';
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try {
  const context = await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,reducedMotion:'no-preference'});
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base, {waitUntil:'networkidle'});
  for (const selector of ['.site-hero','#clarity-title','#app-preview','.request-feature','#how-it-works','#services','#professionals','.trust-section','#questions','#app','#meet-professionals']) assert.equal(await page.locator(selector).count(),1,'Preserved/additional section '+selector);
  assert.equal(await page.locator('.product-strip').count(),0);
  assert.equal(await page.locator('.site-hero .app-phone').count(),0);
  assert.equal(await page.locator('.strip-lane').count(),1);
  assert.equal(await page.locator('.professional-card figcaption>span').count(),0);
  assert.equal(await page.locator('.professional-card').count(),3);
  assert.equal(await page.locator('.professional-card figcaption').filter({hasText:'EDITORIAL IMAGE'}).count(),0);
  const text = await page.locator('main').innerText(); assert(!/[↗↘↙↖]/.test(text),'Decorative arrows removed from rendered public content');
  assert.match(await page.locator('.showcase-disclosure').innerText(),/not Servify accounts or verified professionals/);
  const how = page.getByRole('link',{name:'Explore How Servify Works',exact:true}); assert.match(await how.getAttribute('class'),/button/); assert.equal(await how.getAttribute('href'),'#how-it-works');
  const strip = page.locator('.motion-strip'); await strip.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.motion-strip').classList.contains('is-in-view'));
  await page.mouse.move(0,0); await page.evaluate(() => document.activeElement?.blur());
  const positions = () => page.locator('.strip-track').evaluateAll(tracks => tracks.map(el => new DOMMatrix(getComputedStyle(el).transform).m41));
  const before = await positions(); await page.waitForTimeout(250); const after = await positions();
  assert(after[0]<before[0] && after.length===1,'One continuous moving lane');
  const pause = page.getByRole('button',{name:'Pause animation',exact:true});
  assert.equal(await pause.evaluate(el=>getComputedStyle(el).clipPath),'inset(50%)','No visible pause button during normal browsing'); await pause.focus(); await pause.press('Enter');
  await page.mouse.move(0,0); await page.evaluate(() => document.activeElement?.blur());
  assert.equal(await page.getByRole('button',{name:'Resume animation',exact:true}).getAttribute('aria-pressed'),'true');
  const paused = await positions(); await page.waitForTimeout(180); const still = await positions();
  paused.forEach((x,i) => assert(Math.abs(x-still[i])<.1,'Explicit pause persists away from control'));
  const resume = page.getByRole('button',{name:'Resume animation',exact:true}); await resume.focus(); await resume.press('Enter'); await page.mouse.move(0,0); await page.evaluate(() => document.activeElement?.blur());
  assert(await page.locator('.strip-track').first().evaluate(el=>getComputedStyle(el).animationPlayState==='running'));
  await strip.hover(); const hover = await positions(); await page.waitForTimeout(120); const hoverAfter = await positions(); hover.forEach((x,i)=>assert(Math.abs(x-hoverAfter[i])<.1,'Hover pauses motion'));
  await page.mouse.move(0,0);
  for (const width of [320,390,430,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    const title = await page.locator('#home-title').evaluate(el => ({height:el.offsetHeight,line:parseFloat(getComputedStyle(el).lineHeight)}));
    assert(title.height <= title.line*2.1, 'Hero uses two deliberate lines at '+width);
    const plumbing = page.locator('.plumbing-visual');
    const adjacent = page.locator('.marketing-service-tile').nth(1);
    const dimensions = await Promise.all([plumbing,adjacent].map(card=>card.evaluate(el=>({height:el.offsetHeight,width:el.offsetWidth}))));
    assert.deepEqual(dimensions[0],dimensions[1], 'Plumbing preserves existing card proportions');
    assert.equal(await plumbing.getByRole('heading',{name:'Plumbing',exact:true}).count(),1);
    assert.equal(await page.locator('.marketing-service-tile:not(.plumbing-visual) img').count(),5);
    assert.equal(await page.locator('.professional-card img').count(),3);
    for (const image of await page.locator('.professional-card img').all()) assert.match(await image.getAttribute('src'),/portraits/);
    const frame = await page.locator('.app-phone').first().evaluate(el=>({width:parseFloat(getComputedStyle(el).width),height:parseFloat(getComputedStyle(el).height)}));
    assert(Math.abs(frame.width/frame.height-75.7/150.9)<.003,'iPhone 11 exterior proportions');
    assert.match(await page.locator('.phone-hardware').first().getAttribute('src'),/iphone-11-frame/);
    if(width>=1024){const nav=await page.locator('.home-desktop-nav').evaluate(el=>({radius:parseFloat(getComputedStyle(el).borderRadius),center:el.getBoundingClientRect().left+el.getBoundingClientRect().width/2}));assert(nav.radius>100);assert(Math.abs(nav.center-width/2)<2);}
    await strip.scrollIntoViewIfNeeded();
    for (const track of await page.locator('.strip-track').all()) {
      const groups = await track.locator('.strip-group').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));
      assert(Math.abs(groups[0]-groups[1])<.1); assert(groups[0]>=width,'A full group covers the viewport at the loop boundary');
      const seam = await track.evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=0;const first=new DOMMatrix(getComputedStyle(el).transform).m41;const duration=Number(a.effect.getTiming().duration);a.currentTime=duration-.01;const end=new DOMMatrix(getComputedStyle(el).transform).m41;return {distance:Math.abs(end-first),width:el.children[0].getBoundingClientRect().width};});
      assert(Math.abs(seam.distance-seam.width)<1,'Loop advances by exactly one repeated group');
    }
    await page.locator('#meet-professionals').scrollIntoViewIfNeeded();
    for (const image of await page.locator('#meet-professionals img').all()) await image.evaluate(img=>img.decode());
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow '+width);
    for (const image of await page.locator('.phone-capture img').all()) {
      await image.scrollIntoViewIfNeeded(); await image.evaluate(img => img.decode());
      const metrics = await image.evaluate(img=>({width:parseFloat(getComputedStyle(img).width),height:parseFloat(getComputedStyle(img).height),natural:img.naturalWidth}));
      assert(Math.abs(metrics.width/metrics.height-390/772)<.002,'Original screenshot ratio'); const imageUrl = await image.evaluate(img=>img.currentSrc);
      if(!deliveredImages.has(imageUrl)){const response=await fetch(imageUrl);assert.equal(response.status,200);deliveredImages.set(imageUrl,await sharp(Buffer.from(await response.arrayBuffer())).metadata());}
      assert(deliveredImages.get(imageUrl).width>=metrics.width*2-2,'Delivered screenshot pixels cover 2x display density');
    }
  }
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  await page.waitForFunction(()=>!document.querySelector('.motion-strip').classList.contains('is-in-view'));
  assert(await page.locator('.strip-track').first().evaluate(el=>getComputedStyle(el).animationPlayState==='paused'));
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.strip-control').isVisible(),false);
  assert.equal(await page.locator('.strip-group[aria-hidden=true]').first().isVisible(),false);
  assert.equal(await page.locator('.strip-track').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await page.locator('.professional-card').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await page.locator('.strip-group').first().evaluate(el=>getComputedStyle(el).flexWrap),'wrap');
  await page.emulateMedia({reducedMotion:'no-preference'});
  // Verify internal navigation reinitializes reveals without hiding reachable controls.
  await page.goto(base+'/about'); await page.locator('.about-story').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.about-story').hasAttribute('data-visible'));
  await page.getByRole('navigation',{name:'Public navigation',exact:true}).getByRole('link',{name:'Contact',exact:true}).click();
  await page.waitForURL('**/contact'); await page.locator('.contact-layout').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.contact-layout').hasAttribute('data-visible'));
  await page.getByRole('link',{name:'Our story',exact:true}).focus(); assert(await page.getByRole('link',{name:'Our story',exact:true}).isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS genuine high-density screenshot ratio, preserved sections, no hero device or portrait labels, one seamless marquee with focus-only pause/resume, hover/off-screen suspension, six widths, reduced motion and route-change reveals.');
} finally {await browser.close();}
