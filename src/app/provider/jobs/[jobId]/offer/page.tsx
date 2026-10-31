import { OfferEditor } from "@/features/marketplace/provider-offers";
export const metadata = { title: "Prepare an offer" };
export default async function Page({ params, searchParams }: { params: Promise<{ jobId: string }>; searchParams: Promise<{ offer?: string | string[] }> }) { const { jobId } = await params, { offer } = await searchParams; return <OfferEditor jobId={jobId} offerId={typeof offer === "string" ? offer : undefined}/>; }
