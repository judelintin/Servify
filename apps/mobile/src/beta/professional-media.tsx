import {useState} from 'react';
import {View} from 'react-native';
import {useProfessional} from '../data/professional-store';
import {validateProject,type ProfessionalContent} from '../domain/professional';
import {useBetaAccount} from './account';
import {SharedGallery,ShareLocalPhoto} from './media-ui';
import {Badge,Type} from '../ui/primitives';
import {s} from '../features/marketplace/components';
export function ProfessionalMediaPanel(){
 const account=useBetaAccount(),{profile}=useProfessional();
 return account.user&&profile?<Panel key={account.user.id} owner={account.user.id} content={profile.content}/>:null;
}
function Panel({owner,content}:{owner:string;content:ProfessionalContent}){
 const [refresh,setRefresh]=useState(0),done=()=>setRefresh(n=>n+1);
 return <View style={s.card}><Badge>YOUR ACCOUNT MEDIA</Badge><Type variant="section">Share your work</Type><Type>Save your professional details to your account from Find Jobs first. Sharing a photograph is a separate choice; your local profile remains unchanged. Customers comparing your submitted offer can view these shared copies.</Type>
 {content.photo&&<ShareLocalPhoto photo={content.photo} namespace="professional" target={{bucket:'profile-photos'}} label="Share profile photo" onDone={done}/>}
 {content.portfolio.filter(entry=>entry.photo&&!Object.keys(validateProject(entry,content.categories)).length).map(entry=><View key={entry.id} style={{gap:8}}><Type>{entry.title}</Type><ShareLocalPhoto photo={entry.photo!} namespace="professional" target={{bucket:'portfolio-images',title:entry.title,description:entry.description,category:entry.category}} label={'Share work sample: '+entry.title} onDone={done}/></View>)}
 <SharedGallery ownerId={owner} refresh={refresh}/></View>;
}
