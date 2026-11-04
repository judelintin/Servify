import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { categoryById } from '../domain/catalog';
import type { RequestStarter } from '../domain/preview';
import { usePreview } from '../data/preview-store';
import { colors as c } from '../theme/tokens';
import { Pressable, Badge, Icon, Type } from './primitives';
export function JobCard({ starter }: { starter: RequestStarter }) {
  const router = useRouter(), category = categoryById(starter.category), { storage } = usePreview();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${category.label} request starter. Service selected, not posted. Edit service.`} onPress={() => router.push({ pathname: '/post-job', params: { id: starter.id } })} style={({ pressed }) => [styles.card, pressed && { opacity: .75 }]}><View style={styles.icon}><Icon name={category.icon} color={c.blue}/></View><View style={{ flex: 1, gap: 8 }}><Type style={{ fontWeight: '600' }}>{category.label} request</Type><Badge tone="neutral">Service selected · not posted</Badge><Type variant="caption" color={c.muted}>Step 1 of 7 · {storage === 'device' ? 'saved on device' : 'this session only'}</Type></View><Icon name="chevron-right" color={c.muted} size={18}/></Pressable>;
}
const styles = StyleSheet.create({ card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 18, gap: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: c.paleBlue, alignItems: 'center', justifyContent: 'center' } });
