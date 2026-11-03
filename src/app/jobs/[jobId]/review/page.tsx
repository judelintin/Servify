import { Reviews } from "@/features/trust/components"; export default async function Page({params}:{params:Promise<{jobId:string}>}){const {jobId}=await params;return <Reviews jobId={jobId}/>;}
