-- Administrative fixture provisioning is unavailable to every frontend role.
create function private.beta_prepare_test_invite(p_email text) returns void language plpgsql security definer set search_path='' as $$
begin
 if coalesce(p_email = any(array[nullif(current_setting('servify.controlled_customer_email',true),''),nullif(current_setting('servify.controlled_professional_email',true),'')]),false) is not true then raise exception 'Dedicated controlled-test identity required'; end if;
 insert into private.beta_invites(email,expires_at) values(p_email,now()+interval '7 days') on conflict(email) do nothing;
end $$;
create function public.beta_prepare_test_invite(p_email text) returns void language sql security invoker set search_path='' as $$select private.beta_prepare_test_invite(p_email)$$;
revoke all on function private.beta_prepare_test_invite(text),public.beta_prepare_test_invite(text) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.beta_prepare_test_invite(text),public.beta_prepare_test_invite(text) to service_role;

create function private.beta_select_offer(p_command uuid,p_offer uuid,p_revision integer) returns uuid language plpgsql security definer set search_path='' as $$
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
 if r.status<>'open' or o.status<>'submitted' or o.revision<>p_revision then raise exception 'Offer changed or request already selected' using errcode='40001'; end if;
 if not exists(select 1 from public.accounts a join private.beta_invites i on i.claimed_by=a.id join auth.users u on u.id=a.id where a.id=o.professional_id and a.status='active' and i.revoked_at is null and u.email_confirmed_at is not null) then raise exception 'Professional unavailable'; end if;
 update public.offers set status=case when id=p_offer then 'accepted' else 'not_selected' end,revision=revision+1,updated_at=now() where request_id=r.id and status='submitted';
 update public.service_requests set status='selected',revision=revision+1,updated_at=now() where id=r.id;
 insert into public.jobs(request_id,offer_id,professional_id,customer_id) values(r.id,o.id,o.professional_id,auth.uid()) returning id into v;
 insert into public.job_events(job_id,actor_id,kind,to_status,note) values(v,auth.uid(),'selected','awaiting_confirmation','Customer selected an offer. Work has not started.');
 insert into private.commands values(auth.uid(),p_command,'select',payload,v); return v;
end $$;
create function public.beta_select_offer(p_command uuid,p_offer uuid,p_revision integer) returns uuid language sql security invoker set search_path='' as $$select private.beta_select_offer(p_command,p_offer,p_revision)$$;
revoke all on function private.beta_select_offer(uuid,uuid,integer),public.beta_select_offer(uuid,uuid,integer) from public,anon;
grant execute on function private.beta_select_offer(uuid,uuid,integer),public.beta_select_offer(uuid,uuid,integer) to authenticated;
