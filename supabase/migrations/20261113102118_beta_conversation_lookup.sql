-- Direct lookup remains participant-only even outside the inbox's first page.
create function private.beta_conversation(p_job uuid)
returns table(job_id uuid,title text,status text,customer_id uuid,professional_id uuid,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select j.id,r.title,j.status,j.customer_id,j.professional_id,j.created_at
 from public.jobs j join public.conversations c on c.job_id=j.id join public.service_requests r on r.id=j.request_id
 where j.id=p_job and private.participant(j.id);
$$;
create function public.beta_conversation(p_job uuid)
returns table(job_id uuid,title text,status text,customer_id uuid,professional_id uuid,created_at timestamptz)
language sql stable security invoker set search_path='' as $$select * from private.beta_conversation(p_job)$$;
revoke all on function private.beta_conversation(uuid),public.beta_conversation(uuid) from public,anon;
grant execute on function private.beta_conversation(uuid),public.beta_conversation(uuid) to authenticated;
