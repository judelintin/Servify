/** Public-key smoke checks only. Never creates an admitted/verified user. */
import assert from 'node:assert/strict';
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. Never use a secret key.');
if(!key.startsWith('sb_publishable_'))throw Error('Publishable key required.');
const call=(path,body)=>fetch(url+path,{method:body?'POST':'GET',headers:{apikey:key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
const settings=await call('/auth/v1/settings'),config=await settings.json();assert.equal(settings.status,200);assert.equal(config.mailer_autoconfirm,false);assert.equal(config.external.anonymous_users,false);
const discover=await call('/rest/v1/rpc/beta_discover',{});assert.equal(discover.status,401);
const requests=await call('/rest/v1/service_requests?select=id');assert.equal(requests.status,401);
const signup=await call('/auth/v1/signup',{email:'uninvited-security-smoke@example.invalid',password:'Synthetic-test-password-2026!'});assert(!signup.ok,'Uninvited registration must fail');
const login=await call('/auth/v1/token?grant_type=password',{email:'uninvited-security-smoke@example.invalid',password:'Synthetic-test-password-2026!'});assert(!login.ok,'Unknown account cannot sign in');
console.log('PASS actual HTTPS Auth settings, anonymous table/RPC denial, uninvited signup denial, invalid sign-in denial. No delivery/session success claimed.');
