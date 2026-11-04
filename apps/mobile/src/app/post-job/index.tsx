import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { previewStore, usePreview } from '../../data/preview-store';
import { isCategory, type CategoryId } from '../../domain/catalog';
import { colors as c } from '../../theme/tokens';
import { Badge, Button, EmptyState, Page, Type } from '../../ui/primitives';
import { RequestProgress } from '../../ui/progress';
import { ServiceGrid } from '../../ui/service-card';

export default function PostJob() {
  const params = useLocalSearchParams<{ category?: string; id?: string }>(), router = useRouter(), insets = useSafeAreaInsets(), { data, storage } = usePreview();
  const existing = params.id ? data.starters.find(s => s.id === params.id) : undefined;
  const [selected, setSelected] = useState<CategoryId | undefined>(() => existing?.category ?? (isCategory(params.category) ? params.category : undefined));
  const [editingId, setEditingId] = useState(existing?.id), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const first = useRef<ComponentRef<typeof View>>(null);
  async function next() {
    if (!selected) { const message = 'Choose a service category to continue.'; setError(message); first.current?.focus(); if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(message); return; }
    setError(''); setBusy(true);
    try { const starter = await previewStore.saveStarter(selected, editingId); setEditingId(starter.id); router.push({ pathname: '/post-job/details', params: { id: starter.id } }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Your choice could not be kept. Please try again.'); }
    finally { setBusy(false); }
  }
  if (data.mode !== 'customer') return <Page title="Customer request" back><EmptyState icon="repeat" title="A different hat for this one." description="Switch to Customer mode to prepare a request. Your professional workspace will remain available." action="Choose your mode" onAction={() => router.push('/switch-mode')}/></Page>;
  if (params.id && !existing) return <Page title="Request starter" back><EmptyState title="Starter not found." description="It may have been removed on this device. No saved data has been replaced." action="Go to My Jobs" onAction={() => router.replace('/jobs')}/></Page>;
  return <Page title="Post a job" subtitle="A useful first step" back right={<Badge>LOCAL PREVIEW</Badge>} bottom={<View style={{ backgroundColor: c.warm, padding: 20, paddingBottom: Math.max(insets.bottom,16), borderTopWidth: 1, borderTopColor: c.line }}>{!!error && <Type color={c.error} variant="caption" accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ marginBottom: 12 }}>{error}</Type>}<View style={{ flexDirection: 'row', gap: 12 }}><Button label="Back" variant="secondary" onPress={() => router.canGoBack() ? router.back() : router.replace('/home')} style={{ flex: 1 }}/><Button label="Next" icon="arrow-right" busy={busy} onPress={() => void next()} style={{ flex: 2 }}/></View><Type variant="caption" color={c.muted} style={{ marginTop: 12, fontSize: 10, textAlign: 'center' }}>Next keeps your service choice {storage === 'device' ? 'on this device' : 'for this session'}. Nothing is posted.</Type></View>}>
    <RequestProgress/><Type variant="title" accessibilityRole="header">What needs{`\n`}a little attention?</Type><Type color={c.muted} style={{ marginTop: 14, marginBottom: 26 }}>Choose the closest match. You can come back and change it.</Type><ServiceGrid detailed selected={selected} firstRef={first} onSelect={value => { setSelected(value); setError(''); }}/><Type variant="caption" color={c.muted} style={{ marginTop: 22, fontSize: 11 }}>Only service selection is available in this stage. Photos, timing, budget and the remaining steps are not ready yet.</Type>
  </Page>;
}
