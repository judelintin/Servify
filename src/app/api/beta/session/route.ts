import { createBetaServerClient } from '@/lib/supabase/server';
export const dynamic='force-dynamic';
/** Verified identity only, never a cached session assertion. No admin authority here. */
export async function GET(){
 const headers={'Cache-Control':'private, no-store'};
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return Response.json({status:'not_configured'},{status:503,headers});
 try{const client=await createBetaServerClient();const {data,error}=await client.auth.getUser();if(error||!data.user)return Response.json({status:'signed_out'},{status:401,headers});return Response.json({status:'authenticated',userId:data.user.id,emailVerified:!!data.user.email_confirmed_at},{headers});}catch{return Response.json({status:'unavailable'},{status:503,headers});}
}
