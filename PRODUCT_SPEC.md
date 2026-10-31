# Servify product specification

Status: Stage 01 planning baseline, 30 October 2026. Tagline: **Find the right person. Get it done.**

## Vision and problem

Servify is a mobile-first local services marketplace helping people in Ibadan
describe work, compare relevant providers, and build a trusted record of completed
services. Customers currently rely on fragmented referrals and informal messages;
provider availability, scope, price and accountability can be hard to assess.
Providers need a reliable way to discover suitable work and demonstrate competence.
These are hypotheses to validate through local interviews and a controlled pilot.

This specification follows the PRD direction supplied in the Stage 01 brief. No
separate approved PRD was present in the repository; unresolved policy choices
below remain proposals, not previously validated business decisions.

## Ibadan-first positioning

Start with a curated set of service categories and explicitly supported Ibadan
neighbourhoods, rather than claiming citywide supply. Use familiar area names,
NGN amounts, Nigerian phone formats normalized to E.164, and Africa/Lagos display
times. Store timestamps in UTC. Optimize for narrow screens, unreliable networks,
small image payloads and clear English; validate Yoruba/localization needs later.
Plumbing, electrical, AC, generator, cleaning and appliance work are candidate
categories from the design reference, not a confirmed launch catalogue.

## Roles

- Customers create and manage their own requests, compare offers, accept one,
  communicate about that job, confirm completion and review the provider.
- Providers complete onboarding, declare categories and coverage, submit
  verification, find relevant open requests, offer a price and scope, and deliver
  accepted work. Approval is required before submitting offers.
- Administrators approve taxonomy and service areas, review provider verification,
  moderate reports and disputes, suspend abusive accounts and audit interventions.
  Admin privileges are assigned by trusted operations, never self-selected.

One account may have customer and provider profiles. A provider cannot offer on
their own job. Role membership alone never grants access to another user's records.

## Primary marketplace journey

Customer posts job → relevant providers submit offers → customer compares offers →
customer accepts one provider → job-specific communication → work completion →
customer review.

1. Customer saves a draft with category, area, description, optional date, budget
   and images. Publishing validates completeness and supported coverage.
2. Approved providers matching category and area see a sanitized open request;
   exact address and private contact data remain hidden.
3. Each provider submits one current offer per job with NGN amount, scope,
   estimated duration and expiry. Offer terms remain stable after acceptance.
4. Customer compares only offers on their job. Accepting a valid offer is one
   atomic server transaction: assign job, select one offer, mark competitors
   not selected, append history and create one conversation. Concurrent acceptance
   must never assign two providers.
5. Only the customer and accepted provider communicate in that conversation.
   Exact address is disclosed only to the assigned provider as needed for work.
6. Assigned provider starts work, then requests completion. Customer confirms
   completion or raises a dispute. No automatic completion is assumed.
7. Customer can publish one 1–5 review for the completed job and accepted provider.
   Moderation may hide abuse; it must not rewrite a customer's opinion.

Cancellation, expired offers, withdrawn offers, rejected verification and disputes
must be explicit states with reasons and audit history. Disputes are separate from
job status and block normal completion/review transitions until resolved. See
[data rules](docs/DATA_MODEL.md) for the proposed transition contract.

## MVP scope (future implementation, not Stage 01)

- Secure account registration/sign-in and own-profile management.
- Provider categories, service areas, portfolio, manual verification and approval.
- Customer job drafts, publication, images and own-job tracking.
- Relevant provider discovery, offers and customer comparison/acceptance.
- Database-backed text communication after acceptance.
- Work progress, completion confirmation, one customer review per completed job.
- Admin verification queues, reports, dispute review, suspension and audit trail.
- Accessible loading, empty, validation, error and retry states; minimal operational
  metrics and in-app status visibility without exposing sensitive content.

Stage 01 supplies structure, contracts and placeholders only. It contains no
functional accounts, offers, messages or production transaction simulation.

