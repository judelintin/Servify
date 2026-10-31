import { ProviderJobDetails } from "@/features/marketplace/provider-jobs";
export const metadata = { title: "Available request" };
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { const { jobId } = await params; return <ProviderJobDetails jobId={jobId}/>; }
