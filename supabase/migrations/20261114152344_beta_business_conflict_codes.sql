-- Deterministic revision/status conflicts are HTTP 409, never serialization failures.
-- PostgREST 14 retries 40001 indefinitely; preserve bodies, ownership, locks and grants.
CREATE OR REPLACE FUNCTION private.beta_save_professional(p_kind text, p_name text, p_business text, p_experience integer, p_bio text, p_categories text[], p_areas text[], p_revision integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v integer;
begin
 if not private.member() then raise exception 'Verified beta membership required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select revision into v from public.professional_profiles where user_id=auth.uid() for update;
 if coalesce(v,0)<>p_revision then raise exception 'Profile changed; reload' using errcode='PT409'; end if;
 if coalesce(cardinality(p_categories),0) not between 1 and 6 or coalesce(cardinality(p_areas),0) not between 1 and 30 or
 exists(select 1 from unnest(p_categories) c where not exists(select 1 from public.service_categories where slug=c and active)) or
 exists(select 1 from unnest(p_areas) a where not exists(select 1 from public.service_areas where slug=a and active)) then raise exception 'Select valid services and coverage'; end if;
 insert into public.professional_profiles(user_id,kind,display_name,business_name,experience,bio) values(auth.uid(),p_kind,p_name,p_business,p_experience,p_bio)
 on conflict(user_id) do update set kind=excluded.kind,display_name=excluded.display_name,business_name=excluded.business_name,experience=excluded.experience,bio=excluded.bio,revision=public.professional_profiles.revision+1,updated_at=now() returning revision into v;
 delete from public.professional_services where professional_id=auth.uid(); delete from public.professional_areas where professional_id=auth.uid();
 insert into public.professional_services select auth.uid(),c,'' from (select distinct unnest(p_categories) c) x;
 insert into public.professional_areas select auth.uid(),a from (select distinct unnest(p_areas) a) x;
 return v;
end $function$;

CREATE OR REPLACE FUNCTION private.beta_select_offer(p_command uuid, p_offer uuid, p_revision integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o public.offers; r public.service_requests; v uuid; payload jsonb:=jsonb_build_array(p_offer,p_revision); previous private.commands;
begin
 if not private.member() then raise exception 'Active beta membership required' using errcode='42501'; end if;
 if p_command is null then raise exception 'Command ID required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into previous from private.commands where user_id=auth.uid() and command_id=p_command;
 if found then if previous.operation<>'select' or previous.payload<>payload then raise exception 'Command reused with different data'; end if; return previous.result; end if;
 -- Lock order agrees with offer submission: request before offer.
 select * into r from public.service_requests where id=(select request_id from public.offers where id=p_offer) for update;
 if not found or r.customer_id<>auth.uid() then raise exception 'Request unavailable' using errcode='42501'; end if;
 select * into o from public.offers where id=p_offer for update;
 if r.status<>'open' or o.status<>'submitted' or o.revision<>p_revision then raise exception 'Offer changed or request already selected' using errcode='PT409'; end if;
 if not exists(select 1 from public.accounts a join private.beta_invites i on i.claimed_by=a.id join auth.users u on u.id=a.id where a.id=o.professional_id and a.status='active' and i.revoked_at is null and u.email_confirmed_at is not null) then raise exception 'Professional unavailable'; end if;
 update public.offers set status=case when id=p_offer then 'accepted' else 'not_selected' end,revision=revision+1,updated_at=now() where request_id=r.id and status='submitted';
 update public.service_requests set status='selected',revision=revision+1,updated_at=now() where id=r.id;
 insert into public.jobs(request_id,offer_id,professional_id,customer_id) values(r.id,o.id,o.professional_id,auth.uid()) returning id into v;
 insert into public.job_events(job_id,actor_id,kind,to_status,note) values(v,auth.uid(),'selected','awaiting_confirmation','Customer selected an offer. Work has not started.');
 insert into private.commands values(auth.uid(),p_command,'select',payload,v); return v;
end $function$;
