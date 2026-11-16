import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Image,View,type DimensionValue} from 'react-native';
import type {Photo} from '../domain/requests';
import type {PhotoNamespace} from '../data/photo-files';
import {useBetaAccount} from './account';
import {deleteSharedImage,readSharedImages,signImage,uploadSharedPhoto,type SharedImage,type UploadStatus,type UploadTarget} from './media';
import {Badge,Button,Type} from '../ui/primitives';
import {Confirm} from '../features/marketplace/components';
import {colors as c} from '../theme/tokens';

export function SharedGallery({requestId,ownerId,refresh=0}:{requestId?:string;ownerId?:string;refresh?:number}){
 const account=useBetaAccount();return account.user?<GalleryBody key={account.user.id} user={account.user.id} requestId={requestId} ownerId={ownerId} refresh={refresh}/>:null;
}
function GalleryBody({user,requestId,ownerId,refresh}:{user:string;requestId?:string;ownerId?:string;refresh:number}){
 const [images,setImages]=useState<SharedImage[]>([]),[error,setError]=useState(''),[remove,setRemove]=useState<SharedImage|null>(null),[busy,setBusy]=useState(false),[tick,setTick]=useState(0);
 useEffect(()=>{let live=true;void readSharedImages({requestId,ownerId}).then(next=>{if(live){setImages(next);setError('');}},e=>{if(live)setError(e.message);});return()=>{live=false;};},[requestId,ownerId,refresh,tick]);
 return <View style={{gap:12}}>{!!images.length&&<Type variant="caption" color={c.muted}>Private shared photos · visible only to authorized accounts</Type>}
 {images.map(image=><View key={image.id} style={{gap:8}}>{image.state==='ready'?<SharedPhoto image={image}/>:<Type variant="caption">Photo upload pending · retry the original upload or remove this reservation.</Type>}
 {image.owner_id===user&&<Button label={image.state==='pending'?'Cancel pending shared photo':'Remove shared photo'} variant="ghost" disabled={busy} onPress={()=>setRemove(image)}/>}</View>)}
 {!!error&&<><Type accessibilityRole="alert">{error}</Type><Button label="Retry shared photos" variant="secondary" onPress={()=>setTick(n=>n+1)}/></>}
 <Confirm visible={!!remove} title="Remove this shared photo?" action="Remove shared copy" busy={busy} onCancel={()=>setRemove(null)} onConfirm={()=>{if(!remove||busy)return;setBusy(true);void deleteSharedImage(user,remove).then(()=>{setRemove(null);setTick(n=>n+1);},e=>setError(e.message)).finally(()=>setBusy(false));}}><Type>Only the uploaded copy will be removed. Your saved local photograph and records remain intact.</Type>{!!error&&<Type accessibilityRole="alert">{error}</Type>}</Confirm>
 </View>;
}
function SharedPhoto({image}:{image:SharedImage}){
 const [value,setValue]=useState<{url:string}|null>(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let live=true;let timer:ReturnType<typeof setTimeout>|undefined;
  const load=()=>{void signImage(image).then(url=>{if(live){setFailed(false);setValue({url});timer=setTimeout(()=>{if(live)setValue(null);},55000);}},()=>{if(live){setFailed(true);setValue(null);}});};
  load();const foreground=AppState.addEventListener('change',state=>{if(state==='active')setAttempt(n=>n+1);});
  return()=>{live=false;clearTimeout(timer);foreground.remove();};
 },[image,attempt]);
 return <View style={{gap:8}}><View style={{width:"100%",aspectRatio:1.5,borderRadius:12,backgroundColor:c.neutral,alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{value?<Image source={{uri:value.url}} accessibilityLabel={image.alt_text} accessible resizeMode="cover" onError={()=>{setFailed(true);setValue(null);}} style={{width:'100%',height:'100%'}}/>:<Type variant="caption">{failed?'Photo unavailable.':'Private image link expired or loading.'}</Type>}</View>
 {<Button label={value?"Refresh shared photo":"Load shared photo"} variant="secondary" onPress={()=>setAttempt(n=>n+1)}/>}</View>;
}
export function ShareLocalPhoto({photo,namespace,target,label,onDone}:{photo:Photo;namespace:PhotoNamespace;target:UploadTarget;label:string;onDone?:()=>void}){
 const account=useBetaAccount();return account.user?<UploadBody key={account.user.id+photo.id} user={account.user.id} photo={photo} namespace={namespace} target={target} label={label} onDone={onDone}/>:null;
}
function UploadBody({user,photo,namespace,target,label,onDone}:{user:string;photo:Photo;namespace:PhotoNamespace;target:UploadTarget;label:string;onDone?:()=>void}){
 const [confirm,setConfirm]=useState(false),[status,setStatus]=useState<UploadStatus|null>(null),[busy,setBusy]=useState(false);
 const controller=useRef<AbortController|null>(null),lock=useRef(false);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const upload=useCallback(async()=>{if(lock.current)return;lock.current=true;setBusy(true);setConfirm(false);controller.current=new AbortController();
 try{await uploadSharedPhoto(user,photo,namespace,target,setStatus,controller.current.signal);onDone?.();}
 catch(e){if(!controller.current.signal.aborted)setStatus({phase:'failed',percent:0,message:e instanceof Error?e.message:'Upload failed. Retry when connected.'});}
 finally{lock.current=false;setBusy(false);}
 },[user,photo,namespace,target,onDone]);
 return <View style={{gap:8}}><Button label={busy?'Sharing photo…':status?.phase==='failed'?'Retry '+label:label} variant="secondary" disabled={busy} onPress={()=>setConfirm(true)}/>
 {!!status&&<View accessibilityLiveRegion="polite" style={{gap:6}}><Badge>{status.phase==='success'?'SHARED':status.phase==='failed'?'UPLOAD FAILED':status.phase.toUpperCase()}</Badge><Type variant="caption" accessibilityRole={status.phase==='failed'?'alert':undefined}>{status.message}</Type>{status.phase==='uploading'&&<View accessibilityRole="progressbar" accessibilityLabel="Photo upload" accessibilityValue={{min:0,max:100,now:status.percent}} style={{height:4,backgroundColor:c.line,borderRadius:2}}><View style={{height:4,width:(status.percent+'%') as DimensionValue,backgroundColor:c.blue,borderRadius:2}}/></View>}</View>}
 <Confirm visible={confirm} title="Share a copy of this photograph?" action="Upload shared photo" busy={busy} onCancel={()=>setConfirm(false)} onConfirm={()=>void upload()}><Type>This uploads one copy to your signed-in account. Your original stays on this device. Authorized job participants or customers comparing your offer can view it. Do not upload faces, identity documents, exact addresses or confidential details. Automatic content inspection is not available.</Type></Confirm></View>;
}
