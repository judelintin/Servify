import { ProviderOfferDetails } from "@/features/marketplace/provider-offers";
export const metadata = { title: "Your offer" };
export default async function Page({ params }: { params: Promise<{ offerId: string }> }) { const { offerId } = await params; return <ProviderOfferDetails offerId={offerId}/>; }
