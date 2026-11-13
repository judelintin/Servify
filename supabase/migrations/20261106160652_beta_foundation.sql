-- Servify private beta. No local prototype records or test identities are seeded.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
alter default privileges in schema private revoke execute on functions from public;

create table private.beta_invites (
 email text primary key check(email=lower(trim(email))), expires_at timestamptz not null,
 claimed_by uuid unique references auth.users(id), revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create table private.admin_members (
 user_id uuid primary key references auth.users(id), active boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.accounts (
 id uuid primary key references auth.users(id), display_name text not null default '' check(length(display_name)<=100),
 status text not null default 'active' check(status in ('active','suspended','deactivated')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Database-level invitation guard is fail-closed even before Auth hook configuration.
create function private.guard_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email is null or not exists(select 1 from private.beta_invites i where i.email=lower(new.email) and i.claimed_by is null and i.revoked_at is null and i.expires_at>now()) then
 raise exception 'Invite-only beta: registration unavailable' using errcode='42501'; end if;
 return new;
end $$;
create trigger servify_invite_guard before insert on auth.users for each row execute function private.guard_signup();
create function private.create_account() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update private.beta_invites set claimed_by=new.id where email=lower(new.email) and claimed_by is null;
 insert into public.accounts(id) values(new.id);
 return new;
end $$;
create trigger servify_account after insert on auth.users for each row execute function private.create_account();

create function private.member() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.accounts a join auth.users u on u.id=a.id join private.beta_invites i on i.claimed_by=a.id
 where a.id=(select auth.uid()) and a.status='active' and u.email_confirmed_at is not null and i.revoked_at is null);
$$;
create function private.admin() returns boolean language sql stable security definer set search_path='' as $$
 select private.member() and coalesce((select auth.jwt()->>'aal')='aal2',false) and exists(select 1 from private.admin_members where user_id=(select auth.uid()) and active);
$$;
create table public.customer_profiles (user_id uuid primary key references public.accounts(id), created_at timestamptz not null default now());
create table public.service_categories (slug text primary key, label text not null, active boolean not null default true);
create table public.service_areas (slug text primary key, label text not null, city text not null default 'Ibadan' check(city='Ibadan'), active boolean not null default true);
insert into public.service_categories(slug,label) values ('plumbing','Plumbing'),('electrical','Electrical'),('cooling','AC & refrigeration'),('generator','Generator & power'),('cleaning','Cleaning'),('appliance','Appliance repair');
-- Provisional taxonomy, not a claim of launch coverage.
create table public.professional_profiles (
 user_id uuid primary key references public.accounts(id), kind text not null check(kind in ('individual','business')),
 display_name text not null check(length(trim(display_name)) between 2 and 100), business_name text not null default '' check(length(business_name)<=100),
 experience integer not null check(experience between 0 and 60), bio text not null check(length(trim(bio)) between 30 and 1200),
 qualifications text not null default '' check(length(qualifications)<=500),
 revision integer not null default 1 check(revision>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.professional_services (
 professional_id uuid references public.professional_profiles(user_id), category_slug text references public.service_categories(slug),
 description text not null default '' check(length(description)<=200), primary key(professional_id,category_slug)
);
create table public.professional_areas (
 professional_id uuid references public.professional_profiles(user_id), area_slug text references public.service_areas(slug), primary key(professional_id,area_slug)
);
create table public.portfolio_items (
 id uuid primary key default gen_random_uuid(), professional_id uuid not null references public.professional_profiles(user_id),
 title text not null check(length(trim(title)) between 3 and 100), description text not null default '' check(length(description)<=500),
 category_slug text not null references public.service_categories(slug), created_at timestamptz not null default now()
);
create table public.service_requests (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.accounts(id),
 category_slug text references public.service_categories(slug), area_slug text references public.service_areas(slug),
 title text not null default '' check(length(title)<=120), description text not null default '' check(length(description)<=5000),
 timing text check(timing in ('soon','days','flexible','date')), preferred_date date,
 budget_mode text check(budget_mode in ('quotes','range')), budget_min_kobo bigint, budget_max_kobo bigint,
 status text not null default 'draft' check(status in ('draft','open','selected','closed')),
 revision integer not null default 1 check(revision>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz,
 check(budget_min_kobo is null or budget_min_kobo between 1 and 10000000000),
 check(budget_max_kobo is null or budget_max_kobo between 1 and 10000000000),
 check(budget_max_kobo is null or budget_min_kobo is null or budget_max_kobo>=budget_min_kobo),
 check(status='draft' or (category_slug is not null and area_slug is not null and length(trim(title))>=10 and length(trim(description))>=30 and timing is not null and budget_mode is not null and published_at is not null and (timing<>'date' or preferred_date is not null) and (budget_mode<>'range' or (budget_min_kobo is not null and budget_max_kobo is not null))))
);
create index requests_customer on public.service_requests(customer_id);
create index requests_discovery on public.service_requests(category_slug,area_slug,published_at desc) where status='open';
create table public.request_private_details (request_id uuid primary key references public.service_requests(id), address text not null check(length(address)<=500));
create table public.offers (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.service_requests(id), professional_id uuid not null references public.professional_profiles(user_id),
 amount_kobo bigint not null check(amount_kobo between 1 and 10000000000), price_type text not null check(price_type in ('estimate','fixed')),
 scope text not null check(length(trim(scope)) between 20 and 3000), availability text not null check(length(trim(availability)) between 3 and 300),
 conditions text not null default '' check(length(conditions)<=1000), status text not null default 'submitted' check(status in ('submitted','withdrawn','accepted','not_selected')),
 revision integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(request_id,professional_id), unique(id,request_id,professional_id)
);
create unique index one_selected_offer on public.offers(request_id) where status='accepted';
create index offers_professional on public.offers(professional_id);
create table public.jobs (
 id uuid primary key default gen_random_uuid(), request_id uuid not null unique references public.service_requests(id),
 offer_id uuid not null unique, professional_id uuid not null references public.professional_profiles(user_id), customer_id uuid not null references public.accounts(id),
 status text not null default 'awaiting_confirmation' check(status in ('awaiting_confirmation','confirmed','scheduled','in_progress','completion_requested','completed','issue_reported','cancelled')),
 revision integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz,
 foreign key(offer_id,request_id,professional_id) references public.offers(id,request_id,professional_id), check(customer_id<>professional_id), check(status<>'completed' or completed_at is not null)
);
create index jobs_professional on public.jobs(professional_id); create index jobs_customer on public.jobs(customer_id);
create function private.participant(j uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.member() and exists(select 1 from public.jobs where id=j and (customer_id=(select auth.uid()) or professional_id=(select auth.uid())));
$$;
create function private.request_owner(r uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.member() and exists(select 1 from public.service_requests where id=r and customer_id=(select auth.uid()));
$$;
create function private.matches(c text,a text) returns boolean language sql stable security definer set search_path='' as $$
 select private.member() and exists(select 1 from public.professional_services s join public.professional_areas v on v.professional_id=s.professional_id where s.professional_id=(select auth.uid()) and s.category_slug=c and v.area_slug=a);
$$;
create table public.schedule_proposals (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id), proposed_by uuid not null references public.accounts(id),
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at), notes text not null default '' check(length(notes)<=1000),
 status text not null check(status in ('pending','confirmed','superseded','withdrawn')), created_at timestamptz not null default now()
);
create unique index one_confirmed_schedule on public.schedule_proposals(job_id) where status='confirmed';
create table public.job_events (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id), actor_id uuid not null references public.accounts(id),
 kind text not null, from_status text, to_status text not null, note text not null default '' check(length(note)<=1000), created_at timestamptz not null default now()
);
create table public.conversations (job_id uuid primary key references public.jobs(id), created_at timestamptz not null default now());
create table public.messages (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.conversations(job_id), sender_id uuid not null references public.accounts(id),
 body text not null check(length(trim(body)) between 1 and 4000), client_id uuid not null,
 created_at timestamptz not null default now(), unique(sender_id,client_id)
);
create index messages_cursor on public.messages(job_id,created_at,id);
create table public.conversation_reads (job_id uuid references public.conversations(job_id), user_id uuid references public.accounts(id), read_at timestamptz not null default now(), primary key(job_id,user_id));
create table public.job_issues (id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id), reporter_id uuid not null references public.accounts(id), category text not null check(category in ('quality','scope','timing','other')), description text not null check(length(trim(description)) between 20 and 5000), created_at timestamptz not null default now());
create table public.issue_cases (id uuid primary key default gen_random_uuid(), issue_id uuid not null unique references public.job_issues(id), status text not null default 'open' check(status in ('open','under_review','resolved','dismissed')), resolution text check(length(resolution)<=5000), updated_at timestamptz not null default now());
create table public.reviews (
 id uuid primary key default gen_random_uuid(), job_id uuid not null unique references public.jobs(id), customer_id uuid not null references public.accounts(id), professional_id uuid not null references public.professional_profiles(user_id),
 rating smallint not null check(rating between 1 and 5), body text not null check(length(body)<=2000), hidden boolean not null default false,
 revision integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.review_versions (id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews(id), rating smallint not null check(rating between 1 and 5), body text not null check(length(body)<=2000), created_at timestamptz not null default now());
create table public.professional_responses (review_id uuid primary key references public.reviews(id), body text not null check(length(trim(body)) between 3 and 2000), hidden boolean not null default false, updated_at timestamptz not null default now());
create table public.response_versions (id uuid primary key default gen_random_uuid(), review_id uuid not null references public.professional_responses(review_id), body text not null check(length(trim(body)) between 3 and 2000), created_at timestamptz not null default now());
create table public.content_reports (id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews(id), reporter_id uuid not null references public.accounts(id), target text not null check(target in ('review','response')), reason text not null check(length(reason) between 3 and 1000), status text not null default 'pending' check(status in ('pending','reviewed','dismissed')), created_at timestamptz not null default now());
create table public.beta_feedback (id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.accounts(id), category text not null check(category in ('bug','improvement','general')), body text not null check(length(trim(body)) between 3 and 5000), screen text not null check(length(screen)<=200), status text not null default 'new' check(status in ('new','triaged','in_progress','resolved','dismissed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.admin_audit_events (id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.accounts(id), resource_id uuid not null, action text not null, note text not null check(length(trim(note)) between 3 and 2000), created_at timestamptz not null default now());
-- One attachment registry; non-null resource columns define its authorization scope.
create table public.image_assets (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.accounts(id),
 bucket text not null check(bucket in ('job-photos','profile-photos','portfolio-images','feedback-attachments')),
 object_path text not null unique, request_id uuid references public.service_requests(id), portfolio_id uuid references public.portfolio_items(id), feedback_id uuid references public.beta_feedback(id),
 alt_text text not null check(length(alt_text) between 1 and 300), created_at timestamptz not null default now(),
 check((bucket='job-photos' and request_id is not null and portfolio_id is null and feedback_id is null) or (bucket='profile-photos' and request_id is null and portfolio_id is null and feedback_id is null) or (bucket='portfolio-images' and portfolio_id is not null and request_id is null and feedback_id is null) or (bucket='feedback-attachments' and feedback_id is not null and request_id is null and portfolio_id is null))
);
create table private.commands (user_id uuid references public.accounts(id), command_id uuid, operation text not null, payload jsonb not null, result uuid not null, primary key(user_id,command_id));

-- Start every table locked. Deferred lifecycle/moderation writes are deliberately unavailable.
do $$ declare r record; begin
 for r in select tablename,schemaname from pg_tables where schemaname in ('public','private') loop
 execute format('alter table %I.%I enable row level security',r.schemaname,r.tablename);
 execute format('revoke all on %I.%I from public, anon, authenticated',r.schemaname,r.tablename);
 end loop;
end $$;
grant select on all tables in schema public to authenticated;
grant select on public.service_categories,public.service_areas to anon;
create policy taxonomy on public.service_categories for select to anon,authenticated using(active);
create policy taxonomy on public.service_areas for select to anon,authenticated using(active);
create policy owner on public.accounts for select to authenticated using(private.member() and id=(select auth.uid()));
create policy owner on public.customer_profiles for select to authenticated using(private.member() and user_id=(select auth.uid()));
create policy owner on public.professional_profiles for select to authenticated using(private.member() and user_id=(select auth.uid()));
create policy owner on public.professional_services for select to authenticated using(private.member() and professional_id=(select auth.uid()));
create policy owner on public.professional_areas for select to authenticated using(private.member() and professional_id=(select auth.uid()));
create policy owner on public.portfolio_items for select to authenticated using(private.member() and professional_id=(select auth.uid()));
create policy owner on public.service_requests for select to authenticated using(private.request_owner(id));
create policy owner on public.request_private_details for select to authenticated using(private.request_owner(request_id));
create policy parties on public.offers for select to authenticated using(private.member() and (professional_id=(select auth.uid()) or private.request_owner(request_id)));
create policy participants on public.jobs for select to authenticated using(private.participant(id));
do $$ declare t text; begin
 foreach t in array array['schedule_proposals','job_events','conversations','messages','conversation_reads','job_issues'] loop
 execute format('create policy participants on public.%I for select to authenticated using(private.participant(job_id))',t);
 end loop;
end $$;
create policy case_access on public.issue_cases for select to authenticated using(private.admin() or exists(select 1 from public.job_issues i where i.id=issue_id and private.participant(i.job_id)));
create policy review_read on public.reviews for select to authenticated using(private.member() and (not hidden or customer_id=(select auth.uid()) or private.admin()));
create policy response_read on public.professional_responses for select to authenticated using(private.member() and not hidden and exists(select 1 from public.reviews r where r.id=review_id and not r.hidden));
create policy report_read on public.content_reports for select to authenticated using(private.member() and (reporter_id=(select auth.uid()) or private.admin()));
create policy feedback_read on public.beta_feedback for select to authenticated using(private.member() and (reporter_id=(select auth.uid()) or private.admin()));
create policy audit_read on public.admin_audit_events for select to authenticated using(private.admin());
-- Version history intentionally admin-only; hidden content cannot leak via history.
create policy audit_read on public.review_versions for select to authenticated using(private.admin());
create policy audit_read on public.response_versions for select to authenticated using(private.admin());
create policy asset_owner on public.image_assets for select to authenticated using(private.member() and owner_id=(select auth.uid()));

create function public.beta_discover() returns table(id uuid,category_slug text,area_slug text,title text,description text,timing text,budget_mode text,budget_min_kobo bigint,budget_max_kobo bigint,published_at timestamptz)
language sql stable security definer set search_path='' as $$
 select r.id,r.category_slug,r.area_slug,r.title,r.description,r.timing,r.budget_mode,r.budget_min_kobo,r.budget_max_kobo,r.published_at
 from public.service_requests r where r.status='open' and r.customer_id<>(select auth.uid()) and private.matches(r.category_slug,r.area_slug)
 order by r.published_at desc,r.id limit 100;
$$;
-- Validation is repeated in the database; UI mode and client-supplied owner are ignored.
create function public.beta_save_professional(p_kind text,p_name text,p_business text,p_experience integer,p_bio text,p_categories text[],p_areas text[],p_revision integer) returns integer
language plpgsql security definer set search_path='' as $$
declare v integer;
begin
 if not private.member() then raise exception 'Verified beta membership required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select revision into v from public.professional_profiles where user_id=auth.uid() for update;
 if coalesce(v,0)<>p_revision then raise exception 'Profile changed; reload' using errcode='40001'; end if;
 if coalesce(cardinality(p_categories),0) not between 1 and 6 or coalesce(cardinality(p_areas),0) not between 1 and 30 or
 exists(select 1 from unnest(p_categories) c where not exists(select 1 from public.service_categories where slug=c and active)) or
 exists(select 1 from unnest(p_areas) a where not exists(select 1 from public.service_areas where slug=a and active)) then raise exception 'Select valid services and coverage'; end if;
 insert into public.professional_profiles(user_id,kind,display_name,business_name,experience,bio) values(auth.uid(),p_kind,p_name,p_business,p_experience,p_bio)
 on conflict(user_id) do update set kind=excluded.kind,display_name=excluded.display_name,business_name=excluded.business_name,experience=excluded.experience,bio=excluded.bio,revision=public.professional_profiles.revision+1,updated_at=now() returning revision into v;
 delete from public.professional_services where professional_id=auth.uid(); delete from public.professional_areas where professional_id=auth.uid();
 insert into public.professional_services select auth.uid(),c,'' from (select distinct unnest(p_categories) c) x;
 insert into public.professional_areas select auth.uid(),a from (select distinct unnest(p_areas) a) x;
 return v;
end $$;
create function public.beta_post_request(p_command uuid,p_category text,p_area text,p_title text,p_description text,p_timing text,p_date date,p_budget_mode text,p_min bigint,p_max bigint) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; payload jsonb:=jsonb_build_array(p_category,p_area,p_title,p_description,p_timing,p_date,p_budget_mode,p_min,p_max); old private.commands;
begin
 if not private.member() then raise exception 'Verified beta membership required' using errcode='42501'; end if;
 if p_command is null then raise exception 'Command ID required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into old from private.commands where user_id=auth.uid() and command_id=p_command;
 if found then if old.operation<>'post' or old.payload<>payload then raise exception 'Command reused with different data'; end if; return old.result; end if;
 if not exists(select 1 from public.service_categories where slug=p_category and active) or not exists(select 1 from public.service_areas where slug=p_area and active) or (p_timing='date' and p_date<(now() at time zone 'Africa/Lagos')::date) then raise exception 'Invalid category, coverage or date'; end if;
 insert into public.service_requests(customer_id,category_slug,area_slug,title,description,timing,preferred_date,budget_mode,budget_min_kobo,budget_max_kobo,status,published_at)
 values(auth.uid(),p_category,p_area,trim(p_title),trim(p_description),p_timing,p_date,p_budget_mode,p_min,p_max,'open',now()) returning id into result;
 insert into private.commands values(auth.uid(),p_command,'post',payload,result); return result;
end $$;
create function public.beta_submit_offer(p_command uuid,p_request uuid,p_amount bigint,p_price_type text,p_scope text,p_availability text,p_conditions text) returns uuid
language plpgsql security definer set search_path='' as $$
declare r public.service_requests; result uuid; payload jsonb:=jsonb_build_array(p_request,p_amount,p_price_type,p_scope,p_availability,p_conditions); old private.commands;
begin
 if not private.member() then raise exception 'Verified beta membership required' using errcode='42501'; end if;
 if p_command is null then raise exception 'Command ID required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into old from private.commands where user_id=auth.uid() and command_id=p_command;
 if found then if old.operation<>'offer' or old.payload<>payload then raise exception 'Command reused with different data'; end if; return old.result; end if;
 select * into r from public.service_requests where id=p_request for update;
 if not found or r.status<>'open' or r.customer_id=auth.uid() or not private.matches(r.category_slug,r.area_slug) then raise exception 'Job unavailable or professional ineligible' using errcode='42501'; end if;
 insert into public.offers(request_id,professional_id,amount_kobo,price_type,scope,availability,conditions) values(p_request,auth.uid(),p_amount,p_price_type,trim(p_scope),trim(p_availability),p_conditions) returning id into result;
 insert into private.commands values(auth.uid(),p_command,'offer',payload,result); return result;
end $$;
-- All remaining mutations default-deny until their reviewed transactional commands exist.
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.member(),private.admin(),private.participant(uuid),private.request_owner(uuid),private.matches(text,text) to authenticated;
revoke execute on function public.beta_discover(),public.beta_save_professional(text,text,text,integer,text,text[],text[],integer),public.beta_post_request(uuid,text,text,text,text,text,date,text,bigint,bigint),public.beta_submit_offer(uuid,uuid,bigint,text,text,text,text) from public,anon;
grant execute on function public.beta_discover(),public.beta_save_professional(text,text,text,integer,text,text[],text[],integer),public.beta_post_request(uuid,text,text,text,text,text,date,text,bigint,bigint),public.beta_submit_offer(uuid,uuid,bigint,text,text,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) select b,b,false,5242880,array['image/jpeg','image/png','image/webp'] from unnest(array['job-photos','profile-photos','portfolio-images','feedback-attachments']) b;
-- Reads require registry authorization, not just a guessable owner prefix. Uploads remain
-- disabled until server-side image validation/registry commands are available.
create policy servify_private_images on storage.objects for select to authenticated using(
 private.member() and exists(select 1 from public.image_assets a where a.bucket=bucket_id and a.object_path=name and a.owner_id=(select auth.uid()))
);
-- Index every referencing FK to avoid slow authorization/parent maintenance.
do $$ declare r record; begin
 for r in select c.conrelid::regclass as tbl,a.attname from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
 where c.contype='f' and c.connamespace in ('public'::regnamespace,'private'::regnamespace) loop
 execute format('create index if not exists %I on %s(%I)',replace(r.tbl::text,'.','_')||'_'||r.attname||'_fk',r.tbl,r.attname);
 end loop;
end $$;
