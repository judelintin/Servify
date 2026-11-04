import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { previewStore, usePreview } from '../data/preview-store';
import type { PreviewMode } from '../domain/preview';
import { colors as c } from '../theme/tokens';
import { Pressable, Badge, Icon, Page, PreviewNotice, Type } from '../ui/primitives';

export default function SwitchMode() {
  const { data } = usePreview(), router = useRouter(), [busy, setBusy] = useState(false);
  async function choose(mode: PreviewMode) { if (busy) return; setBusy(true); await previewStore.setMode(mode); router.replace('/home'); }
  return <Page title="Your Servify" back><View style={{ paddingTop: 24 }}><Badge tone="orange">ONE APP. TWO EXPERIENCES.</Badge><Type variant="title" accessibilityRole="header" style={{ marginTop: 24 }}>Which hat{`\n`}are you wearing?</Type><Type color={c.muted} style={{ marginTop: 16, marginBottom: 32 }}>Find help for a project, or build a space for your professional skills.</Type></View><View accessibilityRole="radiogroup" accessibilityLabel="Preview mode">{([{ mode: 'customer', icon: 'home', title: 'I need a hand.', label: 'Customer mode', copy: 'Prepare service requests and keep your plans together.' }, { mode: 'provider', icon: 'tool', title: 'I’m here to help.', label: 'Professional mode', copy: 'Explore a workspace built around your skills and future jobs.' }] as const).map(item => {
    const active = data.mode === item.mode;
    return <Pressable key={item.mode} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: active, disabled: busy }} accessibilityLabel={`Switch to ${item.mode === 'customer' ? 'Customer' : 'Professional'} mode`} onKeyboardSelect={() => void choose(item.mode)} onPress={() => void choose(item.mode)} style={({ pressed }) => [{ padding: 24, borderRadius: 18, borderWidth: active ? 2 : 1, borderColor: active ? c.blue : c.line, backgroundColor: active ? c.paleBlue : c.white, marginBottom: 16, opacity: pressed || busy ? .7 : 1 }]}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: active ? c.blue : c.paleBlue, alignItems: 'center', justifyContent: 'center' }}><Icon name={item.icon} color={active ? c.white : c.blue}/></View>{active ? <Icon name="check-circle" color={c.blue}/> : <Icon name="arrow-up-right" color={c.muted}/>}</View><Type variant="eyebrow" color={c.blue} style={{ marginTop: 22, fontSize: 9 }}>{item.label}</Type><Type variant="heading" style={{ marginTop: 8 }}>{item.title}</Type><Type color={c.muted} style={{ marginTop: 10 }}>{item.copy}</Type></Pressable>;
  })}</View><Type variant="caption" color={c.muted}>Both are clearly labelled preview identities. Switching modes does not authenticate you or securely isolate accounts.</Type><PreviewNotice/></Page>;
}
