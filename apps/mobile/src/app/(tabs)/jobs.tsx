import { JobList } from '../../features/marketplace/lifecycle';
import {useBetaAccount} from '../../beta/account';
import {BetaSessionNotice,BetaWorkspace} from '../../beta/workspace';
import { useState } from 'react';
import { useRequests } from '../../data/requests';
import { StorageNotice } from '../../ui/request-parts';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { usePreview } from '../../data/preview-store';
import { colors as c } from '../../theme/tokens';
import { Badge, Button, EmptyState, Page, PreviewNotice, Type, Input } from '../../ui/primitives';
import { JobCard } from '../../ui/job-card';
import { Discovery } from '../../features/marketplace/discovery';
import { useMarketplace } from '../../data/marketplace';
import { OpportunityCard } from '../../features/marketplace/components';
export default function Jobs() {
  const beta=useBetaAccount();
  if(beta.status==='loading'||beta.status==='error')return <BetaSessionNotice/>;
  return beta.user?<BetaWorkspace/>:<LocalJobs/>;
}
function LocalJobs() {
  const { data } = usePreview(), router = useRouter(), customer = data.mode === 'customer', {drafts,ready}=useRequests(), [search,setSearch]=useState('');
  const market=useMarketplace();
  const records=[...drafts].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).filter(d=>`${d.content.title} ${d.content.description} ${d.content.category} ${d.content.area}`.toLowerCase().includes(search.trim().toLowerCase()));
  if (!customer) return <Discovery/>;
  return <Page title={customer ? 'My Jobs' : 'Find Jobs'} right={<Badge>LOCAL PREVIEW</Badge>}><Type variant="title" accessibilityRole="header" style={{ marginTop: 20 }}>{customer ? 'Your plans,\none place.' : 'Find your next\ngood job.'}</Type><Type color={c.muted} style={{ marginTop: 14, marginBottom: 26 }}>{customer ? 'Your source drafts and explicitly published previews. Everything stays on this device.' : 'Relevant requests will appear here when mobile job discovery is implemented.'}</Type>{customer ? <>{market.data.deliveries.length>0&&<View style={{marginBottom:24,gap:12}}><Type variant="section">Job progress</Type><JobList/></View>}{market.data.jobs.length>0&&<View style={{gap:12,marginBottom:24}}><Type variant="section">Local-preview requests</Type>{market.data.jobs.map(job=><OpportunityCard key={job.id} job={job} offers={market.data.offers.filter(o=>o.jobId===job.id&&o.status!=="draft").length}/>)}</View>}{!ready?<Type>Restoring your drafts…</Type>:drafts.length ? <><Input label="Search drafts" placeholder="Title, service or area" value={search} onChangeText={setSearch}/><View style={{height:16}}/><Badge tone="neutral">{drafts.length} local {drafts.length === 1 ? 'draft' : 'drafts'}</Badge><View style={{ height: 18 }}/>{records.map(item => <JobCard key={item.id} draft={item}/>)}{!records.length&&<Type>No drafts match this search. Try a different title or area.</Type>}</> : <EmptyState icon="briefcase" title="Make your first move." description="Choose a service to start a request. You can return to it in your workspace."/>}<Button label="Start a request" icon="plus" onPress={() => router.push('/post-job')} style={{ marginTop: 22 }}/></> : <EmptyState icon="search" title="Your feed starts with your skills." description="Services and coverage are not set yet. This stage does not include a live or sample job feed." action="See profile setup" onAction={() => router.push('/professional-setup')}/>}{customer?<StorageNotice/>:<PreviewNotice/>}</Page>;
}
