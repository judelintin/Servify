import {useEffect,useSyncExternalStore} from 'react';
import {AppState} from 'react-native';
import type {User} from '@supabase/supabase-js';
import {betaClient} from './client';
type State={status:'loading'|'signed-out'|'authenticated'|'error';user:User|null};
let state:State={status:betaClient?'loading':'signed-out',user:null},started=false,epoch=0;
const listeners=new Set<()=>void>();
const emit=(next:State)=>{state=next;listeners.forEach(l=>l());};
export async function refreshBetaAccount(){const client=betaClient;if(!client)return;const version=++epoch;
 try{const {data:session,error:stored}=await client.auth.getSession();if(stored)throw stored;if(version!==epoch)return;if(!session.session){emit({status:'signed-out',user:null});return;}
 const {data,error}=await client.auth.getUser();if(version!==epoch)return;if(error||!data.user)throw error;emit({status:'authenticated',user:data.user});
 }catch{if(version===epoch)emit({status:'error',user:null});}
}
function start(){if(started||!betaClient)return;started=true;const client=betaClient;
 client.auth.onAuthStateChange((event,session)=>{if(!session){epoch++;emit({status:'signed-out',user:null});}else{if(event==='SIGNED_IN'&&state.user?.id!==session.user.id)emit({status:'loading',user:null});void Promise.resolve().then(refreshBetaAccount);}});
 const refresh=()=>{if(AppState.currentState==='active'){client.auth.startAutoRefresh();void refreshBetaAccount();}else client.auth.stopAutoRefresh();};
 // One module-lifetime subscription for the unified app, not one per screen.
 AppState.addEventListener('change',refresh);refresh();
}
export function useBetaAccount(){useEffect(start,[]);return useSyncExternalStore(l=>{listeners.add(l);return()=>{listeners.delete(l);};},()=>state,()=>state);}
