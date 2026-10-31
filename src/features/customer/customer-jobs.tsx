"use client";
import { useState } from "react";
import { ButtonLink, Card, EmptyState, LoadingState, PageHeading, TextInput } from "@/components/ui/primitives";
import { PreviewContext, PreviewJobList } from "@/features/marketplace/components";
import { useMarketplace } from "@/features/marketplace/use-marketplace";
import { categoryLabel } from "./config";
import { DraftList, DraftStorageNotice } from "./draft-components";
import { useLocalDrafts } from "./use-local-drafts";
export function CustomerJobs() {
  const source = useLocalDrafts(), market = useMarketplace(), [search, setSearch] = useState("");
  const drafts = source.drafts.filter(draft => !market.data.jobs.some(job => job.id === draft.id));
  const matches = (title: string, category: string, description: string) => `${title} ${categoryLabel(category)} ${description}`.toLowerCase().includes(search.trim().toLowerCase());
  const filtered = drafts.filter(draft => matches(draft.content.title, draft.content.category, draft.content.description));
  const jobs = market.data.jobs.filter(job => matches(job.request.content.title, job.request.content.category, job.request.content.description));
  const ready = source.ready && market.ready;
  return <><PageHeading eyebrow="Your workspace" title="My jobs" description="Private drafts and requests you explicitly shared with this browser's local preview." action={<ButtonLink href="/jobs/new" icon="plus">Post a job</ButtonLink>}/><DraftStorageNotice/><PreviewContext role="customer"/><Card><div className="draft-list-toolbar"><h2 id="draft-list-heading" tabIndex={-1}>Local drafts {ready && <span>({drafts.length})</span>}</h2><TextInput id="draft-search" type="search" label="Find a request" placeholder="Search your requests" value={search} onChange={event => setSearch(event.target.value)}/></div>{!ready ? <LoadingState label="Finding your local drafts…"/> : !filtered.length && search ? <EmptyState title="No matching drafts." description="Try a different title, detail or service category."/> : <DraftList drafts={filtered}/>}</Card><p className="draft-helper mt-4">Up to 25 source drafts per browser. Clearing browser data removes local records. They do not move between devices.</p><div className="section-heading market-results"><ButtonLink href="/customer/active-jobs" variant="secondary">Selected & active jobs</ButtonLink><h2>In the local preview {ready && <span>({market.data.jobs.length})</span>}</h2></div>{ready && <PreviewJobList jobs={jobs} data={market.data}/>}</>;
}
