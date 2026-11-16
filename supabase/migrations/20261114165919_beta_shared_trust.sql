-- Shared feedback uses existing relations. Device-local records are not imported.
alter table public.content_reports add column explanation text not null default '' check(length(explanation)<=1000);
create unique index content_reports_pending on public.content_reports(review_id,reporter_id,target) where status='pending';
alter table public.job_issues drop constraint job_issues_description_check;
alter table public.job_issues add constraint job_issues_description_check check(length(trim(description)) between 15 and 2000);
create index reviews_profile_cursor on public.reviews(professional_id,created_at,id) where not hidden;
create index review_versions_cursor on public.review_versions(review_id,created_at,id);
create index response_versions_cursor on public.response_versions(review_id,created_at,id);

-- Raw rows retain job/identity associations and are more restricted than profile projections.
drop policy review_read on public.reviews;
create policy review_read on public.reviews for select to authenticated using
 (private.member() and (private.admin() or (private.participant(job_id) and (not hidden or customer_id=(select auth.uid())))));
drop policy response_read on public.professional_responses;
create policy response_read on public.professional_responses for select to authenticated using
 (private.member() and (private.admin() or exists(select 1 from public.reviews r where r.id=review_id and not r.hidden and private.participant(r.job_id) and (not professional_responses.hidden or r.professional_id=(select auth.uid())))));
drop policy audit_read on public.review_versions;
create policy audit_read on public.review_versions for select to authenticated using
 (private.admin() or (private.member() and exists(select 1 from public.reviews r where r.id=review_id and r.customer_id=(select auth.uid()))));
drop policy audit_read on public.response_versions;
create policy audit_read on public.response_versions for select to authenticated using
 (private.admin() or (private.member() and exists(select 1 from public.reviews r where r.id=review_id and r.professional_id=(select auth.uid()))));

create function private.reviewable_job(p_job uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.jobs j where j.id=p_job and j.status='completed' and j.completed_at is not null
 and exists(select 1 from public.job_events e where e.job_id=j.id and e.kind='complete' and e.actor_id=j.customer_id and e.to_status='completed'))
$$;
revoke all on function private.reviewable_job(uuid) from public,anon,authenticated;

