import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:net';
const require=createRequire(import.meta.url),{chromium}=require(process.env.SERVIFY_PLAYWRIGHT_PATH??'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),sharp=require('sharp');
const port=Number(process.env.SERVIFY_READINESS_PORT??3200),base='http://127.0.0.1:'+port,output='artifacts/stage10c';
await mkdir(output,{recursive:true});
const probe=createServer();await new Promise((ok,bad)=>{probe.once('error',bad);probe.listen(port,'127.0.0.1',ok);});await new Promise(ok=>probe.close(ok));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd:new URL('..',import.meta.url),env:{...process.env,SERVIFY_ADMIN_USERNAME:'',SERVIFY_ADMIN_PASSWORD_SHA256:''},stdio:'ignore',windowsHide:true});
const exited=new Promise(ok=>server.once('exit',ok));let browser;
const report={pages:[],contrast:[],performance:[],externalLinks:[],indexing:{},violations:[]};
function luminance(rgb){const values=rgb.map(x=>{const c=x/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});return values[0]*.2126+values[1]*.7152+values[2]*.0722;}
function ratio(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base,{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}await delay(250);}assert(ready,'Isolated production server readiness');
 for(const headers of [{},{RSC:'1','Next-Router-Prefetch':'1'},{cookie:'role=admin; authenticated=true','x-servify-admin':'true','x-middleware-subrequest':'proxy:proxy:proxy:proxy:proxy'}]){const r=await fetch(base+'/admin/dashboard',{headers,redirect:'manual'});assert.equal(r.status,503);assert.match(r.headers.get('cache-control'),/no-store/);}
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage(),errors=[],links=new Set(),ids=new Map();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(const route of ['/','/about','/contact']){
  for(const width of [320,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:900});await page.goto(base+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
   for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const result=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}}));
   report.violations.push(...result.violations.map(v=>({route,width,id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})));
   const metadata=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name="description"]')?.content,robots:document.querySelector('meta[name="robots"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href??null,openGraphTitle:document.querySelector('meta[property="og:title"]')?.content??null,language:document.documentElement.lang}));
   assert(metadata.title&&metadata.description);assert.match(metadata.robots,/noindex/);assert.equal(metadata.language,'en-NG');
   if(width===390){ids.set(route,new Set(await page.locator('[id]').evaluateAll(els=>els.map(e=>e.id))));for(const href of await page.locator('.marketing-shell a').evaluateAll(els=>els.map(e=>e.getAttribute('href'))))links.add(new URL(href,base+route).href);report.pages.push({route,metadata,manualReviewRules:result.incomplete.map(v=>({rule:v.id,count:v.nodes.length}))});
    const menu=page.getByRole('button',{name:'Open menu',exact:true});await menu.focus();await menu.press('Enter');const expanded=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}}));report.violations.push(...expanded.violations.map(v=>({route,width,state:'menu-open',id:v.id,targets:v.nodes.map(n=>n.target)})));await page.keyboard.press('Escape');assert(await menu.evaluate(e=>e===document.activeElement));
   }
  }
 }
 console.log('Completed 18 production accessibility states and open mobile menus.');
 assert.deepEqual(errors,[]);assert.deepEqual(report.violations,[],'Automated accessibility violations');
 for(const href of links){const url=new URL(href);if(url.origin!==base){report.externalLinks.push({url:href,status:'attribution link; external availability is not an application CTA'});continue;}assert(ids.has(url.pathname),'Unexpected internal destination '+url.pathname);if(url.hash)assert(ids.get(url.pathname).has(decodeURIComponent(url.hash.slice(1))),'Broken fragment '+href);}
 for(const file of ['robots.txt','sitemap.xml'])report.indexing[file]=(await fetch(base+'/'+file)).status;
 // Sample contrast behind text with only its foreground hidden in this disposable context.
 const contrastSelectors=[['/','.launch-pill'],['/','#home-title>span'],['/','#home-title>em'],['/','.site-hero-copy>.site-lead'],['/','.site-actions>.button'],['/','.hero-note'],['/','.plumbing-visual>h3'],['/','.plumbing-visual>p'],['/','#professionals figcaption'],['/about','.about-story figcaption']];
 await page.setViewportSize({width:390,height:900});
 for(const [route,selector] of contrastSelectors){if(new URL(page.url()).pathname!==route)await page.goto(base+route,{waitUntil:'networkidle'});const target=page.locator(selector);await target.scrollIntoViewIfNeeded();await target.evaluate(el=>Promise.all([...((el.closest('figure')??el.closest('.plumbing-visual')??el).querySelectorAll('img'))].map(img=>Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Target image decode timeout')),8000))]))));
  const data=await target.evaluate(el=>{const style=getComputedStyle(el),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.fillStyle=style.color;ctx.fillRect(0,0,1,1);const color=[...ctx.getImageData(0,0,1,1).data].slice(0,3),rects=[],walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width>0&&r.height>0)rects.push({x:r.x,y:r.y,width:r.width,height:r.height});}return{color,rects,threshold:parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&Number(style.fontWeight)>=700)?3:4.5,saved:el.getAttribute('style')};});
  await target.evaluate(async el=>{el.style.setProperty('color','transparent','important');await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const mask=await page.addStyleTag({content:selector.startsWith('#home-title')?'#home-title,#home-title *{color:transparent!important}':'/* no additional mask */'});
  const image=await sharp(await page.screenshot()).ensureAlpha().raw().toBuffer({resolveWithObject:true});let minimum=21;
  for(const r of data.rects)for(let y=Math.max(0,Math.ceil(r.y));y<Math.min(image.info.height,Math.floor(r.y+r.height));y+=2)for(let x=Math.max(0,Math.ceil(r.x));x<Math.min(image.info.width,Math.floor(r.x+r.width));x+=2){const offset=(y*image.info.width+x)*4;minimum=Math.min(minimum,ratio(data.color,[image.data[offset],image.data[offset+1],image.data[offset+2]]));}
  await mask.evaluate(el=>el.remove());
  await target.evaluate((el,saved)=>{if(saved===null)el.removeAttribute('style');else el.setAttribute('style',saved);},data.saved);
  report.contrast.push({route,selector,minimumRatio:Number(minimum.toFixed(2)),required:data.threshold});if(minimum<data.threshold){await writeFile(output+'/contrast-failure.json',JSON.stringify({selector,data,minimum},null,2));await writeFile(output+'/contrast-failure.png',await sharp(image.data,{raw:image.info}).png().toBuffer());}assert(minimum>=data.threshold,selector+' sampled contrast '+minimum.toFixed(2));
 }
 console.log('Completed text-background contrast sampling.');
 // One cold browser context per page: synthetic 4x CPU / 1.6Mbps / 100ms latency.
 for(const route of ['/','/about','/contact']){const perf=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),tab=await perf.newPage(),cdp=await perf.newCDPSession(tab);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await tab.addInitScript(()=>{window.__qaVitals={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.__qaVitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__qaVitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});});await tab.goto(base+route,{waitUntil:'networkidle',timeout:60000});await tab.evaluate(()=>document.fonts.ready);await tab.waitForTimeout(600);report.performance.push(await tab.evaluate(route=>({route,lcpMs:Math.round(window.__qaVitals.lcp),cls:Number(window.__qaVitals.cls.toFixed(4)),ttfbMs:Math.round(performance.getEntriesByType('navigation')[0].responseStart),resourceBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.transferSize,0),resources:performance.getEntriesByType('resource').length}),route));await perf.close();}
 await writeFile(output+'/readiness.json',JSON.stringify(report,null,2));console.log(JSON.stringify({accessibility:'PASS 18 page/width states plus open mobile menus; no automated WCAG A/AA/best-practice violations',internalLinks:'PASS all destinations/fragments',failClosedAdmin:'PASS unconfigured production rejects anonymous and forged/RSC requests',contrast:report.contrast,performance:report.performance,indexing:report.indexing},null,2));
}finally{if(browser)await browser.close();server.kill();await Promise.race([exited,delay(5000)]);}
