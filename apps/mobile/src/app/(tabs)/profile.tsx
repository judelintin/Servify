import {useBetaAccount} from '../../beta/account';
import {BetaSessionNotice} from '../../beta/workspace';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { usePreview } from '../../data/preview-store';
import { colors as c } from '../../theme/tokens';
import { Pressable, Badge, Button, Icon, Page, PreviewNotice, Type } from '../../ui/primitives';
import { ProfessionalProfileScreen } from '../../features/professional/profile-screen';
export default function Profile() {
  const account=useBetaAccount(); const { data, storage } = usePreview(), router = useRouter(), customer = data.mode === 'customer';
  if(account.status==='loading'||account.status==='error')return <BetaSessionNotice/>;
  if (!customer) return <ProfessionalProfileScreen/>;
  return <Page title="Profile"><View style={s.identity}><View style={s.avatar}><Icon name={customer ? 'user' : 'tool'} size={30} color={c.blue}/></View><Type variant="heading" accessibilityRole="header" style={{ marginTop: 18 }}>{account.user?'Customer account':'Customer preview'}</Type><Type color={c.muted} style={{ marginTop: 7, textAlign: 'center' }}>{account.user?'Your signed-in customer workspace.':'Your local space to explore Servify.'}</Type><View style={{ marginTop: 14 }}><Badge tone="neutral">{account.user?'Signed in':'Signed out'}</Badge></View></View>
    <Button label={account.user?'Account & sign out':'Sign in'} variant="secondary" onPress={()=>router.push('/beta')}/><Pressable accessibilityRole="button" onPress={() => router.push('/switch-mode')} style={s.row}><View style={s.icon}><Icon name="repeat" color={c.blue}/></View><View style={{ flex: 1 }}><Type style={{ fontWeight: '600' }}>Switch your mode</Type><Type variant="caption" color={c.muted}>{customer ? 'Explore the professional workspace' : 'Explore the customer workspace'}</Type></View><Icon name="chevron-right" size={18} color={c.muted}/></Pressable>
    {!customer && <Button label="See professional profile setup" variant="secondary" icon="arrow-up-right" onPress={() => router.push('/professional-setup')} style={{ marginTop: 16 }}/>}<View style={s.information}><Type variant="eyebrow" color={c.muted}>ON THIS DEVICE</Type><Type style={{ marginTop: 16, fontWeight: '600' }}>{storage === 'device' ? 'Your mode is remembered here.' : 'Your mode lasts for this session.'}</Type><Type color={c.muted} style={{ marginTop: 10 }}>{account.user?'Role switching changes your tools, not your account or permissions. Device-local records remain shared within this app’s storage.':'Role switching changes the workspace. It does not sign you in or create secure account isolation.'}</Type><Type color={c.muted} style={{ marginTop: 12 }}>Local drafts and role preferences stay on this device. Sign in to use shared jobs, offers and conversations.</Type></View>{!account.user&&<PreviewNotice/>}
  </Page>;
}
const s = StyleSheet.create({ identity: { alignItems: 'center', paddingVertical: 32 }, avatar: { width: 80, height: 80, borderRadius: 28, backgroundColor: c.paleBlue, alignItems: 'center', justifyContent: 'center' }, row: { padding: 18, borderRadius: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.white, flexDirection: 'row', alignItems: 'center', gap: 14 }, icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.paleBlue, justifyContent: 'center', alignItems: 'center' }, information: { marginTop: 30, padding: 22, backgroundColor: c.neutral, borderRadius: 16 } });
