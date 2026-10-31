"use client";
import { useState } from "react";
import { ButtonLink, Card, EmptyState, LoadingState, PageHeading, TextInput } from "@/components/ui/primitives";
import { categoryLabel } from "./config";
import { DraftList, DraftStorageNotice } from "./draft-components";
import { useLocalDrafts } from "./use-local-drafts";

export function CustomerJobs() {
  const { drafts, ready } = useLocalDrafts(); const [search, setSearch] = useState("");
  const filtered = drafts.filter((draft) => `${draft.content.title} ${categoryLabel(draft.content.category)} ${draft.content.description}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <><PageHeading eyebrow="Your workspace" title="My jobs" description="Your own ideas and to-dos, saved as drafts on this browser." action={<ButtonLink href="/jobs/new" icon="plus">Post a job</ButtonLink>}/><DraftStorageNotice/><Card><div className="draft-list-toolbar"><h2 id="draft-list-heading" tabIndex={-1}>Local drafts {ready && <span>({drafts.length})</span>}</h2><TextInput id="draft-search" type="search" label="Find a draft" placeholder="Search your requests" value={search} onChange={(event) => setSearch(event.target.value)}/></div>{!ready ? <LoadingState label="Finding your local drafts…"/> : !filtered.length && search ? <EmptyState title="No matching drafts." description="Try a different title, detail or service category."/> : <DraftList drafts={filtered}/>}</Card><p className="draft-helper mt-4">Up to 25 drafts per browser. Clearing browser data removes them. Drafts do not move between devices.</p></>;
}
