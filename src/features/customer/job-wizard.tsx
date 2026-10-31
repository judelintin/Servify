"use client";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DraftCapacityError, DraftConflictError, writeLocalDraft } from "@/data/local-drafts";
import { Badge, Button, Card, Feedback, LoadingState, PageHeading, TextInput } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { customerAreas, customerCategories, postingSteps } from "./config";
import { contentSignature, emptyContent, firstIncompleteStep, localToday, validateStep, type DraftContent, type DraftErrors, type LocalDraft } from "./draft-model";
import { DraftMissing, DraftStorageNotice, DraftSummary, PhotoPreview } from "./draft-components";
import { preparePhoto } from "./photos";
import { useLocalDrafts } from "./use-local-drafts";

const stepTitles = ["What needs a little attention?", "Tell us a little about the job.", "A photo can make it clearer.", "Where in Ibadan is the job?", "When would you like a hand?", "What do you have in mind?", "Your request, at a glance."];
const stepDescriptions = ["Choose the closest match. You can always change it later.", "A clear description helps you prepare a more useful request.", "Optional, but useful for showing the problem or the space.", "A general service area is enough. No house number or exact address.", "This is your preference, not a promise of provider availability.", "Add a budget range, or leave room for providers to quote in a future stage.", "Take a moment to check the details. This saves a local draft; it doesn’t publish a job."];

export function JobWizard({ draftId }: { draftId?: string }) {
  const state = useLocalDrafts();
  if (!state.ready) return <><PageHeading title="Post a job"/><LoadingState label="Preparing your local draft…"/></>;
  const existing = draftId ? state.drafts.find((item) => item.id === draftId) : undefined;
  if (draftId && !existing) return <><PageHeading title="Draft not found"/><DraftStorageNotice hideError/><DraftMissing/></>;
  return <DraftEditor key={draftId ?? "new"} initialDraft={existing} temporary={state.mode === "memory"}/>;
}

