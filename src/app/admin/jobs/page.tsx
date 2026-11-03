import {OperationsPage} from "@/features/operations/components";
export default async function Page({searchParams}:{searchParams:Promise<{status?:string|string[]}>}){const {status}=await searchParams;return <OperationsPage view="jobs" initialFilter={typeof status==="string"?status:undefined}/>;}
