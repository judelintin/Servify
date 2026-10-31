"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publishPreviewJob } from "@/data/local-marketplace";
import { Badge, Button, ButtonLink, Card, Feedback, PageHeading } from "@/components/ui/primitives";
import { DeleteDraftButton, DraftSummary } from "@/features/customer/draft-components";
import { firstIncompleteStep } from "@/features/customer/draft-model";
import { useLocalDrafts } from "@/features/customer/use-local-drafts";
import { jobStatusLabel, type PreviewJob } from "./model";
import { MarketplaceLoading, MissingPreview, PreviewContext } from "./components";
import { useMarketplace } from "./use-marketplace";

export function PublishPreview({ draftId }: { draftId: string }) {
  const drafts = useLocalDrafts(), market = useMarketplace(), router = useRouter();
  const [ack, setAck] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const alert = useRef<HTMLDivElement>(null);
  const [errorAttempt, setErrorAttempt] = useState(0);
  useEffect(() => { if (errorAttempt) alert.current?.focus(); }, [errorAttempt]);
  const draft = drafts.drafts.find(draft => draft.id === draftId), published = market.data.jobs.find(job => job.id === draftId);
  async function publish() {
    if (!draft || busy) return;
    if (!ack) { setError("Confirm that you understand this publishes only to the local browser preview."); setErrorAttempt(attempt => attempt + 1); return; }
    setBusy(true);
    try { await publishPreviewJob(draft.id, draft.revision); router.push(`/jobs/${draft.id}?published=1`); }
    catch (failure) { setBusy(false); setError(failure instanceof Error ? failure.message : "The request could not be published."); setErrorAttempt(attempt => attempt + 1); }
  }
  return <><PageHeading eyebrow="Customer / Local marketplace" title="Review before publishing" description="A separate, explicit step. Your original draft and photos stay on this browser."/><PreviewContext role="customer"/>{!drafts.ready || !market.ready ? <MarketplaceLoading/> : published ? <Card className="market-panel"><h2>This request is already in preview.</h2><p>It has not been published again. The existing snapshot and associated offers are unchanged.</p><ButtonLink href={`/jobs/${draftId}`}>View preview request</ButtonLink></Card> : !draft ? <MissingPreview title="This draft is not on this browser."/> : firstIncompleteStep(draft.content) !== 6 ? <Card className="market-panel"><h2>Finish your request first.</h2><p>A service, clear title and description, general area, valid timing and budget preference are required.</p><ButtonLink href={`/jobs/${draftId}/edit`}>Complete required details</ButtonLink></Card> : <div className="draft-details-layout"><Card><div className="section-card-head"><h2>{draft.content.title}</h2><Badge tone="orange">Draft · private</Badge></div><DraftSummary draft={draft}/></Card><div className="market-stack"><Feedback title="Only in this local prototype">Publishing makes a snapshot available to provider preview contexts in this browser. No real providers are notified, and no public listing is created.</Feedback><Card className="market-panel"><h2>Ready to explore offers?</h2><p>The published snapshot stays fixed so offers refer to the details you reviewed. Your original draft remains a separate private copy.</p>{error && <div className="wizard-errors" role="alert" ref={alert} tabIndex={-1}>{error}</div>}<label className="provider-acknowledgement"><input type="checkbox" checked={ack} onChange={event => setAck(event.target.checked)} disabled={busy}/>I understand this is a browser-local preview, not a public job posting.</label><Button disabled={busy || market.blocked} onClick={() => void publish()}>{busy ? "Publishing locally…" : "Publish to Preview"}</Button><Link className="draft-edit-link" href={`/jobs/${draft.id}/edit`}>Back to private draft</Link></Card></div></div>}</>;
}
export function CustomerPreviewJob({ job }: { job: PreviewJob }) {
  const { data } = useMarketplace(); const source = useLocalDrafts(); const draft = source.drafts.find(draft => draft.id === job.id);
  const offers = data.offers.filter(offer => offer.jobId === job.id && offer.submittedAt !== null);
  const selected = data.offers.find(offer => offer.id === job.selectedOfferId), provider = data.providers.find(provider => provider.id === selected?.providerId);
  return <><PageHeading eyebrow="Your local preview request" title={job.request.content.title} description="This is the published snapshot. Changes to the private source draft do not alter it." action={<ButtonLink href={`/offers?job=${job.id}`}>View offers ({offers.length})</ButtonLink>}/><PreviewContext role="customer"/><div className="draft-details-layout"><Card><div className="section-card-head"><h2>Request details</h2><Badge tone={selected ? "orange" : "blue"}>{jobStatusLabel(job.status)}</Badge></div><DraftSummary draft={job.request}/></Card><div className="market-stack"><Card className="market-panel"><h2>{selected ? "Your preferred provider" : "Your next step"}</h2><p>{selected ? `${provider?.profile.content.name ?? "A preview provider"} has been selected in this prototype. This creates no real booking, payment or work agreement.` : "Switch to a provider preview context to discover this request and prepare an offer. Come back here to compare submitted offers."}</p><ButtonLink href={selected ? `/offers/${selected.id}` : `/offers?job=${job.id}`} icon="arrow">{selected ? "View selected offer" : "Compare local offers"}</ButtonLink></Card><Feedback title="No real transaction">Messages, bookings, payments and work completion are not implemented. Selection is a local prototype decision only.</Feedback><Card className="market-panel"><h2 id="private-source-heading" tabIndex={-1}>Private source copy</h2><p>Your original draft is preserved. Editing it does not revise the published snapshot or existing offers. Published revisions and cancellations are deferred.</p>{draft ? <><ButtonLink href={`/jobs/${job.id}/edit`} variant="secondary">Edit private copy</ButtonLink><DeleteDraftButton draft={draft} previewCopy onDeleted={() => document.getElementById("private-source-heading")?.focus()}/></> : <p className="draft-helper">The private source copy is no longer saved. The published snapshot and offers remain intact.</p>}</Card></div></div></>;
}