function DraftEditor({ initialDraft, temporary }: { initialDraft?: LocalDraft; temporary: boolean }) {
  const router = useRouter();
  const [identity] = useState(() => ({ id: initialDraft?.id ?? crypto.randomUUID(), createdAt: initialDraft?.createdAt ?? new Date().toISOString() }));
  const [content, setContent] = useState<DraftContent>(() => initialDraft?.content ?? emptyContent());
  const [step, setStep] = useState(initialDraft?.lastStep ?? 0);
  const [visited, setVisited] = useState(initialDraft?.lastStep ?? 0);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saveState, setSaveState] = useState(initialDraft ? "saved" : "idle");
  const [saveError, setSaveError] = useState("");
  const [conflicted, setConflicted] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const signature = contentSignature(content, step);
  const [savedSignature, setSavedSignature] = useState(signature);
  const savedRef = useRef(signature);
  const revision = useRef(initialDraft?.revision ?? 0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const conflictRef = useRef(false);
  const latest = useRef({ content, step });
  const heading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const hasUnsaved = signature !== savedSignature;

  useEffect(() => { latest.current = { content, step }; }, [content, step]);
  const persist = useCallback((answers: DraftContent, atStep: number, reviewed = false): Promise<LocalDraft> => {
    const task = queue.current.catch(() => {}).then(async () => {
      if (conflictRef.current) throw new DraftConflictError();
      setSaveState("saving");
      try {
        const draft = await writeLocalDraft({ ...identity, schemaVersion: 1, revision: revision.current, updatedAt: new Date().toISOString(), status: "draft", lastStep: atStep, reviewed, content: answers }, revision.current);
        revision.current = draft.revision;
        savedRef.current = contentSignature(answers, atStep);
        setSavedSignature(savedRef.current); setSaveState("saved"); setSaveError("");
        if (window.location.pathname === "/jobs/new" && !new URLSearchParams(window.location.search).has("draft")) window.history.replaceState(null, "", `/jobs/new?draft=${draft.id}`);
        return draft;
      } catch (error) {
        if (error instanceof DraftConflictError) { conflictRef.current = true; setConflicted(true); }
        setSaveState("error");
        setSaveError(error instanceof DraftConflictError || error instanceof DraftCapacityError ? error.message : "Your current answers are still on this page, but the last save didn’t finish. Check device storage and try ‘Save & exit’ again.");
        throw error;
      }
    });
    queue.current = task;
    return task;
  }, [identity]);

  useEffect(() => {
    if (!hasUnsaved || conflicted || photoBusy) return;
    const timer = setTimeout(() => { void persist(content, step).catch(() => {}); }, 650);
    return () => clearTimeout(timer);
  }, [content, step, hasUnsaved, conflicted, photoBusy, persist]);
  useEffect(() => () => {
    const current = latest.current;
    if (!conflictRef.current && contentSignature(current.content, current.step) !== savedRef.current) void persist(current.content, current.step).catch(() => {});
  }, [persist]);
  useEffect(() => {
    if (!hasUnsaved && !photoBusy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved, photoBusy]);

  function update<K extends keyof DraftContent>(key: K, value: DraftContent[K]) {
    setContent((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }
  function moveTo(next: number) { setErrors({}); setStep(next); setVisited((previous) => Math.max(previous, next)); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start" }); }); }
  function showErrors(nextErrors: DraftErrors) { setErrors(nextErrors); requestAnimationFrame(() => errorSummary.current?.focus()); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (photoBusy || leaving) return;
    if (step < 6) {
      const nextErrors = validateStep(content, step);
      if (Object.keys(nextErrors).length) { showErrors(nextErrors); return; }
      moveTo(step + 1); void persist(content, step + 1).catch(() => {}); return;
    }
    const incomplete = firstIncompleteStep(content);
    if (incomplete < 6) { moveTo(incomplete); showErrors(validateStep(content, incomplete)); return; }
    setLeaving(true);
    try { const draft = await persist(content, 6, true); router.push(`/jobs/${draft.id}`); } catch { setLeaving(false); }
  }
  async function saveAndExit() { setLeaving(true); try { const draft = await persist(content, step); router.push(`/jobs/${draft.id}`); } catch { setLeaving(false); } }
  async function saveCopy() {
    setLeaving(true);
    try {
      const now = new Date().toISOString();
      const copy = await writeLocalDraft({ id: crypto.randomUUID(), schemaVersion: 1, revision: 0, createdAt: now, updatedAt: now, status: "draft", lastStep: step, reviewed: false, content }, 0);
      router.push(`/jobs/${copy.id}`);
    } catch (error) {
      setLeaving(false);
      setSaveError(error instanceof DraftCapacityError ? error.message : "Your separate copy could not be saved. Your answers are still here. Keep this editor open, check device storage, and try again.");
    }
  }
  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    if (content.photos.length + files.length > 8) { setErrors((previous) => ({ ...previous, photos: "You can add up to 8 photos. Remove one before adding more." })); return; }
    setPhotoBusy(true); const added: Awaited<ReturnType<typeof preparePhoto>>[] = []; const failures: string[] = [];
    for (const file of Array.from(files)) { try { added.push(await preparePhoto(file)); } catch (error) { failures.push(error instanceof Error ? error.message : "A photo could not be read."); } }
    if (added.length) setContent((previous) => ({ ...previous, photos: [...previous.photos, ...added] }));
    setErrors((previous) => ({ ...previous, photos: failures.length ? `${failures.length} photo${failures.length === 1 ? " was" : "s were"} not added. ${failures[0]}` : undefined })); setPhotoBusy(false);
  }

  const draftForReview = { content };
  return <><PageHeading eyebrow="Your request, one step at a time" title="Post a job" description="A few details. A clearer request. Take it one step at a time."/><DraftStorageNotice hideError/>
    <div className="job-wizard-layout"><aside className="wizard-sidebar" aria-label="Job draft steps"><div className="wizard-progress-label"><span>YOUR REQUEST</span><span>{step + 1} of 7</span></div><progress max={7} value={step + 1} aria-label="Job draft progress"/><ol className="wizard-steps">{postingSteps.map((label, index) => <li key={label}><button type="button" aria-label={`${index + 1}. ${label}`} aria-current={step === index ? "step" : undefined} disabled={index > visited || leaving || photoBusy} onClick={() => moveTo(index)}><span className="wizard-step-number">{index < step ? <Icon name="check" size={14}/> : index + 1}</span><span>{label}</span></button></li>)}</ol><p className="draft-helper wizard-sidebar-note">This is just a draft.<br/>Your answers stay on this browser, and no providers are notified.</p></aside>
      <Card className="wizard-card"><form noValidate onSubmit={(event) => void submit(event)} aria-label="Local job draft" aria-busy={leaving || photoBusy}>
        <div className="wizard-card-header"><Badge tone="orange">Draft · local only</Badge><p className="wizard-save-status" role="status">{saveState === "saving" ? "Saving…" : saveState === "error" ? "Changes not saved" : hasUnsaved ? "Unsaved changes" : saveState === "saved" ? temporary ? "Kept in this tab" : "Saved on this browser" : "Ready when you are"}</p></div>
        <div className="wizard-step-content"><p className="eyebrow">Step {step + 1} / {postingSteps[step]}</p><h2 ref={heading} tabIndex={-1}>{stepTitles[step]}</h2><p className="wizard-description">{stepDescriptions[step]}</p>
          {Object.values(errors).some(Boolean) && <div ref={errorSummary} className="wizard-errors" tabIndex={-1} role="alert"><strong>A little more information is needed.</strong><ul>{Object.entries(errors).filter(([, message]) => message).map(([key, message]) => <li key={key}>{message}</li>)}</ul></div>}
          {saveError && <div className="mb-6"><Feedback title="Your last save needs attention" tone="error" live>{saveError}</Feedback>{conflicted && <div className="component-row mt-4"><Button variant="secondary" onClick={() => void saveCopy()} disabled={leaving}>Save a separate copy</Button><Button variant="ghost" onClick={() => window.location.reload()}>Reload latest (discard edits)</Button></div>}</div>}
          {step === 0 && <fieldset className="wizard-fieldset" aria-describedby={errors.category ? "category-error" : "category-hint"}><legend className="sr-only">Service category</legend><div className="category-options">{customerCategories.map((category) => <label key={category.slug} className="category-option"><input type="radio" name="category" value={category.slug} checked={content.category === category.slug} onChange={() => update("category", category.slug)}/><span className="service-icon"><Image src={`/icons/services/${category.slug}.svg`} alt="" width={26} height={26}/></span><span><strong>{category.label}</strong><small>{category.description}</small></span></label>)}</div><p id="category-hint" className="draft-helper mt-4">These are configurable preview categories, not confirmed launch services.</p>{errors.category && <p id="category-error" className="field-error mt-3">{errors.category}</p>}</fieldset>}
          {step === 1 && <div className="wizard-fields"><TextInput id="job-title" label="Give your request a title" placeholder="For example, fix a leaking kitchen tap" value={content.title} onChange={(event) => update("title", event.target.value)} maxLength={120} error={errors.title} hint="A short, specific title. 10–120 characters."/><div className="field"><label htmlFor="job-description">Describe what you need</label><textarea id="job-description" className="input" rows={6} placeholder="What’s happening? What would you like help with? Include any useful details about the work." value={content.description} onChange={(event) => update("description", event.target.value)} maxLength={5000} aria-invalid={!!errors.description} aria-describedby="description-hint"/><p id="description-hint" className={errors.description ? "field-error" : "field-hint"}>{errors.description || `${content.description.length}/5,000 characters · At least 30. Please leave out phone numbers, exact addresses and other private details.`}</p></div></div>}
          {step === 2 && <><div className="photo-picker"><span className="empty-icon"><Icon name="plus" size={24}/></span><label htmlFor="job-photos">Add photos of the job</label><p>JPG, PNG or WebP · up to 5 MB each · 8 photos maximum</p><input id="job-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={photoBusy || content.photos.length >= 8} onChange={(event) => { void addPhotos(event.target.files); event.target.value = ""; }} aria-describedby="photo-hint"/><p id="photo-hint">Photos stay on this device. We resize them and remove embedded metadata. Avoid faces, identity documents and address details.</p></div>{photoBusy && <LoadingState label="Preparing photos on this device…"/>}{errors.photos && <p className="field-error mt-3" role="alert">{errors.photos}</p>}<div className="draft-photo-grid wizard-photo-grid">{content.photos.map((photo, index) => <div className="photo-editor" key={photo.id}><PhotoPreview photo={photo} index={index}/><TextInput id={`photo-alt-${photo.id}`} label={`Photo ${index + 1} description (optional)`} value={photo.alt} maxLength={300} onChange={(event) => update("photos", content.photos.map((item) => item.id === photo.id ? { ...item, alt: event.target.value } : item))}/><Button variant="ghost" disabled={photoBusy} onClick={() => update("photos", content.photos.filter((item) => item.id !== photo.id))} aria-label={`Remove photo ${index + 1}`}>Remove photo</Button></div>)}</div></>}
          {step === 3 && <div className="wizard-fields"><div className="field"><label htmlFor="job-area">General service area</label><select id="job-area" className="input" value={content.area} onChange={(event) => update("area", event.target.value)} aria-invalid={!!errors.area} aria-describedby="area-hint"><option value="">Choose an area in Ibadan</option>{customerAreas.map((area) => <option key={area.slug} value={area.slug}>{area.label}</option>)}</select><p id="area-hint" className={errors.area ? "field-error" : "field-hint"}>{errors.area || "Preview areas only. This selection does not confirm provider coverage."}</p></div><Feedback title="Keep your location general.">You don’t need to share an exact address for a draft.</Feedback></div>}
          {step === 4 && <div className="wizard-fields"><fieldset className="wizard-fieldset" aria-describedby={errors.timing ? "timing-error" : undefined}><legend className="sr-only">Preferred timing</legend><div className="choice-options">{[{ value: "flexible", label: "I’m flexible", description: "There’s no particular rush." }, { value: "soon", label: "As soon as practical", description: "I’d like to get things moving." }, { value: "date", label: "I have a date in mind", description: "Choose a preferred day." }].map((option) => <label className="choice-option" key={option.value}><input type="radio" name="timing" value={option.value} checked={content.timing === option.value} onChange={() => update("timing", option.value as DraftContent["timing"])}/><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</div>{errors.timing && <p id="timing-error" className="field-error mt-3">{errors.timing}</p>}</fieldset>{content.timing === "date" && <TextInput id="preferred-date" type="date" label="Preferred date" min={localToday()} value={content.preferredDate} onChange={(event) => update("preferredDate", event.target.value)} error={errors.preferredDate} hint="A preferred date doesn’t reserve a provider."/>}</div>}
          {step === 5 && <div className="wizard-fields"><fieldset className="wizard-fieldset" aria-describedby={errors.budgetMode ? "budget-error" : undefined}><legend className="sr-only">Budget preference</legend><div className="choice-options">{[{ value: "quotes", label: "I need quotes", description: "I’m not sure what this should cost." }, { value: "range", label: "I have a budget range", description: "I have an amount in mind, in Nigerian naira." }].map((option) => <label className="choice-option" key={option.value}><input type="radio" name="budget" value={option.value} checked={content.budgetMode === option.value} onChange={() => update("budgetMode", option.value as DraftContent["budgetMode"])}/><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</div>{errors.budgetMode && <p id="budget-error" className="field-error mt-3">{errors.budgetMode}</p>}</fieldset>{content.budgetMode === "range" && <div className="budget-inputs"><TextInput id="budget-min" label="Minimum (NGN)" inputMode="decimal" placeholder="e.g. 15000" maxLength={12} value={content.budgetMin} onChange={(event) => update("budgetMin", event.target.value)} error={errors.budgetMin}/><TextInput id="budget-max" label="Maximum (NGN)" inputMode="decimal" placeholder="e.g. 25000" maxLength={12} value={content.budgetMax} onChange={(event) => update("budgetMax", event.target.value)} error={errors.budgetMax}/></div>}<p className="draft-helper">A budget is a preference, not a quotation or payment. No money changes hands in this preview.</p></div>}
          {step === 6 && <><DraftSummary draft={draftForReview} onEdit={moveTo}/><div className="mt-6"><Feedback title="You’re saving a draft, not publishing.">Your request stays {temporary ? "in this tab" : "on this browser"}. It won’t be shared with service providers.</Feedback></div></>}
        </div><div className="wizard-actions"><Button variant="ghost" disabled={step === 0 || leaving || photoBusy} onClick={() => moveTo(step - 1)}><Icon name="arrow-left" size={16}/>Back</Button><div><Button variant="secondary" disabled={leaving || photoBusy || conflicted} onClick={() => void saveAndExit()}>Save & exit</Button><Button type="submit" disabled={leaving || photoBusy || conflicted}>{leaving ? "Saving…" : step === 6 ? temporary ? "Keep for this tab" : "Save draft & view" : "Next"}<Icon name="arrow" size={16}/></Button></div></div>
      </form></Card></div></>;
}