create function private.beta_save_feedback(p_command uuid,p_job uuid,p_revision integer,p_action text,p_rating integer default 0,p_body text default '',p_category text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare j public.jobs;r public.reviews;old private.commands;result uuid;at timestamptz;
 payload jsonb:=jsonb_build_array(p_job,p_revision,p_action,p_rating,p_body,p_category);
begin
 if not private.member() then raise exception 'Active beta membership required' using errcode='42501';end if;
 if p_command is null or p_revision is null or p_body is null or p_category is null or p_action is null or length(p_body)>2000 then raise exception 'Invalid feedback fields' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into j from public.jobs where id=p_job and auth.uid() in (customer_id,professional_id) for update;
 if not found then raise exception 'Job unavailable' using errcode='42501';end if;
 select * into old from private.commands where user_id=auth.uid() and command_id=p_command;
 if found then if old.operation<>'feedback' or old.payload<>payload then raise exception 'Command changed' using errcode='PT409';end if;return old.result;end if;
 at:=clock_timestamp();
 if p_action='issue' then
  if auth.uid()<>j.customer_id then raise exception 'Only this job customer can report unresolved work' using errcode='42501';end if;
  if j.revision<>p_revision or j.status not in ('confirmed','scheduled','in_progress','completion_requested') then raise exception 'Job changed or issue reporting is unavailable' using errcode='PT409';end if;
  if p_category not in ('quality','scope','timing','other') or length(trim(p_body))<15 then raise exception 'Choose an issue category and describe it in 15 to 2000 characters' using errcode='22023';end if;
  if (select count(*) from public.job_events where job_id=p_job)>=150 then raise exception 'Job activity limit reached';end if;
  insert into public.job_issues(job_id,reporter_id,category,description,created_at) values(p_job,auth.uid(),p_category,trim(p_body),at) returning id into result;
  insert into public.issue_cases(issue_id,updated_at) values(result,at);
  update public.schedule_proposals set status='withdrawn',resolved_at=at where job_id=p_job and status='pending';
  update public.jobs set status='issue_reported',revision=revision+1,updated_at=at where id=p_job;
  insert into public.job_events(job_id,actor_id,kind,from_status,to_status,note,created_at)
   values(p_job,auth.uid(),'issue_reported',j.status,'issue_reported','Customer reported an unresolved job issue.',at);
 else
  if p_action not in ('review','response') or p_category<>'' then raise exception 'Unsupported feedback action' using errcode='22023';end if;
  if not private.reviewable_job(p_job) then raise exception 'Customer-confirmed completion is required' using errcode='PT409';end if;
  select * into r from public.reviews where job_id=p_job for update;
  if coalesce(r.revision,0)<>p_revision then raise exception 'Review changed; refresh before editing' using errcode='PT409';end if;
  if p_action='review' then
   if auth.uid()<>j.customer_id then raise exception 'Only this job customer can review' using errcode='42501';end if;
   if p_rating is null or p_rating not between 1 and 5 then raise exception 'Choose 1 to 5 stars' using errcode='22023';end if;
   if r.id is not null and (select count(*) from public.review_versions where review_id=r.id)>=30 then raise exception 'Review version limit reached';end if;
   if r.id is null then
    insert into public.reviews(job_id,customer_id,professional_id,rating,body,created_at,updated_at) values(p_job,j.customer_id,j.professional_id,p_rating,trim(p_body),at,at) returning id into result;
   else
    update public.reviews set rating=p_rating,body=trim(p_body),revision=revision+1,updated_at=at where id=r.id returning id into result;
   end if;
   insert into public.review_versions(review_id,rating,body,created_at) values(result,p_rating,trim(p_body),at);
  else
   if auth.uid()<>j.professional_id then raise exception 'Only the reviewed professional can respond' using errcode='42501';end if;
   if r.id is null or r.hidden then raise exception 'A visible customer review is required' using errcode='PT409';end if;
   if p_rating is distinct from 0 or length(trim(p_body))<3 then raise exception 'Responses need 3 to 2000 characters' using errcode='22023';end if;
   if (select count(*) from public.response_versions where review_id=r.id)>=30 then raise exception 'Response version limit reached';end if;
   insert into public.professional_responses(review_id,body,updated_at) values(r.id,trim(p_body),at)
    on conflict(review_id) do update set body=excluded.body,updated_at=excluded.updated_at;
   insert into public.response_versions(review_id,body,created_at) values(r.id,trim(p_body),at);
   update public.reviews set revision=revision+1 where id=r.id;result:=r.id;
  end if;
  insert into public.job_events(job_id,actor_id,kind,from_status,to_status,note,created_at)
   values(p_job,auth.uid(),case when p_action='review' then 'review_saved' else 'response_saved' end,j.status,j.status,'Completed-job feedback updated.',at);
 end if;
 insert into private.commands values(auth.uid(),p_command,'feedback',payload,result);return result;
end $$;
create function public.beta_save_feedback(p_command uuid,p_job uuid,p_revision integer,p_action text,p_rating integer default 0,p_body text default '',p_category text default '')
returns uuid language sql security invoker set search_path='' as $$select private.beta_save_feedback(p_command,p_job,p_revision,p_action,p_rating,p_body,p_category)$$;
revoke all on function private.beta_save_feedback(uuid,uuid,integer,text,integer,text,text),public.beta_save_feedback(uuid,uuid,integer,text,integer,text,text) from public,anon;
grant execute on function private.beta_save_feedback(uuid,uuid,integer,text,integer,text,text),public.beta_save_feedback(uuid,uuid,integer,text,integer,text,text) to authenticated;

create function private.beta_report_review(p_command uuid,p_review uuid,p_target text,p_reason text,p_explanation text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.reviews;old private.commands;result uuid;payload jsonb:=jsonb_build_array(p_review,p_target,p_reason,p_explanation);
begin
 if not private.member() then raise exception 'Active beta membership required' using errcode='42501';end if;
 if p_command is null or p_target is null or p_reason is null or p_explanation is null or length(p_explanation)>1000 then raise exception 'Invalid report' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into old from private.commands where user_id=auth.uid() and command_id=p_command;
 if found then if old.operation<>'content_report' or old.payload<>payload then raise exception 'Command changed' using errcode='PT409';end if;return old.result;end if;
 select * into r from public.reviews where id=p_review for update;
 if not found or r.hidden or not private.reviewable_job(r.job_id) then raise exception 'Review unavailable' using errcode='42501';end if;
 if p_target not in ('review','response') or p_reason not in ('Abuse or harassment','Personal information','Misleading or irrelevant','Spam','Other') then raise exception 'Choose a valid report target and reason' using errcode='22023';end if;
 if p_target='response' and not exists(select 1 from public.professional_responses where review_id=r.id and not hidden) then raise exception 'Response unavailable' using errcode='42501';end if;
 if exists(select 1 from public.content_reports where review_id=r.id and reporter_id=auth.uid() and target=p_target and status='pending') then raise exception 'A pending report already exists' using errcode='PT409';end if;
 insert into public.content_reports(review_id,reporter_id,target,reason,explanation) values(r.id,auth.uid(),p_target,p_reason,trim(p_explanation)) returning id into result;
 insert into private.commands values(auth.uid(),p_command,'content_report',payload,result);return result;
end $$;
create function public.beta_report_review(p_command uuid,p_review uuid,p_target text,p_reason text,p_explanation text default '')
returns uuid language sql security invoker set search_path='' as $$select private.beta_report_review(p_command,p_review,p_target,p_reason,p_explanation)$$;
revoke all on function private.beta_report_review(uuid,uuid,text,text,text),public.beta_report_review(uuid,uuid,text,text,text) from public,anon;
grant execute on function private.beta_report_review(uuid,uuid,text,text,text),public.beta_report_review(uuid,uuid,text,text,text) to authenticated;

-- Participant detail can include the author's hidden review; hidden text stays off profiles.
create function private.beta_feedback(p_job uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('review',(select to_jsonb(r)||jsonb_build_object(
 'review_versions',(select count(*) from public.review_versions v where v.review_id=r.id),
 'response_versions',(select count(*) from public.response_versions v where v.review_id=r.id),
 'response',(select jsonb_build_object('body',case when not p.hidden or j.professional_id=auth.uid() then p.body else null end,'hidden',p.hidden,'updated_at',p.updated_at) from public.professional_responses p where p.review_id=r.id and not r.hidden))
 from public.reviews r where r.job_id=j.id and (not r.hidden or j.customer_id=auth.uid())),
 'issues',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('case_status',c.status,'case_updated_at',c.updated_at) order by i.created_at,i.id)
 from public.job_issues i left join public.issue_cases c on c.issue_id=i.id where i.job_id=j.id),'[]'::jsonb))
 from public.jobs j where j.id=p_job and private.participant(j.id)
