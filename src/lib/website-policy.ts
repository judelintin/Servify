/** Website route policy. Retained marketplace routes are mobile-only at runtime. */
export const mobileOnlyRoots=['/customer','/provider','/providers','/jobs','/offers','/conversations','/auth'] as const;
export function websiteRoute(pathname:string){let path:string;try{path=decodeURIComponent(pathname).replace(/\\/g,'/').replace(/\/+/g,'/').toLowerCase();}catch{return 'invalid' as const;}
if(mobileOnlyRoots.some(root=>path===root||path.startsWith(root+'/')))return 'mobile' as const;
if(path==='/admin'||path.startsWith('/admin/')||path==='/design-system'||path.startsWith('/design-system/'))return 'private' as const;
return 'public' as const;}
