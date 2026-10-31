import { PublishPreview } from "@/features/marketplace/customer-jobs";
export const metadata = { title: "Review & publish to preview" };
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { const { jobId } = await params; return <PublishPreview draftId={jobId}/>; }
