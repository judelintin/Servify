import AsyncStorage from '@react-native-async-storage/async-storage';
import {betaClient} from './client';
import {commandId} from './commands';
import {photoUri,type PhotoNamespace} from '../data/photo-files';
import type {Photo} from '../domain/requests';
export type MediaBucket='job-photos'|'profile-photos'|'portfolio-images';
export type SharedImage={id:string;owner_id:string;bucket:MediaBucket;object_path:string;request_id:string|null;portfolio_id:string|null;alt_text:string;state:'pending'|'ready';created_at:string};
export type UploadStatus={phase:'pending'|'uploading'|'confirming'|'success'|'failed';percent:number;message:string};
export type UploadTarget={bucket:MediaBucket;requestId?:string;title?:string;description?:string;category?:string};
const keys=new Map<string,Promise<string>>();
const c=()=>{if(!betaClient)throw Error('Beta connection unavailable.');return betaClient;};
async function identity(user:string){const {data,error}=await c().auth.getSession();if(error||data.session?.user.id!==user)throw Error('Account changed. Sign in again before uploading.');return data.session;}
async function uploadId(key:string){let pending=keys.get(key);if(!pending){pending=(async()=>{const saved=await AsyncStorage.getItem(key);if(saved)return saved;const id=commandId();await AsyncStorage.setItem(key,id);return id;})();keys.set(key,pending);pending.catch(()=>keys.delete(key));}return pending;}
function checkAborted(signal?:AbortSignal){if(signal?.aborted)throw Error('Upload paused. Your local photograph is preserved.');}
/** Real bytes-sent progress on native and web. Never sends an administrative key. */
export function sendImage(url:string,key:string,token:string,body:ArrayBuffer,type:string,onProgress:(percent:number)=>void,signal?:AbortSignal){
 return new Promise<void>((resolve,reject)=>{
  checkAborted(signal);const xhr=new XMLHttpRequest();let settled=false;
  const finish=(error?:Error)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',abort);if(error)reject(error);else resolve();};
  const abort=()=>{xhr.abort();finish(Error('Upload paused. Retry when ready.'));};
  xhr.open('POST',url);xhr.timeout=60000;xhr.setRequestHeader('apikey',key);xhr.setRequestHeader('Authorization','Bearer '+token);xhr.setRequestHeader('Content-Type',type);xhr.setRequestHeader('cache-control','no-store');xhr.setRequestHeader('x-upsert','false');
  xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.min(99,Math.round(e.loaded/e.total*100)));};
  xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300){finish();return;}let duplicate=xhr.status===409;try{const response=JSON.parse(xhr.responseText);duplicate ||=response.error==='Duplicate'||response.statusCode==='409';}catch{}if(duplicate){finish();return;}finish(Error('Photo upload failed. Check your connection, size and session, then retry.'));};
  xhr.onerror=()=>finish(Error('Connection lost while uploading. Retry; your local photograph is safe.'));
  xhr.ontimeout=()=>finish(Error('Upload timed out. Reconnect and retry.'));
  xhr.onabort=()=>finish(Error('Upload paused. Retry when ready.'));
  signal?.addEventListener('abort',abort,{once:true});xhr.send(body);
 });
}
export async function uploadSharedPhoto(user:string,photo:Photo,namespace:PhotoNamespace,target:UploadTarget,onStatus:(s:UploadStatus)=>void,signal?:AbortSignal){
 const update=(phase:UploadStatus['phase'],percent:number,message:string)=>{checkAborted(signal);onStatus({phase,percent,message});};
 update('pending',0,'Preparing your saved photograph…');
 const uri=await photoUri(photo.id,namespace);checkAborted(signal);
 const response=await fetch(uri);const body=await response.arrayBuffer();checkAborted(signal);
 const bytes=new Uint8Array(body);
 // UX validation only. Storage does not guarantee decoded-image validity or EXIF removal.
 if(!body.byteLength||body.byteLength>1024*1024||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw Error('Use a saved JPEG under 1 MB. Replace the local image if it cannot be read.');
 await identity(user);
 const key=['servify.beta.media',user,target.bucket,target.requestId??'profile',photo.id].join('.');
 const id=await uploadId(key);checkAborted(signal);
 const {error}=await c().rpc('beta_reserve_media',{p_id:id,p_bucket:target.bucket,p_request:target.requestId??null,p_bytes:body.byteLength,p_type:'image/jpeg',p_alt:photo.alt,p_title:target.title?.trim()??'',p_description:target.description??'',p_category:target.category??''});
 if(error)throw Error('Photo could not be reserved. Check ownership, profile completion and the 8-photo limit, then retry.');
 checkAborted(signal);const session=await identity(user);
 update('uploading',0,'Uploading photograph…');
 const url=process.env.EXPO_PUBLIC_SUPABASE_URL!,publicKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
 await sendImage(url+'/storage/v1/object/'+target.bucket+'/'+user+'/'+id+'.jpg',publicKey,session.access_token,body,'image/jpeg',percent=>{if(!signal?.aborted)update('uploading',percent,'Uploading photograph…');},signal);
 checkAborted(signal);await identity(user);update('confirming',100,'Confirming shared photograph…');
 const completed=await c().rpc('beta_complete_media',{p_id:id});if(completed.error)throw Error('Upload needs confirmation. Retry to finish; no local photograph has been deleted.');
 update('success',100,'Shared securely with authorized accounts.');return id;
}
export async function readSharedImages(target:{requestId?:string;ownerId?:string}){
 let query=c().from('image_assets').select('id,owner_id,bucket,object_path,request_id,portfolio_id,alt_text,state,created_at').in('bucket',['job-photos','profile-photos','portfolio-images']).order('created_at',{ascending:false});
 if(target.requestId)query=query.eq('request_id',target.requestId);
 else if(target.ownerId)query=query.eq('owner_id',target.ownerId).in('bucket',['profile-photos','portfolio-images']);
 else throw Error('Choose a media resource.');
 const {data,error}=await query;if(error)throw Error('Shared photographs could not be loaded. Reconnect and retry.');return data as SharedImage[];
}
export async function signImage(image:SharedImage){
 const {data,error}=await c().storage.from(image.bucket).createSignedUrl(image.object_path,60);
 if(error||!data.signedUrl)throw Error('Photo unavailable or access expired. Retry to check permission.');return data.signedUrl;
}
export async function deleteSharedImage(user:string,image:SharedImage){
 await identity(user);if(image.owner_id!==user)throw Error('Only the owner can remove this shared photo.');
 const removed=await c().storage.from(image.bucket).remove([image.object_path]);if(removed.error)throw Error('Photo removal failed. Retry; local records are preserved.');
 await identity(user);const forgotten=await c().rpc('beta_forget_media',{p_id:image.id});if(forgotten.error)throw Error('Photo removed from Storage; retry to finish clearing its listing.');
 const prefix=['servify.beta.media',user,image.bucket,image.request_id??'profile',''].join('.');
 for(const key of await AsyncStorage.getAllKeys())if(key.startsWith(prefix)&&(await AsyncStorage.getItem(key))===image.id){await AsyncStorage.removeItem(key);keys.delete(key);}
}
