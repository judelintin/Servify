import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
// Trusted Windows runner supplies two authorized accounts on stdin; never log them.
let raw='',step='private input';for await(const part of process.stdin)raw+=part;
const clients=[],events=[[],[]],timings={};
const make=()=>{const c=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(u,o={})=>fetch(u,{...o,signal:AbortSignal.timeout(15000)})}});clients.push(c);return c;};
const wait=async(test)=>{const end=Date.now()+10000;while(!test()){assert(Date.now()<end,'Realtime deadline');await new Promise(r=>setTimeout(r,40));}};
try{
 const accounts=JSON.parse(raw);raw='';const a=make(),b=make();
 const account=role=>{const x=accounts.find(v=>v.role===role);assert(x);return {email:x.email,password:x.password};};
 step='independent authenticated sessions';
 const [aa,bb]=await Promise.all([a.auth.signInWithPassword(account('customer')),b.auth.signInWithPassword(account('professional'))]);assert(!aa.error&&!bb.error);assert.notEqual(aa.data.user.id,bb.data.user.id);
 step='stale profile is one HTTP 409';
 let start=Date.now();
 const profile=await b.rpc('beta_save_professional',{p_kind:'individual',p_name:'Synthetic profile',p_business:'',p_experience:3,p_bio:'Synthetic profile conflict test; no record is changed.',p_categories:['electrical'],p_areas:['bodija'],p_revision:-1});
 assert.equal(profile.status,409);assert.equal(profile.error?.code,'PT409');timings.profileConflictMs=Date.now()-start;
 step='existing selected job';
 const job=await a.from('jobs').select('id,offer_id').eq('professional_id',bb.data.user.id).limit(1).single();assert(!job.error);
 const offer=await a.from('offers').select('revision').eq('id',job.data.offer_id).single();assert(!offer.error);
 step='repeat selection is one HTTP 409';start=Date.now();
 const selection=await a.rpc('beta_select_offer',{p_command:randomUUID(),p_offer:job.data.offer_id,p_revision:offer.data.revision});
 assert.equal(selection.status,409);assert.equal(selection.error?.code,'PT409');timings.selectionConflictMs=Date.now()-start;
 step='two Realtime subscriptions';
 for(const [index,c] of clients.entries())await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Subscription deadline')),10000);
  c.channel('cpu-audit-'+randomUUID()).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'job_id=eq.'+job.data.id},p=>events[index].push(p.new)).subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timer);resolve();}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timer);reject(Error('Subscription failed'));}});
 });
 step='customer message and professional reply';
 const args={p_job:job.data.id,p_client:randomUUID(),p_body:'Synthetic CPU audit: customer message.'};
 const first=await a.rpc('beta_send_message',args);assert(!first.error);await wait(()=>events[1].some(m=>m.id===first.data[0].id));
 const repeated=await a.rpc('beta_send_message',args);assert.equal(repeated.data?.[0].id,first.data[0].id);
 const second=await b.rpc('beta_send_message',{p_job:job.data.id,p_client:randomUUID(),p_body:'Synthetic CPU audit: professional reply.'});assert(!second.error);await wait(()=>events[0].some(m=>m.id===second.data[0].id));
 const history=await a.from('messages').select('id').eq('job_id',job.data.id).in('id',[first.data[0].id,second.data[0].id]);assert(!history.error);assert.equal(history.data.length,2);
 console.log(JSON.stringify({result:'PASS: two bounded HTTP 409 business conflicts; independent account sessions; two-way Realtime; persisted history; idempotent send',...timings,syntheticMessages:2}));
}catch{console.error('FAIL focused performance regression at: '+step);process.exitCode=1;}finally{for(const c of clients){await c.removeAllChannels();await c.auth.signOut({scope:'local'});c.auth.stopAutoRefresh();}}
