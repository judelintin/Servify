import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.SERVIFY_PLAYWRIGHT_PATH||'playwright'),sharp=require('sharp');
let input='',step='private credential input',browser;for await(const p of process.stdin)input+=p;
const completed=[],clients=[],errors=[];let accounts=[];
try{
 accounts=JSON.parse(input);input='';
 const jpeg=(await sharp({create:{width:800,height:600,channels:3,background:'#3155c8'}}).jpeg().toBuffer()).toString('base64');
 const now=new Date().toISOString(),title='Controlled integrated journey '+Date.now(),photo={id:'controlled-media-photo',alt:'Synthetic shared request photograph'};
 const draft={id:'controlled-media-draft',revision:1,createdAt:now,updatedAt:now,status:'draft',lastStep:6,reviewed:true,content:{category:'electrical',title,description:'Synthetic electrical socket repair for controlled shared photograph testing.',photos:[photo],area:'bodija',timing:'flexible',preferredDate:'',budgetMode:'quotes',budgetMin:'',budgetMax:''}};
 const raw=JSON.stringify({schemaVersion:1,drafts:[draft]});
 const profile={id:'local-professional',schemaVersion:1,revision:1,createdAt:now,updatedAt:now,lastStep:5,reviewed:true,content:{type:'individual',name:'Synthetic Browser Professional',businessName:'',photo:{id:'controlled-portrait',alt:'Synthetic shared professional portrait'},categories:['electrical'],specializations:[],serviceDescriptions:{},experience:'3',areas:['bodija'],bio:'Synthetic professional details for controlled media testing only.',qualifications:'',portfolio:[{id:'controlled-project',title:'Synthetic socket project',description:'Synthetic work photograph, not real completed work.',category:'electrical',photo:{id:'controlled-portfolio',alt:'Synthetic shared portfolio photograph'}}]}};
 const profileRaw=JSON.stringify(profile),photoRaw=JSON.stringify({createdAt:Date.now(),data:'data:image/jpeg;base64,'+jpeg});
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const a=await browser.newContext({viewport:{width:390,height:844}}),b=await browser.newContext({viewport:{width:430,height:844}});
 for(const [context,mode]of[[a,'customer'],[b,'provider']])await context.addInitScript(({mode,raw,profileRaw,photoRaw})=>{if(localStorage.getItem('stage09-seeded'))return;localStorage.setItem('stage09-seeded','1');localStorage.setItem('servify.mobile.preview.v1',JSON.stringify({schemaVersion:1,mode,starters:[]}));localStorage.setItem('servify.mobile.requests.v1',raw);localStorage.setItem('servify.mobile.professional.v1',profileRaw);localStorage.setItem('servify.mobile.photo.controlled-media-photo',photoRaw);for(const id of['controlled-portrait','controlled-portfolio'])localStorage.setItem('servify.mobile.professional.photo.'+id,photoRaw);},{mode,raw,profileRaw,photoRaw});
 const pa=await a.newPage(),pb=await b.newPage();
 for(const [page,role]of[[pa,'customer'],[pb,'professional']]){
  page.setDefaultTimeout(35000);page.on('pageerror',()=>errors.push('pageerror'));
  page.on('request',r=>{if(r.url().endsWith('/rpc/beta_reserve_media'))try{completed.push({role,id:r.postDataJSON().p_id});}catch{}});
  step='independent UI sign-in '+role;await page.goto('http://127.0.0.1:8081/beta',{waitUntil:'domcontentloaded',timeout:90000});
  const account=accounts.find(x=>x.role===role);await page.getByRole('textbox',{name:'Email',exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Open my workspace',exact:true}).waitFor();
 }


 const button=(p,name)=>p.getByRole('button',{name,exact:true}),text=(p,t)=>p.getByText(t,{exact:true}).filter({visible:true});
 step='signed-in customer profile copy and keyboard account access';await pa.goto('http://127.0.0.1:8081/profile',{waitUntil:'domcontentloaded'});await text(pa,'Customer account').waitFor();await text(pa,'Signed in').waitFor();assert.equal(await text(pa,'No production account').count(),0);assert.equal(await pa.getByText('Local mobile preview · records stay on this device.',{exact:true}).count(),0);await button(pa,'Account & sign out').focus();await button(pa,'Account & sign out').press('Enter');await button(pa,'Open my workspace').waitFor();
 step='review and photos at narrow widths';await mkdir('artifacts/beta-stage09e',{recursive:true});
 for(const part of[{route:'/profile',name:'customer-profile'},{route:'/post-job?id='+draft.id+'&step=6',name:'review'},{route:'/post-job?id='+draft.id+'&step=2',name:'photos'}]){
  await pa.goto('http://127.0.0.1:8081'+part.route,{waitUntil:'domcontentloaded'});if(part.name==='review')await button(pa,'Post job').waitFor();else await pa.getByRole('heading').first().waitFor();
  for(const width of[320,390,430]){await pa.setViewportSize({width,height:640});await pa.emulateMedia({reducedMotion:'reduce'});assert(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await pa.screenshot({path:'artifacts/beta-stage09e/'+part.name+'-'+width+'.png',fullPage:true});}
 }
 step='professional authenticated entry points';for(const route of ['/home','/profile','/activity']){await pb.goto('http://127.0.0.1:8081'+route,{waitUntil:'domcontentloaded'});await text(pb,route==='/home'?'SERVIFY FOR PROS':route==='/profile'?'Shared reviews & reputation':'Your shared offers').waitFor();for(const width of[320,390,430]){await pb.setViewportSize({width,height:640});assert(await pb.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await pb.screenshot({path:'artifacts/beta-stage09e/'+route.slice(1)+'-'+width+'.png'});}}
 step='explicit local offers remain available';await button(pb,'View device-local offers').click();await text(pb,'LOCAL PREVIEW').waitFor();await button(pb,'Back to shared offers').click();await text(pb,'Your shared offers').waitFor();
 step='failed authentication cannot expose local fallback';let blocked=false;await pa.route('**/auth/v1/user',route=>{if(!blocked){blocked=true;return route.abort('connectionfailed');}return route.continue();});
 await pa.goto('http://127.0.0.1:8081/jobs',{waitUntil:'domcontentloaded'});await button(pa,'Retry session').waitFor();assert.equal(await text(pa,'LOCAL PREVIEW').count(),0);await button(pa,'Retry session').click();await button(pa,'Refresh shared jobs').waitFor();
 assert.equal(await pa.evaluate(()=>localStorage.getItem('servify.mobile.photo.controlled-media-photo')),photoRaw);
 assert.equal(await pb.evaluate(()=>localStorage.getItem('servify.mobile.professional.v1')),profileRaw);
 console.log('PASS signed-in account copy, keyboard navigation, authenticated review/photo layouts at 320/390/430px, recoverable authentication error without local fallback and preserved local photo/profile.');
}catch(e){console.error('FAIL integrated browser at: '+step+'; '+(e.message?.includes('strict mode violation')?'ambiguous locator':String(e.name))+'; line '+(e.stack?.match(/verify-beta-readiness-browser\.mjs:(\d+)/)?.[1]??'unknown'));process.exitCode=1;}
finally{
 if(browser)await browser.close();
 for(const role of['customer','professional']){const c=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(u,o={})=>fetch(u,{...o,signal:AbortSignal.timeout(20000)})}});clients.push(c);const account=accounts.find(x=>x.role===role);if(!account)continue;const signed=await c.auth.signInWithPassword(account);if(signed.error){process.exitCode=1;continue;}for(const {id} of completed.filter(x=>x.role===role)){const row=await c.from('image_assets').select('bucket,object_path').eq('id',id).maybeSingle();if(row.data){await c.storage.from(row.data.bucket).remove([row.data.object_path]);if((await c.rpc('beta_forget_media',{p_id:id})).error){console.error('Synthetic media cleanup needs review.');process.exitCode=1;}}}await c.auth.signOut({scope:'local'});}
 for(const c of clients)c.auth.stopAutoRefresh();
}
