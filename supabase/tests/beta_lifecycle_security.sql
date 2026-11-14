-- Synthetic accounts/claims ONLY, always rolled back. Not a GoTrue/email/device test.
begin;
create function pg_temp.check_true(ok boolean, label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; end$$;
create function pg_temp.denied(statement text) returns void language plpgsql as $$
begin
 begin execute statement; exception when insufficient_privilege or check_violation or unique_violation or raise_exception then return; end;
 raise exception 'Unexpectedly allowed: %',statement;
end$$;
select pg_temp.check_true(not exists(select 1 from pg_tables where schemaname in ('public','private') and not rowsecurity),'every application table has RLS');
select pg_temp.denied($q$insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000009','not-invited@example.invalid')$q$);
insert into private.beta_invites(email,expires_at) select 'test-'||n||'@example.invalid', now()+interval '1 hour' from generate_series(1,6) n;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) select ('00000000-0000-4000-8000-00000000000'||n)::uuid,'test-'||n||'@example.invalid',case when n=5 then null else now() end,'{"role":"admin"}'::jsonb from generate_series(1,6) n;
update public.accounts set status='suspended' where id='00000000-0000-4000-8000-000000000006';
-- One unrelated draft with sensitive details, never exposed through discovery.
insert into public.service_requests(id,customer_id,title) values('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Private unfinished draft');
insert into public.request_private_details values('10000000-0000-4000-8000-000000000001','Synthetic private address');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}',true);
select pg_temp.check_true((select count(*)=1 from public.accounts),'owner account only');
select pg_temp.check_true((select count(*)=1 from public.service_requests),'customer own draft');
select public.beta_post_request('20000000-0000-4000-8000-000000000001','electrical','bodija','Repair faulty socket','A faulty electrical socket needs inspection and safe repair.','flexible',null,'quotes',null,null);
select public.beta_post_request('20000000-0000-4000-8000-000000000001','electrical','bodija','Repair faulty socket','A faulty electrical socket needs inspection and safe repair.','flexible',null,'quotes',null,null);
select pg_temp.check_true((select count(*)=1 from public.service_requests where status='open'),'idempotent publish');
select set_config('test.request',(select id::text from public.service_requests where status='open'),true);
select pg_temp.denied($q$select public.beta_post_request('20000000-0000-4000-8000-000000000001','electrical','bodija','Different payload title','A faulty electrical socket needs inspection and safe repair.','flexible',null,'quotes',null,null)$q$);
select pg_temp.denied($q$insert into public.service_requests(customer_id) values('00000000-0000-4000-8000-000000000002')$q$);
select pg_temp.denied($q$update public.accounts set status='active'$q$);
select pg_temp.denied($q$delete from public.service_requests$q$);
select pg_temp.denied($q$insert into private.admin_members(user_id,active) values('00000000-0000-4000-8000-000000000001',true)$q$);
select pg_temp.check_true(not private.admin(),'user_metadata cannot grant admin');
-- Professional B: profile incomplete cannot discover/offer.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}',true);
select pg_temp.check_true((select count(*)=0 from public.service_requests),'no unrelated raw requests');
select pg_temp.check_true((select count(*)=0 from public.request_private_details),'no unrelated private address');
select pg_temp.check_true((select count(*)=0 from public.beta_discover()),'incomplete professional cannot discover');
select pg_temp.denied($q$select public.beta_submit_offer('20000000-0000-4000-8000-000000000002',current_setting('test.request')::uuid,1500000,'fixed','Inspection and socket repair','Within two days','')$q$);
select public.beta_save_professional('individual','Synthetic Professional','',3,'Electrical repairs with careful work and clear communication.',array['electrical'],array['bodija'],0);
select pg_temp.check_true((select count(*)=1 from public.beta_discover() where id=current_setting('test.request')::uuid),'matching completed profile discovers open request');
select public.beta_submit_offer('20000000-0000-4000-8000-000000000002',current_setting('test.request')::uuid,1500000,'fixed','Inspection and socket repair','Within two days','');
select public.beta_submit_offer('20000000-0000-4000-8000-000000000002',current_setting('test.request')::uuid,1500000,'fixed','Inspection and socket repair','Within two days','');
select pg_temp.check_true((select count(*)=1 from public.offers),'own offer and idempotency');
select pg_temp.denied($q$update public.offers set professional_id='00000000-0000-4000-8000-000000000003'$q$);
select pg_temp.denied($q$delete from public.offers$q$);
select pg_temp.denied($q$insert into public.messages(job_id,sender_id,body,client_id) values(gen_random_uuid(),'00000000-0000-4000-8000-000000000002','Unauthorized message',gen_random_uuid())$q$);
-- Independent competing provider: can see eligible listing, cannot see rival offers.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}',true);
select public.beta_save_professional('individual','Synthetic Competitor','',4,'Electrical services with careful installation and maintenance.',array['electrical'],array['bodija'],0);
select pg_temp.check_true((select count(*)=1 from public.beta_discover() where id=current_setting('test.request')::uuid),'competitor discovery');
select pg_temp.check_true((select count(*)=0 from public.offers),'competing offers private');
select pg_temp.check_true((select count(*)=0 from public.professional_profiles where user_id<>'00000000-0000-4000-8000-000000000003'),'private professional profile');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}',true);
select pg_temp.check_true((select count(*)=1 from public.offers),'customer sees received offer');
-- Set up a selected/completed job as trusted fixture to test participant reads.
reset role;
-- Stage 09C authorization assertions, using the transaction's synthetic participants.
update public.offers set status='accepted' where request_id=current_setting('test.request')::uuid;
insert into public.jobs(id,request_id,offer_id,professional_id,customer_id)
select '30000000-0000-4000-8000-000000000001',request_id,id,professional_id,'00000000-0000-4000-8000-000000000001' from public.offers where request_id=current_setting('test.request')::uuid;
create function pg_temp.expect_state(statement text,wanted text) returns void language plpgsql as $$
declare code text;begin begin execute statement;exception when others then get stacked diagnostics code=returned_sqlstate;
 if code=wanted then return;end if;raise exception 'Expected %, got %',wanted,code;end;raise exception 'Expected denial';end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","user_metadata":{"role":"provider","admin":true}}',true);
