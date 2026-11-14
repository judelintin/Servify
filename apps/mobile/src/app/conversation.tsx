import {useLocalSearchParams} from 'expo-router';
import {BetaConversation} from '../beta/chat-screen';
import {Conversation} from '../features/marketplace/lifecycle';
export default function ConversationRoute(){const {id,source}=useLocalSearchParams<{id:string;source?:string}>();return source==='beta'?<BetaConversation job={id}/>:<Conversation/>;}
