export type ServerMessage={id:string;job_id:string;sender_id:string;client_id:string;body:string;created_at:string;sequence:number};
export type PendingMessage={clientId:string;body:string;state:'sending'|'failed'};
export type ConversationInfo={job_id:string;title:string;status:string;customer_id:string;professional_id:string;created_at:string};
export type ConversationSummary=ConversationInfo&{last_body:string|null;last_at:string|null;last_sender:string|null};
export const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
export function parseMessage(value:unknown):ServerMessage{const m=value as ServerMessage;
 if(!m||![m.id,m.job_id,m.sender_id,m.client_id].every(uuid)||typeof m.body!=='string'||!m.body.trim()||m.body.length>4000||!Number.isFinite(Date.parse(m.created_at))||!Number.isSafeInteger(Number(m.sequence))||Number(m.sequence)<1)throw Error('The server message could not be read. Reconnect to reload history.');
 return {...m,sequence:Number(m.sequence)};
}
export function mergeMessages(current:ServerMessage[],incoming:ServerMessage[]){const byId=new Map(current.map(m=>[m.id,m]));for(const m of incoming)byId.set(m.id,m);return [...byId.values()].sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id));}
export function outstanding(pending:PendingMessage[],messages:ServerMessage[],user:string){return pending.filter(p=>!messages.some(m=>m.sender_id===user&&m.client_id===p.clientId));}
export function parseOutbox(raw:string|null):PendingMessage[]{if(raw===null)return[];const values=JSON.parse(raw) as PendingMessage[];
 if(!Array.isArray(values)||values.length>8||values.some(p=>!p||!uuid(p.clientId)||typeof p.body!=='string'||!p.body.trim()||p.body.length>2000)||new Set(values.map(p=>p.clientId)).size!==values.length)throw Error('The private message queue could not be read. It has been preserved.');
 return values.map(p=>({clientId:p.clientId,body:p.body,state:'failed'}));
}
