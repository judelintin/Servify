import { JobWizard } from "@/features/customer/job-wizard";
export const metadata = { title: "Post a job" };
export default async function Page({ searchParams }: { searchParams: Promise<{ draft?: string | string[]; category?: string | string[] }> }) { const { draft, category } = await searchParams; return <JobWizard initialCategory={typeof category === "string" ? category : undefined} draftId={typeof draft === "string" ? draft : undefined}/>; }
