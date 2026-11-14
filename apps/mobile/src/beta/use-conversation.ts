import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {messageError} from '../domain/delivery';
import {commandId} from './commands';
import {chatClient,conversationInfo,messagePage,sendSharedMessage} from './messaging';
import {mergeMessages,outstanding,parseMessage,type ConversationInfo,type PendingMessage,type ServerMessage} from './messaging-model';
import {loadOutbox,saveOutbox} from './messaging-outbox';
type State={info:ConversationInfo|null;messages:ServerMessage[];pending:PendingMessage[];ready:boolean;loading:boolean;connection:string;error:string;more:boolean;olderBusy:boolean;sending:boolean};
export function useConversation(user:string,job:string){
 const initial:State={info:null,messages:[],pending:[],ready:false,loading:true,connection:'Connecting…',error:'',more:false,olderBusy:false,sending:false};
 const [state,setState]=useState(initial),model=useRef(initial),[attempt,setAttempt]=useState(0),live=useRef(false),abort=useRef<AbortController|null>(null),lock=useRef(false),through=useRef(0),initialized=useRef(false);
 const update=useCallback((patch:Partial<State>)=>{if(!live.current)return;model.current={...model.current,...patch};setState(model.current);},[]);
 const accept=useCallback((incoming:ServerMessage[])=>{
  const info=model.current.info;
  const allowed=incoming.filter(m=>m.job_id===job&&info&&[info.customer_id,info.professional_id].includes(m.sender_id));
  const messages=mergeMessages(model.current.messages,allowed),pending=outstanding(model.current.pending,messages,user);
  const changed=pending.length!==model.current.pending.length;update({messages,pending});if(changed)void saveOutbox(user,job,pending).catch(()=>{});
 },[job,user,update]);
 useEffect(()=>{
  live.current=true;const controller=new AbortController();abort.current=controller;let active=true,channel:ReturnType<ReturnType<typeof chatClient>['channel']>|undefined;
  update({loading:true,ready:false,error:'',connection:'Connecting…',sending:false,olderBusy:false});lock.current=false;
  let catchup:Promise<void>|null=null;
  const catchUp=()=>{if(catchup)return catchup;catchup=(async()=>{let cursor=through.current;
   while(active){const page=await messagePage(job,{after:cursor,signal:controller.signal});if(!active)return;accept(page);if(page.length)cursor=page.at(-1)?.sequence??cursor;if(page.length<50)break;}
   if(active){through.current=cursor;update({connection:'Live updates connected',error:''});}
  })().finally(()=>{catchup=null;});return catchup;};
  void(async()=>{
   const [info,pending]=await Promise.all([conversationInfo(job,controller.signal),loadOutbox(user,job)]);
   if(!active)return;update({info,pending});
   if(!initialized.current){const page=await messagePage(job,{signal:controller.signal});if(!active)return;through.current=page.at(-1)?.sequence??0;accept(page);update({more:page.length===50});initialized.current=true;}
   else await catchUp();
   if(!active)return;const remaining=outstanding(model.current.pending,model.current.messages,user);update({pending:remaining,ready:true,loading:false});
   void saveOutbox(user,job,remaining).catch(()=>{});
   channel=chatClient().channel('job-chat-'+user+'-'+job+'-'+commandId())
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'job_id=eq.'+job},payload=>{if(active)try{accept([parseMessage(payload.new)]);}catch{update({error:'A message could not be read. Reconnect to reload it.'});}})
    .subscribe(status=>{if(!active)return;if(status==='SUBSCRIBED'){void conversationInfo(job,controller.signal).then(()=>catchUp()).catch(()=>{if(active)update({ready:false,info:null,messages:[],connection:'Disconnected',error:'Conversation access could not be verified. Reconnect when signed in.'});});}
     else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED')update({connection:'Reconnecting…',error:'Live updates are interrupted. Saved messages remain safe; reconnection reloads missed history.'});});
  })().catch(e=>{if(active)update({loading:false,ready:false,error:e instanceof Error?e.message:'Conversation unavailable.'});});
  return()=>{active=false;live.current=false;controller.abort();if(channel)void chatClient().removeChannel(channel);};
 },[user,job,attempt,accept,update]); // Each account/job is mounted with its own React key.
 useEffect(()=>{const foreground=AppState.addEventListener('change',status=>{if(status==='active')setAttempt(n=>n+1);});const online=()=>setAttempt(n=>n+1);globalThis.addEventListener?.('online',online);return()=>{foreground.remove();globalThis.removeEventListener?.('online',online);};},[]);
 async function transmit(p:PendingMessage,onQueued?:()=>void){
  if(lock.current||!model.current.ready)return;lock.current=true;const controller=abort.current;
  try{const pending=[...model.current.pending.filter(v=>v.clientId!==p.clientId),{...p,state:'sending' as const}];await saveOutbox(user,job,pending);
   if(!live.current||controller?.signal.aborted)return;update({pending,sending:true,error:''});onQueued?.();
   const sent=await sendSharedMessage(user,job,p.clientId,p.body,controller?.signal);if(!live.current||controller?.signal.aborted)return;
   accept([sent]);const remaining=outstanding(model.current.pending,model.current.messages,user);update({pending:remaining,error:''});await saveOutbox(user,job,remaining);
  }catch(e){if(live.current&&!controller?.signal.aborted){const confirmed=model.current.messages.some(m=>m.sender_id===user&&m.client_id===p.clientId);if(!confirmed){const pending=model.current.pending.map(v=>v.clientId===p.clientId?{...v,state:'failed' as const}:v);update({pending,error:e instanceof Error?e.message:'Message not confirmed. Retry the same message.'});void saveOutbox(user,job,pending).catch(()=>{});}}}
  finally{if(controller===abort.current){if(live.current&&!controller?.signal.aborted)update({sending:false});lock.current=false;}}
 }
 async function send(body:string,onQueued:()=>void){const error=messageError(body);if(error){update({error});return;}await transmit({clientId:commandId(),body:body.trim(),state:'sending'},onQueued);}
 async function earlier(){if(!model.current.more||model.current.olderBusy)return;const controller=abort.current;update({olderBusy:true});try{const page=await messagePage(job,{before:model.current.messages[0]?.sequence,signal:controller?.signal});if(live.current&&!controller?.signal.aborted){accept(page);update({more:page.length===50,error:''});}}catch(e){if(live.current&&!controller?.signal.aborted)update({error:e instanceof Error?e.message:'Earlier messages unavailable.'});}finally{if(live.current&&!controller?.signal.aborted)update({olderBusy:false});}}
 return {...state,send,retry:(p:PendingMessage)=>transmit(p),earlier,reconnect:()=>setAttempt(n=>n+1)};
}
