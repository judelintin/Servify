"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deleteLocalDraft } from "@/data/local-drafts";
import { Badge, Button, ButtonLink, Card, EmptyState, Feedback } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { areaLabel, categoryLabel, customerCategories } from "./config";
import { budgetLabel, firstIncompleteStep, timingLabel, type DraftPhoto, type LocalDraft } from "./draft-model";
import { useLocalDrafts } from "./use-local-drafts";

export function DraftStorageNotice({ hideError = false }: { hideError?: boolean }) {
  const { mode, warning, error } = useLocalDrafts();
  return <div className="draft-notices"><div className="local-draft-notice"><Icon name="info" size={17}/><div><strong>{mode === "browser" ? "Your draft. Only on this browser." : "Temporary drafts · this tab only"}</strong><p>{mode === "browser" ? "Nothing is published online or sent to real providers. Anyone using this browser profile may see saved drafts." : "Reloading or closing this tab will lose these drafts. Nothing is sent to providers."}</p></div><Badge tone="blue">Local only</Badge></div>{warning && <Feedback title="A note about storage">{warning}</Feedback>}{error && !hideError && <Feedback title="Draft storage needs attention" tone="error" live>{error}</Feedback>}</div>;
}
export function PhotoPreview({ photo, index = 0 }: { photo: DraftPhoto; index?: number }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => { const url = URL.createObjectURL(photo.blob); if (image.current) image.current.src = url; return () => URL.revokeObjectURL(url); }, [photo.blob]);
  // eslint-disable-next-line @next/next/no-img-element -- Local Blob URLs never pass through the server image optimizer.
  return <img ref={image} alt={photo.alt || `Job photo ${index + 1}`} width={320} height={240} className="draft-photo-image"/>;
}
export function DeleteDraftButton({ draft, onDeleted, previewCopy = false }: { draft: LocalDraft; onDeleted?: () => void; previewCopy?: boolean }) {
  const [confirming, setConfirming] = useState(false); const [busy, setBusy] = useState(false);
  const confirmedRevision = useRef(draft.revision);
  const cancel = useRef<HTMLButtonElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  async function remove() { setBusy(true); try { await deleteLocalDraft(draft.id, confirmedRevision.current); onDeleted?.(); } catch { setBusy(false); } }
  if (!confirming) return <button ref={trigger} type="button" className="draft-delete-trigger" onClick={() => { confirmedRevision.current = draft.revision; setConfirming(true); requestAnimationFrame(() => cancel.current?.focus()); }}>{previewCopy ? "Delete private source copy" : "Delete draft"}</button>;
  return <div className="draft-delete-confirm" role="region" aria-label="Confirm draft deletion"><strong>{previewCopy ? "Delete this private source copy?" : "Delete this local draft?"}</strong><p>{previewCopy ? "The published snapshot, its photos and offers will remain. Only the private source draft is deleted." : "This removes its answers and photos from this browser."} You can’t undo this.</p><div className="component-row"><Button ref={cancel} variant="secondary" disabled={busy} onClick={() => { setConfirming(false); requestAnimationFrame(() => trigger.current?.focus()); }}>Keep draft</Button><Button className="button-danger" disabled={busy} onClick={() => void remove()}>{busy ? "Deleting…" : "Yes, delete draft"}</Button></div></div>;
}
export function DraftList({ drafts, compact = false }: { drafts: LocalDraft[]; compact?: boolean }) {
  if (!drafts.length) return <EmptyState title="Your next project starts here." description="Make a little room for a fix, a fresh start or an everyday to-do. Start a draft and come back whenever you’re ready." action={<ButtonLink href="/jobs/new" icon="plus">Start your first draft</ButtonLink>}/>;
  return <div className="draft-list">{drafts.map((draft) => <article className="draft-list-item" key={draft.id}><div className="draft-row-top"><Link href={`/jobs/${draft.id}`} className="draft-row-link"><span className="draft-thumbnail">{draft.content.photos[0] ? <PhotoPreview photo={draft.content.photos[0]}/> : customerCategories.some((item) => item.slug === draft.content.category) ? <Image src={`/icons/services/${draft.content.category}.svg`} width={28} height={28} alt=""/> : <Icon name="jobs" size={28}/>}</span><div className="draft-row-copy"><span className="eyebrow">{categoryLabel(draft.content.category)}</span><h3>{draft.content.title.trim() || "Untitled request"}</h3><p>{draft.content.area ? areaLabel(draft.content.area) : "Area not selected"}<span aria-hidden="true"> · </span>{firstIncompleteStep(draft.content) === 6 ? "Ready to review" : "Keep adding details"}</p></div><Icon name="chevron" size={16}/></Link><Badge tone="orange">Draft</Badge></div><div className="draft-row-bottom"><span>Saved {new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "Africa/Lagos" }).format(new Date(draft.updatedAt))} · {draft.content.photos.length} photo{draft.content.photos.length === 1 ? "" : "s"}</span><Link href={`/jobs/${draft.id}/edit`} className="draft-edit-link">Continue draft<Icon name="arrow" size={14}/></Link></div>{!compact && <DeleteDraftButton draft={draft} onDeleted={() => document.getElementById("draft-list-heading")?.focus()}/>}</article>)}</div>;
}
export function DraftSummary({ draft, onEdit }: { draft: Pick<LocalDraft, "content">; onEdit?: (step: number) => void }) {
  const c = draft.content;
  const rows = [
    { label: "Service", value: categoryLabel(c.category), step: 0 },
    { label: "Request title", value: c.title.trim() || "Not added yet", step: 1 },
    { label: "What you need", value: c.description.trim() || "Not added yet", step: 1 },
    { label: "General area", value: `${areaLabel(c.area)}${c.area ? ", Ibadan" : ""}`, step: 3 },
    { label: "Preferred timing", value: timingLabel(c), step: 4 },
    { label: "Budget", value: budgetLabel(c), step: 5 },
  ];
  return <div className="draft-summary"><dl>{rows.map((row) => <div key={row.label} className="draft-summary-row"><div><dt>{row.label}</dt><dd>{row.value}</dd></div>{onEdit && <button className="draft-edit-link" type="button" aria-label={`Edit ${row.label.toLowerCase()}`} onClick={() => onEdit(row.step)}>Edit</button>}</div>)}</dl><div className="draft-summary-photos"><div className="section-heading"><h3>Photos <span className="text-muted">({c.photos.length})</span></h3>{onEdit && <button className="draft-edit-link" type="button" onClick={() => onEdit(2)} aria-label="Edit photos">Edit</button>}</div>{c.photos.length ? <div className="draft-photo-grid">{c.photos.map((photo, index) => <figure key={photo.id}><PhotoPreview photo={photo} index={index}/><figcaption>{photo.alt || `Photo ${index + 1}`}</figcaption></figure>)}</div> : <p className="draft-helper">No photos added. Photos are optional.</p>}</div></div>;
}
export function DraftMissing() { return <Card><EmptyState title="This draft isn’t on this browser." description="It may have been deleted, or saved on another browser or device. Drafts are not synced to an account." action={<ButtonLink href="/customer/jobs" variant="secondary" icon="arrow-left">Back to my jobs</ButtonLink>}/></Card>; }
