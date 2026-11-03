import type { Marketplace } from "@/features/marketplace/model";
import { isDraftId } from "@/features/customer/draft-model";
export const assessmentLabels={requested:"Profile review requested",review:"Under preview review",information:"Additional information requested",complete:"Preview assessment complete"} as const;
export const caseLabels={new:"New",review:"Under review",information:"Awaiting information",followup:"Follow-up recorded",closed:"Closed"} as const;
export const outcomes=["Not assessed","Information requested","Follow-up documented","No further preview action"];
export interface Assessment {id:string;providerId:string;revision:number;requestedAt:string;status:keyof typeof assessmentLabels}
export interface Case {id:string;issueId:string;jobId:string;revision:number;status:keyof typeof caseLabels;outcome:string}
export interface Event {id:string;targetId:string;kind:"assessment"|"case";actor:"local-admin";at:string;from:string;to:string;note:string;outcome:string}
export interface Operations {assessments:Assessment[];cases:Case[];events:Event[]}
export const emptyOperations=():Operations=>({assessments:[],cases:[],events:[]});
export const issuesOf=(m:Marketplace)=>m.deliveries.flatMap(d=>d.issues.map(i=>({...i,jobId:d.jobId,providerId:d.providerId})));
export const stateOf=(m:Marketplace,id:string)=>m.deliveries.find(d=>d.jobId===id)?.status??"preview_published";
export const metrics=(m:Marketplace)=>({providers:m.providers.length,attention:m.operations.assessments.filter(a=>a.status!=="complete").length,published:m.jobs.filter(j=>j.status==="preview_published").length,awaiting:m.deliveries.filter(d=>d.status==="awaiting_confirmation").length,active:m.deliveries.filter(d=>["confirmed","scheduled","in_progress","completion_requested"].includes(d.status)).length,issues:issuesOf(m).filter(i=>m.operations.cases.find(c=>c.issueId===i.id)?.status!=="closed").length,completed:m.deliveries.filter(d=>d.status==="completed").length,reports:m.trust.reports.filter(r=>r.status==="pending").length});
export function parseOperations(v:unknown,m:Marketplace):Operations|null{const o=v as Operations;if(!o||!Array.isArray(o.assessments)||!Array.isArray(o.cases)||!Array.isArray(o.events)||o.assessments.length>10||o.cases.length>1000||o.events.length>2000)return null;const date=(x:string)=>typeof x==="string"&&Number.isFinite(Date.parse(x));
for(const a of o.assessments)if(!a||!isDraftId(a.id)||a.id!==a.providerId||!m.providers.some(p=>p.id===a.providerId)||!Number.isSafeInteger(a.revision)||a.revision<1||!date(a.requestedAt)||!Object.hasOwn(assessmentLabels,a.status))return null;
const issues=issuesOf(m);for(const c of o.cases)if(!c||!isDraftId(c.id)||c.id!==c.issueId||!issues.some(i=>i.id===c.issueId&&i.jobId===c.jobId)||!Number.isSafeInteger(c.revision)||c.revision<1||!Object.hasOwn(caseLabels,c.status)||!outcomes.includes(c.outcome))return null;
for(const e of o.events)if(!e||!isDraftId(e.id)||e.actor!=="local-admin"||!date(e.at)||typeof e.note!=="string"||e.note.trim().length<3||e.note.length>1500||!outcomes.includes(e.outcome)||(e.kind==="assessment"?!o.assessments.some(a=>a.id===e.targetId)||!Object.hasOwn(assessmentLabels,e.from)||!Object.hasOwn(assessmentLabels,e.to):e.kind!=="case"||!o.cases.some(c=>c.id===e.targetId)||!Object.hasOwn(caseLabels,e.from)||!Object.hasOwn(caseLabels,e.to)))return null;
for(const list of [o.assessments,o.cases,o.events])if(new Set(list.map(x=>x.id)).size!==list.length)return null;
for(const a of o.assessments){let status="requested";for(const e of o.events.filter(e=>e.kind==="assessment"&&e.targetId===a.id)){if(e.from!==status)return null;status=e.to;}if(status!==a.status)return null;}
for(const c of o.cases){let status="new";const events=o.events.filter(e=>e.kind==="case"&&e.targetId===c.id);if(!events.length)return null;for(const e of events){if(e.from!==status||(status==="closed"&&e.to!=="review"))return null;status=e.to;}if(status!==c.status||events.at(-1)?.outcome!==c.outcome)return null;}
return structuredClone(o);}
