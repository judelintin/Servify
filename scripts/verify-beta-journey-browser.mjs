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

 step='independent API readback without account changes';
 const api=async role=>{const c=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(u,o={})=>fetch(u,{...o,signal:AbortSignal.timeout(20000)})}});clients.push(c);const r=await c.auth.signInWithPassword(accounts.find(x=>x.role===role));assert(!r.error);return c;};
 const apiA=await api('customer'),apiB=await api('professional'),professional=(await apiB.auth.getUser()).data.user.id;
 const baselineProfile=await apiB.from('professional_profiles').select('*').eq('user_id',professional).single();assert(!baselineProfile.error&&baselineProfile.data.bio);
 const button=(p,name)=>p.getByRole('button',{name,exact:true}),text=(p,t)=>p.getByText(t,{exact:true}).filter({visible:true});
 for(const p of[pa,pb])p.on('console',m=>{if(m.type()==='error'&&!/net::ERR_(?:FAILED|CONNECTION_FAILED)/.test(m.text()))errors.push('console error');});
 step='profile preparation remains explicit';await pb.goto('http://127.0.0.1:8081/jobs',{waitUntil:'domcontentloaded'});await button(pb,'Save profile draft to account').or(button(pb,'Update account from profile draft')).first().click();await button(pb,'Save profile to account').waitFor();await button(pb,'Cancel').click();
 step='reviewed job posts directly; failed photo retry keeps one request';
 let blocked=false;const publicationCommands=[];
 pa.on('request',r=>{if(r.url().endsWith('/rpc/beta_post_request'))publicationCommands.push(r.postDataJSON().p_command);});
 await pa.route('**/storage/v1/object/job-photos/**',route=>{if(!blocked&&route.request().method()==='POST'){blocked=true;return route.abort('connectionfailed');}return route.continue();});
 await pa.goto('http://127.0.0.1:8081/post-job?id='+draft.id+'&step=6',{waitUntil:'domcontentloaded'});
 await button(pa,'Post job').focus();await button(pa,'Post job').press('Enter');
 await pa.getByText('Your request was posted, but a photo still needs uploading.',{exact:false}).filter({visible:true}).first().waitFor();
 assert.equal(await button(pa,'Confirm job publication').count(),0,'Reviewed signed-in posting must not require a second prototype confirmation.');
 await button(pa,'Post job').click();await button(pa,'Refresh shared jobs').waitFor();await pa.getByLabel(photo.alt,{exact:true}).filter({visible:true}).first().waitFor();
 assert.equal(new Set(publicationCommands).size,1);assert(publicationCommands.length>=2);
 const requests=await apiA.from('service_requests').select('id,status').eq('title',title);assert.equal(requests.data.length,1);const requestId=requests.data[0].id;
 step='independent professional discovery and offer';
 await button(pb,'Refresh shared jobs').click();await pb.getByLabel(photo.alt,{exact:true}).filter({visible:true}).first().waitFor();await button(pb,'Prepare offer: '+title).click();
 await pb.getByRole('textbox',{name:'Offer price (NGN)',exact:true}).fill('17500');await pb.getByRole('textbox',{name:'Scope of work',exact:true}).fill('Synthetic integrated inspection and repair of a socket. '+title);await pb.getByRole('textbox',{name:'Availability',exact:true}).fill('Within two days');await button(pb,'Submit offer to customer').click();await button(pb,'Submit offer to customer').waitFor({state:'hidden'});
 step='offers tab uses server records';await pb.goto('http://127.0.0.1:8081/activity',{waitUntil:'domcontentloaded'});await text(pb,'Your shared offers').waitFor();await text(pb,'Synthetic integrated inspection and repair of a socket. '+title).waitFor();assert.equal(await text(pb,'LOCAL PREVIEW').count(),0);
 step='customer comparison and selection';await button(pa,'Refresh shared jobs').click();const card=text(pa,title).locator('..');await card.getByRole('button',{name:'Review and select offer',exact:true}).click();await button(pa,'Confirm provider selection').click();await button(pa,'Confirm provider selection').waitFor({state:'hidden'});
 const jobRow=await apiA.from('jobs').select('id').eq('request_id',requestId).single();assert(!jobRow.error);const job=jobRow.data.id,jobURL='http://127.0.0.1:8081/job?source=beta&id='+job;
 await button(pa,'View shared job progress').click();await button(pa,'Manage job: '+title).click();await pb.goto(jobURL,{waitUntil:'domcontentloaded'});
 const act=async(p,label)=>{step='job action: '+label;await button(p,label).click();await button(p,'Confirm job action').click();await button(p,'Cancel').waitFor({state:'hidden'});};
 await act(pb,'Accept selected job');await text(pa,'Confirmed').first().waitFor();
 step='same-job two-way messaging and reconnect';for(const p of[pa,pb])await button(p,'Open job conversation').click();
 const hello='Synthetic integrated customer message '+Date.now(),reply='Synthetic integrated professional reply '+Date.now();
 await pa.getByRole('textbox',{name:'Message',exact:true}).fill(hello);await button(pa,'Send message').click();await text(pb,hello).waitFor();
 await pb.getByRole('textbox',{name:'Message',exact:true}).fill(reply);await button(pb,'Send message').click();await text(pa,reply).waitFor();
 await b.setOffline(true);const missed='Synthetic integrated reconnect '+Date.now();await pa.getByRole('textbox',{name:'Message',exact:true}).fill(missed);await button(pa,'Send message').click();await b.setOffline(false);await text(pb,missed).waitFor({timeout:45000});assert.equal(await text(pb,missed).count(),1);
 for(const p of[pa,pb])await button(p,'Manage this shared job').click();
 step='scheduling and rescheduling across accounts';
 const fields=async(p,days)=>{await p.getByRole('textbox',{name:'Appointment date (YYYY-MM-DD)',exact:true}).fill(new Date(Date.now()+days*86400000).toISOString().slice(0,10));await p.getByRole('textbox',{name:'Start time (HH:mm WAT)',exact:true}).fill('09:00');await p.getByRole('textbox',{name:'End time (HH:mm WAT)',exact:true}).fill('11:00');};
 await fields(pa,3);await act(pa,'Propose appointment');await button(pb,'Confirm schedule proposal').waitFor();await act(pb,'Confirm schedule proposal');await text(pa,'Scheduled').first().waitFor();
 await fields(pb,4);await act(pb,'Propose appointment');await button(pa,'Confirm schedule proposal').waitFor();await act(pa,'Confirm schedule proposal');await button(pb,'Withdraw schedule proposal').waitFor({state:'hidden'});await text(pb,'Scheduled').first().waitFor();
 step='work progress and customer-confirmed completion';await act(pb,'Start work');await text(pa,'In progress').first().waitFor();await act(pb,'Request completion confirmation');await button(pa,'Confirm work completed').waitFor();await act(pa,'Confirm work completed');await text(pb,'Completed').first().waitFor();
 step='shared review, response, reputation and restart';for(const p of[pa,pb])await button(p,'View completed-job review').click();
 const review='Synthetic integrated completed-job feedback '+Date.now(),response='Synthetic integrated professional response '+Date.now();
 await pa.getByRole('radio',{name:'5 out of 5 stars',exact:true}).click();await pa.getByRole('textbox',{name:'Written feedback (optional)',exact:true}).fill(review);await button(pa,'Preview review').click();await button(pa,'Confirm feedback').click();await text(pb,review).waitFor();
 await button(pb,'Respond to review').click();await pb.getByRole('textbox',{name:'Professional response',exact:true}).fill(response);await button(pb,'Preview response').click();await button(pb,'Confirm feedback').click();await text(pa,response).waitFor();
 await pa.reload({waitUntil:'domcontentloaded'});await text(pa,response).waitFor();await button(pa,'View shared professional reputation').click();await text(pa,review).waitFor();assert.equal(await text(pa,title).count(),0);
 step='separate unfinished-job private issue';
 const posted=await apiA.rpc('beta_post_request',{p_command:crypto.randomUUID(),p_category:'electrical',p_area:'bodija',p_title:'Controlled integrated issue '+Date.now(),p_description:'Synthetic separate job for private unresolved issue reporting.',p_timing:'flexible',p_date:null,p_budget_mode:'quotes',p_min:null,p_max:null});assert(!posted.error);
 const offered=await apiB.rpc('beta_submit_offer',{p_command:crypto.randomUUID(),p_request:posted.data,p_amount:1500000,p_price_type:'estimate',p_scope:'Synthetic unresolved repair issue only.',p_availability:'Within two days',p_conditions:''});assert(!offered.error);
 const chosen=await apiA.rpc('beta_select_offer',{p_command:crypto.randomUUID(),p_offer:offered.data,p_revision:1});assert(!chosen.error);
 assert(!(await apiB.rpc('beta_job_command',{p_command:crypto.randomUUID(),p_job:chosen.data,p_revision:1,p_action:'confirm'})).error);
 for(const p of[pa,pb])await p.goto('http://127.0.0.1:8081/job?source=beta&id='+chosen.data,{waitUntil:'domcontentloaded'});
 const issue='Synthetic integrated private issue '+Date.now();await pa.getByRole('textbox',{name:'Describe the issue',exact:true}).fill(issue);await button(pa,'Review issue report').click();await button(pa,'Confirm issue report').click();await text(pb,issue).waitFor();assert.equal(await button(pb,'Review issue report').count(),0);
 step='profile photographs, native-safe bounds and private-data preservation';
 await pb.goto('http://127.0.0.1:8081/profile',{waitUntil:'domcontentloaded'});
 for(const label of['Share profile photo','Share work sample: Synthetic socket project']){await button(pb,label).click();await button(pb,'Upload shared photo').click();await pb.getByText('Shared securely with authorized accounts.',{exact:true}).first().waitFor();}
 await mkdir('artifacts/beta-stage09e',{recursive:true});
 for(const route of['/home','/profile','/activity']){await pb.goto('http://127.0.0.1:8081'+route,{waitUntil:'domcontentloaded'});await pb.getByRole('heading').first().waitFor();for(const width of[320,390,430]){await pb.setViewportSize({width,height:640});await pb.emulateMedia({reducedMotion:'reduce'});assert(await pb.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await pb.screenshot({path:'artifacts/beta-stage09e/'+route.slice(1)+'-'+width+'.png'});}}
 assert.equal(await pb.evaluate(()=>localStorage.getItem('servify.mobile.professional.v1')),profileRaw);
 assert.equal(await pa.evaluate(()=>localStorage.getItem('servify.mobile.photo.controlled-media-photo')),photoRaw);
 const preserved=await apiB.from('professional_profiles').select('*').eq('user_id',professional).single();assert.deepEqual(preserved.data,baselineProfile.data);
 step='sign-out and account switch isolation';await pa.goto('http://127.0.0.1:8081/beta',{waitUntil:'domcontentloaded'});await button(pa,'Sign out').click();await button(pa,'Sign in').waitFor();await pa.goto(jobURL,{waitUntil:'domcontentloaded'});await button(pa,'Sign in').waitFor();assert.equal(await text(pa,title).count(),0);
 await pa.goto('http://127.0.0.1:8081/beta',{waitUntil:'domcontentloaded'});const pro=accounts.find(x=>x.role==='professional');await pa.getByRole('textbox',{name:'Email',exact:true}).fill(pro.email);await pa.getByLabel('Password',{exact:true}).fill(pro.password);await button(pa,'Sign in').click();await button(pa,'Open my workspace').waitFor();await pa.goto(jobURL,{waitUntil:'domcontentloaded'});await text(pa,'Completed').first().waitFor();assert.equal(await button(pa,'Confirm work completed').count(),0);
 assert.equal(errors.length,0);console.log('PASS full isolated-browser marketplace: auth/profile preparation, photo publication/retry, discovery/offers tab/selection, two-way messaging/reconnect, scheduling/rescheduling, completion, reviews/response/reputation, private issue, reload, role switch and 320/390/430px. Existing account profile and local photographs preserved; native-device tests remain pending.');
}catch(e){console.error('FAIL integrated browser at: '+step+'; '+(e.message?.includes('strict mode violation')?'ambiguous locator':String(e.name))+'; line '+(e.stack?.match(/verify-beta-journey-browser\.mjs:(\d+)/)?.[1]??'unknown'));process.exitCode=1;}
finally{
 if(browser)await browser.close();
 for(const role of['customer','professional']){const c=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(u,o={})=>fetch(u,{...o,signal:AbortSignal.timeout(20000)})}});clients.push(c);const account=accounts.find(x=>x.role===role);if(!account)continue;const signed=await c.auth.signInWithPassword(account);if(signed.error){process.exitCode=1;continue;}for(const {id} of completed.filter(x=>x.role===role)){const row=await c.from('image_assets').select('bucket,object_path').eq('id',id).maybeSingle();if(row.data){await c.storage.from(row.data.bucket).remove([row.data.object_path]);if((await c.rpc('beta_forget_media',{p_id:id})).error){console.error('Synthetic media cleanup needs review.');process.exitCode=1;}}}await c.auth.signOut({scope:'local'});}
 for(const c of clients)c.auth.stopAutoRefresh();
}
