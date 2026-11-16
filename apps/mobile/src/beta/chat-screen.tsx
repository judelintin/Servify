import {BetaSessionNotice} from './workspace';
import {useRef,useState,type ComponentRef} from 'react';
import {ScrollView,TextInput} from 'react-native';
import {useRouter} from 'expo-router';
import {useBetaAccount} from './account';
import {useConversation} from './use-conversation';
import {Button,EmptyState,Page,Type} from '../ui/primitives';
import {JobChat,messageStamp,type ChatBubble} from '../ui/job-chat';
export function BetaConversation({job}:{job:string}){
 const account=useBetaAccount(),router=useRouter();
 if(account.status==='loading'||account.status==='error')return <BetaSessionNotice/>;
 if(!account.user)return <Page title="Job conversation" back><Type>Sign in to the authorized account to open this conversation. Local conversations are separate.</Type><Button label="Sign in" onPress={()=>router.push('/beta')}/></Page>;
 return <ConversationBody key={account.user.id+job} user={account.user.id} job={job}/>;
}
function ConversationBody({user,job}:{user:string;job:string}){
 const router=useRouter();
 const chat=useConversation(user,job),[text,setText]=useState(''),field=useRef<ComponentRef<typeof TextInput>>(null),scroll=useRef<ComponentRef<typeof ScrollView>>(null),nearBottom=useRef(true);
 if(chat.loading)return <Page title="Conversation" back><Type>Loading your private conversation…</Type><Button label="Reconnect conversation" variant="ghost" onPress={chat.reconnect}/></Page>;
 if(!chat.ready||!chat.info)return <Page title="Conversation" back><EmptyState title="Conversation unavailable." description={chat.error||'Only this job’s participants can open it.'}/><Button label="Reconnect conversation" onPress={chat.reconnect}/></Page>;
 const sender=(id:string)=>id===chat.info!.customer_id?'Customer':'Professional';
 const messages:ChatBubble[]=[...chat.messages.map(m=>({id:m.id,sender:sender(m.sender_id),text:m.body,mine:m.sender_id===user,stamp:messageStamp(m.created_at)+' · saved to server'})),...chat.pending.map(p=>({id:p.clientId,sender:sender(user),text:p.body,mine:true,stamp:p.state==='sending'?'Sending…':'Not confirmed · retry safely',state:p.state,retry:p.state==='failed'?()=>void chat.retry(p):undefined}))];
 return <JobChat title={chat.info.title} description={'Job conversation · '+chat.connection+'. Sent means saved to server, not read or delivered.'} messages={messages} text={text} onText={setText} onSend={()=>{if(!text.trim()){field.current?.focus();}void chat.send(text,()=>{setText('');nearBottom.current=true;});}} sendLabel="Send message" busy={chat.sending} disabled={!chat.ready} error={chat.error} field={field} scroll={scroll} nearBottom={nearBottom} emptyDescription="Only the authorized customer and selected professional can send here. No automatic replies or read receipts." header={<><Button label="Manage this shared job" variant="secondary" onPress={()=>router.push({pathname:'/job',params:{id:job,source:'beta'}})}/><Button label="Reconnect conversation" variant="ghost" onPress={chat.reconnect}/></>} onEarlier={chat.more?()=>void chat.earlier():undefined} loadingEarlier={chat.olderBusy}/>;
}
