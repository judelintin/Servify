/** Copy-on-write SecureStore chunks. Never touches prototype/business storage. */
export interface SecurePort { getItemAsync(key:string):Promise<string|null>; setItemAsync(key:string,value:string):Promise<void>; deleteItemAsync(key:string):Promise<void> }
type Manifest={generation:string;count:number};
export function createSessionStorage(port:SecurePort){
 let queue=Promise.resolve();
 const prefix=(key:string)=>'servify.beta.'+key.replace(/[^a-zA-Z0-9._-]/g,'_');
 async function manifest(key:string):Promise<Manifest|null>{const raw=await port.getItemAsync(key);if(raw===null)return null;const m=JSON.parse(raw) as Manifest;if(!/^[a-z0-9-]+$/.test(m.generation)||!Number.isInteger(m.count)||m.count<1||m.count>128)throw Error('Stored beta session is unreadable.');return m;}
 const chunk=(key:string,m:Manifest,i:number)=>`${key}.${m.generation}.${i}`;
 function change(work:()=>Promise<void>){const next=queue.then(work);queue=next.catch(()=>{});return next;}
 return {
  async getItem(key:string){await queue;const p=prefix(key),m=await manifest(p);if(!m)return null;const parts=await Promise.all(Array.from({length:m.count},(_,i)=>port.getItemAsync(chunk(p,m,i))));if(parts.some(p=>p===null))throw Error('Stored beta session is incomplete.');return parts.join('');},
  setItem(key:string,value:string){return change(async()=>{if(value.length>64000)throw Error('Beta session exceeds secure storage limit.');const p=prefix(key),old=await manifest(p),m={generation:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),count:Math.max(1,Math.ceil(value.length/500))};let committed=false;try{for(let i=0;i<m.count;i++)await port.setItemAsync(chunk(p,m,i),value.slice(i*500,(i+1)*500));await port.setItemAsync(p,JSON.stringify(m));committed=true;}finally{if(!committed)await Promise.all(Array.from({length:m.count},(_,i)=>port.deleteItemAsync(chunk(p,m,i)).catch(()=>{})));}if(old)await Promise.all(Array.from({length:old.count},(_,i)=>port.deleteItemAsync(chunk(p,old,i)).catch(()=>{})));});},
  removeItem(key:string){return change(async()=>{const p=prefix(key),m=await manifest(p);await port.deleteItemAsync(p);if(m)await Promise.all(Array.from({length:m.count},(_,i)=>port.deleteItemAsync(chunk(p,m,i)).catch(()=>{})));});}
 };
}
