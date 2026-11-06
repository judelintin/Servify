import { newId } from "../domain/requests";
import { eligible, reasons, type TrustActor } from "../domain/trust";
import type { Marketplace } from "../domain/marketplace";
export function createTrustActions(mutateMarketplace:(fn:(m:Marketplace)=>void)=>Promise<void>){
const MarketplaceError=Error;
function identity(_m:Marketplace,a:TrustActor){if(!(a.role==="customer"&&a.id==="local-customer")&&!(a.role==="provider"&&a.id==="local-professional"))throw Error("Choose a valid local customer or professional identity.");}
function saveReview(jobId: string, a: TrustActor, revision: number, rating: number, text: string, response = false) { return mutateMarketplace(m => {
 identity(m,a); const d=eligible(m,jobId), old=m.trust.reviews.find(r=>r.jobId===jobId);
 if (!d || (old?.revision ?? 0)!==revision) throw new MarketplaceError("This review is ineligible or changed. Reload before saving; your answers have not overwritten it.");
 if (response ? a.role!=="provider" || a.id!==d.providerId || !old || old.hidden : a.role!=="customer" || a.id!==d.customerId) throw new MarketplaceError("This preview identity cannot write this feedback.");
 if (text.length>2000 || (response ? text.trim().length<3 : !Number.isInteger(rating)||rating<1||rating>5)) throw new MarketplaceError("Choose 1–5 stars. Text is limited to 2,000 characters; responses need at least 3.");
 const version={text:text.trim(),rating:response?0:rating,at:new Date().toISOString()};
 if (old) { const list=response?old.response?.versions:old.versions; if ((list?.length??0)>=30) throw new MarketplaceError("The 30-version preview limit has been reached."); if(response) { if(old.response) old.response.versions.push(version); else old.response={id:newId(),hidden:false,versions:[version]}; } else old.versions.push(version); old.revision++; }
 else m.trust.reviews.push({id:newId(),jobId,providerId:d.providerId,customerId:d.customerId,revision:1,hidden:false,versions:[version],response:null});
 }); }
function reportReview(reviewId:string,target:"review"|"response",a:TrustActor,reason:string,explanation:string) { return mutateMarketplace(m=>{ identity(m,a); const r=m.trust.reviews.find(r=>r.id===reviewId); if(a.role==="admin"||!r||!(target==="review"||target==="response"&&r.response)||!reasons.includes(reason)||explanation.length>1000) throw new MarketplaceError("Check the report target, identity and explanation."); if(m.trust.reports.some(r=>r.reviewId===reviewId&&r.target===target&&r.actor.id===a.id&&r.actor.role===a.role&&r.status==="pending")) throw new MarketplaceError("You already have a pending report for this content."); if(m.trust.reports.length>=500) throw new MarketplaceError("Report preview limit reached."); m.trust.reports.push({id:newId(),reviewId,target,actor:a,reason,explanation:explanation.trim(),at:new Date().toISOString(),status:"pending"}); }); }

return {saveReview,reportReview};
}
