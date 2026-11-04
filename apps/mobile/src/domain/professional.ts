import { categories, isCategory } from './catalog';
import { areas, type Photo } from './requests';

export const professionalSteps = ['About you', 'Services', 'Coverage', 'Introduction', 'Portfolio', 'Review'] as const;
export const specializations: Record<string, readonly string[]> = {
  plumbing: ['Taps & fittings', 'Pipe repairs', 'Drainage'],
  electrical: ['Lighting', 'Sockets & switches', 'Fault finding'],
  cooling: ['AC servicing', 'Refrigerator repairs', 'Installation'],
  generator: ['Generator servicing', 'Power faults', 'Maintenance'],
  cleaning: ['Home cleaning', 'Deep cleaning', 'Office cleaning'],
  appliance: ['Washing machines', 'Kitchen appliances', 'Appliance maintenance'],
};
export interface PortfolioEntry { id: string; title: string; description: string; category: string; photo: Photo | null }
export interface ProfessionalContent {
  type: '' | 'individual' | 'business'; name: string; businessName: string; photo: Photo | null;
  categories: string[]; specializations: string[]; serviceDescriptions: Record<string,string>;
  experience: string; areas: string[]; bio: string; qualifications: string; portfolio: PortfolioEntry[];
}
export interface ProfessionalProfile {
  id: 'local-professional'; schemaVersion: 1; revision: number; createdAt: string; updatedAt: string;
  lastStep: number; reviewed: boolean; content: ProfessionalContent;
}
export type ProfessionalErrors = Partial<Record<keyof ProfessionalContent,string>>;
export const emptyProfessional = (): ProfessionalContent => ({type:'',name:'',businessName:'',photo:null,categories:[],specializations:[],serviceDescriptions:{},experience:'',areas:[],bio:'',qualifications:'',portfolio:[]});
export function validateProject(p: PortfolioEntry, offered: string[]) {
  const errors: Partial<Record<'title'|'description'|'category'|'photo',string>> = {};
  if(p.title.trim().length<3||p.title.length>100) errors.title='Give this project a title between 3 and 100 characters.';
  if(p.description.length>500) errors.description='Keep the project description within 500 characters.';
  if(!isCategory(p.category)||!offered.includes(p.category)) errors.category='Choose one of your offered services for this project.';
  if(!p.photo) errors.photo='Add a project photo, or delete this unfinished work sample.';
  return errors;
}
export function validateProfessional(c: ProfessionalContent, step: number): ProfessionalErrors {
  const e: ProfessionalErrors = {};
  if(step===0){
    if(!['individual','business'].includes(c.type))e.type='Choose an individual or small-business profile.';
    if(c.name.trim().length<2||c.name.length>100)e.name='Use a professional display name between 2 and 100 characters.';
    if(c.businessName.length>100)e.businessName='Keep the business name within 100 characters.';
  }
  if(step===1){
    if(!c.categories.length||c.categories.some(id=>!isCategory(id)))e.categories='Choose at least one service you offer.';
    if(!/^\d{1,2}$/.test(c.experience)||Number(c.experience)>60)e.experience='Enter whole years of experience from 0 to 60.';
    if(c.specializations.some(v=>!c.categories.some(id=>specializations[id]?.includes(v))))e.specializations='Choose specializations from your selected services.';
    if(Object.entries(c.serviceDescriptions).some(([id,v])=>!c.categories.includes(id)||v.length>200))e.serviceDescriptions='Keep service details within 200 characters for your offered services.';
  }
  if(step===2&&(!c.areas.length||c.areas.some(id=>!areas.some(a=>a[0]===id))))e.areas='Choose at least one general service area in Ibadan.';
  if(step===3){if(c.bio.trim().length<30||c.bio.length>1200)e.bio='Introduce your work in 30 to 1,200 characters. Leave out private contact details.';if(c.qualifications.length>500)e.qualifications='Keep qualifications within 500 characters.';}
  if(step===4&&(c.portfolio.length>8||c.portfolio.some(p=>Object.keys(validateProject(p,c.categories)).length)))e.portfolio='Finish the photo, title and service for each project, or remove unfinished entries. Work samples are optional.';
  return e;
}
export const nextProfessionalStep = (c: ProfessionalContent) => [0,1,2,3,4].find(s=>Object.keys(validateProfessional(c,s)).length)??5;
export const requiredProfessionalComplete = (c: ProfessionalContent) => [0,1,2,3].every(s=>!Object.keys(validateProfessional(c,s)).length);
/** Four required sections + two optional extras, matching the web percentage. */
export function completeness(c: ProfessionalContent){const items=[
  {label:'Professional details',step:0,optional:false,done:!Object.keys(validateProfessional(c,0)).length},
  {label:'Services & experience',step:1,optional:false,done:!Object.keys(validateProfessional(c,1)).length},
  {label:'Service coverage',step:2,optional:false,done:!Object.keys(validateProfessional(c,2)).length},
  {label:'Professional introduction',step:3,optional:false,done:!Object.keys(validateProfessional(c,3)).length},
  {label:'Profile photo',step:0,optional:true,done:!!c.photo},
  {label:'Work samples',step:4,optional:true,done:c.portfolio.some(p=>!Object.keys(validateProject(p,c.categories)).length)},
];return{items,percent:Math.round(items.filter(i=>i.done).length/6*100),requiredComplete:requiredProfessionalComplete(c)};}
const validId=(id:unknown):id is string=>typeof id==='string'&&/^[a-z0-9-]{8,80}$/.test(id);
function parsePhoto(value:unknown):Photo{const p=value as Photo;if(!p||!validId(p.id)||typeof p.alt!=='string'||p.alt.length>300)throw Error('Invalid photo reference.');return{id:p.id,alt:p.alt};}
/** Whitelist untrusted metadata; incomplete form answers remain valid autosave data. */
export function parseProfessional(raw:string):ProfessionalProfile{
  if(raw.length>100_000)throw Error('Profile metadata is too large.');
  const p=JSON.parse(raw) as ProfessionalProfile,c=p?.content;
  if(!p||p.id!=='local-professional'||p.schemaVersion!==1||!Number.isInteger(p.revision)||p.revision<1||!Number.isInteger(p.lastStep)||p.lastStep<0||p.lastStep>5||typeof p.reviewed!=='boolean'||[p.createdAt,p.updatedAt].some(d=>typeof d!=='string'||!Number.isFinite(Date.parse(d)))||!c)throw Error('Unsupported professional profile.');
  if(!['','individual','business'].includes(c.type))throw Error('Invalid professional type.');
  for(const[key,max]of [['name',100],['businessName',100],['experience',2],['bio',1200],['qualifications',500]] as const)if(typeof c[key]!=='string'||c[key].length>max)throw Error('Invalid profile field.');
  for(const list of [c.categories,c.specializations,c.areas])if(!Array.isArray(list)||list.length>30||list.some(v=>typeof v!=='string'||v.length>100)||new Set(list).size!==list.length)throw Error('Invalid profile selection.');
  if(c.categories.some(v=>!categories.some(cat=>cat.slug===v))||c.areas.some(v=>!areas.some(a=>a[0]===v)))throw Error('Unknown profile selection.');
  if(!c.serviceDescriptions||typeof c.serviceDescriptions!=='object'||Array.isArray(c.serviceDescriptions)||Object.entries(c.serviceDescriptions).some(([id,v])=>!isCategory(id)||typeof v!=='string'||v.length>200))throw Error('Invalid service descriptions.');
  if(!Array.isArray(c.portfolio)||c.portfolio.length>8)throw Error('Invalid work samples.');
  const portfolio=c.portfolio.map(v=>{if(!v||!validId(v.id)||typeof v.title!=='string'||v.title.length>100||typeof v.description!=='string'||v.description.length>500||typeof v.category!=='string'||(v.category!==''&&!isCategory(v.category)))throw Error('Invalid project.');return{id:v.id,title:v.title,description:v.description,category:v.category,photo:v.photo===null?null:parsePhoto(v.photo)};});
  if(new Set(portfolio.map(v=>v.id)).size!==portfolio.length)throw Error('Duplicate project.');
  const photo=c.photo===null?null:parsePhoto(c.photo),photoIds=[...(photo?[photo.id]:[]),...portfolio.flatMap(v=>v.photo?[v.photo.id]:[])];if(new Set(photoIds).size!==photoIds.length)throw Error('Duplicate profile image.');
  const content:ProfessionalContent={type:c.type,name:c.name,businessName:c.businessName,photo,categories:[...c.categories],specializations:[...c.specializations],serviceDescriptions:{...c.serviceDescriptions},experience:c.experience,areas:[...c.areas],bio:c.bio,qualifications:c.qualifications,portfolio};
  if(p.reviewed&&!requiredProfessionalComplete(content))throw Error('Reviewed profile is incomplete.');
  return{id:'local-professional',schemaVersion:1,revision:p.revision,createdAt:p.createdAt,updatedAt:p.updatedAt,lastStep:p.lastStep,reviewed:p.reviewed,content};
}
