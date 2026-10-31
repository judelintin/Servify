import { JobConversation } from "@/features/delivery/messaging";
export const metadata = { title: "Job conversation" };
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { const { jobId } = await params; return <JobConversation jobId={jobId} role="provider"/>; }
