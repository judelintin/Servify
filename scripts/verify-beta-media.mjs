import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {createClient} from '@supabase/supabase-js';
const require=createRequire(import.meta.url),sharp=require('sharp');
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
let input='',step='secure credential input';for await(const chunk of process.stdin)input+=chunk;
const files=[],clients=[];let a,b;
const make=()=>{const c=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(u,o={})=>fetch(u,{...o,signal:o.signal?AbortSignal.any([o.signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)})}});clients.push(c);return c;};
async function reserve(client,owner,bucket,request,body,extra={}){
 const id=randomUUID(),args={p_id:id,p_bucket:bucket,p_request:request,p_bytes:body.length,p_type:'image/jpeg',p_alt:'Synthetic Stage 09A test photograph',p_title:'Controlled work sample',p_description:'Synthetic portfolio, not real customer activity.',p_category:'electrical',...extra};
 const r=await client.rpc('beta_reserve_media',args);assert(!r.error,'reservation failed');files.push({client,id,bucket,path:owner+'/'+id+'.jpg'});return {id,args,path:owner+'/'+id+'.jpg'};
}
async function complete(client,file){const r=await client.rpc('beta_complete_media',{p_id:file.id});assert(!r.error,'finalization failed');}
async function download(client,bucket,path){return client.storage.from(bucket).download(path);}
try{
 const accounts=JSON.parse(input);input='';a=make();b=make();const anonymous=make();
 step='two independent real sign-ins';const [aa,bb]=await Promise.all([a.auth.signInWithPassword(accounts.find(x=>x.role==='customer')),b.auth.signInWithPassword(accounts.find(x=>x.role==='professional'))]);
 assert(!aa.error&&!bb.error&&aa.data.user.id!==bb.data.user.id);const aid=aa.data.user.id,bid=bb.data.user.id;
 const jpeg=await sharp({create:{width:80,height:60,channels:3,background:'#3155c8'}}).jpeg().toBuffer();
 const post=async category=>{const r=await a.rpc('beta_post_request',{p_command:randomUUID(),p_category:category,p_area:'bodija',p_title:'Controlled Stage09A '+category+' '+Date.now(),p_description:'Synthetic media authorization request. No personal information or real work.',p_timing:'flexible',p_date:null,p_budget_mode:'quotes',p_min:null,p_max:null});assert(!r.error);return r.data;};
 step='publication and eligible discovery';const request=await post('electrical'),privateRequest=await post('plumbing');
 assert((await b.rpc('beta_discover')).data.some(r=>r.id===request));
 step='unauthorized reservation and raw upload denial';
 assert((await b.rpc('beta_reserve_media',{p_id:randomUUID(),p_bucket:'job-photos',p_request:request,p_bytes:jpeg.length,p_type:'image/jpeg',p_alt:'forbidden'})).error);
 assert((await anonymous.rpc('beta_reserve_media',{p_id:randomUUID(),p_bucket:'job-photos',p_request:request,p_bytes:jpeg.length,p_type:'image/jpeg',p_alt:'forbidden'})).error);
 assert((await a.storage.from('job-photos').upload(aid+'/'+randomUUID()+'.jpg',jpeg,{contentType:'image/jpeg'})).error);
 step='owner reservation, idempotency and incomplete confirmation';const job=await reserve(a,aid,'job-photos',request,jpeg);
 assert.equal((await a.rpc('beta_reserve_media',job.args)).data,job.id);
 assert((await a.rpc('beta_reserve_media',{...job.args,p_bytes:jpeg.length+1})).error);
 assert((await a.rpc('beta_complete_media',{p_id:job.id})).error);
 assert(!(await b.from('image_assets').select('id').eq('id',job.id)).data.length,'pending hidden');
 step='bucket MIME/size enforcement';
 assert((await a.rpc('beta_reserve_media',{...job.args,p_id:randomUUID(),p_type:'image/svg+xml'})).error);
 assert((await a.rpc('beta_reserve_media',{...job.args,p_id:randomUUID(),p_bytes:5242881})).error);
 assert((await a.storage.from('job-photos').upload(job.path,Buffer.from('<html>forbidden</html>'),{contentType:'text/html'})).error);
 assert((await a.storage.from('job-photos').upload(job.path,Buffer.alloc(5242881),{contentType:'image/jpeg'})).error);
 step='direct authenticated upload, retry and finalization';
 assert(!(await a.storage.from('job-photos').upload(job.path,jpeg,{contentType:'image/jpeg'})).error);
 assert((await a.storage.from('job-photos').upload(job.path,jpeg,{contentType:'image/jpeg'})).error,'immutable duplicate');
 await complete(a,job);await complete(a,job);
 assert(!(await download(b,'job-photos',job.path)).error,'eligible professional shared read');
 assert((await download(anonymous,'job-photos',job.path)).error,'anonymous denied');
 const privatePhoto=await reserve(a,aid,'job-photos',privateRequest,jpeg);
 assert(!(await a.storage.from('job-photos').upload(privatePhoto.path,jpeg,{contentType:'image/jpeg'})).error);await complete(a,privatePhoto);
 assert((await download(b,'job-photos',privatePhoto.path)).error,'unrelated authenticated read denied');
 assert((await b.storage.from('job-photos').createSignedUrl(privatePhoto.path,60)).error,'unrelated signing denied');
 assert((await b.storage.from('job-photos').upload(privatePhoto.path,jpeg,{contentType:'image/jpeg',upsert:true})).error,'foreign overwrite denied');
 assert((await a.storage.from('job-photos').update(job.path,jpeg,{contentType:'image/jpeg'})).error,'owner overwrite denied');
 await b.storage.from('job-photos').remove([privatePhoto.path]);assert(!(await download(a,'job-photos',privatePhoto.path)).error,'foreign delete no effect');
 assert((await a.rpc('beta_forget_media',{p_id:job.id})).error,'cannot orphan live object');
 step='professional profile and portfolio upload';const portrait=await reserve(b,bid,'profile-photos',null,jpeg),portfolio=await reserve(b,bid,'portfolio-images',null,jpeg);
 for(const item of[portrait,portfolio]){assert(!(await b.storage.from(item.args.p_bucket).upload(item.path,jpeg,{contentType:'image/jpeg'})).error);await complete(b,item);}
 assert((await download(anonymous,'profile-photos',portrait.path)).error,'anonymous professional media denied');
 step='offer customer gets professional media; selection preserves authorized job access';
 const offered=await b.rpc('beta_submit_offer',{p_command:randomUUID(),p_request:request,p_amount:1500000,p_price_type:'estimate',p_scope:'Controlled media test inspection and socket replacement.',p_availability:'Within two days',p_conditions:'Synthetic beta test only'});assert(!offered.error);
 for(const item of[portrait,portfolio])assert(!(await download(a,item.args.p_bucket,item.path)).error,'offer customer shared professional media');
 const received=await a.from('offers').select('revision').eq('id',offered.data).single();
 assert(!(await a.rpc('beta_select_offer',{p_command:randomUUID(),p_offer:offered.data,p_revision:received.data.revision})).error);
 assert(!(await download(b,'job-photos',job.path)).error,'selected participant read');
 step='signed link access, expiry and no public bucket access';
 const validLink=await b.storage.from('job-photos').createSignedUrl(job.path,30);
 assert(!validLink.error,'authorized signed URL creation failed');
 const validRead=await fetch(validLink.data.signedUrl);await validRead.arrayBuffer();
 assert(validRead.ok,'authorized signed URL download must succeed within its validity window');
 const shortLink=await b.storage.from('job-photos').createSignedUrl(job.path,1);
 assert(!shortLink.error,'short-lived signed URL creation failed');
 await new Promise(resolve=>setTimeout(resolve,2200));
 const deadline=Date.now()+10000;let expired=false;
 while(Date.now()<deadline){
  const response=await fetch(shortLink.data.signedUrl,{cache:'no-store'});
  if(!response.ok){const error=await response.json();assert([400,401].includes(response.status)&&[error.code,error.error,error.message].some(value=>/jwt|expir/i.test(String(value))),'expiry must reject the token, not fail from an unrelated server/storage error');expired=true;break;}
  await response.arrayBuffer();await new Promise(resolve=>setTimeout(resolve,500));
 }
 assert(expired,'short-lived signed URL must expire within the bounded wait');
 assert(!(await download(b,'job-photos',job.path)).error,'authenticated participant remains authorized after signed-link expiry');
 assert(!(await fetch(url+'/storage/v1/object/public/job-photos/'+job.path)).ok,'public endpoint denied');
 step='concurrent resource count bound';const reserved=await Promise.all(Array.from({length:8},()=>reserve(a,aid,'job-photos',privateRequest,jpeg).then(()=>true,()=>false)));
 assert.equal(reserved.filter(Boolean).length,7,'existing ready + seven reservations = eight');
 step='fresh independent session and isolation';
 const restored=make();assert(!(await restored.auth.signInWithPassword(accounts.find(x=>x.role==='customer'))).error);
 assert(!(await download(restored,'job-photos',job.path)).error);
 console.log(JSON.stringify({result:'PASS actual HTTPS two-account private job/profile/portfolio uploads, resource/count/MIME/size enforcement, pending visibility, stranger/anonymous denials, immutable files, offer relationship, selection, signed expiry and independent readback',requestId:request,privateRequestId:privateRequest}));
}catch(e){console.error('FAIL Stage09A media at: '+step+'; '+e.name+'; '+String(e.message).split('\n')[0]);process.exitCode=1;}
finally{
 for(const file of files){try{await file.client.storage.from(file.bucket).remove([file.path]);const r=await file.client.rpc('beta_forget_media',{p_id:file.id});if(r.error)throw r.error;}catch{console.error('Media fixture cleanup incomplete; inspect synthetic Stage09A registry.');process.exitCode=1;}}
 for(const client of clients){try{await client.auth.signOut({scope:'local'});}catch{}client.auth.stopAutoRefresh();}
}
