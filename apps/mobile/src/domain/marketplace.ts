import { createDelivery, parseDeliveries, type JobDelivery } from "./delivery";
import { amount, firstIncomplete, parseRequests, type RequestDraft, type Photo } from './requests';
import { parseProfessional, requiredProfessionalComplete, type ProfessionalProfile } from './professional';

export interface OfferContent { price: string; priceType: 'estimate'|'fixed'; scope: string; availability: string; conditions: string }
export type OfferStatus = 'draft'|'submitted'|'withdrawn'|'selected'|'unavailable';
export interface Opportunity { id: string; sourceId: string; sourceRevision: number; revision: number; publishedAt: string; status: 'preview_published'|'provider_selected'; selectedOfferId: string|null; request: RequestDraft }
export interface Offer { id: string; jobId: string; providerId: 'local-professional'; revision: number; status: OfferStatus; createdAt: string; updatedAt: string; submittedAt: string|null; content: OfferContent; professional: ProfessionalProfile }
export interface Marketplace { schemaVersion: 2; revision: number; jobs: Opportunity[]; offers: Offer[]; deliveries: JobDelivery[] }
export const emptyMarketplace = (): Marketplace => ({schemaVersion:2,revision:0,jobs:[],offers:[],deliveries:[]});
export const emptyOffer = (): OfferContent => ({price:'',priceType:'estimate',scope:'',availability:'',conditions:''});
export const offerLabels: Record<OfferStatus,string> = {draft:'Draft offer',submitted:'Pending · local preview',withdrawn:'Withdrawn',selected:'Selected · local preview',unavailable:'Not selected · unavailable'};
export const jobLabel = (job: Opportunity) => job.status==='provider_selected'?'Professional selected · preview':'Published · local preview';
export const currency = (value: string) => {const n=amount(value);return n===null?'Amount not set':new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:2}).format(n/100);};
export function validateOffer(c: OfferContent) {
  const e: Partial<Record<keyof OfferContent,string>> = {};
  if(amount(c.price)===null)e.price='Enter a positive NGN amount up to 100,000,000, with up to 2 decimals.';
  if(!['estimate','fixed'].includes(c.priceType))e.priceType='Choose an estimate or fixed price.';
  if(c.scope.trim().length<20||c.scope.length>3000)e.scope='Describe the work in 20 to 3,000 characters.';
  if(c.availability.trim().length<3||c.availability.length>200)e.availability='Add a timeframe in 3 to 200 characters.';
  if(c.conditions.length>1200)e.conditions='Keep optional notes within 1,200 characters.';
  return e;
}
export const eligibleProfessional=(p:ProfessionalProfile|null):p is ProfessionalProfile=>!!p&&p.reviewed&&requiredProfessionalComplete(p.content);
export const matches=(j:Opportunity,p:ProfessionalProfile|null)=>!!p&&p.content.categories.includes(j.request.content.category)&&p.content.areas.includes(j.request.content.area);
export interface Filters { search:string; category:string; area:string; timing:string; matching:boolean; sort:'recent'|'oldest'|'budget-low'|'budget-high' }
export const emptyFilters=():Filters=>({search:'',category:'',area:'',timing:'',matching:false,sort:'recent'});
export function discover(m:Marketplace,f:Filters,p:ProfessionalProfile|null){return m.jobs.filter(j=>{const c=j.request.content;return j.status==='preview_published'&&(!f.category||c.category===f.category)&&(!f.area||c.area===f.area)&&(!f.timing||c.timing===f.timing)&&(!f.matching||matches(j,p))&&`${c.title} ${c.description} ${c.category} ${c.area}`.toLowerCase().includes(f.search.trim().toLowerCase());}).sort((a,b)=>{
  if(f.sort==='oldest')return a.publishedAt.localeCompare(b.publishedAt);
  if(f.sort.startsWith('budget')){const value=(j:Opportunity)=>j.request.content.budgetMode==='range'?amount(j.request.content.budgetMin):null,x=value(a),y=value(b);if(x===null)return y===null?0:1;if(y===null)return -1;return f.sort==='budget-low'?x-y:y-x;}
  return b.publishedAt.localeCompare(a.publishedAt);
});}
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-z0-9-]{8,80}$/.test(v);
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const revision=(v:unknown)=>Number.isInteger(v)&&Number(v)>0;
const copy=<T,>(v:T):T=>JSON.parse(JSON.stringify(v));
export function parseMarketplace(raw:string):Marketplace {
  if(raw.length>5_000_000)throw Error('Marketplace records exceed this preview’s limit.');
  const m=JSON.parse(raw) as Marketplace;
  if(![1,2].includes(m?.schemaVersion)||!Number.isInteger(m.revision)||m.revision<0||!Array.isArray(m.jobs)||!Array.isArray(m.offers)||m.jobs.length>100||m.offers.length>500)throw Error('Unsupported marketplace records.');
  const jobs=m.jobs.map(j=>{
    if(!id(j?.id)||!id(j.sourceId)||!revision(j.sourceRevision)||!revision(j.revision)||!date(j.publishedAt)||!['preview_published','provider_selected'].includes(j.status)||(j.selectedOfferId!==null&&!id(j.selectedOfferId)))throw Error('Invalid preview request.');
    const request=parseRequests(JSON.stringify({schemaVersion:1,drafts:[j.request]}))[0]!;
    // A date can pass after publication; historical records must remain readable.
    if(request.id!==j.sourceId||request.revision!==j.sourceRevision||firstIncomplete({...request.content,timing:request.content.timing==='date'?'flexible':request.content.timing})!==6)throw Error('Incomplete published request.');
    return {...j,request:copy(request)};
  });
  const offers=m.offers.map(o=>{
    if(!id(o?.id)||!jobs.some(j=>j.id===o.jobId)||o.providerId!=='local-professional'||!revision(o.revision)||!date(o.createdAt)||!date(o.updatedAt)||!Object.keys(offerLabels).includes(o.status)||(o.submittedAt!==null&&!date(o.submittedAt)))throw Error('Invalid offer.');
    const c=o.content;
    if(!c||typeof c.price!=='string'||c.price.length>32||!['estimate','fixed'].includes(c.priceType)||typeof c.scope!=='string'||c.scope.length>3000||typeof c.availability!=='string'||c.availability.length>200||typeof c.conditions!=='string'||c.conditions.length>1200)throw Error('Invalid offer content.');
    if(o.status!=='draft'&&(Object.keys(validateOffer(c)).length||o.submittedAt===null))throw Error('Invalid submitted offer.');
    const professional=parseProfessional(JSON.stringify(o.professional));if(!eligibleProfessional(professional))throw Error('Incomplete professional snapshot.');
    return {...o,content:{price:c.price,priceType:c.priceType,scope:c.scope,availability:c.availability,conditions:c.conditions},professional};
  });
  if(new Set(jobs.map(j=>j.id)).size!==jobs.length||new Set(jobs.map(j=>j.sourceId)).size!==jobs.length||new Set(offers.map(o=>o.id)).size!==offers.length)throw Error('Duplicate marketplace identifiers.');
  const active=offers.filter(o=>['draft','submitted'].includes(o.status));if(new Set(active.map(o=>o.jobId+':'+o.providerId)).size!==active.length)throw Error('Duplicate active offer.');
  for(const j of jobs){const selected=offers.filter(o=>o.jobId===j.id&&o.status==='selected');if(j.status==='provider_selected'?(selected.length!==1||selected[0]?.id!==j.selectedOfferId||active.some(o=>o.jobId===j.id)):(j.selectedOfferId!==null||selected.length!==0))throw Error('Contradictory selection.');}
  const selections=jobs.filter(j=>j.selectedOfferId).map(j=>{const o=offers.find(o=>o.id===j.selectedOfferId)!;return {id:o.id,jobId:j.id,offerId:o.id,providerId:o.providerId,selectedAt:o.updatedAt};});
  const deliveries=parseDeliveries(Number(m.schemaVersion)===1?selections.map(createDelivery):m.deliveries,selections);if(!deliveries)throw Error("Invalid job lifecycle records.");
  return {schemaVersion:2,revision:m.revision,jobs,offers,deliveries};
}
export const photoCopies=(photos:Photo[])=>photos.map(p=>({...p}));
