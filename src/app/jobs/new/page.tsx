import { JobWizard } from "@/features/customer/job-wizard";
export const metadata = { title: "Post a job" };
export default async function Page({ searchParams }: { searchParams: Promise<{ draft?: string | string[] }> }) { const { draft } = await searchParams; return <JobWizard draftId={typeof draft === "string" ? draft : undefined}/>; }