select pg_temp.expect_state($q$select public.beta_job_command(gen_random_uuid(),'30000000-0000-4000-8000-000000000001',1,'confirm')$q$,'PT409');
select pg_temp.denied($q$update public.jobs set status='completed'$q$);
select pg_temp.denied($q$insert into public.job_events(job_id,actor_id,kind,to_status) values('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','complete','completed')$q$);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select public.beta_job_command('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,'confirm');
select public.beta_job_command('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,'confirm');
select pg_temp.check_true((public.beta_job('30000000-0000-4000-8000-000000000001')->'job'->>'revision')::integer=2,'stable command retry');
select pg_temp.expect_state($q$select public.beta_job_command(gen_random_uuid(),'30000000-0000-4000-8000-000000000001',1,'start')$q$,'PT409');
-- Cancellation/decline keep pending proposals and activity consistent.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select pg_temp.expect_state($q$select public.beta_job_command(gen_random_uuid(),'30000000-0000-4000-8000-000000000001',2,'cancel')$q$,'22023');
select public.beta_job_command(gen_random_uuid(),'30000000-0000-4000-8000-000000000001',2,'propose',null,date_trunc('day',now()+interval '2 days')+interval '9 hours',date_trunc('day',now()+interval '2 days')+interval '11 hours','Synthetic cancellation window');
select public.beta_job_command(gen_random_uuid(),'30000000-0000-4000-8000-000000000001',3,'cancel',null,null,null,'Synthetic cancellation reason');
select pg_temp.check_true((public.beta_job('30000000-0000-4000-8000-000000000001')->'job'->>'status')='cancelled','customer pre-start cancellation');
select pg_temp.check_true(not exists(select 1 from public.schedule_proposals where job_id='30000000-0000-4000-8000-000000000001' and status='pending'),'cancel withdraws pending proposal');
select set_config('test.decline_request',public.beta_post_request(gen_random_uuid(),'electrical','bodija','Synthetic decline request','Synthetic electrical repair request for lifecycle decline verification.','flexible',null,'quotes',null,null)::text,true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select set_config('test.decline_offer',public.beta_submit_offer(gen_random_uuid(),current_setting('test.decline_request')::uuid,1500000,'estimate','Synthetic electrical inspection and repair','Within two days','')::text,true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select set_config('test.decline_job',public.beta_select_offer(gen_random_uuid(),current_setting('test.decline_offer')::uuid,1)::text,true);
select pg_temp.expect_state($q$select public.beta_job_command(gen_random_uuid(),current_setting('test.decline_job')::uuid,1,'decline',null,null,null,'Synthetic decline reason')$q$,'PT409');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select public.beta_job_command(gen_random_uuid(),current_setting('test.decline_job')::uuid,1,'decline',null,null,null,'Synthetic decline reason');
select pg_temp.check_true((public.beta_job(current_setting('test.decline_job')::uuid)->'job'->>'status')='cancelled','only selected professional declines');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated","user_metadata":{"role":"admin"}}',true);
select pg_temp.check_true(public.beta_job('30000000-0000-4000-8000-000000000001') is null,'unrelated job lookup hidden');
select pg_temp.check_true(not exists(select 1 from public.beta_jobs() where id='30000000-0000-4000-8000-000000000001'),'unrelated list hidden');
select pg_temp.check_true(not exists(select 1 from public.job_events where job_id='30000000-0000-4000-8000-000000000001'),'activity RLS');
select pg_temp.check_true(not exists(select 1 from public.schedule_proposals where job_id='30000000-0000-4000-8000-000000000001'),'schedule RLS');
select pg_temp.expect_state($q$select public.beta_job_command(gen_random_uuid(),'30000000-0000-4000-8000-000000000001',2,'start')$q$,'42501');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","role":"authenticated"}',true);
select pg_temp.expect_state($q$select public.beta_job_command(gen_random_uuid(),'30000000-0000-4000-8000-000000000001',2,'start')$q$,'42501');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000006","role":"authenticated"}',true);
select pg_temp.expect_state($q$select public.beta_job_command(gen_random_uuid(),'30000000-0000-4000-8000-000000000001',2,'start')$q$,'42501');
reset role;set local role anon;
select pg_temp.denied($q$select public.beta_job('30000000-0000-4000-8000-000000000001')$q$);
select pg_temp.denied($q$select public.beta_job_command(gen_random_uuid(),'30000000-0000-4000-8000-000000000001',2,'start')$q$);
reset role;
select pg_temp.check_true(exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='job_events'),'activity publication');
select pg_temp.check_true(not exists(select 1 from pg_tables where schemaname='public' and not rowsecurity),'RLS retained');
select 'PASS: lifecycle participant authorization, role-spoof denial, private reads/writes, stable retries and HTTP conflict codes' as result;
rollback;
