drop index public.jobs_customer_id_fk;
drop index public.jobs_professional_id_fk;
drop index public.offers_professional_id_fk;
drop index public.service_requests_customer_id_fk;
create index jobs_accepted_offer_fk on public.jobs(offer_id,request_id,professional_id);
create policy no_client_access on private.beta_invites to authenticated using(false) with check(false);
create policy no_client_access on private.admin_members to authenticated using(false) with check(false);
create policy no_client_access on private.commands to authenticated using(false) with check(false);
alter function public.beta_discover() set schema private;
alter function public.beta_save_professional(text,text,text,integer,text,text[],text[],integer) set schema private;
alter function public.beta_post_request(uuid,text,text,text,text,text,date,text,bigint,bigint) set schema private;
alter function public.beta_submit_offer(uuid,uuid,bigint,text,text,text,text) set schema private;
create function public.beta_discover() returns table(id uuid,category_slug text,area_slug text,title text,description text,timing text,budget_mode text,budget_min_kobo bigint,budget_max_kobo bigint,published_at timestamptz)
language sql stable security invoker set search_path='' as $$select * from private.beta_discover()$$;
create function public.beta_save_professional(p_kind text,p_name text,p_business text,p_experience integer,p_bio text,p_categories text[],p_areas text[],p_revision integer) returns integer
language sql security invoker set search_path='' as $$select private.beta_save_professional(p_kind,p_name,p_business,p_experience,p_bio,p_categories,p_areas,p_revision)$$;
create function public.beta_post_request(p_command uuid,p_category text,p_area text,p_title text,p_description text,p_timing text,p_date date,p_budget_mode text,p_min bigint,p_max bigint) returns uuid
language sql security invoker set search_path='' as $$select private.beta_post_request(p_command,p_category,p_area,p_title,p_description,p_timing,p_date,p_budget_mode,p_min,p_max)$$;
create function public.beta_submit_offer(p_command uuid,p_request uuid,p_amount bigint,p_price_type text,p_scope text,p_availability text,p_conditions text) returns uuid
language sql security invoker set search_path='' as $$select private.beta_submit_offer(p_command,p_request,p_amount,p_price_type,p_scope,p_availability,p_conditions)$$;
revoke execute on function public.beta_discover(),public.beta_save_professional(text,text,text,integer,text,text[],text[],integer),public.beta_post_request(uuid,text,text,text,text,text,date,text,bigint,bigint),public.beta_submit_offer(uuid,uuid,bigint,text,text,text,text) from public,anon;
grant execute on function public.beta_discover(),public.beta_save_professional(text,text,text,integer,text,text[],text[],integer),public.beta_post_request(uuid,text,text,text,text,text,date,text,bigint,bigint),public.beta_submit_offer(uuid,uuid,bigint,text,text,text,text) to authenticated;
