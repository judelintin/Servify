import {AssessmentRequest} from "@/features/operations/components";
import { ProviderVerification } from "@/features/provider/provider-verification";
export const metadata = { title: "Provider verification" };
export default function Page() { return <><ProviderVerification/><AssessmentRequest/></>; }
