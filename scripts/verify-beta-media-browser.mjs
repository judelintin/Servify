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
 const now=new Date().toISOString(),title='Controlled media browser '+Date.now(),photo={id:'controlled-media-photo',alt:'Synthetic shared request photograph'};
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
 step='failed upload after publication and safe retry';
 let blocked=false;await pa.route('**/storage/v1/object/job-photos/**',async route=>{if(!blocked&&route.request().method()==='POST'){blocked=true;return route.abort('connectionfailed');}return route.continue();});
 await pa.goto('http://127.0.0.1:8081/post-job/details?id='+draft.id,{waitUntil:'domcontentloaded'});await pa.getByRole('button',{name:'Post job',exact:true}).click();await pa.getByRole('button',{name:'Confirm job publication',exact:true}).click();
 await pa.getByText('Your request was posted, but a photo still needs uploading.',{exact:false}).filter({visible:true}).first().waitFor();
 await pa.getByRole('button',{name:'Confirm job publication',exact:true}).click();await pa.getByRole('button',{name:'View shared request',exact:true}).waitFor();
 assert(blocked);assert.equal(await pa.evaluate(()=>localStorage.getItem('servify.mobile.requests.v1')),raw);
 step='customer and independent professional retrieve shared request image';
 await pa.getByRole('button',{name:'View shared request',exact:true}).click();
 await pa.getByLabel(photo.alt,{exact:true}).filter({visible:true}).first().waitFor();
 step='professional discovery displays customer shared photograph';await pb.getByRole('button',{name:'Open my workspace',exact:true}).click();
 await pb.getByLabel(photo.alt,{exact:true}).filter({visible:true}).first().waitFor();
 step='professional explicit profile and portfolio upload';
 await pb.goto('http://127.0.0.1:8081/profile',{waitUntil:'domcontentloaded'});
 for(const label of['Share profile photo','Share work sample: Synthetic socket project']){
  await pb.getByRole('button',{name:label,exact:true}).click();const confirm=pb.getByRole('button',{name:'Upload shared photo',exact:true});await confirm.focus();assert(await confirm.evaluate(el=>el===document.activeElement));await confirm.press('Enter');
  await pb.getByText('Shared securely with authorized accounts.',{exact:true}).first().waitFor();
  if(label.startsWith('Share work'))await pb.getByText('Share your work',{exact:true}).locator('..').getByLabel('Synthetic shared portfolio photograph',{exact:true}).waitFor();
  else await pb.getByText('Share your work',{exact:true}).locator('..').getByLabel('Synthetic shared professional portrait',{exact:true}).waitFor();
 }
 step='offer and customer receives professional photographs';
 await pb.goto('http://127.0.0.1:8081/jobs',{waitUntil:'domcontentloaded'});await pb.getByRole('button',{name:'Prepare offer: '+title,exact:true}).click();await pb.getByRole('textbox',{name:'Offer price (NGN)',exact:true}).fill('17500');await pb.getByRole('textbox',{name:'Scope of work',exact:true}).fill('Controlled photo test inspection and replacement of an electrical socket.');await pb.getByRole('textbox',{name:'Availability',exact:true}).fill('Within two days');await pb.getByRole('button',{name:'Submit offer to customer',exact:true}).click();await pb.getByRole('button',{name:'Submit offer to customer',exact:true}).waitFor({state:'hidden'});
 await pa.getByRole('button',{name:'Refresh shared jobs',exact:true}).click();await pa.getByLabel('Synthetic shared professional portrait',{exact:true}).filter({visible:true}).first().waitFor();
 step='reload, widths, reduced motion, preserved local records';
 await pa.reload({waitUntil:'domcontentloaded'});await pa.getByLabel(photo.alt,{exact:true}).filter({visible:true}).first().waitFor();
 await mkdir('artifacts/beta-stage09a',{recursive:true});
 for(const width of[320,390,430]){await pa.setViewportSize({width,height:844});await pa.emulateMedia({reducedMotion:'reduce'});assert(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await pa.screenshot({path:'artifacts/beta-stage09a/customer-'+width+'.png'});await pb.setViewportSize({width,height:844});assert(await pb.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 assert.equal(await pa.evaluate(()=>localStorage.getItem('servify.mobile.requests.v1')),raw);assert.equal(await pb.evaluate(()=>localStorage.getItem('servify.mobile.professional.v1')),profileRaw);assert.equal(await pa.evaluate(()=>localStorage.getItem('servify.mobile.photo.controlled-media-photo')),photoRaw);
 step='owner removal and account switch isolation';
 await pb.goto('http://127.0.0.1:8081/profile',{waitUntil:'domcontentloaded'});await pb.getByRole('button',{name:'Remove shared photo',exact:true}).first().click();await pb.getByRole('button',{name:'Remove shared copy',exact:true}).click();await pb.getByRole('button',{name:'Remove shared copy',exact:true}).waitFor({state:'hidden'});assert.equal(await pb.evaluate(()=>localStorage.getItem('servify.mobile.professional.v1')),profileRaw);
 await pa.goto('http://127.0.0.1:8081/beta',{waitUntil:'domcontentloaded'});await pa.getByRole('button',{name:'Sign out',exact:true}).click();await pa.getByRole('button',{name:'Sign in',exact:true}).waitFor();assert.equal(await pa.getByLabel(photo.alt,{exact:true}).count(),0);assert.equal(errors.length,0);
 console.log('PASS isolated-browser real photo publication, failed-upload retry, cross-account image display, explicit profile/portfolio uploads, keyboard confirmation, deletion, reload, 320/390/430 bounds, reduced motion, logout and exact local-record preservation. Not physical-iPhone verification.');
}catch(e){console.error('FAIL media browser at: '+step+'; '+String(e.name));process.exitCode=1;}
finally{
 if(browser)await browser.close();
 for(const role of['customer','professional']){const c=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(u,o={})=>fetch(u,{...o,signal:AbortSignal.timeout(20000)})}});clients.push(c);const account=accounts.find(x=>x.role===role);if(!account)continue;const signed=await c.auth.signInWithPassword(account);if(signed.error){process.exitCode=1;continue;}for(const {id} of completed.filter(x=>x.role===role)){const row=await c.from('image_assets').select('bucket,object_path').eq('id',id).maybeSingle();if(row.data){await c.storage.from(row.data.bucket).remove([row.data.object_path]);if((await c.rpc('beta_forget_media',{p_id:id})).error){console.error('Synthetic media cleanup needs review.');process.exitCode=1;}}}await c.auth.signOut({scope:'local'});}
 for(const c of clients)c.auth.stopAutoRefresh();
}
