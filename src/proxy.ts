import {NextResponse,type NextRequest} from 'next/server';
import {websiteRoute} from './lib/website-policy';
import {adminAccess,adminGateConfig} from './lib/admin-access';
export function proxy(request:NextRequest){
 const route=websiteRoute(request.nextUrl.pathname);
 if(route==='mobile'){const response=NextResponse.redirect(new URL('/#app',request.url),307);response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Robots-Tag','noindex, nofollow');return response;}
 if(route==='invalid')return new NextResponse('Invalid address.',{status:400});
 if(route==='private'){
  const access=adminAccess(request.headers.get('authorization'),adminGateConfig());
  if(access!=='allowed')return new NextResponse(access==='unconfigured'?'Private administration is unavailable.':'Private administration requires authentication.',{status:access==='unconfigured'?503:401,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow',...(access==='denied'?{'WWW-Authenticate':'Basic realm="Servify administration", charset="UTF-8"'}:{})}});
  const response=NextResponse.next();response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Robots-Tag','noindex, nofollow');return response;
 }
 return NextResponse.next();
}
// Do not exclude RSC/prefetch requests or rely on navigation/cookie hints.
export const config={matcher:['/((?!_next/static|_next/image|images/|icons/|icon.svg|favicon.ico).*)']};
