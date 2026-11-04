import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { professionalStore } from '../../data/professional-store';
import { cleanPhotos, removePhoto } from '../../data/photo-files';
import { selectPhotos } from '../../data/photos';
import { emptyProfessional, requiredProfessionalComplete, type ProfessionalContent, type ProfessionalProfile } from '../../domain/professional';
import { newId } from '../../domain/requests';

export function photoReferences(c:ProfessionalContent){return new Set([...(c.photo?[c.photo.id]:[]),...c.portfolio.flatMap(p=>p.photo?[p.photo.id]:[])]);}
export function useProfessionalEditor(initial:ProfessionalProfile|null,atStep?:number){
  const [content,setContent]=useState(initial?.content??emptyProfessional()),[step,setStep]=useState(atStep??initial?.lastStep??0),[dirty,setDirty]=useState(false),[photoBusy,setPhotoBusy]=useState(false),[notice,setNotice]=useState('');
  const model=useRef({content,step,revision:initial?.revision??0,reviewed:initial?.reviewed??false}),changed=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),queue=useRef(Promise.resolve(true)),alive=useRef(true);
  function save(finish=false){clearTimeout(timer.current);if(!changed.current&&!finish)return queue.current;changed.current=false;const captured={content:model.current.content,step:model.current.step};queue.current=queue.current.then(async()=>{try{const reviewed=(finish||model.current.reviewed)&&requiredProfessionalComplete(captured.content);const result=await professionalStore.save(captured.content,captured.step,model.current.revision,reviewed);model.current.revision=result.profile.revision;model.current.reviewed=reviewed;if(alive.current){setDirty(changed.current);setNotice('');}if(result.saved)void cleanPhotos(photoReferences(result.profile.content),'professional').catch(()=>{});return result.saved;}catch(e){changed.current=true;if(alive.current){setDirty(true);setNotice(e instanceof Error?e.message:'Your changes could not be saved. Keep this screen open and try again.');}return false;}});return queue.current;}
  function update(patch:Partial<ProfessionalContent>){model.current.content={...model.current.content,...patch};setContent(model.current.content);changed.current=true;setDirty(true);clearTimeout(timer.current);timer.current=setTimeout(()=>{void save();},350);}
  function move(next:number){model.current.step=next;setStep(next);changed.current=true;void save();}
  async function retire(ids:string[],persisted:boolean){if(!persisted)return;const current=professionalStore.getSnapshot().profile;if(!current)return;const live=photoReferences(current.content);await Promise.all(ids.filter(id=>!live.has(id)).map(id=>removePhoto(id,'professional').catch(()=>{})));}
  async function photo(kind:'avatar'|'portfolio',entryId?:string){setPhotoBusy(true);setNotice('');try{const current=model.current.content;const photos=await selectPhotos(kind==='portfolio'&&!entryId?8-current.portfolio.length:1,'professional');if(!photos.length)return null;
      let firstEntry:string|null=null;const retired:string[]=[];
      if(kind==='avatar'){if(current.photo)retired.push(current.photo.id);update({photo:photos[0]!});}
      else if(entryId){update({portfolio:current.portfolio.map(p=>{if(p.id!==entryId)return p;if(p.photo)retired.push(p.photo.id);return{...p,photo:photos[0]!};})});}
      else{const entries=photos.map(photo=>({id:newId(),title:'',description:'',category:current.categories.length===1?current.categories[0]!:'',photo}));firstEntry=entries[0]?.id??null;update({portfolio:[...current.portfolio,...entries]});}
      await retire(retired,await save());return firstEntry;
    }catch(e){setNotice(`${e instanceof Error?e.message:'Photo access is unavailable.'} You can continue without images, or try selecting again.`);return null;}finally{setPhotoBusy(false);}}
  async function removeAvatar(){const old=model.current.content.photo;update({photo:null});await retire(old?[old.id]:[],await save());}
  async function removeProjectPhoto(id:string){const old=model.current.content.portfolio.find(p=>p.id===id);update({portfolio:model.current.content.portfolio.map(p=>p.id===id?{...p,photo:null}:p)});await retire(old?.photo?[old.photo.id]:[],await save());}
  async function removeProject(id:string){const old=model.current.content.portfolio.find(p=>p.id===id);update({portfolio:model.current.content.portfolio.filter(p=>p.id!==id)});await retire(old?.photo?[old.photo.id]:[],await save());}
  const saveRef=useRef(save);useEffect(()=>{saveRef.current=save;});
  useEffect(()=>{alive.current=true;const listener=AppState.addEventListener('change',state=>{if(state!=='active')void saveRef.current();});return()=>{alive.current=false;listener.remove();clearTimeout(timer.current);void saveRef.current();};},[]);
  return{content,step,dirty,photoBusy,notice,setNotice,save,update,move,photo,removeAvatar,removeProject,removeProjectPhoto,hasUnsavedError:()=>changed.current};
}
