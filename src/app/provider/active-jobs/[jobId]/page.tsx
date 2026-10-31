import { JobWorkspace } from "@/features/delivery/workspace";
export const metadata = { title: "Provider job workspace" };
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { const { jobId } = await params; return <JobWorkspace jobId={jobId} role="provider"/>; }
