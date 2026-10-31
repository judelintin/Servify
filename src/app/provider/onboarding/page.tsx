import { ProviderOnboarding } from "@/features/provider/provider-onboarding";
export const metadata = { title: "Provider onboarding" };
export default async function Page({ searchParams }: { searchParams: Promise<{ step?: string | string[] }> }) {
  const { step } = await searchParams;
  return <ProviderOnboarding requestedStep={typeof step === "string" && /^[0-5]$/.test(step) ? Number(step) : undefined}/>;
}
