"use client";
import { useRouter } from "next/navigation";
import { Badge, ButtonLink, Card, Feedback, LoadingState, PageHeading } from "@/components/ui/primitives";
import { categoryLabel } from "./config";
import { DeleteDraftButton, DraftMissing, DraftStorageNotice, DraftSummary } from "./draft-components";
import { firstIncompleteStep } from "./draft-model";
import { useLocalDrafts } from "./use-local-drafts";

export function JobDetails({ draftId }: { draftId: string }) {
  const state = useLocalDrafts(); const router = useRouter();
  const draft = state.drafts.find((item) => item.id === draftId);
  if (!state.ready) return <><PageHeading title="Your draft request"/><LoadingState label="Opening the draft on this browser…"/></>;
  if (!draft) return <><PageHeading title="Draft not found"/><DraftStorageNotice/><DraftMissing/></>;
  return <><PageHeading eyebrow={`${categoryLabel(draft.content.category)} / Your local draft`} title={draft.content.title.trim() || "Untitled request"} description="A request in the making. You’re in control of every detail." action={<ButtonLink href={`/jobs/${draft.id}/edit`} variant="secondary" icon="arrow">Edit draft</ButtonLink>}/><DraftStorageNotice/><div className="draft-details-layout"><Card><div className="section-card-head"><h2>Request details</h2><Badge tone="orange">Draft · not published</Badge></div><DraftSummary draft={draft}/></Card><aside className="draft-details-aside"><Card className="card-padding"><h2>Your next step</h2><p>{firstIncompleteStep(draft.content) === 6 ? "Your answers are ready to review. Publishing to providers will be available in a later stage." : "There’s room to add a few more details. Pick up where you left off whenever you’re ready."}</p><ButtonLink href={`/jobs/${draft.id}/edit`} icon="arrow">{firstIncompleteStep(draft.content) === 6 ? "Review your draft" : "Continue editing"}</ButtonLink></Card><Feedback title="Kept on this device">There are no offers or provider conversations for a local draft.</Feedback><DeleteDraftButton draft={draft} onDeleted={() => router.push("/customer/jobs")}/></aside></div></>;
}
