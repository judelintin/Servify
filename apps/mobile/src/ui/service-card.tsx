import type { ComponentRef, Ref } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { categories, type CategoryId } from '../domain/catalog';
import { colors as c } from '../theme/tokens';
import { Pressable, Icon, Type } from './primitives';

export function ServiceGrid({ selected, onSelect, detailed = false, firstRef }: { selected?: CategoryId; onSelect: (id: CategoryId) => void; detailed?: boolean; firstRef?: Ref<ComponentRef<typeof View>> }) {
  const { width } = useWindowDimensions(), columns = detailed || width < 350 ? 2 : 3;
  return <View style={styles.grid} accessibilityRole={detailed ? 'radiogroup' : undefined} accessibilityLabel={detailed ? 'Choose a service category' : 'Explore service categories'}>{categories.map((category, index) => {
    const active = selected === category.slug;
    return <Pressable key={category.slug} ref={index === 0 ? firstRef : undefined} accessibilityRole={detailed ? 'radio' : 'button'} accessibilityState={detailed ? { checked: active } : undefined} accessibilityLabel={category.label} onKeyboardSelect={detailed ? () => onSelect(category.slug) : undefined} accessibilityHint={detailed ? category.description : 'Start a request for this service'} onPress={() => onSelect(category.slug)} style={({ pressed }) => [styles.card, { width: columns === 2 ? '48%' : '31%', minHeight: detailed ? 148 : 116 }, active && styles.selected, pressed && { opacity: .75 }]}><View style={[styles.icon, detailed && { marginBottom: 12 }, active && { backgroundColor: c.blue }]}><Icon name={category.icon} color={active ? c.white : c.blue} size={22}/></View>{detailed && <View style={[styles.radio, active && { borderColor: c.blue, backgroundColor: c.blue }]}>{active && <Icon name="check" size={11} color={c.white}/>}</View>}<Type style={[styles.label, active && { color: c.blue }]}>{category.label}</Type>{detailed && <Type variant="caption" color={c.muted} style={{ fontSize: 11, lineHeight: 16, marginTop: 7 }}>{category.description}</Type>}</Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }, card: { borderWidth: 1, borderColor: c.line, backgroundColor: c.white, borderRadius: 15, padding: 15, position: 'relative' }, selected: { borderColor: c.blue, backgroundColor: '#F0F3FF', borderWidth: 2, padding: 14 }, icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.paleBlue, marginBottom: 14 }, label: { fontSize: 12, lineHeight: 17, fontWeight: '600', letterSpacing: -.1 }, radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#A8AFBF', position: 'absolute', right: 12, top: 15, justifyContent: 'center', alignItems: 'center' },
});
