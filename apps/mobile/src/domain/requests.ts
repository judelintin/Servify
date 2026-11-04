import { isCategory } from './catalog';

/** Provisional Ibadan catalogue, aligned with web; not confirmed launch coverage. */
export const areas = [ ['bodija','Bodija'], ['akobo','Akobo'], ['oluyole','Oluyole'], ['iyaganku','Iyaganku'], ['jericho','Jericho'], ['challenge','Challenge'], ['ring-road','Ring Road'], ['apete','Apete'], ['other-ibadan','Another area in Ibadan'] ] as const;
export interface Photo { id: string; alt: string }
export interface Content { category: string; title: string; description: string; photos: Photo[]; area: string; timing: ''|'soon'|'days'|'flexible'|'date'; preferredDate: string; budgetMode: ''|'quotes'|'range'; budgetMin: string; budgetMax: string }
export interface RequestDraft { id: string; revision: number; createdAt: string; updatedAt: string; status: 'draft'; lastStep: number; reviewed: boolean; content: Content }
export const emptyContent = (): Content => ({ category:'', title:'', description:'', photos:[], area:'', timing:'', preferredDate:'', budgetMode:'', budgetMin:'', budgetMax:'' });
export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
export const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function amount(value: string) { if (!/^\d{1,9}(\.\d{1,2})?$/.test(value.trim())) return null; const [whole='0',fraction=''] = value.trim().split('.'); const n=Number(whole)*100+Number(fraction.padEnd(2,'0')); return n>0&&n<=10_000_000_000?n:null; }
export type Errors = Partial<Record<keyof Content,string>>;
export function validate(content: Content, step: number): Errors {
  const e: Errors={};
  if(step===0&&!isCategory(content.category)) e.category='Choose a service category to continue.';
  if(step===1) { if(content.title.trim().length<10||content.title.length>120)e.title='Use a clear title between 10 and 120 characters.'; if(content.description.trim().length<30||content.description.length>5000)e.description='Describe the work in 30 to 5,000 characters.'; }
  if(step===2&&content.photos.length>8)e.photos='Keep up to 8 photos.';
  if(step===3&&!areas.some(([id])=>id===content.area))e.area='Choose a general area in Ibadan.';
  if(step===4){ if(!content.timing)e.timing='Choose your preferred timing.'; if(content.timing==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(content.preferredDate)||!Number.isFinite(Date.parse(content.preferredDate))||new Date(`${content.preferredDate}T12:00:00Z`).toISOString().slice(0,10)!==content.preferredDate||content.preferredDate<today()))e.preferredDate='Choose today or a future date.'; }
  if(step===5){ if(!content.budgetMode)e.budgetMode='Choose a budget range or request quotes.'; if(content.budgetMode==='range'){const min=amount(content.budgetMin),max=amount(content.budgetMax);if(min===null)e.budgetMin='Enter a positive NGN amount up to 100,000,000 (up to 2 decimals).';if(max===null)e.budgetMax='Enter a positive NGN amount up to 100,000,000 (up to 2 decimals).';if(min!==null&&max!==null&&max<min)e.budgetMax='Maximum must be at least the minimum.';} }
  return e;
}
export const firstIncomplete = (c: Content) => [0,1,2,3,4,5].find(s=>Object.keys(validate(c,s)).length)??6;
export const areaLabel = (id:string) => areas.find(a=>a[0]===id)?.[1]??'Not selected';
export const timingLabel = (c:Content) => ({soon:'As soon as practical',days:'Within the next few days',flexible:'Flexible timing',date:c.preferredDate||'Choose a date','':'Not selected'})[c.timing];
export function budgetLabel(c:Content){if(c.budgetMode==='quotes')return 'I need quotes';const min=amount(c.budgetMin),max=amount(c.budgetMax);const f=(n:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:2}).format(n/100);return min!==null&&max!==null&&max>=min?`${f(min)} – ${f(max)}`:'Not specified';}
export function parseRequests(raw:string):RequestDraft[]{
  if(raw.length>1_000_000)throw Error('Saved drafts are too large.');
  const p=JSON.parse(raw);if(p.schemaVersion!==1||!Array.isArray(p.drafts)||p.drafts.length>50)throw Error('Unsupported draft data.');
  const ids=new Set<string>();
  for(const d of p.drafts){const c=d?.content;if(!d||typeof d.id!=='string'||!/^[a-z0-9-]{8,80}$/.test(d.id)||ids.has(d.id)||!Number.isInteger(d.revision)||d.revision<1||d.status!=='draft'||!Number.isInteger(d.lastStep)||d.lastStep<0||d.lastStep>6||typeof d.reviewed!=='boolean'||[d.createdAt,d.updatedAt].some(t=>typeof t!=='string'||!Number.isFinite(Date.parse(t)))||!c)throw Error('Invalid draft.');
    for(const [key,max] of [['category',80],['title',120],['description',5000],['area',80],['preferredDate',10],['budgetMin',32],['budgetMax',32]] as const)if(typeof c[key]!=='string'||c[key].length>max)throw Error('Invalid draft field.');
    if(!['','soon','days','date','flexible'].includes(c.timing)||!['','range','quotes'].includes(c.budgetMode)||!Array.isArray(c.photos)||c.photos.length>8||c.photos.some((p:Photo)=>!p||typeof p.id!=='string'||!/^[a-z0-9-]{8,80}$/.test(p.id)||typeof p.alt!=='string'||p.alt.length>300)||new Set(c.photos.map((p:Photo)=>p.id)).size!==c.photos.length)throw Error('Invalid draft content.');ids.add(d.id);
  }
  return p.drafts;
}
