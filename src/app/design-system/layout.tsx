import {requirePrivateAdmin} from '@/lib/server/website-access';
export default async function Layout({children}:{children:React.ReactNode}){await requirePrivateAdmin();return children;}
