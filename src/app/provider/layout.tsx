import { WorkspaceShell } from "@/components/shells/workspace-shell";
export default function Layout({ children }: { children: React.ReactNode }) { return <WorkspaceShell role="provider">{children}</WorkspaceShell>; }
