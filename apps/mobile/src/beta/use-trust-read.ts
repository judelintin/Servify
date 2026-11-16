import {useEffect,useState} from 'react';
import {AppState} from 'react-native';
export function useTrustRead<T>(load:(signal:AbortSignal)=>Promise<T>){
 const [data,setData]=useState<T|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(true),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;const controller=new AbortController();void load(controller.signal).then(v=>{if(active){setData(v);setError('');setBusy(false);}},()=>{if(active){setError('Shared feedback could not be loaded. Refresh when connected.');setBusy(false);}});
 const foreground=AppState.addEventListener('change',s=>{if(s==='active')setAttempt(v=>v+1);}),online=()=>setAttempt(v=>v+1);globalThis.addEventListener?.('online',online);
 return()=>{active=false;controller.abort();foreground.remove();globalThis.removeEventListener?.('online',online);};},[load,attempt]);
 return {data,error,busy,refresh:()=>setAttempt(v=>v+1)};
}
