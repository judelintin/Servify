import { useState } from 'react';
import { useRequests } from '../../data/requests';
import { StorageNotice } from '../../ui/request-parts';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { usePreview } from '../../data/preview-store';
import { colors as c } from '../../theme/tokens';
import { Badge, Button, EmptyState, Page, PreviewNotice, Type, Input } from '../../ui/primitives';
import { JobCard } from '../../ui/job-card';
export default function Jobs() {
  const { data } = usePreview(), router = useRouter(), customer = data.mode === 'customer', {drafts,ready}=useRequests(), [search,setSearch]=useState('');
  const records=[...drafts].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).filter(d=>`${d.content.title} ${d.content.description} ${d.content.category} ${d.content.area}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <Page title={customer ? 'My Jobs' : 'Find Jobs'} right={<Badge>LOCAL PREVIEW</Badge>}><Type variant="title" accessibilityRole="header" style={{ marginTop: 20 }}>{customer ? 'Your plans,\none place.' : 'Find your next\ngood job.'}</Type><Type color={c.muted} style={{ marginTop: 14, marginBottom: 26 }}>{customer ? 'Your saved drafts, only on this device. Nothing here has been posted to providers.' : 'Relevant requests will appear here when mobile job discovery is implemented.'}</Type>{customer ? <>{!ready?<Type>Restoring your drafts…</Type>:drafts.length ? <><Input label="Search drafts" placeholder="Title, service or area" value={search} onChangeText={setSearch}/><View style={{height:16}}/><Badge tone="neutral">{drafts.length} local {drafts.length === 1 ? 'draft' : 'drafts'}</Badge><View style={{ height: 18 }}/>{records.map(item => <JobCard key={item.id} draft={item}/>)}{!records.length&&<Type>No drafts match this search. Try a different title or area.</Type>}</> : <EmptyState icon="briefcase" title="Make your first move." description="Choose a service to start a request. You can return to it in your workspace."/>}<Button label="Start a request" icon="plus" onPress={() => router.push('/post-job')} style={{ marginTop: 22 }}/></> : <EmptyState icon="search" title="Your feed starts with your skills." description="Services and coverage are not set yet. This stage does not include a live or sample job feed." action="See profile setup" onAction={() => router.push('/professional-setup')}/>}{customer?<StorageNotice/>:<PreviewNotice/>}</Page>;
}
