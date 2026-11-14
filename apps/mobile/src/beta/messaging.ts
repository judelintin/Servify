import {betaClient} from './client';
import {parseMessage,uuid,type ConversationInfo,type ConversationSummary} from './messaging-model';
async function bounded<T>(work:(signal:AbortSignal)=>PromiseLike<T>,parent?:AbortSignal):Promise<T>{const controller=new AbortController();const stop=()=>controller.abort();if(parent?.aborted)stop();parent?.addEventListener('abort',stop,{once:true});const timer=setTimeout(stop,20000);try{return await work(controller.signal);}finally{clearTimeout(timer);parent?.removeEventListener('abort',stop);}}
export const chatClient=()=>{if(!betaClient)throw Error('Beta connection unavailable.');return betaClient;};
export async function conversationInfo(job:string,signal?:AbortSignal){if(!uuid(job))throw Error('Conversation unavailable.');let query=chatClient().rpc('beta_conversation',{p_job:job});const {data,error}=await bounded(s=>query.abortSignal(s),signal);if(error||!data?.length)throw Error('Conversation unavailable. Only the selected job participants can open it.');return data[0] as ConversationInfo;}
export async function conversationList(before?:ConversationSummary){const {data,error}=await bounded(s=>chatClient().rpc('beta_conversations',{p_before:before?.created_at??null,p_before_id:before?.job_id??null}).abortSignal(s));if(error)throw Error('Conversations could not be loaded. Check your connection and beta session.');return data as ConversationSummary[];}
export async function messagePage(job:string,options:{before?:number;after?:number;signal?:AbortSignal}={}){
 if(!uuid(job))throw Error('Conversation unavailable.');
 let query=chatClient().from('messages').select('id,job_id,sender_id,client_id,body,created_at,sequence').eq('job_id',job).order('sequence',{ascending:options.after!==undefined}).limit(50);
 if(options.before!==undefined)query=query.lt('sequence',options.before);if(options.after!==undefined)query=query.gt('sequence',options.after);if(options.signal)query=query.abortSignal(options.signal);
 const {data,error}=await bounded(s=>query.abortSignal(s),options.signal);if(error)throw Error('Message history could not be loaded. Reconnect to retry.');const messages=(data as unknown[]).map(parseMessage);return options.after===undefined?messages.reverse():messages;
}
export async function sendSharedMessage(user:string,job:string,clientId:string,body:string,signal?:AbortSignal){
 const {data:session}=await chatClient().auth.getSession();if(session.session?.user.id!==user)throw Error('Account changed. Sign in again before sending.');
 let query=chatClient().rpc('beta_send_message',{p_job:job,p_client:clientId,p_body:body});if(signal)query=query.abortSignal(signal);
 const {data,error}=await bounded(s=>query.abortSignal(s),signal);if(error||!data?.length)throw Error('Message not confirmed. Check your connection and retry this message; the same ID prevents duplicates.');return parseMessage(data[0]);
}
