import {useEffect,useRef,useState} from 'react';
import {AppState,View} from 'react-native';
import {useRouter} from 'expo-router';
import {useBetaAccount} from './account';
import {chatClient,conversationList} from './messaging';
import type {ConversationSummary} from './messaging-model';
import {commandId} from './commands';
import {Badge,Button,EmptyState,Page,Type} from '../ui/primitives';
import {messageStamp} from '../ui/job-chat';
import {s} from '../features/marketplace/components';
export function BetaInbox({onLocal}:{onLocal:()=>void}){const account=useBetaAccount();return account.user?<InboxBody key={account.user.id} user={account.user.id} onLocal={onLocal}/>:null;}
function InboxBody({user,onLocal}:{user:string;onLocal:()=>void}){
 const router=useRouter(),[rows,setRows]=useState<ConversationSummary[]>([]),[error,setError]=useState(''),[loaded,setLoaded]=useState(false),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[attempt,setAttempt]=useState(0),live=useRef(false),current=useRef<ConversationSummary[]>([]);
 useEffect(()=>{live.current=true;let active=true;let timer:ReturnType<typeof setTimeout>|undefined;
  const reload=async()=>{try{const next=await conversationList();if(active){current.current=next;setRows(next);setMore(next.length===50);setError('');setLoaded(true);}}catch(e){if(active){setError(e instanceof Error?e.message:"Conversations unavailable.");setLoaded(true);}}};
  void reload();const channel=chatClient().channel('inbox-'+user+'-'+commandId()).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},()=>{clearTimeout(timer);timer=setTimeout(()=>void reload(),120);}).subscribe(status=>{if(status==='SUBSCRIBED')void reload();});
  const foreground=AppState.addEventListener('change',state=>{if(state==='active')setAttempt(n=>n+1);});const online=()=>setAttempt(n=>n+1);globalThis.addEventListener?.('online',online);
  return()=>{active=false;live.current=false;clearTimeout(timer);foreground.remove();globalThis.removeEventListener?.('online',online);void chatClient().removeChannel(channel);};
 },[user,attempt]);
 async function older(){if(busy)return;setBusy(true);try{const next=await conversationList(current.current.at(-1));if(live.current){const map=new Map([...current.current,...next].map(r=>[r.job_id,r]));current.current=[...map.values()];setRows(current.current);setMore(next.length===50);}}catch(e){if(live.current)setError(e instanceof Error?e.message:'Could not load more conversations.');}finally{if(live.current)setBusy(false);}}
 return <Page title="Messages"><View style={{gap:18,paddingTop:18}}><Badge>PRIVATE BETA</Badge><Type variant="title">The details,{'\n'}kept together.</Type><Type>One private conversation per selected job. Messages are shared through Supabase, regardless of interface mode. No read receipts.</Type>
 {!loaded&&<Type>Loading conversations…</Type>}{!!error&&<><Type accessibilityRole="alert">{error}</Type><Button label="Retry conversations" variant="secondary" onPress={()=>setAttempt(n=>n+1)}/></>}
 {loaded&&!rows.length&&!error&&<EmptyState icon="message-circle" title="A conversation starts with a selected job." description="Select an offer to begin. No messages or activity are invented."/>}
 {rows.map(r=><View key={r.job_id} style={s.card}><Badge>{r.status.replaceAll('_',' ')}</Badge><Type variant="section">{r.title}</Type><Type variant="caption">{r.last_body?r.last_body:'No messages yet'}</Type><Button label={'Manage job: '+r.title} variant="secondary" onPress={()=>router.push({pathname:'/job',params:{id:r.job_id,source:'beta'}})}/>{r.last_at&&<Type variant="caption">{messageStamp(r.last_at)}</Type>}<Button label={'Open conversation: '+r.title} variant="secondary" onPress={()=>router.push({pathname:'/conversation',params:{id:r.job_id,source:'beta'}})}/></View>)}
 {more&&<Button label="Load more conversations" variant="secondary" busy={busy} onPress={()=>void older()}/>}<Button label="View device-local conversations" variant="ghost" onPress={onLocal}/><Button label="Beta account / sign out" variant="ghost" onPress={()=>router.push('/beta')}/></View></Page>;
}
