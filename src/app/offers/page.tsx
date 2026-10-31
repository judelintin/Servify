import { CustomerOffers } from "@/features/marketplace/customer-offers";
export const metadata = { title: "Offers" };
export default async function Page({ searchParams }: { searchParams: Promise<{ job?: string | string[] }> }) { const { job } = await searchParams; return <CustomerOffers initialJobId={typeof job === "string" ? job : undefined}/>; }
