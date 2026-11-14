import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {chatClient} from './messaging';
import {commandId} from './commands';
/** One event subscription per mounted account/view; coalesced reads, no polling. */
export function useLifecycle<T>(user:string,job:string|undefined,load:(signal:AbortSignal)=>Promise<T>){
 const [state,setState]=useState<{data:T|null;error:string;loading:boolean;connection:string}>({data:null,error:'',loading:true,connection:'Connecting…'});
 const [attempt,setAttempt]=useState(0),reloadRef=useRef<()=>Promise<void>>(async()=>{}),signal=useRef<AbortSignal|undefined>(undefined);
 useEffect(()=>{
  let live=true,running:Promise<void>|null=null,again=false,timer:ReturnType<typeof setTimeout>|undefined;
  const controller=new AbortController();signal.current=controller.signal;
  const read=():Promise<void>=>{if(!live)return Promise.resolve();if(running){again=true;return running;}
   running=(async()=>{do{again=false;try{const data=await load(controller.signal);if(live)setState(s=>({...s,data,error:'',loading:false}));}catch(e){if(live)setState(s=>({...s,error:e instanceof Error?e.message:'Shared job unavailable.',loading:false}));}}while(live&&again);})().finally(()=>{running=null;});return running;};
  reloadRef.current=read;void read();
  const change={event:'INSERT' as const,schema:'public',table:'job_events',...(job?{filter:'job_id=eq.'+job}:{})};
  const channel=chatClient().channel('lifecycle-'+user+'-'+(job??'list')+'-'+commandId()).on('postgres_changes',change,()=>{clearTimeout(timer);timer=setTimeout(()=>void read(),120);}).subscribe(status=>{
   if(!live)return;if(status==='SUBSCRIBED'){setState(s=>({...s,connection:'Live updates connected'}));void read();}
   else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))setState(s=>({...s,connection:'Live updates interrupted. Reconnect to check the latest job.'}));
  });
  const foreground=AppState.addEventListener('change',v=>{if(v==='active')setAttempt(n=>n+1);}),online=()=>setAttempt(n=>n+1);
  globalThis.addEventListener?.('online',online);
  return()=>{live=false;controller.abort();clearTimeout(timer);foreground.remove();globalThis.removeEventListener?.('online',online);void chatClient().removeChannel(channel);};
 },[user,job,load,attempt]);
 return {...state,signal,reload:useCallback(()=>reloadRef.current(),[]),reconnect:()=>setAttempt(n=>n+1)};
}
