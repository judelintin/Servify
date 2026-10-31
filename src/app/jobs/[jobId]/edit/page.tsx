import { JobWizard } from "@/features/customer/job-wizard";
export const metadata = { title: "Edit local draft" };
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { const { jobId } = await params; return <JobWizard draftId={jobId}/>; }
