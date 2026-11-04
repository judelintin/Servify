import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreview } from '../data/preview-store';
import { colors as c } from '../theme/tokens';
import { Pressable, Brand, Icon, Type, type IconName } from './primitives';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (alive) setReduced(value); }).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { alive = false; listener.remove(); };
  }, []);
  return reduced;
}
export function WorkspaceHeader() {
  const router = useRouter(), { data } = usePreview();
  return <View style={styles.header}><Brand/><Pressable accessibilityRole="button" accessibilityLabel={`Switch mode. Current mode: ${data.mode === 'customer' ? 'Customer' : 'Professional'}`} onPress={() => router.push('/switch-mode')} style={({ pressed }) => [styles.mode, pressed && { backgroundColor: c.line }]}><View style={styles.modeDot}/><Type variant="caption" style={{ fontWeight: '600' }}>{data.mode === 'customer' ? 'Customer' : 'Professional'}</Type><Icon name="chevron-down" size={14}/></Pressable></View>;
}
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
export function WorkspaceTabBar({ state, emitter, navigateToTab, descriptors }: TabBarProps) {
  const { data } = usePreview(), router = useRouter(), insets = useSafeAreaInsets();
  const customer = data.mode === 'customer';
  const items: Record<string, { label: string; icon: IconName }> = { home: { label: 'Home', icon: 'home' }, jobs: { label: customer ? 'My Jobs' : 'Find Jobs', icon: customer ? 'briefcase' : 'search' }, activity: { label: customer ? 'Post Job' : 'Offers', icon: customer ? 'plus' : 'file-text' }, messages: { label: 'Messages', icon: 'message-circle' }, profile: { label: 'Profile', icon: 'user' } };
  return <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">{state.routes.map((route, index) => {
    const item = items[route.name]; if (!item) return null;
    const action = route.name === 'activity' && customer, focused = state.index === index && !action;
    return <Pressable key={route.key} accessibilityRole={action ? 'button' : 'tab'} accessibilityLabel={item.label} accessibilityState={{ selected: focused }} onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key, data: undefined })} onPress={() => {
      if (action) { router.push('/post-job'); return; }
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true, data: undefined });
      if (!event.defaultPrevented && !focused) navigateToTab(route.key);
    }} style={({ pressed }) => [styles.tabItem, pressed && { opacity: .65 }]} testID={descriptors[route.key]?.options.tabBarButtonTestID ?? `tab-${route.name}`}><View style={[styles.tabIcon, action && styles.postIcon, focused && styles.focusedIcon]}><Icon name={item.icon} size={action ? 25 : 21} color={action ? c.white : focused ? c.blue : c.muted}/></View><Type style={[styles.tabLabel, { color: focused ? c.blue : c.muted, fontWeight: focused ? '600' : '500' }]}>{item.label}</Type></Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({
  header: { paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, mode: { minHeight: 40, paddingHorizontal: 12, backgroundColor: c.white, borderRadius: 999, borderWidth: 1, borderColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 7 }, modeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.orange },
  tabBar: { flexDirection: 'row', paddingTop: 10, paddingHorizontal: 9, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.line }, tabItem: { flex: 1, alignItems: 'center', minHeight: 58, gap: 4 }, tabIcon: { width: 43, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, postIcon: { height: 36, width: 43, backgroundColor: c.blue, marginTop: -3 }, focusedIcon: { backgroundColor: c.paleBlue }, tabLabel: { fontSize: 10, lineHeight: 15 },
});
