import { StyleSheet, View } from 'react-native';
import { requestSteps } from '../domain/catalog';
import { colors as c } from '../theme/tokens';
import { Type } from './primitives';
export function RequestProgress({ step = 0 }: { step?: number }) { return <View style={{ marginTop: 8, marginBottom: 28 }} accessibilityRole="progressbar" accessibilityLabel="Job request progress" accessibilityValue={{ min: 1, max: 7, now: step+1, text: `Step ${step+1} of 7. ${requestSteps[step]}.` }} aria-valuemin={1} aria-valuemax={7} aria-valuenow={step+1} aria-valuetext={`Step ${step+1} of 7. ${requestSteps[step]}.`}><View style={s.label}><Type variant="eyebrow" color={c.blue}>STEP 0{step+1} / 07</Type><Type variant="caption" color={c.muted}>{requestSteps[step]}</Type></View><View style={s.track}>{requestSteps.map((label,i) => <View key={label} style={[s.segment, i <= step && { backgroundColor: c.blue }]}/>)}</View></View>; }
const s = StyleSheet.create({ label: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 14 }, track: { flexDirection: 'row', gap: 5 }, segment: { flex: 1, height: 4, backgroundColor: '#DDE2ED', borderRadius: 2 } });
