CREATE OR REPLACE FUNCTION private.beta_feedback(p_job uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select private.beta_job(j.id)||jsonb_build_object('review',(select to_jsonb(r)||jsonb_build_object(
 'review_versions',(select count(*) from public.review_versions v where v.review_id=r.id),
 'response_versions',(select count(*) from public.response_versions v where v.review_id=r.id),
 'response',(select jsonb_build_object('body',case when not p.hidden or j.professional_id=auth.uid() then p.body else null end,'hidden',p.hidden,'updated_at',p.updated_at) from public.professional_responses p where p.review_id=r.id and not r.hidden))
 from public.reviews r where r.job_id=j.id and (not r.hidden or j.customer_id=auth.uid())),
 'issues',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('case_status',c.status,'case_updated_at',c.updated_at) order by i.created_at,i.id)
 from public.job_issues i left join public.issue_cases c on c.issue_id=i.id where i.job_id=j.id),'[]'::jsonb))
 from public.jobs j where j.id=p_job and private.participant(j.id)
$function$;
