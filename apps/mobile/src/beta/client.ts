import { createClient } from '@supabase/supabase-js';
import { sessionStorage } from './session-storage';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// Explicit opt-in; normal customer/professional preview stores are unchanged.
export const betaClient=url&&key?createClient(url,key,{auth:{storage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce',storageKey:'servify-beta-auth'}}):null;
