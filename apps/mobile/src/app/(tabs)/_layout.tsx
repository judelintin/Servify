import { Tabs } from 'expo-router';
import { WorkspaceTabBar } from '../../ui/navigation';
export default function TabLayout() { return <Tabs backBehavior="history" tabBar={props => <WorkspaceTabBar {...props}/>} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#FFFBF5' } }}><Tabs.Screen name="home"/><Tabs.Screen name="jobs"/><Tabs.Screen name="activity"/><Tabs.Screen name="messages"/><Tabs.Screen name="profile"/></Tabs>; }
