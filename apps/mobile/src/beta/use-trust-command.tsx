import {useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {Button,Type} from '../ui/primitives';
import {Confirm,s} from '../features/marketplace/components';
import {clearTrustIntent,executeTrustIntent,loadTrustIntent,storeTrustIntent,type TrustIntent} from './trust';
export function useTrustCommand(user:string,scope:string,resource:string){
 const [pending,setPending]=useState<TrustIntent|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false),live=useRef(true);
 useEffect(()=>{let active=true;live.current=true;void loadTrustIntent(user,scope,resource).then(v=>{if(active){setPending(v);setReady(true);}},()=>{if(active)setError('Saved feedback could not be read. It was preserved; reopen this view to retry storage.');});return()=>{active=false;live.current=false;};},[user,scope,resource]);
 async function send(p:TrustIntent){if(lock.current||!ready)throw Error('Feedback storage is not ready.');lock.current=true;setBusy(true);setError('');try{await storeTrustIntent(user,scope,resource,p);if(live.current)setPending(p);const id=await executeTrustIntent(user,p);await clearTrustIntent(user,scope,resource,p.args.p_command);if(live.current)setPending(null);return id;}catch(e){if(live.current)setError(e instanceof Error?e.message:'Feedback not confirmed.');throw e;}finally{lock.current=false;if(live.current)setBusy(false);}}
 async function dismiss(){if(lock.current||!pending)return;lock.current=true;setBusy(true);try{await clearTrustIntent(user,scope,resource,pending?.args.p_command);if(live.current){setPending(null);setError('Saved instruction dismissed. Refresh before another action; server records were not deleted.');}}catch(e){if(live.current)setError('Saved feedback could not be dismissed and was preserved.');throw e;}finally{lock.current=false;if(live.current)setBusy(false);}}
 return {pending,ready,busy,error,send,dismiss};
}
export function TrustPending({command:c,onConfirmed,onRefresh}:{command:ReturnType<typeof useTrustCommand>;onConfirmed:()=>Promise<void>|void;onRefresh:()=>Promise<void>|void}){
 const [confirm,setConfirm]=useState(false);
 return <>{c.pending&&<View style={s.card}><Type variant="section">Unconfirmed feedback action</Type><Type>It may already be saved. Retry uses the same ID and cannot duplicate a successful action.</Type><Button label="Retry saved feedback" busy={c.busy} onPress={()=>{if(c.pending)void c.send(c.pending).then(onConfirmed).catch(()=>{});}}/><Button label="Dismiss saved feedback" variant="secondary" disabled={c.busy} onPress={()=>setConfirm(true)}/></View>}{!!c.error&&<Type accessibilityRole="alert">{c.error}</Type>}<Confirm visible={confirm} title="Dismiss saved feedback instruction?" action="Dismiss instruction" busy={c.busy} onCancel={()=>setConfirm(false)} onConfirm={()=>void Promise.resolve(onRefresh()).then(()=>c.dismiss()).then(()=>setConfirm(false)).catch(()=>{})}><Type>This dismisses only the retry instruction. An already saved review, response or report remains on the server. Review current data before another action.</Type></Confirm></>;
}
