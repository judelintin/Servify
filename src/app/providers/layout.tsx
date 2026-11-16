import {requireMobileApp} from '@/lib/server/website-access';
export default function Layout({children}:{children:React.ReactNode}){requireMobileApp();return children;}
