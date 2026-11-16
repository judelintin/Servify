import { PublishPanel } from '../../features/marketplace/customer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, View } from 'react-native';
import { requestStore, useRequests } from '../../data/requests';
import { usePreview } from '../../data/preview-store';
import { removePhoto } from '../../data/photo-files';
import { colors as c } from '../../theme/tokens';
import { Badge, Button, EmptyState, Page, Type } from '../../ui/primitives';
import { RequestSummary, StorageNotice } from '../../ui/request-parts';
export default function Details(){const{id,saved}=useLocalSearchParams<{id:string;saved?:string}>(),{drafts,ready,storage}=useRequests(),{data}=usePreview(),router=useRouter(),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const draft=drafts.find(d=>d.id===id);
  if(!ready)return <Page title="Your request"><Type>Restoring your draft…</Type></Page>;
  if(data.mode!=='customer')return <Page title="Customer request" back><EmptyState title="Switch to Customer mode." description="These drafts are not published professional opportunities."/></Page>;
  if(!draft)return <Page title="Your request" back><EmptyState title="Draft not found." description="This request is no longer on this device." action="My Jobs" onAction={()=>router.replace('/jobs')}/></Page>;
  const edit=(step:number)=>router.push({pathname:'/post-job',params:{id:draft.id,step:String(step)}});
  async function remove(){if(!draft)return;setBusy(true);try{const persisted=await requestStore.remove(draft.id,draft.revision);if(persisted)await Promise.all(draft.content.photos.filter(p=>!requestStore.getSnapshot().drafts.some(d=>d.content.photos.some(other=>other.id===p.id))).map(p=>removePhoto(p.id).catch(()=>{})));setConfirm(false);router.dismissTo('/jobs');}catch(e){setError(e instanceof Error?e.message:'Could not remove draft.');}finally{setBusy(false);}}
  return <Page title="Your request" back><View style={{gap:18,paddingTop:18}}><Badge tone="orange">DRAFT ON THIS DEVICE</Badge>{saved==='1'&&storage==='device'&&<Type accessibilityRole="alert" color={c.blue}>Draft saved on this device. Nothing was sent to providers.</Type>}<Type variant="heading" accessibilityRole="header">{draft.content.title.trim()||'Your next project starts here.'}</Type><Type color={c.muted}>Only on this device. Anyone with access to this app’s storage may see this draft. Not synced with the website.</Type><Button label="Continue editing" icon="edit-2" onPress={()=>edit(draft.lastStep)}/><PublishPanel draft={draft}/><RequestSummary content={draft.content} onEdit={edit}/><Button label="Delete draft" variant="ghost" onPress={()=>setConfirm(true)}/><StorageNotice/></View>
    <Modal visible={confirm} transparent animationType="none" onRequestClose={()=>{if(!busy)setConfirm(false);}}><View style={{flex:1,backgroundColor:'#151A2D80',justifyContent:'center',padding:24}}><View accessibilityViewIsModal style={{backgroundColor:c.warm,padding:24,borderRadius:18,gap:16}}><Type variant="heading" accessibilityRole="header">Delete this draft?</Type><Type>This removes only this device’s draft and local photo copies. Posted jobs and uploaded files are not deleted. This cannot be undone.</Type>{storage==='session'&&<Type color={c.error}>Storage is unavailable. Deletion may not survive restarting the app.</Type>}{!!error&&<Type accessibilityRole="alert" color={c.error}>{error}</Type>}<Button label="Keep draft" variant="secondary" disabled={busy} onPress={()=>setConfirm(false)}/><Button label="Confirm delete" busy={busy} onPress={()=>void remove()} style={{backgroundColor:c.error}}/></View></View></Modal>
  </Page>;
}
