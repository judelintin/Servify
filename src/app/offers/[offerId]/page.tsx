import { CustomerOfferDetails } from "@/features/marketplace/customer-offers";
export const metadata = { title: "Offer details" };
export default async function Page({ params }: { params: Promise<{ offerId: string }> }) { const { offerId } = await params; return <CustomerOfferDetails offerId={offerId}/>; }
