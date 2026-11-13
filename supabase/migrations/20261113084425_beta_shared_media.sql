-- Stage 09A: direct authenticated private uploads. No content-inspection claim.
alter table public.image_assets
 add column state text not null default 'ready' check(state in ('pending','ready')),
 add column expected_bytes integer check(expected_bytes between 1 and 5242880),
 add column content_type text check(content_type in ('image/jpeg','image/png','image/webp'));
create index images_owner_bucket on public.image_assets(owner_id,bucket,state);
create index images_request on public.image_assets(request_id) where request_id is not null;
create index images_portfolio on public.image_assets(portfolio_id) where portfolio_id is not null;

-- SECURITY DEFINER is limited to authorization/commands, never a client owner field.
create function private.media_visible(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.member() and exists (
 select 1 from public.image_assets a where a.id=p_id and (
 a.owner_id=(select auth.uid()) or (a.state='ready' and (
 (a.bucket='job-photos' and exists(select 1 from public.service_requests r
 where r.id=a.request_id and (
 (r.status='open' and private.matches(r.category_slug,r.area_slug))
 or exists(select 1 from public.jobs j where j.request_id=r.id and j.professional_id=(select auth.uid()))
 )))
 or (a.bucket in ('profile-photos','portfolio-images') and exists (
 select 1 from public.offers o join public.service_requests r on r.id=o.request_id
 where o.professional_id=a.owner_id and r.customer_id=(select auth.uid()) and o.status in ('submitted','accepted')
 ))
 ))));
$$;
create function private.media_write(p_bucket text,p_path text,p_upload boolean) returns boolean
language sql stable security definer set search_path='' as $$
 select private.member() and exists(select 1 from public.image_assets a
 where a.bucket=p_bucket and a.object_path=p_path and a.owner_id=(select auth.uid())
 and a.bucket in ('job-photos','profile-photos','portfolio-images')
 and (not p_upload or (a.state='pending' and a.created_at>now()-interval '24 hours')));
$$;
drop policy asset_owner on public.image_assets;
create policy media_read on public.image_assets for select to authenticated using(private.media_visible(id));
drop policy servify_private_images on storage.objects;
create policy servify_media_read on storage.objects for select to authenticated using(
 exists(select 1 from public.image_assets a where a.bucket=bucket_id and a.object_path=name and private.media_visible(a.id)));
create policy servify_media_insert on storage.objects for insert to authenticated
 with check(private.media_write(bucket_id,name,true));
-- Objects are immutable: deliberately no UPDATE policy, including upserts.
create policy servify_media_delete on storage.objects for delete to authenticated
 using(private.media_write(bucket_id,name,false));

create function private.beta_reserve_media(p_id uuid,p_bucket text,p_request uuid,p_bytes integer,p_type text,p_alt text,p_title text,p_description text,p_category text)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.image_assets; resource_owner uuid; n integer;
begin
 if not private.member() or p_id is null then raise exception 'Beta membership required' using errcode='42501'; end if;
 if p_bucket is null or p_bucket not in ('job-photos','profile-photos','portfolio-images') or p_bytes is null or p_bytes not between 1 and 5242880
 or p_type is null or p_type not in ('image/jpeg','image/png','image/webp')
 or p_alt is null or length(p_alt) not between 1 and 300 then raise exception 'Invalid media parameters'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into a from public.image_assets where id=p_id;
 if found then
  if a.owner_id<>auth.uid() or a.bucket<>p_bucket or a.request_id is distinct from p_request
   or a.expected_bytes<>p_bytes or a.content_type<>p_type or a.alt_text<>p_alt then raise exception 'Media retry changed' using errcode='42501'; end if;
  if p_bucket='portfolio-images' and not exists(select 1 from public.portfolio_items where id=a.portfolio_id and title=p_title and description=p_description and category_slug=p_category)
   then raise exception 'Portfolio retry changed'; end if;
  if a.state='pending' then update public.image_assets set created_at=now() where id=p_id; end if;
  return p_id;
 end if;
 if p_bucket='job-photos' then
  if p_request is null or not private.request_owner(p_request) then raise exception 'Request not owned' using errcode='42501'; end if;
  perform 1 from public.service_requests where id=p_request and status in ('open','selected') for update;
  if not found then raise exception 'Request unavailable'; end if;
 else
  if p_request is not null or not exists(select 1 from public.professional_profiles where user_id=auth.uid()) then raise exception 'Professional profile required' using errcode='42501'; end if;
 end if;
 select count(*) into n from public.image_assets where owner_id=auth.uid();
 if n>=64 then raise exception 'Account photo limit reached; remove unused shared photos'; end if;
 select count(*) into n from public.image_assets where owner_id=auth.uid() and bucket=p_bucket
 and (p_bucket<>'job-photos' or request_id=p_request);
 if n>=8 then raise exception 'Photo limit reached (8); remove an unused shared photo'; end if;
 if p_bucket='portfolio-images' then
  if p_title is null or length(trim(p_title)) not between 3 and 100 or p_description is null or length(p_description)>500
  or not exists(select 1 from public.professional_services s join public.service_categories c on c.slug=s.category_slug
   where s.professional_id=auth.uid() and s.category_slug=p_category and c.active) then raise exception 'Invalid portfolio details'; end if;
  insert into public.portfolio_items(id,professional_id,title,description,category_slug) values(p_id,auth.uid(),trim(p_title),p_description,p_category);
 end if;
 insert into public.image_assets(id,owner_id,bucket,object_path,request_id,portfolio_id,alt_text,state,expected_bytes,content_type)
 values(p_id,auth.uid(),p_bucket,auth.uid()::text||'/'||p_id::text||case p_type when 'image/png' then '.png' when 'image/webp' then '.webp' else '.jpg' end,
 p_request,case when p_bucket='portfolio-images' then p_id end,p_alt,'pending',p_bytes,p_type);
 return p_id;
end $$;

create function private.beta_complete_media(p_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare a public.image_assets;
begin
 if not private.member() then raise exception 'Beta membership required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into a from public.image_assets where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Media unavailable' using errcode='42501'; end if;
 if not exists(select 1 from storage.objects o where o.bucket_id=a.bucket and o.name=a.object_path
 and o.owner_id=auth.uid()::text and (o.metadata->>'size')::bigint=a.expected_bytes and o.metadata->>'mimetype'=a.content_type)
 then raise exception 'Upload not complete or size/type mismatch'; end if;
 update public.image_assets set state='ready' where id=p_id;
 return p_id;
end $$;
create function private.beta_forget_media(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare a public.image_assets;
begin
 if not private.member() then raise exception 'Beta membership required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into a from public.image_assets where id=p_id and owner_id=auth.uid() for update;
 if not found then return; end if;
 if exists(select 1 from storage.objects where bucket_id=a.bucket and name=a.object_path) then raise exception 'Remove storage object first'; end if;
 delete from public.image_assets where id=p_id;
 if a.portfolio_id is not null then delete from public.portfolio_items where id=a.portfolio_id and professional_id=auth.uid(); end if;
end $$;
create function public.beta_reserve_media(p_id uuid,p_bucket text,p_request uuid,p_bytes integer,p_type text,p_alt text,p_title text default '',p_description text default '',p_category text default '')
returns uuid language sql security invoker set search_path='' as $$ select private.beta_reserve_media(p_id,p_bucket,p_request,p_bytes,p_type,p_alt,p_title,p_description,p_category) $$;
create function public.beta_complete_media(p_id uuid) returns uuid language sql security invoker set search_path='' as $$select private.beta_complete_media(p_id)$$;
create function public.beta_forget_media(p_id uuid) returns void language sql security invoker set search_path='' as $$select private.beta_forget_media(p_id)$$;
revoke all on function private.media_visible(uuid),private.media_write(text,text,boolean),
 private.beta_reserve_media(uuid,text,uuid,integer,text,text,text,text,text),private.beta_complete_media(uuid),private.beta_forget_media(uuid),
 public.beta_reserve_media(uuid,text,uuid,integer,text,text,text,text,text),public.beta_complete_media(uuid),public.beta_forget_media(uuid) from public,anon;
grant execute on function private.media_visible(uuid),private.media_write(text,text,boolean),
 private.beta_reserve_media(uuid,text,uuid,integer,text,text,text,text,text),private.beta_complete_media(uuid),private.beta_forget_media(uuid),
 public.beta_reserve_media(uuid,text,uuid,integer,text,text,text,text,text),public.beta_complete_media(uuid),public.beta_forget_media(uuid) to authenticated;
