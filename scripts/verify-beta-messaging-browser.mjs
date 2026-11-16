import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {fixture} from '../apps/mobile/scripts/lifecycle-fixture.mjs';
import {load,root,resolve} from '../apps/mobile/scripts/domain-loader.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.SERVIFY_PLAYWRIGHT_PATH||'playwright');
let input='',step='private vault input',browser;for await(const p of process.stdin)input+=p;
const clients=[],errors=[];let accounts=[];
const make=()=>{const c=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(u,o={})=>fetch(u,{...o,signal:AbortSignal.timeout(20000)})}});clients.push(c);return c;};
try{
 accounts=JSON.parse(input);input='';const apiA=make(),apiB=make();assert(!(await apiA.auth.signInWithPassword(accounts.find(x=>x.role==='customer'))).error);assert(!(await apiB.auth.signInWithPassword(accounts.find(x=>x.role==='professional'))).error);
 const title='Controlled chat browser '+Date.now();
 step='selected job fixture';const posted=await apiA.rpc('beta_post_request',{p_command:randomUUID(),p_category:'electrical',p_area:'bodija',p_title:title,p_description:'Synthetic selected job for controlled browser messaging testing.',p_timing:'flexible',p_date:null,p_budget_mode:'quotes',p_min:null,p_max:null});assert(!posted.error);
 const offered=await apiB.rpc('beta_submit_offer',{p_command:randomUUID(),p_request:posted.data,p_amount:1500000,p_price_type:'estimate',p_scope:'Synthetic repair with private job-specific conversation.',p_availability:'Within two days',p_conditions:'Synthetic test only'});assert(!offered.error);const o=await apiA.from('offers').select('revision').eq('id',offered.data).single();
 const selected=await apiA.rpc('beta_select_offer',{p_command:randomUUID(),p_offer:offered.data,p_revision:o.data.revision});assert(!selected.error);const job=selected.data;
 const {parseMarketplace}=load(resolve(root,'src/domain/marketplace.ts')),local=parseMarketplace(JSON.stringify(fixture));local.deliveries[0].messages.push({id:'preserved-local-message',sequence:1,actor:{role:'customer',id:'local-customer'},text:'Preserved device-local conversation text.',createdAt:'2026-11-06T10:01:00Z'});
 const raw=JSON.stringify(parseMarketplace(JSON.stringify(local))),draftRaw=JSON.stringify({schemaVersion:1,drafts:[fixture.jobs[0].request]}),profileRaw=JSON.stringify(fixture.offers[0].professional);
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const a=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),b=await browser.newContext({viewport:{width:430,height:844},reducedMotion:'reduce'});
 for(const [context,mode]of [[a,'customer'],[b,'provider']])await context.addInitScript(({mode,raw,draftRaw,profileRaw})=>{if(!localStorage.getItem('chat-seeded')){localStorage.setItem('chat-seeded','1');localStorage.setItem('servify.mobile.preview.v1',JSON.stringify({schemaVersion:1,mode,starters:[]}));localStorage.setItem('servify.mobile.marketplace.v1',raw);localStorage.setItem('servify.mobile.requests.v1',draftRaw);localStorage.setItem('servify.mobile.professional.v1',profileRaw);}const Original=globalThis.WebSocket;globalThis.chatTestSockets=[];globalThis.WebSocket=class extends Original{constructor(...args){super(...args);if(String(args[0]).includes('realtime'))globalThis.chatTestSockets.push(this);}};},{mode,raw,draftRaw,profileRaw});
 const pa=await a.newPage(),pb=await b.newPage();
 const button=(p,name)=>p.getByRole('button',{name,exact:true}),text=(p,t)=>p.getByText(t,{exact:true}).filter({visible:true});
 async function login(page,role){const account=accounts.find(x=>x.role===role);await page.goto('http://127.0.0.1:8081/beta',{waitUntil:'domcontentloaded',timeout:90000});await page.getByRole('textbox',{name:'Email',exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await button(page,'Sign in').click();await button(page,'Open my workspace').waitFor();}
 for(const p of[pa,pb]){p.setDefaultTimeout(35000);p.on('pageerror',()=>errors.push('pageerror'));}
 step='two isolated UI sign-ins and inbox navigation';await login(pa,'customer');await login(pb,'professional');
 for(const p of[pa,pb]){await p.goto('http://127.0.0.1:8081/messages',{waitUntil:'domcontentloaded'});await button(p,'Open conversation: '+title).click();await p.getByText('Live updates connected',{exact:false}).filter({visible:true}).first().waitFor();}
 step='empty validation and bidirectional realtime';await button(pa,'Send message').click();await pa.getByText('Write a message before sending.',{exact:true}).waitFor();
 const hello='Customer live hello '+Date.now(),reply='Professional live reply '+Date.now();
 await pa.getByRole('textbox',{name:'Message',exact:true}).fill(hello);await button(pa,'Send message').focus();await button(pa,'Send message').press('Enter');await text(pb,hello).waitFor();
 await pb.getByRole('textbox',{name:'Message',exact:true}).fill(reply);await button(pb,'Send message').click();await text(pa,reply).waitFor();
 assert.equal(await text(pa,hello).count(),1);assert.equal(await text(pb,reply).count(),1);
 step='failed send, durable reload and retry without duplicate';let blocked=false;
 await pa.route('**/rest/v1/rpc/beta_send_message',async route=>{if(!blocked){blocked=true;return route.abort('connectionfailed');}return route.continue();});
 const retryText='Retained failed message '+Date.now();await pa.getByRole('textbox',{name:'Message',exact:true}).fill(retryText);await button(pa,'Send message').click();await button(pa,'Retry message').waitFor();
 await pa.reload({waitUntil:'domcontentloaded'});await button(pa,'Retry message').waitFor();await button(pa,'Retry message').click();await text(pb,retryText).waitFor();await button(pa,'Retry message').waitFor({state:'hidden'});assert.equal(await text(pa,retryText).count(),1);
 step='reconnect catchup without manual refresh';await b.setOffline(true);await pb.evaluate(()=>globalThis.chatTestSockets.forEach(s=>s.close()));
 const missed='Message during interruption '+Date.now();await pa.getByRole('textbox',{name:'Message',exact:true}).fill(missed);await button(pa,'Send message').click();await b.setOffline(false);await text(pb,missed).waitFor();assert.equal(await text(pb,missed).count(),1);
 step='history pagination';for(let i=0;i<51;i+=8){const results=await Promise.all(Array.from({length:Math.min(8,51-i)},(_,n)=>apiA.rpc('beta_send_message',{p_job:job,p_client:randomUUID(),p_body:'Browser pagination fixture '+(i+n)})));assert(results.every(r=>!r.error));}
 await pa.reload({waitUntil:'domcontentloaded'});await button(pa,'Load earlier messages').waitFor();assert.equal(await text(pa,hello).count(),0);await button(pa,'Load earlier messages').click();await text(pa,hello).waitFor();
 step='local conversation preservation and no migration';await pa.goto('http://127.0.0.1:8081/messages',{waitUntil:'domcontentloaded'});await button(pa,'View device-local conversations').click();await button(pa,'Open conversation: '+fixture.jobs[0].request.content.title).click();await text(pa,'Preserved device-local conversation text.').waitFor();
 assert.equal(await pa.evaluate(()=>localStorage.getItem('servify.mobile.marketplace.v1')),raw);
 step='responsive chat, keyboard and reduced motion';await pa.goto('http://127.0.0.1:8081/conversation?id='+job+'&source=beta',{waitUntil:'domcontentloaded'});await button(pa,'Send message').waitFor();await mkdir('artifacts/beta-stage09b',{recursive:true});
 for(const width of[320,390,430]){await pa.setViewportSize({width,height:640});await pa.getByRole('textbox',{name:'Message',exact:true}).focus();assert(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const bounds=await button(pa,'Send message').boundingBox();assert(bounds&&bounds.y+bounds.height<=640);await pa.screenshot({path:'artifacts/beta-stage09b/chat-'+width+'.png'});}
 step='signout clears only account queue and hides private chat';await pa.unroute('**/rest/v1/rpc/beta_send_message');await pa.route('**/rest/v1/rpc/beta_send_message',route=>route.abort('connectionfailed'));
 const unsent='Customer private unsent '+Date.now();await pa.getByRole('textbox',{name:'Message',exact:true}).fill(unsent);await button(pa,'Send message').click();await button(pa,'Retry message').waitFor();
 await pa.goto('http://127.0.0.1:8081/beta',{waitUntil:'domcontentloaded'});await button(pa,'Sign out').click();await button(pa,'Sign in').waitFor();
 await pa.goto('http://127.0.0.1:8081/conversation?id='+job+'&source=beta',{waitUntil:'domcontentloaded'});await button(pa,'Sign in').waitFor();assert.equal(await text(pa,hello).count(),0);
 await pa.unroute('**/rest/v1/rpc/beta_send_message');await login(pa,'professional');
 await pa.goto('http://127.0.0.1:8081/conversation?id='+job+'&source=beta',{waitUntil:'domcontentloaded'});await button(pa,'Send message').waitFor();assert.equal(await text(pa,unsent).count(),0);assert.equal(await pa.evaluate(()=>Object.keys(sessionStorage).filter(k=>k.includes('chat-outbox')).length),0);
 step='mode is not sender identity';const modeText='Professional account in Customer interface '+Date.now();await pa.getByRole('textbox',{name:'Message',exact:true}).fill(modeText);await button(pa,'Send message').click();await text(pb,modeText).waitFor();
 const actual=await apiB.from('messages').select('sender_id').eq('job_id',job).eq('body',modeText).single();assert.equal(actual.data.sender_id,(await apiB.auth.getUser()).data.user.id);
 step='unauthorized route and existing records';await pa.goto('http://127.0.0.1:8081/conversation?id='+randomUUID()+'&source=beta',{waitUntil:'domcontentloaded'});await pa.getByText('Conversation unavailable.',{exact:true}).waitFor();assert.equal(await text(pa,hello).count(),0);
 for(const p of[pa,pb]){assert.equal(await p.evaluate(()=>localStorage.getItem('servify.mobile.marketplace.v1')),raw);assert.equal(await p.evaluate(()=>localStorage.getItem('servify.mobile.requests.v1')),draftRaw);assert.equal(await p.evaluate(()=>localStorage.getItem('servify.mobile.professional.v1')),profileRaw);}
 assert.equal(errors.length,0);console.log(JSON.stringify({result:'PASS isolated-browser actual bidirectional Realtime, failed-send/reload/retry, reconnect catchup, pagination, local message view/preservation, mode-independent sender, logout/account-switch privacy, keyboard/reduced-motion/320-390-430 bounds and no page errors',jobId:job}));
}catch(e){console.error('FAIL messaging browser at: '+step+'; '+e.name);process.exitCode=1;}
finally{if(browser)await browser.close();for(const c of clients){await c.auth.signOut({scope:'local'}).catch(()=>{});c.auth.stopAutoRefresh();c.realtime.disconnect();}}
