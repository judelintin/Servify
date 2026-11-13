// Trusted Node process only. Secret/passwords arrive on stdin, never argv or logs.
import {createClient} from '@supabase/supabase-js';
let input='';for await(const part of process.stdin)input+=part;
try{
 const {secret,accounts}=JSON.parse(input);input='';
 if(typeof secret!=='string'||(!secret.startsWith('sb_secret_')&&!secret.startsWith('eyJ')))throw Error('Invalid admin credential format');
 const client=createClient(process.env.SUPABASE_URL,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 if(!Array.isArray(accounts)||accounts.length!==2||new Set(accounts.map(a=>a.email)).size!==2)throw Error('Expected two distinct controlled identities');
 for(const a of accounts){
  if(!(/^[^@\s]+@example\.invalid$/).test(a.email)||typeof a.password!=='string'||a.password.length<24)throw Error('Invalid controlled account');
  const {error:invite}=await client.rpc('beta_prepare_test_invite',{p_email:a.email});if(invite)throw Error('Invitation preparation failed');
  const {error}=await client.auth.admin.createUser({email:a.email,password:a.password,email_confirm:true,app_metadata:{servify_controlled_test:true}});
  if(error){if(error.code!=='email_exists')throw Error('Administrative provisioning failed');
   const {data,error:login}=await createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}).auth.signInWithPassword({email:a.email,password:a.password});if(login||!data.user?.app_metadata.servify_controlled_test)throw Error('Existing account does not match this vault; no password was overwritten');
  }
  console.log('Controlled account ready (identity withheld)');
 }
}catch{console.error('Provisioning failed. Check the beta administrative key and existing test vault. No credentials are logged.');process.exitCode=1;}
