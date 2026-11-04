import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, View } from 'react-native';
import { previewStore, usePreview } from '../../data/preview-store';
import { categoryById } from '../../domain/catalog';
import { colors as c } from '../../theme/tokens';
import { Badge, Button, EmptyState, Icon, Page, PreviewNotice, Type } from '../../ui/primitives';

export default function Details() {
  const { id } = useLocalSearchParams<{ id: string }>(), { data, storage } = usePreview(), router = useRouter(), [confirm, setConfirm] = useState(false);
  const starter = data.starters.find(item => item.id === id);
  function edit() { if (router.canGoBack()) router.back(); else router.replace({ pathname: '/post-job', params: { id } }); }
  if (!starter) return <Page title="Request starter" back><EmptyState title="Starter not found." description="This choice is no longer available on this device." action="My Jobs" onAction={() => router.replace('/jobs')}/></Page>;
  const category = categoryById(starter.category);
  return <Page title="Your request starter" back><View style={{ marginTop: 24 }}><Badge tone="orange">STEP 1 ONLY · NOT POSTED</Badge><Type variant="title" accessibilityRole="header" style={{ marginTop: 22 }}>You’ve made{`\n`}a start.</Type><Type color={c.muted} style={{ marginTop: 16 }}>The details come next. This is the stopping point for Mobile Stage 01.</Type></View><View style={{ backgroundColor: c.white, borderRadius: 18, padding: 26, marginVertical: 28, borderWidth: 1, borderColor: c.line }}><View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: c.paleBlue, alignItems: 'center', justifyContent: 'center' }}><Icon name={category.icon} color={c.blue} size={25}/></View><Type variant="heading" style={{ marginTop: 20 }}>{category.label}</Type><Type color={c.muted} style={{ marginTop: 10 }}>{category.description}</Type><View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 18, marginTop: 24 }}><Type variant="caption" color={c.blue}>{storage === 'device' ? 'Service choice saved on this device.' : 'Service choice kept for this session only.'}</Type><Type variant="caption" color={c.muted} style={{ marginTop: 8 }}>Nothing has been published or sent to a provider.</Type></View></View><Button label="Change service" icon="arrow-left" variant="secondary" onPress={edit}/><Button label="Save for later" icon="arrow-right" onPress={() => router.dismissTo('/home')} style={{ marginTop: 12 }}/><Button label="Discard this starter" variant="ghost" onPress={() => setConfirm(true)} style={{ marginTop: 12 }}/><PreviewNotice/>
    <Modal visible={confirm} transparent animationType="none" onRequestClose={() => setConfirm(false)}><View style={{ flex: 1, backgroundColor: '#151A2D80', justifyContent: 'center', alignItems: 'center', padding: 24 }}><View accessibilityViewIsModal style={{ backgroundColor: c.warm, padding: 26, borderRadius: 20, width: '100%', maxWidth: 400 }}><Type variant="heading" accessibilityRole="header">Discard this starter?</Type><Type color={c.muted} style={{ marginTop: 14, marginBottom: 24 }}>This removes only this service choice from the mobile preview.</Type><Button label="Keep starter" variant="secondary" onPress={() => setConfirm(false)}/><Button label="Discard starter" onPress={() => { void previewStore.removeStarter(starter.id); setConfirm(false); router.dismissTo('/jobs'); }} style={{ marginTop: 12, backgroundColor: c.error }}/></View></View></Modal>
  </Page>;
}
