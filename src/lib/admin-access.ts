import {createHash,timingSafeEqual} from 'node:crypto';
export type AdminGateConfig={username?:string;passwordHash?:string};
/** Server-only operator gate for retained local Admin UI; grants no Supabase role. */
export function adminAccess(authorization:string|null,config:AdminGateConfig):'unconfigured'|'denied'|'allowed'{
 if(!config.username?.trim()||!config.passwordHash||!(/^[a-f0-9]{64}$/i).test(config.passwordHash))return 'unconfigured';
 if(!authorization||authorization.length>4096||!/^Basic [A-Za-z0-9+/]+={0,2}$/i.test(authorization))return 'denied';
 const decoded=Buffer.from(authorization.slice(6),'base64').toString('utf8'),colon=decoded.indexOf(':');if(colon<1)return 'denied';
 const user=createHash('sha256').update(decoded.slice(0,colon)).digest(),expected=createHash('sha256').update(config.username).digest(),password=createHash('sha256').update(decoded.slice(colon+1)).digest();
 const userMatches=timingSafeEqual(user,expected),passwordMatches=timingSafeEqual(password,Buffer.from(config.passwordHash,'hex'));return userMatches&&passwordMatches?'allowed':'denied';
}
export function adminGateConfig():AdminGateConfig{return {username:process.env.SERVIFY_ADMIN_USERNAME,passwordHash:process.env.SERVIFY_ADMIN_PASSWORD_SHA256};}
