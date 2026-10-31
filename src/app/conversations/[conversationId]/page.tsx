import { JobConversation } from "@/features/delivery/messaging";
export const metadata = { title: "Job conversation" };
export default async function Page({ params }: { params: Promise<{ conversationId: string }> }) { const { conversationId } = await params; return <JobConversation jobId={conversationId} role="customer"/>; }
