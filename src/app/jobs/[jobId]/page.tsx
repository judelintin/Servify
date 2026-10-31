import { JobDetails } from "@/features/customer/job-details";
export const metadata = { title: "Job details" };
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { const { jobId } = await params; return <JobDetails draftId={jobId}/>; }
