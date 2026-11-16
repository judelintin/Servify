import { ProfessionalMediaPanel } from '../../beta/professional-media';
import { ReputationSection } from '../marketplace/reviews';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { professionalStore, useProfessional } from '../../data/professional-store';
import { selectPhotos } from '../../data/photos';
import { removePhoto } from '../../data/photo-files';
import { completeness, nextProfessionalStep, requiredProfessionalComplete } from '../../domain/professional';
import { colors as c } from '../../theme/tokens';
import { Badge, Button, EmptyState, Page, Type } from '../../ui/primitives';
import { PortfolioGallery, ProfileCompleteness, ProfessionalAvatar, ProfessionalStorageNotice, ProfessionalSummary, VerificationNote } from './components';
import { photoReferences } from './use-editor';

export function ProfessionalProfileScreen(){const snapshot=useProfessional(),router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('');const profile=snapshot.profile;
  const edit=(step:number)=>router.push({pathname:'/professional-setup',params:{step:String(step)}});
  async function changePhoto(remove=false){if(!profile)return;setBusy(true);setError('');try{const selection=remove?null:(await selectPhotos(1,'professional'))[0];if(!remove&&!selection)return;const previous=profile.content.photo,content={...profile.content,photo:selection??null};const result=await professionalStore.save(content,profile.lastStep,profile.revision,profile.reviewed&&requiredProfessionalComplete(content));if(result.saved&&previous&&!photoReferences(result.profile.content).has(previous.id))await removePhoto(previous.id,'professional').catch(()=>{});}catch(e){setError(`${e instanceof Error?e.message:'Photo access is unavailable.'} Your existing saved data is preserved; try again or continue without a photo.`);}finally{setBusy(false);}}
  if(!snapshot.ready)return <Page title="Professional profile"><Type>Restoring your local profile…</Type></Page>;
  if(!profile)return <Page title="Professional profile"><View style={{paddingTop:20,gap:20}}><Badge>LOCAL PROFILE</Badge><EmptyState icon="user" title="Your skills deserve an introduction." description="Tell your story, choose your services and add real work samples. Nothing will be published or verified in this preview." action="Create your profile" onAction={()=>edit(0)}/><VerificationNote/><ReputationSection sharedOnly/><Button label="Switch your mode" variant="ghost" onPress={()=>router.push('/switch-mode')}/><Button label="Account & sign out" variant="ghost" onPress={()=>router.push('/beta')}/><ProfessionalStorageNotice/></View></Page>;
  const progress=completeness(profile.content),finished=profile.reviewed&&progress.requiredComplete;
  return <Page title="Professional profile" right={<Badge>LOCAL ONLY</Badge>}><View style={{gap:22,paddingTop:18}}>
    <View style={{padding:22,borderRadius:18,borderWidth:1,borderColor:c.line,backgroundColor:c.white,gap:14}}><ProfessionalAvatar photo={profile.content.photo} name={profile.content.name} size={96}/><View><Type variant="heading" accessibilityRole="header">{profile.content.name.trim()||'Your professional profile'}</Type>{profile.content.type==='business'&&!!profile.content.businessName.trim()&&<Type color={c.muted} style={{marginTop:5}}>{profile.content.businessName}</Type>}<Type variant="caption" color={c.blue} style={{marginTop:10}}>{finished?'Required details complete · not verified':'Your introduction is taking shape'}</Type></View><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Button label={profile.content.photo?'Replace profile photo':'Add profile photo'} icon="image" variant="secondary" busy={busy} onPress={()=>void changePhoto()}/>{profile.content.photo&&<Button label="Remove profile photo" variant="ghost" disabled={busy} onPress={()=>void changePhoto(true)}/>}</View>{!!error&&<Type accessibilityRole="alert" color={c.error}>{error}</Type>}<Button label={finished?'Edit profile':'Continue your profile'} icon="edit-2" disabled={busy} onPress={()=>edit(finished?0:nextProfessionalStep(profile.content))}/></View>
    <Type variant="caption" color={c.muted}>{snapshot.storage==='session'?'This profile is kept in this session only and may not survive restarting.':'This profile is stored only on this device.'} It is not publicly searchable, visible to customers or synced with the website.</Type>
    <ProfessionalSummary content={profile.content} onEdit={edit}/>
    <View><View style={{flexDirection:'row',alignItems:'center',gap:12,marginBottom:16}}><Type variant="section" style={{flex:1}}>Work samples</Type><Button label="Manage portfolio" variant="ghost" onPress={()=>edit(4)}/></View>{profile.content.portfolio.length?<PortfolioGallery content={profile.content}/>:<EmptyState compact icon="image" title="Let your work tell the story." description="Add examples you completed and have permission to share. Work samples are optional." action="Add work samples" onAction={()=>edit(4)}/>}</View>
    <ProfessionalMediaPanel/><ReputationSection/><ProfileCompleteness content={profile.content} onEdit={edit}/><VerificationNote/><Button label="Switch your mode" variant="secondary" icon="repeat" onPress={()=>router.push('/switch-mode')}/><Button label="Account & sign out" variant="ghost" onPress={()=>router.push('/beta')}/><ProfessionalStorageNotice/>
  </View></Page>;
}
