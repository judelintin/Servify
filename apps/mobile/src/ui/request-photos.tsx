import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { Photo } from '../domain/requests';
import { colors as c } from '../theme/tokens';
import { Icon, Pressable, Type } from './primitives';
import { PhotoPreview } from './request-parts';

/** Presentation for the Photos step only; selection and persistence stay with the form. */
export function RequestPhotos({ photos, busy, onAdd, onReplace, onRemove }: {
  photos: Photo[];
  busy: boolean;
  onAdd: () => void;
  onReplace: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  return <View style={s.section}>
    {photos.length ? photos.map((photo, index) => <View key={photo.id} style={s.card}>
      <View style={s.preview}><PhotoPreview photo={photo}/></View>
      <View style={s.details}>
        <Type style={s.label}>Photo {index + 1}</Type>
        <Type variant="caption" color={c.muted}>Only on this device</Type>
        <View style={s.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Replace photo ${index + 1}`} accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => onReplace(index)} style={({ pressed }) => [s.action, pressed && s.pressed, busy && s.disabled]}>
            <Type variant="caption" color={c.blue} style={s.actionLabel}>Replace</Type>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${index + 1}`} accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => onRemove(index)} style={({ pressed }) => [s.action, pressed && s.pressed, busy && s.disabled]}>
            <Type variant="caption" color={c.error} style={s.actionLabel}>Remove</Type>
          </Pressable>
        </View>
      </View>
    </View>) : <View style={s.empty}>
      <View style={s.emptyIcon}><Icon name="image" color={c.blue} size={22}/></View>
      <View style={{ flex: 1 }}><Type style={s.label}>A little context helps.</Type><Type variant="caption" color={c.muted} style={{ marginTop: 4 }}>Add a clear view of the work, or continue without photos.</Type></View>
    </View>}
    <View style={s.uploadRow}>
      {photos.length < 8 ? <Pressable accessibilityRole="button" accessibilityLabel="Add photos" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={onAdd} style={({ pressed }) => [s.upload, pressed && s.pressed, busy && s.disabled]}>
        {busy ? <ActivityIndicator size="small" color={c.blue}/> : <Icon name="plus" size={18} color={c.blue}/>}
        <Type color={c.blue} style={s.label}>{busy ? 'Preparing photos…' : 'Add photos'}</Type>
      </Pressable> : <Type variant="caption" color={c.muted}>Photo limit reached</Type>}
      <Type variant="caption" color={c.muted} accessibilityLiveRegion="polite">{photos.length}/8 photos</Type>
    </View>
    <Type variant="caption" color={c.muted} style={s.help}>Up to 10 MB each · resized and saved locally.{`\n`}Avoid faces, ID documents and private information.</Type>
  </View>;
}

const s = StyleSheet.create({
  section: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: c.line, borderRadius: 16, backgroundColor: c.white },
  preview: { width: 96, flexShrink: 0 },
  details: { flex: 1, minWidth: 0, gap: 2 },
  label: { fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 4, marginLeft: -4, marginTop: 2 },
  action: { minWidth: 58, minHeight: 44, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  actionLabel: { fontWeight: '600' },
  pressed: { backgroundColor: c.paleBlue },
  disabled: { opacity: .5 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CCD4E8', borderRadius: 16 },
  emptyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.paleBlue, alignItems: 'center', justifyContent: 'center' },
  uploadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  upload: { minHeight: 48, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, borderRadius: 10 },
  help: { fontSize: 11, lineHeight: 17 },
});
