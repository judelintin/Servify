-- Shared lifecycle commands; local prototype stores are not imported.
alter table public.schedule_proposals drop constraint schedule_proposals_status_check;
alter table public.schedule_proposals add constraint schedule_proposals_status_check
 check(status in ('pending','confirmed','superseded','withdrawn','rejected'));
alter table public.schedule_proposals add column resolved_at timestamptz;
create unique index one_pending_schedule on public.schedule_proposals(job_id) where status='pending';
alter table public.job_events add column sequence bigint generated always as identity;
alter table public.job_events add column schedule_id uuid references public.schedule_proposals(id);
create unique index job_events_order on public.job_events(job_id,sequence);
create index job_events_schedule_fk on public.job_events(schedule_id);
create index schedules_job_cursor on public.schedule_proposals(job_id,created_at,id);

create function private.beta_job_command(p_command uuid,p_job uuid,p_revision integer,p_action text,
 p_schedule uuid default null,p_starts timestamptz default null,p_ends timestamptz default null,p_notes text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare j public.jobs; s public.schedule_proposals; old private.commands; target text; sid uuid;
 at timestamptz; customer boolean; payload jsonb:=jsonb_build_array(p_job,p_revision,p_action,p_schedule,p_starts,p_ends,p_notes);
begin
 if not private.member() then raise exception 'Active beta membership required' using errcode='42501'; end if;
 if p_command is null or p_job is null or p_revision is null or p_action is null or p_notes is null or length(p_notes)>1000 then
  raise exception 'Invalid lifecycle command' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into j from public.jobs where id=p_job and auth.uid() in (customer_id,professional_id) for update;
 if not found then raise exception 'Job unavailable' using errcode='42501'; end if;
 select * into old from private.commands where user_id=auth.uid() and command_id=p_command;
 if found then
  if old.operation<>'lifecycle' or old.payload<>payload then raise exception 'Command reused with different data' using errcode='PT409'; end if;
  return old.result;
 end if;
 if j.revision<>p_revision then raise exception 'Job changed; refresh before reviewing this action' using errcode='PT409'; end if;
 if (select count(*) from public.job_events where job_id=p_job)>=150 then raise exception 'Job activity limit reached'; end if;
 at:=clock_timestamp();customer:=auth.uid()=j.customer_id;target:=j.status;
 if p_action<>'propose' and (p_starts is not null or p_ends is not null) then raise exception 'Unexpected appointment window' using errcode='22023'; end if;
 if p_action not in ('accept_schedule','reject_schedule','withdraw_schedule') and p_schedule is not null then raise exception 'Unexpected proposal' using errcode='22023'; end if;
 if p_action='propose' then
  if j.status not in ('confirmed','scheduled') then raise exception 'Confirm the job before scheduling; scheduling closes when work starts' using errcode='PT409'; end if;
  if p_starts is null or p_ends is null or not isfinite(p_starts) or not isfinite(p_ends) or p_starts<=at or p_ends<=p_starts
   or (p_starts at time zone 'Africa/Lagos')::date<>(p_ends at time zone 'Africa/Lagos')::date then raise exception 'Choose a future same-day appointment window in WAT' using errcode='22023'; end if;
  if (select count(*) from public.schedule_proposals where job_id=p_job)>=30 then raise exception 'Schedule proposal limit reached'; end if;
  update public.schedule_proposals set status='superseded',resolved_at=at where job_id=p_job and status='pending';
  insert into public.schedule_proposals(job_id,proposed_by,starts_at,ends_at,notes,status,created_at)
   values(p_job,auth.uid(),p_starts,p_ends,trim(p_notes),'pending',at) returning id into sid;
 elsif p_action in ('accept_schedule','reject_schedule','withdraw_schedule') then
  select * into s from public.schedule_proposals where id=p_schedule and job_id=p_job for update;
  if j.status not in ('confirmed','scheduled') or not found or s.status<>'pending' then raise exception 'Proposal changed; refresh the job' using errcode='PT409'; end if;
  if (p_action='withdraw_schedule' and s.proposed_by<>auth.uid()) or (p_action<>'withdraw_schedule' and s.proposed_by=auth.uid()) then
   raise exception 'Only the proposer can withdraw; the other participant accepts or rejects' using errcode='42501'; end if;
  sid:=s.id;
  if p_action='accept_schedule' then
   if s.starts_at<=at then raise exception 'Proposal has expired; propose a future time' using errcode='PT409'; end if;
   update public.schedule_proposals set status='superseded',resolved_at=at where job_id=p_job and status='confirmed';
   update public.schedule_proposals set status='confirmed',resolved_at=at where id=s.id;target:='scheduled';
  else
   update public.schedule_proposals set status=case when p_action='reject_schedule' then 'rejected' else 'withdrawn' end,resolved_at=at where id=s.id;
  end if;
 else
  target:=case
   when p_action='confirm' and not customer and j.status='awaiting_confirmation' then 'confirmed'
   when p_action='decline' and not customer and j.status='awaiting_confirmation' then 'cancelled'
   when p_action='cancel' and j.status in ('awaiting_confirmation','confirmed','scheduled') and (customer or j.status<>'awaiting_confirmation') then 'cancelled'
   when p_action='start' and not customer and j.status in ('confirmed','scheduled') then 'in_progress'
   when p_action='request_completion' and not customer and j.status='in_progress' then 'completion_requested'
   when p_action='complete' and customer and j.status='completion_requested' then 'completed'
   else null end;
  if target is null then raise exception 'Action unavailable for this participant or job stage' using errcode='PT409'; end if;
  if p_action in ('cancel','decline') and length(trim(p_notes))<10 then raise exception 'Explain the cancellation or decline in at least ten characters' using errcode='22023'; end if;
  if p_action='start' and exists(select 1 from public.schedule_proposals where job_id=p_job and status='pending') then raise exception 'Resolve the pending proposal before starting work' using errcode='PT409'; end if;
  if target='cancelled' then update public.schedule_proposals set status='withdrawn',resolved_at=at where job_id=p_job and status='pending'; end if;
 end if;
 update public.jobs set status=target,revision=revision+1,updated_at=at,
  completed_at=case when target='completed' then at else completed_at end where id=p_job;
 insert into public.job_events(job_id,actor_id,kind,from_status,to_status,note,created_at,schedule_id)
  values(p_job,auth.uid(),p_action,j.status,target,trim(p_notes),at,sid);
 insert into private.commands(user_id,command_id,operation,payload,result) values(auth.uid(),p_command,'lifecycle',payload,p_job);
 return p_job;
end $$;

create function public.beta_job_command(p_command uuid,p_job uuid,p_revision integer,p_action text,
 p_schedule uuid default null,p_starts timestamptz default null,p_ends timestamptz default null,p_notes text default '')
returns uuid language sql security invoker set search_path='' as $$
 select private.beta_job_command(p_command,p_job,p_revision,p_action,p_schedule,p_starts,p_ends,p_notes)
$$;
revoke all on function private.beta_job_command(uuid,uuid,integer,text,uuid,timestamptz,timestamptz,text),public.beta_job_command(uuid,uuid,integer,text,uuid,timestamptz,timestamptz,text) from public,anon;
grant execute on function private.beta_job_command(uuid,uuid,integer,text,uuid,timestamptz,timestamptz,text),public.beta_job_command(uuid,uuid,integer,text,uuid,timestamptz,timestamptz,text) to authenticated;

create function private.beta_job(p_job uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('job',to_jsonb(j)||jsonb_build_object('title',r.title),
  'schedules',coalesce((select jsonb_agg(s order by s.created_at,s.id) from public.schedule_proposals s where s.job_id=j.id),'[]'::jsonb),
  'events',coalesce((select jsonb_agg(e order by e.sequence) from public.job_events e where e.job_id=j.id),'[]'::jsonb))
 from public.jobs j join public.service_requests r on r.id=j.request_id where j.id=p_job and private.participant(j.id)
$$;
create function public.beta_job(p_job uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.beta_job(p_job) $$;
revoke all on function private.beta_job(uuid),public.beta_job(uuid) from public,anon;
grant execute on function private.beta_job(uuid),public.beta_job(uuid) to authenticated;

create function private.beta_jobs(p_before timestamptz default null,p_before_id uuid default null)
returns table(id uuid,title text,status text,revision integer,customer_id uuid,professional_id uuid,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select j.id,r.title,j.status,j.revision,j.customer_id,j.professional_id,j.created_at
 from public.jobs j join public.service_requests r on r.id=j.request_id where private.member() and auth.uid() in (j.customer_id,j.professional_id)
 and (p_before is null or (j.created_at,j.id)<(p_before,p_before_id)) order by j.created_at desc,j.id desc limit 50
$$;
create function public.beta_jobs(p_before timestamptz default null,p_before_id uuid default null)
returns table(id uuid,title text,status text,revision integer,customer_id uuid,professional_id uuid,created_at timestamptz)
language sql stable security invoker set search_path='' as $$ select * from private.beta_jobs(p_before,p_before_id) $$;
revoke all on function private.beta_jobs(timestamptz,uuid),public.beta_jobs(timestamptz,uuid) from public,anon;
grant execute on function private.beta_jobs(timestamptz,uuid),public.beta_jobs(timestamptz,uuid) to authenticated;
alter publication supabase_realtime add table public.job_events;
