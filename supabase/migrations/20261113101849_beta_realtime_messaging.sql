-- Stage 09B. Existing local conversations are never imported.
alter table public.messages add column sequence bigint generated always as identity;
create unique index messages_sequence on public.messages(job_id,sequence);
create function private.create_job_conversation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.conversations(job_id) values(new.id) on conflict do nothing;
 return new;
end $$;
revoke all on function private.create_job_conversation() from public,anon,authenticated;
create trigger job_conversation after insert on public.jobs for each row execute function private.create_job_conversation();
insert into public.conversations(job_id) select id from public.jobs on conflict do nothing;

create function private.beta_send_message(p_job uuid,p_client uuid,p_body text)
returns setof public.messages language plpgsql security definer set search_path='' as $$
declare previous public.messages; body text;
begin
 if not private.participant(p_job) or p_client is null then raise exception 'Conversation unavailable' using errcode='42501'; end if;
 if p_body is null or length(p_body)>2000 or p_body!~'[^[:space:]]'
  or regexp_replace(p_body,E'[\\n\\r\\t]','','g')~'[[:cntrl:]]' then raise exception 'Write a plain-text message of 1 to 2000 characters'; end if;
 body:=btrim(p_body,E' \t\n\r');
 -- Serializes messages for this job, including commit/Realtime ordering.
 perform 1 from public.jobs where id=p_job for update;
 select * into previous from public.messages where sender_id=auth.uid() and client_id=p_client;
 if found then
  if previous.job_id<>p_job or previous.body<>body then raise exception 'Message retry changed' using errcode='22023'; end if;
  return next previous; return;
 end if;
 if (select count(*) from public.messages where job_id=p_job)>=500 then raise exception 'Conversation reached its 500-message beta limit'; end if;
 insert into public.conversations(job_id) values(p_job) on conflict do nothing;
 return query insert into public.messages(job_id,sender_id,body,client_id)
 values(p_job,auth.uid(),body,p_client) returning *;
end $$;
create function public.beta_send_message(p_job uuid,p_client uuid,p_body text)
returns setof public.messages language sql security invoker set search_path='' as $$
 select * from private.beta_send_message(p_job,p_client,p_body)
$$;

create function private.beta_conversations(p_before timestamptz,p_before_id uuid)
returns table(job_id uuid,title text,status text,customer_id uuid,professional_id uuid,created_at timestamptz,last_body text,last_at timestamptz,last_sender uuid)
language sql stable security definer set search_path='' as $$
 select j.id,r.title,j.status,j.customer_id,j.professional_id,j.created_at,m.body,m.created_at,m.sender_id
 from public.jobs j join public.conversations c on c.job_id=j.id join public.service_requests r on r.id=j.request_id
 left join lateral(select body,created_at,sender_id from public.messages where job_id=j.id order by sequence desc limit 1)m on true
 where private.member() and (j.customer_id=(select auth.uid()) or j.professional_id=(select auth.uid()))
 and (p_before is null or (j.created_at,j.id)<(p_before,p_before_id))
 order by j.created_at desc,j.id desc limit 50;
$$;
create function public.beta_conversations(p_before timestamptz default null,p_before_id uuid default null)
returns table(job_id uuid,title text,status text,customer_id uuid,professional_id uuid,created_at timestamptz,last_body text,last_at timestamptz,last_sender uuid)
language sql stable security invoker set search_path='' as $$ select * from private.beta_conversations(p_before,p_before_id) $$;
revoke all on function private.beta_send_message(uuid,uuid,text),public.beta_send_message(uuid,uuid,text),
 private.beta_conversations(timestamptz,uuid),public.beta_conversations(timestamptz,uuid) from public,anon;
grant execute on function private.beta_send_message(uuid,uuid,text),public.beta_send_message(uuid,uuid,text),
 private.beta_conversations(timestamptz,uuid),public.beta_conversations(timestamptz,uuid) to authenticated;
-- Postgres Changes applies existing SELECT RLS to every subscriber. No Broadcast or public-message policy.
alter publication supabase_realtime add table public.messages;
