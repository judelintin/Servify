import { StyleSheet, View } from 'react-native';
import { requestSteps } from '../domain/catalog';
import { colors as c } from '../theme/tokens';
import { Type } from './primitives';
export function RequestProgress() { return <View style={{ marginTop: 8, marginBottom: 28 }} accessibilityRole="progressbar" accessibilityLabel="Job request progress" accessibilityValue={{ min: 1, max: 7, now: 1, text: 'Step 1 of 7. Choose a service. Only Step 1 is available.' }} aria-valuemin={1} aria-valuemax={7} aria-valuenow={1} aria-valuetext="Step 1 of 7. Choose a service. Only Step 1 is available."><View style={s.label}><Type variant="eyebrow" color={c.blue}>STEP 01 / 07</Type><Type variant="caption" color={c.muted}>Choose a service</Type></View><View style={s.track}>{requestSteps.map((step,i) => <View key={step} style={[s.segment, i === 0 && { backgroundColor: c.blue }]}/>)}</View></View>; }
const s = StyleSheet.create({ label: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 14 }, track: { flexDirection: 'row', gap: 5 }, segment: { flex: 1, height: 4, backgroundColor: '#DDE2ED', borderRadius: 2 } });
