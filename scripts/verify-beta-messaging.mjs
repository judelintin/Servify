import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
let input='',step='private vault input';for await(const p of process.stdin)input+=p;
const clients=[],channels=[];
const wait=async(fn,label,ms=15000)=>{const start=Date.now();while(!fn()){if(Date.now()-start>ms)throw Error(label);await new Promise(r=>setTimeout(r,60));}};
const make=()=>{const c=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(u,o={})=>fetch(u,{...o,signal:AbortSignal.timeout(20000)})}});clients.push(c);return c;};
async function subscribe(client,job,seen){
 const ch=client.channel('controlled-chat-'+randomUUID()).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'job_id=eq.'+job},p=>seen.push(p.new));channels.push({client,ch});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Realtime join timeout')),18000);ch.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timer);resolve();}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timer);reject(Error('Realtime join failed'));}});});return ch;
}
try{
 const accounts=JSON.parse(input);input='';const a=make(),b=make(),anon=make();
 step='independent authenticated sessions';const [aa,bb]=await Promise.all([a.auth.signInWithPassword(accounts.find(x=>x.role==='customer')),b.auth.signInWithPassword(accounts.find(x=>x.role==='professional'))]);assert(!aa.error&&!bb.error);const aid=aa.data.user.id,bid=bb.data.user.id;assert.notEqual(aid,bid);
 step='unchanged job/offer workflow and automatic conversation';
 const request=await a.rpc('beta_post_request',{p_command:randomUUID(),p_category:'electrical',p_area:'bodija',p_title:'Controlled messaging '+Date.now(),p_description:'Synthetic conversation test request without private personal information.',p_timing:'flexible',p_date:null,p_budget_mode:'quotes',p_min:null,p_max:null});assert(!request.error);
 const offer=await b.rpc('beta_submit_offer',{p_command:randomUUID(),p_request:request.data,p_amount:1500000,p_price_type:'estimate',p_scope:'Synthetic electrical repair for controlled messaging verification.',p_availability:'Within two days',p_conditions:'Test only'});assert(!offer.error);
 const revision=await a.from('offers').select('revision').eq('id',offer.data).single();const selected=await a.rpc('beta_select_offer',{p_command:randomUUID(),p_offer:offer.data,p_revision:revision.data.revision});assert(!selected.error);const job=selected.data;
 assert((await a.from('conversations').select('job_id').eq('job_id',job)).data.length===1);
 const info=await b.rpc('beta_conversation',{p_job:job});assert(!info.error&&info.data[0].customer_id===aid);
 step='unauthorized writes, impersonation and validation';
 assert((await anon.rpc('beta_send_message',{p_job:job,p_client:randomUUID(),p_body:'Unauthorized'})).error);
 assert((await b.rpc('beta_send_message',{p_job:randomUUID(),p_client:randomUUID(),p_body:'Unavailable conversation'})).error);
 assert((await a.from('messages').insert({job_id:job,sender_id:bid,client_id:randomUUID(),body:'Impersonation denied'})).error);
 assert((await a.rpc('beta_send_message',{p_job:job,p_client:randomUUID(),p_body:'Impersonation',p_sender:bid})).error);
 for(const p_body of[' \n\t','x'.repeat(2001),'bad\u0001control'])assert((await a.rpc('beta_send_message',{p_job:job,p_client:randomUUID(),p_body})).error);
 step='authenticated Realtime subscription';const seenA=[],seenB=[],seenAnon=[];const ca=await subscribe(a,job,seenA);let cb=await subscribe(b,job,seenB);
 const anonymousChannel=anon.channel('unauthorized-'+randomUUID()).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'job_id=eq.'+job},p=>seenAnon.push(p.new)).subscribe();channels.push({client:anon,ch:anonymousChannel});
 const send=async(c,p_body,p_client=randomUUID())=>{const r=await c.rpc('beta_send_message',{p_job:job,p_client,p_body});assert(!r.error,'message command');assert.equal(r.data.length,1);return r.data[0];};
 step='customer send and professional realtime delivery';const firstId=randomUUID(),first=await send(a,'Customer controlled message',firstId);assert.equal(first.sender_id,aid);assert(Date.parse(first.created_at)<=Date.now()+5000);assert(first.id&&Number.isSafeInteger(first.sequence));await wait(()=>seenB.some(m=>m.id===first.id),'professional realtime delivery');
 step='idempotent retry and changed payload denial';assert.equal((await send(a,'Customer controlled message',firstId)).id,first.id);assert((await a.rpc('beta_send_message',{p_job:job,p_client:firstId,p_body:'Changed retry'})).error);
 assert.equal((await a.from('messages').select('id').eq('sender_id',aid).eq('client_id',firstId)).data.length,1);
 step='professional reply and customer realtime delivery';const reply=await send(b,'Professional controlled reply');await wait(()=>seenA.some(m=>m.id===reply.id),'customer realtime delivery');assert.equal(reply.sender_id,bid);
 step='ordered history and actual pagination';for(let i=0;i<52;i+=8)await Promise.all(Array.from({length:Math.min(8,52-i)},(_,j)=>send(a,'Synthetic pagination message '+(i+j))));
 const recent=await b.from('messages').select('*').eq('job_id',job).order('sequence',{ascending:false}).limit(50);assert(!recent.error&&recent.data.length===50);
 const older=await b.from('messages').select('*').eq('job_id',job).lt('sequence',recent.data.at(-1).sequence).order('sequence',{ascending:false}).limit(50);assert(!older.error&&older.data.length===4);
 const combined=[...recent.data,...older.data];assert.equal(new Set(combined.map(m=>m.id)).size,54);
 step='reconnection, catchup and stable ids';await b.removeChannel(cb);const cursor=Math.max(...combined.map(m=>m.sequence));const missed=await send(a,'Sent while professional was disconnected');
 await b.auth.refreshSession();cb=await subscribe(b,job,seenB);
 const after=await b.from('messages').select('*').eq('job_id',job).gt('sequence',cursor).order('sequence');assert(!after.error&&after.data.some(m=>m.id===missed.id));
 const live=await send(a,'Realtime after reconnection');await wait(()=>seenB.some(m=>m.id===live.id),'post-reconnection update');
 const all=await b.from('messages').select('*').eq('job_id',job).order('sequence');assert.equal(all.data.length,56);assert.equal(new Set(all.data.map(m=>m.id)).size,56);assert.equal(seenB.filter(m=>m.id===first.id).length,1);assert.equal(seenAnon.length,0);
 assert((await anon.from('messages').select('id').eq('job_id',job)).error||!(await anon.from('messages').select('id').eq('job_id',job)).data?.length);
 step='independent history restoration and logout';const restored=make();assert(!(await restored.auth.signInWithPassword(accounts.find(x=>x.role==='customer'))).error);assert.equal((await restored.from('messages').select('id').eq('job_id',job)).data.length,56);
 assert((await a.from('messages').update({body:'tampered'}).eq('id',first.id)).error);assert((await a.from('messages').delete().eq('id',first.id)).error);
 assert.equal((await b.from('jobs').select('status').eq('id',job).single()).data.status,'awaiting_confirmation');
 await a.removeChannel(ca);await a.auth.signOut({scope:'local'});assert((await b.auth.getUser()).data.user?.id===bid);
 console.log(JSON.stringify({result:'PASS genuine two-account RPC and Realtime send/reply, persistence, ordering, 50-message pagination, idempotency, reconnect catchup, no anonymous events, sender/write validation and unchanged job lifecycle',jobId:job,messages:56}));
}catch{console.error('FAIL controlled messaging at: '+step);process.exitCode=1;}
finally{for(const {client,ch} of channels)await client.removeChannel(ch);for(const c of clients){await c.auth.signOut({scope:'local'}).catch(()=>{});c.auth.stopAutoRefresh();c.realtime.disconnect();}}