## Deferred and excluded

Instant booking, escrow, internal wallets, subscriptions and AI-generated quotations
are outside this MVP direction. Also defer payment processing, commission collection,
automated identity checks, live location, mobile native apps, multi-city expansion,
complex ranking, bidding automation, message attachments and push/SMS notifications.
Any direct payment is agreed and made outside Servify; the platform must not imply
that it holds funds, guarantees payment, or can issue refunds. Monetization and
payment policy require separate validation and approval.

## Privacy and trust requirements

Collect only necessary information. Keep identity documents, contact information,
exact addresses, disputes and messages private. Discovery must use deliberate safe
projections, not entire job/account records. Use private image buckets, scoped
signed URLs, file validation and metadata removal. Never expose verification files
as public profile assets. Verification means a specific check was reviewed, not a
guarantee of safety or workmanship.

Require server authorization and database RLS on every owned resource; immutable
status/audit records; rate limits for auth, jobs, offers, uploads and messages;
reporting, suspension, and admin access logging. Define consent, retention, deletion,
appeal and incident handling before real personal data is collected. Review the
applicable Nigerian data protection obligations with qualified support before launch.
Analytics must not capture messages, addresses, identity files or OTP codes.

## Assumptions requiring validation

- Customers will post detailed requests and wait for offers rather than requiring
  immediate booking; validate acceptable time to first offer by category.
- Enough approved providers are active in each launch area/category to respond.
- Providers can quote useful scope remotely; clarify inspection fees/materials
  and scope changes before accepting real jobs.
- Manual verification and dispute handling are operationally affordable; define
  accepted documents, reviewer access, service levels and appeal process.
- Customers and providers will use job conversations and confirm completion.
- Nigerian SMS routes deliver reliably at acceptable cost; email fallback usability
  and delivery also need testing. A phone number is not proof of identity.
- Off-platform payment and future monetization can sustain the marketplace without
  misleading guarantees or incentives to bypass it.

## Success metrics

Instrument server-confirmed events with pseudonymous IDs and no sensitive payloads.
Agree targets after baseline pilot data; no invented numeric traction targets.

| Metric | Definition |
| --- | --- |
| Supply coverage | Active approved providers per launch category and area |
| Offer coverage | Published jobs receiving at least one valid offer / published jobs, measured over a fixed pilot window |
| Time to first offer | Median and p90 elapsed time from publication to first valid offer |
| Assignment rate | Jobs with accepted offer / published jobs in the same cohort |
| Completion rate | Customer-confirmed completions / assigned jobs after an agreed maturation window |
| Review participation | Completed jobs receiving a review / completed jobs |
| Repeat use | Customers posting another job within a defined 30/60/90-day cohort window |
| Trust and operations | Reports/disputes per assigned job, cancellation reasons, resolution time, verification turnaround |
| Reliability | Auth delivery success, mutation failures, upload failures and mobile page performance |

Avoid treating unsigned page visits or unconfirmed provider completions as completed
transactions. Segment by area/category and monitor supply concentration and abuse.

## Development stages and exit criteria

1. **Foundation (this stage):** scaffold, product specification, types, design and
   architecture plans; pass lint, type checks, build and placeholder route checks.
2. **Validated design and identity:** approve launch taxonomy, auth delivery,
   privacy policies and wireframes; design the schema, local migrations and RLS
   tests; introduce approved auth/profile integration in an isolated environment.
3. **Jobs and provider supply:** onboarding, verification, images, coverage and job
   publication/discovery with real access-control tests and moderation tooling.
4. **Offers and communication:** atomic acceptance, scoped database messaging,
   work progress, cancellation and completion rules with concurrency tests.
5. **Trust and controlled launch:** reviews, disputes, audit, accessibility,
   performance, retention, operational readiness and an Ibadan pilot.

No stage authorizes cloud creation, deployment or live credentials without the
relevant implementation request. Revisit assumptions at each stage boundary.
