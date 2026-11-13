'use client';
import { createBrowserClient } from '@supabase/ssr';
export function createBetaBrowserClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Beta authentication is not configured.');
 return createBrowserClient(url,key);
}
