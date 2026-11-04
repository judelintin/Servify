import { useRouter } from 'expo-router';
import { EmptyState, Page } from '../ui/primitives';
export default function NotFound() { const router = useRouter(); return <Page title="Page not found" back><EmptyState title="Let’s find your way back." description="This screen is not part of the mobile preview." action="Go home" onAction={() => router.replace('/home')}/></Page>; }
