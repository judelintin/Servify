import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { usePreview } from '../../data/preview-store';
import { colors as c } from '../../theme/tokens';
import { Badge, Button, EmptyState, Page, PreviewNotice, Type } from '../../ui/primitives';
import { JobCard } from '../../ui/job-card';
export default function Jobs() {
  const { data } = usePreview(), router = useRouter(), customer = data.mode === 'customer';
  return <Page title={customer ? 'My Jobs' : 'Find Jobs'} right={<Badge>LOCAL PREVIEW</Badge>}><Type variant="title" accessibilityRole="header" style={{ marginTop: 20 }}>{customer ? 'Your plans,\none place.' : 'Find your next\ngood job.'}</Type><Type color={c.muted} style={{ marginTop: 14, marginBottom: 26 }}>{customer ? 'A space for your request starters. Nothing here has been posted to providers.' : 'Relevant requests will appear here when mobile job discovery is implemented.'}</Type>{customer ? <>{data.starters.length ? <><Badge tone="neutral">{data.starters.length} request {data.starters.length === 1 ? 'starter' : 'starters'}</Badge><View style={{ height: 18 }}/>{data.starters.map(item => <JobCard key={item.id} starter={item}/>)}</> : <EmptyState icon="briefcase" title="Make your first move." description="Choose a service to start a request. You can return to it in your workspace."/>}<Button label="Start a request" icon="plus" onPress={() => router.push('/post-job')} style={{ marginTop: 22 }}/></> : <EmptyState icon="search" title="Your feed starts with your skills." description="Services and coverage are not set yet. This stage does not include a live or sample job feed." action="See profile setup" onAction={() => router.push('/professional-setup')}/>}<PreviewNotice/></Page>;
}
