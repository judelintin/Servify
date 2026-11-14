import {betaClient} from './client';
import {sessionStorage} from './session-storage';
import {parseOutbox,type PendingMessage,uuid} from './messaging-model';
let queue:Promise<unknown>=Promise.resolve();
const serial=<T,>(work:()=>Promise<T>)=>{const next=queue.then(work);queue=next.catch(()=>{});return next;};
const index=(user:string)=>'chat-index.'+user;
const key=(user:string,job:string)=>'chat-outbox.'+user+'.'+job;
function check(user:string,job?:string){if(!uuid(user)||(job!==undefined&&!uuid(job)))throw Error('Invalid conversation identity.');}
export async function loadOutbox(user:string,job:string){check(user,job);await queue;const session=await betaClient?.auth.getSession();if(session?.data.session?.user.id!==user)throw Error("Account changed. This private queue is unavailable.");return parseOutbox(await sessionStorage.getItem(key(user,job)));}
export function saveOutbox(user:string,job:string,pending:PendingMessage[]){check(user,job);
 return serial(async()=>{const session=await betaClient?.auth.getSession();if(session?.data.session?.user.id!==user)throw Error('Account changed. The message was not queued.');
 const raw=await sessionStorage.getItem(index(user)),jobs:unknown=raw===null?[]:JSON.parse(raw);
 if(!Array.isArray(jobs)||jobs.some(j=>!uuid(j))||jobs.length>50)throw Error('Private queue index is unreadable; it is preserved.');
 if(pending.length>8)throw Error('Retry your queued messages before sending more.');
 if(pending.length){if(!jobs.includes(job)){if(jobs.length>=50)throw Error('Too many pending conversations.');await sessionStorage.setItem(index(user),JSON.stringify([...jobs,job]));}await sessionStorage.setItem(key(user,job),JSON.stringify(pending));}
 else{await sessionStorage.removeItem(key(user,job));await sessionStorage.setItem(index(user),JSON.stringify(jobs.filter(j=>j!==job)));}
 });
}
export function clearChatOutbox(user:string){check(user);return serial(async()=>{const raw=await sessionStorage.getItem(index(user));if(raw===null)return;const jobs:unknown=JSON.parse(raw);
 if(!Array.isArray(jobs)||jobs.length>50||jobs.some(j=>!uuid(j)))throw Error('Private queue index unreadable; no other data was removed.');
 for(const job of jobs)await sessionStorage.removeItem(key(user,job));await sessionStorage.removeItem(index(user));});}
