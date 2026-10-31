"use client";
import { useMarketplace } from "@/features/marketplace/use-marketplace";
import { CustomerPreviewJob } from "@/features/marketplace/customer-jobs";
import { useRouter } from "next/navigation";
import { Badge, ButtonLink, Card, Feedback, LoadingState, PageHeading } from "@/components/ui/primitives";
import { categoryLabel } from "./config";
import { DeleteDraftButton, DraftMissing, DraftStorageNotice, DraftSummary } from "./draft-components";
import { firstIncompleteStep } from "./draft-model";
import { useLocalDrafts } from "./use-local-drafts";

export function JobDetails({ draftId }: { draftId: string }) {
  const state = useLocalDrafts(); const market = useMarketplace(); const router = useRouter();
  const draft = state.drafts.find((item) => item.id === draftId);
  const preview = market.data.jobs.find(job => job.id === draftId);
  if (preview) return <CustomerPreviewJob job={preview}/>;
  if (!state.ready || !market.ready) return <><PageHeading title="Your draft request"/><LoadingState label="Opening the draft on this browser…"/></>;
  if (!draft) return <><PageHeading title="Draft not found"/><DraftStorageNotice/><DraftMissing/></>;
  return <><PageHeading eyebrow={`${categoryLabel(draft.content.category)} / Your local draft`} title={draft.content.title.trim() || "Untitled request"} description="A request in the making. You’re in control of every detail." action={<ButtonLink href={`/jobs/${draft.id}/edit`} variant="secondary" icon="arrow">Edit draft</ButtonLink>}/><DraftStorageNotice/><div className="draft-details-layout"><Card><div className="section-card-head"><h2>Request details</h2><Badge tone="orange">Draft · not published</Badge></div><DraftSummary draft={draft}/></Card><aside className="draft-details-aside"><Card className="card-padding"><h2>Your next step</h2><p>{firstIncompleteStep(draft.content) === 6 ? "Your answers are ready. Review them before explicitly publishing a snapshot to the local browser preview." : "There’s room to add a few more details. Pick up where you left off whenever you’re ready."}</p><ButtonLink href={firstIncompleteStep(draft.content) === 6 ? `/jobs/${draft.id}/publish` : `/jobs/${draft.id}/edit`} icon="arrow">{firstIncompleteStep(draft.content) === 6 ? "Review & publish to preview" : "Continue editing"}</ButtonLink></Card><Feedback title="Kept on this device">There are no offers or provider conversations for a local draft.</Feedback><DeleteDraftButton draft={draft} onDeleted={() => router.push("/customer/jobs")}/></aside></div></>;
}