$$;
create function public.beta_feedback(p_job uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.beta_feedback(p_job)$$;
revoke all on function private.beta_feedback(uuid),public.beta_feedback(uuid) from public,anon;
grant execute on function private.beta_feedback(uuid),public.beta_feedback(uuid) to authenticated;

create function private.beta_reputation(p_professional uuid,p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('professional',jsonb_build_object('id',p.user_id,'display_name',p.display_name,'business_name',p.business_name),
 'summary',(select jsonb_build_object('count',count(*),'average',round(avg(r.rating),1)) from public.reviews r where r.professional_id=p.user_id and not r.hidden and private.reviewable_job(r.job_id)),
 'reviews',coalesce((select jsonb_agg(x order by x.created_at desc,x.id desc) from (
 select r.id,r.rating,r.body,r.created_at,r.updated_at,
 (select count(*) from public.review_versions v where v.review_id=r.id) as review_versions,
 (select jsonb_build_object('body',case when not pr.hidden then pr.body else null end,'hidden',pr.hidden,'updated_at',pr.updated_at) from public.professional_responses pr where pr.review_id=r.id) as response
 from public.reviews r where r.professional_id=p.user_id and not r.hidden and private.reviewable_job(r.job_id)
 and (p_before is null or (r.created_at,r.id)<(p_before,p_before_id)) order by r.created_at desc,r.id desc limit 50)x),'[]'::jsonb))
 from public.professional_profiles p where p.user_id=p_professional and private.member()
$$;
create function public.beta_reputation(p_professional uuid,p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$select private.beta_reputation(p_professional,p_before,p_before_id)$$;
revoke all on function private.beta_reputation(uuid,timestamptz,uuid),public.beta_reputation(uuid,timestamptz,uuid) from public,anon;
grant execute on function private.beta_reputation(uuid,timestamptz,uuid),public.beta_reputation(uuid,timestamptz,uuid) to authenticated;

create function private.beta_review_jobs(p_before timestamptz default null,p_before_id uuid default null)
returns table(id uuid,title text,customer_id uuid,professional_id uuid,created_at timestamptz,has_review boolean)
language sql stable security definer set search_path='' as $$
 select j.id,r.title,j.customer_id,j.professional_id,j.created_at,exists(select 1 from public.reviews v where v.job_id=j.id)
 from public.jobs j join public.service_requests r on r.id=j.request_id where private.member() and auth.uid() in (j.customer_id,j.professional_id)
 and private.reviewable_job(j.id) and (p_before is null or (j.created_at,j.id)<(p_before,p_before_id))
 order by j.created_at desc,j.id desc limit 50
$$;
create function public.beta_review_jobs(p_before timestamptz default null,p_before_id uuid default null)
returns table(id uuid,title text,customer_id uuid,professional_id uuid,created_at timestamptz,has_review boolean)
language sql stable security invoker set search_path='' as $$select * from private.beta_review_jobs(p_before,p_before_id)$$;
revoke all on function private.beta_review_jobs(timestamptz,uuid),public.beta_review_jobs(timestamptz,uuid) from public,anon;
grant execute on function private.beta_review_jobs(timestamptz,uuid),public.beta_review_jobs(timestamptz,uuid) to authenticated;
