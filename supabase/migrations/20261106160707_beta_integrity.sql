insert into public.service_areas(slug,label) values ('bodija','Bodija'),('akobo','Akobo'),('oluyole','Oluyole'),('iyaganku','Iyaganku'),('jericho','Jericho'),('challenge','Challenge'),('ring-road','Ring Road'),('apete','Apete'),('other-ibadan','Another area in Ibadan');

create function private.review_integrity() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.jobs j where j.id=new.job_id and j.status='completed' and j.completed_at is not null and j.customer_id=new.customer_id and j.professional_id=new.professional_id) then
 raise exception 'Review requires the completed job customer and professional'; end if;
 return new;
end $$;
create trigger review_eligibility before insert or update on public.reviews for each row execute function private.review_integrity();
create function private.job_integrity() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.service_requests r join public.offers o on o.request_id=r.id where r.id=new.request_id and r.customer_id=new.customer_id and o.id=new.offer_id and o.professional_id=new.professional_id and o.status='accepted') then
 raise exception 'Job requires the request owner and accepted offer'; end if;
 return new;
end $$;
create trigger job_parties before insert or update on public.jobs for each row execute function private.job_integrity();
revoke execute on function private.review_integrity(),private.job_integrity() from public,anon,authenticated;
