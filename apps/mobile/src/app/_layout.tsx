import { useWelcome } from '../data/welcome';
import { WelcomeFlow } from '../features/welcome/welcome-flow';
import Feather from '@expo/vector-icons/Feather';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { previewStore, usePreview } from '../data/preview-store';
import { colors } from '../theme/tokens';
import { useReducedMotion } from '../ui/navigation';

export default function RootLayout() {
  const [loaded, error] = useFonts({ InterTight: require('../../assets/fonts/InterTight-Variable.ttf'), ...Feather.font });
  const launch=useWelcome(),pathname=usePathname();
  const { ready } = usePreview(), reduced = useReducedMotion();
  useEffect(() => { void previewStore.hydrate(); }, []);
  return <SafeAreaProvider><View style={{ flex: 1, backgroundColor: '#E9EBEF', alignItems: 'center' }}><View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, backgroundColor: colors.warm }}><StatusBar style="dark"/>{(!loaded && !error) || !ready || !launch.ready ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}><ActivityIndicator color={colors.blue}/><Text>Preparing your mobile preview…</Text></View> : launch.phase!=='workspace' && pathname!=='/beta' ? <WelcomeFlow/> : <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.warm }, animation: reduced ? 'none' : 'slide_from_right' }}><Stack.Screen name="(tabs)"/><Stack.Screen name="index"/><Stack.Screen name="switch-mode" options={{ presentation: 'modal' }}/><Stack.Screen name="post-job/index"/><Stack.Screen name="post-job/details"/><Stack.Screen name="professional-setup"/></Stack>}</View></View></SafeAreaProvider>;
}
