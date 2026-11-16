import {requireMobileApp} from '@/lib/server/website-access';
import { WorkspaceShell } from "@/components/shells/workspace-shell";
export default function Layout({ children }: { children: React.ReactNode }) { requireMobileApp(); return <WorkspaceShell role="provider">{children}</WorkspaceShell>; }
