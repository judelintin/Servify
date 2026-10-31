"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ProviderConflictError, saveProviderProfile } from "@/data/local-provider";
import { Badge, Button, Card, EmptyState, LoadingState, PageHeading, TextInput } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { PhotoPreview } from "@/features/customer/draft-components";
import { providerAreas, providerCategories, providerSteps, specializations } from "./config";
import { emptyProvider, nextProviderStep, providerSignature, validateProviderStep, type LocalProviderProfile, type ProviderContent, type ProviderErrors } from "./profile-model";
import { ProviderPhotoManager, ProviderStorageNotice, ProviderSummary } from "./provider-components";
import { useProviderProfile } from "./use-provider-profile";

const titles = ["A good introduction starts with you.", "Make your skills easy to understand.", "Where do you work?", "Tell the story of your work.", "Let your work speak for itself.", "Your professional introduction, together."];
const descriptions = ["Choose how you work and the name customers would know you by. A profile photo is optional.", "Select the services you offer. These are provisional categories, not a confirmed launch catalogue.", "Choose general areas you can serve in Ibadan. This is a preference, not confirmed marketplace coverage.", "A short, clear introduction helps explain your experience and approach.", "Add work samples you have permission to share. You can skip this and add photos later.", "Check your details. Saving a profile does not publish it, verify your identity or notify customers."];
export function ProviderOnboarding({ requestedStep }: { requestedStep?: number }) {
  const state = useProviderProfile();
  return <><PageHeading eyebrow="Servify for Pros / Your introduction" title="Build your professional profile" description="Your experience. Your skills. A profile that feels like you."/><ProviderStorageNotice/>{!state.ready ? <LoadingState label="Preparing your local provider profile…"/> : state.unreadable ? <Card><EmptyState icon="info" title="Your saved profile needs attention." description="The saved record has been left untouched. Close older tabs and reload after storage recovery before making changes." action={<Button onClick={() => window.location.reload()}>Reload profile</Button>}/></Card> : <ProfileEditor initialProfile={state.profile} requestedStep={requestedStep} temporary={state.mode === "memory"}/>}</>;
}
function ProfileEditor({ initialProfile, requestedStep, temporary }: { initialProfile: LocalProviderProfile | null; requestedStep?: number; temporary: boolean }) {
  const router = useRouter();
  const start = requestedStep !== undefined && Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep <= 5 ? requestedStep : initialProfile?.lastStep ?? 0;
  const [content, setContent] = useState<ProviderContent>(() => initialProfile?.content ?? emptyProvider());
  const [step, setStep] = useState(start), [visited, setVisited] = useState(Math.max(start, initialProfile?.lastStep ?? 0));
  const [createdAt] = useState(initialProfile?.createdAt ?? new Date().toISOString());
  const [errors, setErrors] = useState<ProviderErrors>({}), [saveError, setSaveError] = useState("");
  const [saveState, setSaveState] = useState(initialProfile ? "saved" : "idle");
  const [busy, setBusy] = useState(false), [leaving, setLeaving] = useState(false), [conflicted, setConflicted] = useState(false);
  const signature = providerSignature(content, step);
  const [savedSignature, setSavedSignature] = useState(signature);
  const saved = useRef(signature), revision = useRef(initialProfile?.revision ?? 0), conflict = useRef(false);
  const latest = useRef({ content, step });
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const heading = useRef<HTMLHeadingElement>(null), summary = useRef<HTMLDivElement>(null);
  const unsaved = signature !== savedSignature;
  useEffect(() => { latest.current = { content, step }; }, [content, step]);
  const persist = useCallback((answers: ProviderContent, atStep: number, reviewed = false) => {
    const task = queue.current.catch(() => {}).then(async () => {
      if (conflict.current) throw new ProviderConflictError();
      setSaveState("saving");
      try {
        const profile = await saveProviderProfile({ id: "local-provider", schemaVersion: 1, revision: revision.current, createdAt, updatedAt: new Date().toISOString(), lastStep: atStep, reviewed, content: answers }, revision.current);
        revision.current = profile.revision; saved.current = providerSignature(answers, atStep);
        setSavedSignature(saved.current); setSaveState("saved"); setSaveError(""); return profile;
      } catch (failure) {
        if (failure instanceof ProviderConflictError) { conflict.current = true; setConflicted(true); }
        setSaveState("error"); setSaveError(failure instanceof ProviderConflictError ? failure.message : "The last save did not finish. Your current answers are still here. Keep this page open, check browser storage, then try Save & exit again.");
        throw failure;
      }
    });
    queue.current = task; return task;
  }, [createdAt]);
  useEffect(() => {
    if (!unsaved || busy || conflicted) return;
    const timer = setTimeout(() => { void persist(content, step).catch(() => {}); }, 650);
    return () => clearTimeout(timer);
  }, [content, step, unsaved, busy, conflicted, persist]);
  useEffect(() => () => {
    const current = latest.current;
    if (!conflict.current && providerSignature(current.content, current.step) !== saved.current) void persist(current.content, current.step).catch(() => {});
  }, [persist]);
  useEffect(() => {
    if (!unsaved && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved, busy]);
  function update<K extends keyof ProviderContent>(key: K, value: ProviderContent[K]) {
    setContent(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined }));
  }
  function toggleCategory(slug: string) {
    const categories = content.categories.includes(slug) ? content.categories.filter(value => value !== slug) : [...content.categories, slug];
    setContent(previous => ({ ...previous, categories, specializations: previous.specializations.filter(value => categories.some(category => specializations[category]?.includes(value))) }));
    setErrors(previous => ({ ...previous, categories: undefined, specializations: undefined }));
  }
  function moveTo(next: number) {
    setErrors({}); setStep(next); setVisited(previous => Math.max(previous, next));
    window.history.replaceState(null, "", `/provider/onboarding?step=${next}`);
    requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start" }); });
  }
  function showErrors(next: ProviderErrors) { setErrors(next); requestAnimationFrame(() => summary.current?.focus()); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || leaving || conflicted) return;
    if (step < 5) {
      const nextErrors = validateProviderStep(content, step);
      if (Object.keys(nextErrors).length) { showErrors(nextErrors); return; }
      moveTo(step + 1); void persist(content, step + 1).catch(() => {}); return;
    }
    const next = nextProviderStep(content);
    if (next < 5) { moveTo(next); showErrors(validateProviderStep(content, next)); return; }
    setLeaving(true);
    try { await persist(content, 5, true); router.push("/provider/profile"); } catch { setLeaving(false); }
  }
  async function saveAndExit() {
    setLeaving(true); try { await persist(content, step); router.push("/provider/profile"); } catch { setLeaving(false); }
  }
  return <div className="job-wizard-layout provider-onboarding"><aside className="wizard-sidebar" aria-label="Provider profile steps"><div className="wizard-progress-label"><span>YOUR PROFILE</span><span>{step + 1} of 6</span></div><progress max={6} value={step + 1} aria-label="Provider onboarding progress"/><ol className="wizard-steps">{providerSteps.map((label, index) => <li key={label}><button type="button" disabled={index > visited || busy || leaving} aria-current={step === index ? "step" : undefined} aria-label={`${index + 1}. ${label}`} onClick={() => moveTo(index)}><span className="wizard-step-number">{index < step ? <Icon name="check" size={14}/> : index + 1}</span><span>{label}</span></button></li>)}</ol><p className="draft-helper wizard-sidebar-note">Your profile is a local preview, not an application for verification or a published listing.</p></aside><Card className="wizard-card"><form noValidate aria-label="Local provider profile" onSubmit={event => void submit(event)} aria-busy={busy || leaving}><div className="wizard-card-header"><Badge tone="blue">Profile · local preview</Badge><span role="status" className="provider-save-status wizard-save-status">{saveState === "saving" ? "Saving…" : saveState === "error" ? "Changes not saved" : unsaved ? "Unsaved changes" : saveState === "saved" ? temporary ? "Kept in this tab" : "Saved on this browser" : "Ready when you are"}</span></div><div className="wizard-step-content"><p className="eyebrow">Step {step + 1} / {providerSteps[step]}</p><h2 ref={heading} tabIndex={-1}>{titles[step]}</h2><p className="wizard-description">{descriptions[step]}</p>{Object.values(errors).some(Boolean) && <div ref={summary} className="wizard-errors" role="alert" tabIndex={-1}><strong>A little more information is needed.</strong><ul>{Object.entries(errors).map(([key, message]) => message && <li key={key}>{message}</li>)}</ul></div>}{saveError && <div className="wizard-errors" role="alert"><strong>Your profile has not been saved.</strong><p>{saveError}</p>{conflicted && <Button variant="secondary" onClick={() => window.location.reload()}>Reload latest profile (discard unsaved edits)</Button>}</div>}<fieldset className="wizard-fieldset" disabled={busy || leaving}>
      {step === 0 && <div className="wizard-fields"><fieldset className="wizard-fieldset" aria-describedby={errors.type ? "provider-type-error" : undefined}><legend className="provider-field-label">How do you work?</legend><div className="choice-options provider-type-options">{[{ value: "individual", title: "Individual professional", description: "I provide services in my own professional capacity." }, { value: "business", title: "Small business", description: "I represent a small service business or team." }].map(option => <label className="choice-option" key={option.value}><input type="radio" name="provider-type" value={option.value} checked={content.type === option.value} onChange={() => update("type", option.value as ProviderContent["type"])}/><span><strong>{option.title}</strong><small>{option.description}</small></span></label>)}</div>{errors.type && <p className="field-error mt-3" id="provider-type-error">{errors.type}</p>}</fieldset><TextInput id="provider-name" label="Professional or business name" value={content.name} maxLength={100} onChange={event => update("name", event.target.value)} error={errors.name} hint="Use the professional name you want to introduce. No phone number or exact address."/><ProviderPhotoManager kind="profile" photos={content.photo ? [content.photo] : []} onChange={photos => update("photo", photos[0] ?? null)} busy={busy} onBusy={setBusy}/></div>}
      {step === 1 && <div className="wizard-fields"><fieldset className="wizard-fieldset" aria-describedby={errors.categories ? "provider-categories-error" : "provider-categories-hint"}><legend className="provider-field-label">Services you offer</legend><p className="field-hint" id="provider-categories-hint">Choose all that apply. Launch categories are still being validated.</p><div className="provider-category-options">{providerCategories.map(category => <label className="choice-option" key={category.slug}><input type="checkbox" checked={content.categories.includes(category.slug)} onChange={() => toggleCategory(category.slug)}/><span><strong>{category.label}</strong><small>{category.description}</small></span></label>)}</div>{errors.categories && <p id="provider-categories-error" className="field-error mt-3">{errors.categories}</p>}</fieldset>{content.categories.length > 0 && <fieldset className="wizard-fieldset"><legend className="provider-field-label">Specializations (optional)</legend><div className="provider-checkbox-list">{content.categories.flatMap(slug => (specializations[slug] ?? []).map(value => <label key={`${slug}-${value}`}><input type="checkbox" checked={content.specializations.includes(value)} onChange={() => update("specializations", content.specializations.includes(value) ? content.specializations.filter(item => item !== value) : [...content.specializations, value])}/>{value}</label>))}</div></fieldset>}<TextInput id="provider-experience" label="Years of experience" inputMode="numeric" value={content.experience} maxLength={2} onChange={event => update("experience", event.target.value)} error={errors.experience} hint="Whole years from 0 to 60. Enter 0 if you are just starting."/></div>}
      {step === 2 && <fieldset className="wizard-fieldset" aria-describedby={errors.areas ? "provider-areas-error" : "provider-areas-hint"}><legend className="provider-field-label">Your service areas in Ibadan</legend><p id="provider-areas-hint" className="field-hint">Select all general areas you can serve. An exact address is not needed, and coverage is not confirmed for launch.</p><div className="provider-area-options">{providerAreas.map(area => <label className="choice-option" key={area.slug}><input type="checkbox" checked={content.areas.includes(area.slug)} onChange={() => update("areas", content.areas.includes(area.slug) ? content.areas.filter(value => value !== area.slug) : [...content.areas, area.slug])}/><strong>{area.label}</strong></label>)}</div>{errors.areas && <p className="field-error mt-3" id="provider-areas-error">{errors.areas}</p>}</fieldset>}
      {step === 3 && <div className="field"><label htmlFor="provider-bio">Professional introduction</label><textarea id="provider-bio" className="input" rows={7} maxLength={1200} value={content.bio} onChange={event => update("bio", event.target.value)} aria-invalid={!!errors.bio} aria-describedby="provider-bio-hint" placeholder="Describe the work you do, your approach and the experience you bring."/><p id="provider-bio-hint" className={errors.bio ? "field-error" : "field-hint"}>{errors.bio || `${content.bio.length}/1,200 characters · At least 30. Avoid phone numbers, exact addresses and private information.`}</p></div>}
      {step === 4 && <ProviderPhotoManager kind="portfolio" photos={content.portfolio} onChange={photos => update("portfolio", photos)} busy={busy} onBusy={setBusy}/>}
      {step === 5 && <><div className="provider-review-photo">{content.photo ? <><span className="provider-small-avatar"><ProviderAvatar content={content}/></span><p className="draft-helper">Profile photo added · local preview</p></> : <p className="draft-helper">No profile photo. Adding one is optional.</p>}</div><ProviderSummary content={content} onEdit={moveTo}/><p className="provider-review-note">Saving keeps this profile {temporary ? "in this tab only" : "on this browser"}. It does not make your profile public or submit it for verification.</p></>}
      </fieldset></div><div className="wizard-actions"><Button variant="ghost" disabled={step === 0 || busy || leaving} onClick={() => moveTo(step - 1)}><Icon name="arrow-left" size={16}/>Back</Button><div><Button variant="secondary" disabled={busy || leaving || conflicted} onClick={() => void saveAndExit()}>Save & exit</Button><Button type="submit" disabled={busy || leaving || conflicted}>{leaving ? "Saving…" : step === 5 ? temporary ? "Keep for this tab" : "Save profile & view" : "Next"}<Icon name="arrow" size={16}/></Button></div></div></form></Card></div>;
}
// Shared Blob URL lifecycle comes from the existing local image preview component.
function ProviderAvatar({ content }: { content: ProviderContent }) { return content.photo ? <PhotoPreview photo={{ ...content.photo, alt: "Profile photo preview" }}/> : null; }
