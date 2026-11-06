import type { StoragePort } from './store-core';
export const WELCOME_KEY='servify.mobile.welcome.v1';
const legacyKeys=['servify.mobile.preview.v1','servify.mobile.requests.v1','servify.mobile.professional.v1','servify.mobile.marketplace.v1','servify.mobile.discovery.v1'];
export type LaunchPhase='intro'|'role'|'workspace'|'recovery';
type Marker={schemaVersion:1;introduced:boolean;roleChosen:boolean};
type Snapshot={ready:boolean;phase:LaunchPhase;busy:boolean;message:string|null};
export function createWelcomeStore(storage:StoragePort&{getAllKeys?:()=>Promise<readonly string[]>},timeout=4000){
 const initial:Snapshot={ready:false,phase:'intro',busy:false,message:null};let state=initial,baseline:string|null=null,blocked=false,marker:Marker={schemaVersion:1,introduced:false,roleChosen:false},hydrating:Promise<void>|undefined;
 const listeners=new Set<()=>void>(),emit=(p:Partial<Snapshot>)=>{state={...state,...p};listeners.forEach(fn=>fn());};
 const bounded=<T,>(work:Promise<T>)=>new Promise<T>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Storage timed out.')),timeout);work.then(v=>{clearTimeout(timer);resolve(v);},e=>{clearTimeout(timer);reject(e);});});
 async function read(){try{const [raw,legacy,keys]=await Promise.all([bounded(storage.getItem(WELCOME_KEY)),Promise.all(legacyKeys.map(k=>bounded(storage.getItem(k)))),storage.getAllKeys?bounded(storage.getAllKeys()):Promise.resolve([])]);baseline=raw;blocked=false;if(raw!==null){const p=JSON.parse(raw);if(p?.schemaVersion!==1||typeof p.introduced!=='boolean'||typeof p.roleChosen!=='boolean'||p.roleChosen&&!p.introduced)throw Error('Unsupported welcome preference.');marker={schemaVersion:1,introduced:p.introduced,roleChosen:p.roleChosen};}else marker={schemaVersion:1,introduced:false,roleChosen:false};const returning=legacy.some(v=>v!==null)||keys.some(k=>k.startsWith('servify.mobile.')&&k!==WELCOME_KEY);emit({ready:true,phase:returning||marker.roleChosen?'workspace':marker.introduced?'role':'intro',message:null});}catch{blocked=true;emit({ready:true,phase:'recovery',message:'Saved preferences could not be checked. Existing records are untouched. Retry, view the introduction, or continue to your existing workspace for this session.'});}}
 function hydrate(){return hydrating??=read();}
 async function write(next:Marker){if(blocked)return false;try{const current=await bounded(storage.getItem(WELCOME_KEY));if(current!==baseline)throw Error('Preferences changed elsewhere.');const raw=JSON.stringify(next);await bounded(storage.setItem(WELCOME_KEY,raw));baseline=raw;marker=next;return true;}catch{blocked=true;emit({message:'This preference could not be saved. Your existing records are preserved. You can continue for this session; the introduction or role choice may appear again after restarting.'});return false;}}
 return {getSnapshot:()=>state,getServerSnapshot:()=>initial,subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};},hydrate,
  async introDone(){if(state.busy)return false;emit({busy:true});try{const saved=await write({...marker,introduced:true});emit({phase:'role'});return saved;}finally{emit({busy:false});}},
  async finish(roleSaved:boolean){if(state.busy)return false;emit({busy:true});try{if(!roleSaved){emit({message:'Your role is available in this session only. Continue without saving or try storage again before closing.'});return false;}const saved=await write({schemaVersion:1,introduced:true,roleChosen:true});if(saved)emit({phase:'workspace',message:null});return saved;}finally{emit({busy:false});}},
  continueSession(){emit({phase:'workspace'});},async retry(){if(state.busy)return;emit({busy:true});try{await read();}finally{emit({busy:false});}},
 };
}
