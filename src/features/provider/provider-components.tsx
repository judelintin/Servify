"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Badge, Button, Card, Feedback, TextInput } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { PhotoPreview } from "@/features/customer/draft-components";
import { preparePhoto } from "@/features/customer/photos";
import { areaName, categoryName } from "./config";
import { providerCompleteness, type ProviderContent, type ProviderPhoto } from "./profile-model";
import { useProviderProfile } from "./use-provider-profile";

export function ProviderStorageNotice() {
  const { mode, warning, error } = useProviderProfile();
  return <div className="draft-notices"><div className="local-draft-notice"><Icon name="info" size={18}/><div><strong>{mode === "browser" ? "Your profile preview. Only on this browser." : "Temporary profile · this tab only"}</strong><p>{mode === "browser" ? "Not public, submitted or verified. Anyone using this browser profile may see these details. Avoid private contact details and exact addresses." : "Reloading or closing this tab loses temporary changes. Nothing is published, uploaded or sent for review."}</p></div><Badge tone="blue">Local only</Badge></div>{warning && <Feedback title="A note about storage">{warning}</Feedback>}{error && <Feedback title="Profile storage needs attention" tone="error" live>{error}</Feedback>}</div>;
}
export function ProviderCompleteness({ content }: { content: ProviderContent }) {
  const { percent, items } = providerCompleteness(content);
  return <Card className="provider-completeness"><div className="provider-section-heading"><h2>Profile completeness</h2><strong>{percent}%</strong></div><progress max={100} value={percent} aria-label="Profile completeness"/><p className="draft-helper">A useful introduction, one detail at a time. Photos are optional.</p><ul>{items.map(item => <li key={item.label}><Link href={`/provider/onboarding?step=${item.step}`}><span aria-hidden="true" className={item.done ? "provider-check is-done" : "provider-check"}><Icon name={item.done ? "check" : "plus"} size={14}/></span><span>{item.label}<span className="sr-only">{item.done ? ", added" : ", not added"}</span></span></Link></li>)}</ul></Card>;
}
function ProfilePhotoPicker({ id, label, disabled, onFiles, describedBy }: { id: string; label: string; disabled: boolean; onFiles: (files: FileList | null) => void; describedBy?: string }) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="provider-upload-action"><input ref={input} id={id} type="file" hidden accept="image/jpeg,image/png,image/webp" aria-label={label} disabled={disabled} onChange={event => { onFiles(event.target.files); event.target.value = ""; }}/><Button variant="secondary" disabled={disabled} aria-describedby={describedBy} onClick={() => input.current?.click()}><Icon name="upload" size={17}/>{label}</Button></div>;
}
export function ProviderPhotoManager({ kind, photos, onChange, busy, onBusy }: { kind: "profile" | "portfolio"; photos: ProviderPhoto[]; onChange: (photos: ProviderPhoto[]) => void; busy: boolean; onBusy: (busy: boolean) => void }) {
  const [error, setError] = useState("");
  const max = kind === "profile" ? 1 : 8;
  async function add(files: FileList | null, replace?: string) {
    if (!files?.length || busy) return;
    if (!replace && photos.length + files.length > max) { setError(`Keep up to ${max} ${kind === "profile" ? "profile photo" : "work samples"}. Remove a sample before adding more.`); return; }
    onBusy(true); setError("");
    try {
      const added: ProviderPhoto[] = [], failures: string[] = [];
      for (const file of Array.from(files)) { try { added.push(await preparePhoto(file)); } catch (failure) { failures.push(failure instanceof Error ? failure.message : "This photo could not be prepared."); } }
      if (added.length) onChange(replace ? photos.map(photo => photo.id === replace ? { ...added[0]!, alt: photo.alt } : photo) : [...photos, ...added]);
      if (failures.length) setError(failures.join(" "));
    } finally { onBusy(false); }
  }
  return <div className="provider-photo-manager"><div className="photo-picker"><span className="empty-icon"><Icon name={kind === "profile" ? "user" : "plus"} size={24}/></span><label htmlFor={`${kind}-photos`}>{kind === "profile" ? "Profile photo (optional)" : "Add work samples"}</label><p>JPG, PNG or WebP · up to 5 MB each · {max} {max === 1 ? "photo" : "photos"} maximum</p>{kind === "profile" ? <ProfilePhotoPicker id="profile-photos" label={photos.length ? "Change profile photo" : "Upload profile photo"} disabled={busy} onFiles={files => { void add(files, photos[0]?.id); }} describedBy="profile-photo-hint"/> : <input id={`${kind}-photos`} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || photos.length >= max} onChange={event => { void add(event.target.files); event.target.value = ""; }} aria-describedby={`${kind}-photo-hint`}/>}<p id={`${kind}-photo-hint`}>Use photos you have permission to share. Avoid IDs, exact addresses, private details and other people’s faces. Photos are resized locally and embedded metadata is removed; visible details cannot be redacted automatically.</p></div>{busy && <p role="status" className="draft-helper">Preparing photos on this device…</p>}{error && <p role="alert" className="field-error mt-3">{error}</p>}<div className={kind === "profile" ? "provider-avatar-editor" : "provider-portfolio-grid"}>{photos.map((photo, index) => <div className="photo-editor" key={photo.id}><PhotoPreview photo={{ ...photo, alt: photo.alt || (kind === "profile" ? "Profile photo preview" : `Work sample ${index + 1}`) }} index={index}/>{kind === "portfolio" && <TextInput id={`caption-${photo.id}`} label={`Work sample ${index + 1} caption (optional)`} value={photo.alt} maxLength={300} disabled={busy} onChange={event => onChange(photos.map(item => item.id === photo.id ? { ...item, alt: event.target.value } : item))}/>}{kind === "profile" ? <ProfilePhotoPicker id={`replace-${photo.id}`} label="Replace profile photo" disabled={busy} onFiles={files => { void add(files, photo.id); }} describedBy="profile-photo-hint"/> : <><label className="provider-replace-label" htmlFor={`replace-${photo.id}`}>Replace work sample {index + 1}</label><input id={`replace-${photo.id}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { void add(event.target.files, photo.id); event.target.value = ""; }}/></>}<Button variant="ghost" disabled={busy} onClick={() => onChange(photos.filter(item => item.id !== photo.id))}>Remove {kind === "profile" ? "profile photo" : `work sample ${index + 1}`}</Button></div>)}</div></div>;
}
export function ProviderSummary({ content: c, onEdit }: { content: ProviderContent; onEdit?: (step: number) => void }) {
  const rows = [
    { label: "Provider type", value: c.type === "individual" ? "Individual professional" : c.type === "business" ? "Small business" : "Not selected", step: 0 },
    { label: "Professional name", value: c.name.trim() || "Not added", step: 0 },
    { label: "Services", value: c.categories.map(categoryName).join(", ") || "Not selected", step: 1 },
    { label: "Specializations", value: c.specializations.join(", ") || "Not added (optional)", step: 1 },
    { label: "Experience", value: c.experience === "0" ? "Less than one year" : c.experience ? `${c.experience} year${c.experience === "1" ? "" : "s"}` : "Not added", step: 1 },
    { label: "Service coverage", value: c.areas.length ? `${c.areas.map(areaName).join(", ")}, Ibadan` : "Not selected", step: 2 },
    { label: "Introduction", value: c.bio.trim() || "Not added", step: 3 },
  ];
  return <div className="draft-summary provider-summary"><dl>{rows.map(row => <div className="draft-summary-row" key={row.label}><div><dt>{row.label}</dt><dd>{row.value}</dd></div>{onEdit && <button type="button" className="draft-edit-link" aria-label={`Edit ${row.label.toLowerCase()}`} onClick={() => onEdit(row.step)}>Edit</button>}</div>)}</dl><div className="draft-summary-photos"><div className="provider-section-heading"><h3>Work samples ({c.portfolio.length}/8)</h3>{onEdit && <button type="button" className="draft-edit-link" onClick={() => onEdit(4)}>Edit portfolio</button>}</div>{c.portfolio.length ? <div className="provider-portfolio-grid">{c.portfolio.map((photo, index) => <figure key={photo.id}><PhotoPreview photo={{ ...photo, alt: photo.alt || `Work sample ${index + 1}` }} index={index}/><figcaption>{photo.alt || `Work sample ${index + 1}`}</figcaption></figure>)}</div> : <p className="draft-helper">No work samples yet. You can add them later.</p>}</div></div>;
}
