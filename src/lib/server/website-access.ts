import 'server-only';
import {headers} from 'next/headers';
import {notFound,redirect} from 'next/navigation';
import {adminAccess,adminGateConfig} from '../admin-access';
export function requireMobileApp():never{redirect('/#app');}
export async function requirePrivateAdmin(){if(adminAccess((await headers()).get('authorization'),adminGateConfig())!=='allowed')notFound();}
