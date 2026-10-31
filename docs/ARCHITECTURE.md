# Technical architecture and security plan

## Stage 01 decisions

- Next.js App Router with strict TypeScript, React Server Components by default,
  Tailwind v4 and the Next ESLint flat configuration. No client state library,
  component framework, ORM or Supabase SDK until a feature needs it.
- Node 24 is the local baseline; package engines require Node 22 or newer. Use the
  checked-in npm lockfile and `npm ci` for repeatable installs.
- Dependency compatibility: Next 16.4.3 and React 19.3.1 are the stable npm releases
  checked for this stage. TypeScript uses 6.x because the bundled typescript-eslint
  parser explicitly rejects 7.x. ESLint uses 9.39.5 because Next's bundled import,
  React and accessibility plugins exclude ESLint 10 in their peer ranges. npm marks
  ESLint 9 unsupported; reassess this tooling constraint before Stage 02 and upgrade
  the coordinated lint stack when compatible. Do not force peer overrides.
- Thin routes in `src/app`; shared UI in `src/components`; future business use cases
  in `src/features`; general utilities in `src/lib`; domain types in `src/types`;
  server-only data adapters in `src/data`; decisions and setup in `docs`.
- Retain original README unchanged. No changes to Git history, commits, pushes,
  cloud projects, live credentials, deployments or Figma writes in this stage.
- Placeholder role routes are publicly readable static descriptions. They contain
  no protected data and are not access-control implementations. `noindex` is a
  discovery preference, not security. No form/actions or mock transactions exist.

## Proposed request and data flow

Browser → Next.js server route/action → runtime input validation and verified
Supabase session → authorized domain use case → Supabase PostgreSQL with RLS →
explicit output projection → UI. Browser state is never an authority for ownership,
role, price, status or verification. Validate all untrusted inputs including params,
forms and stored external data; types are compile-time contracts only.

Prefer Supabase's supported server-side cookie integration when auth is introduced.
Revalidate sessions server-side using the current recommended verified identity
method rather than trusting a client session object. Add authenticated server
guards to layouts/actions and data operations; route redirects alone are insufficient.
Check request origin/CSRF controls, rate limits, safe redirects, error redaction and
bounded inputs. Reject suspended accounts on mutations. Do not cache private responses
across users; any future caching must include authorization scope and invalidation.

## Supabase PostgreSQL and RLS

Domain types are not generated database types. Design tables and versioned local
migrations only after schema review in the next stage. RLS must default-deny on
all exposed tables, with authenticated user identity linked to profiles and jobs.
Use normalized category/area joins, explicit foreign keys and check/unique constraints.
Privileged role assignments live in trusted tables or server-controlled claims, not
user-editable metadata. Avoid stale claims granting a suspended account privileges.

| Resource | Proposed access |
| --- | --- |
| Active categories/areas | Public read; audited admin write |
| Private users/customer profiles | Owner read/update permitted fields; no role/status self-edit |
| Approved provider directory | Safe public projection only; private profile owner/admin access |
| Verification files/submissions | Owner submit/read; verification admin review; no public access |
| Draft jobs | Owner only |
| Open jobs | Owner full access; approved matching providers get sanitized discovery fields |
| Assigned jobs | Owner and selected provider scoped reads; exact address only as needed |
| Offers | Submitting provider and job owner only; no competitor access |
| Conversations/messages | Accepted job participants only; audited support access tied to a case |
| Status history | Job participants read; trusted transition operation inserts |
| Reviews | Safe published projection; owning customer creates after completion |
| Reports/disputes | Reporter/participants as appropriate; scoped admin case handling |

RLS filters rows, not a safe subset of columns. Separate private contacts/addresses
from discovery data or use carefully permissioned projections/RPCs. Review views
for invoker security; never expose private columns via a default owner-executed view.
Use one transactional database function for acceptance and other multi-row
transitions. A future security-definer function must pin search_path, validate actor
and permissions, narrowly grant execution and avoid arbitrary input SQL.
Add policy and concurrency tests before integrating real users.

## Authentication and phone/OTP decision gate

Supabase Authentication is proposed, not configured. Phone sign-in needs an enabled
phone provider and an SMS integration; SMS delivery is neither assumed available
nor free. Before selecting it, test Nigerian carrier delivery, sender registration,
route restrictions, delivery latency, retries, per-message/failed-attempt cost and
abuse budgets with a supported provider. Normalize +234 numbers; avoid duplicate
identities when linking phone/email and handle recycled phone numbers safely.

Specify OTP expiry, resend cooldown, attempt limits, enumeration-resistant errors,
CAPTCHA/risk controls and recovery. Never log codes or let clients set verified
timestamps. OTP verifies possession, not identity or provider competence.
Assess email/password or email-link fallback after testing deliverability and user
access; email delivery also needs operational configuration. Production admin access
needs MFA and an emergency recovery process. No auth method is operational here.

## Storage

Use separate private Supabase Storage buckets/classes for job images, portfolios
and verification evidence. Plan user/resource-scoped object paths, upload ownership
policies and short-lived signed reads. Portfolio publication requires an explicit
approved public delivery policy; do not make identity or job buckets public.

Proposed uploads: JPEG/PNG/WebP for photos, maximum 5 MiB each; verification accepts
those formats plus PDF up to 10 MiB. Validate magic bytes/content and dimensions
server-side, not just extensions/MIME headers; reject SVG/HTML, strip EXIF/location,
re-encode images, scan/quarantine documents and enforce count/size quotas. Define
cleanup for abandoned uploads and cascaded deletion. Never trust a client-provided
path to grant access. Images remain unimplemented in Stage 01.

## Messaging and lifecycle integrity

Persist conversation and message records in PostgreSQL; polling/pagination can be
the first transport. Realtime is an optional later enhancement governed by the same
participant authorization; realtime presence or an open socket grants no access.
One conversation per accepted job; no global direct messaging. Paginate by stable
timestamp/ID, limit message length and send frequency, and render plain escaped text.
No attachments, outbound SMS or push in the initial messaging scope.

Server transactions own offer acceptance, assignment and status history. Use row
locks and uniqueness for concurrent acceptance, idempotency for retried commands,
and server timestamps. Preserve accepted scope/amount and audit admin actions.
Dispute resolution is operational mediation, not escrow or refund processing.

## Privacy and operational security

Never commit `.env` files, credentials, access tokens, private certificates or
identity documents. `.env.example` is intentionally value-free. A future Supabase
publishable key may be public only with tested RLS; secret/service-role keys must
remain in server-only modules and environment secrets, never `NEXT_PUBLIC_*`.
Normal user operations should use their session/RLS rather than bypassing policies
with a service key. Redact PII from errors, logs, analytics and support exports.

Before launch approve a data inventory, minimum collection, consent/privacy notice,
retention schedules, account deletion/anonymization, backup handling, audit access
and incident response. Review applicable Nigerian privacy obligations before handling
real identity evidence. Set moderation access rules, access logs and reviewer training.

## Vercel deployment plan (deferred)

After an authorized deployment request, connect this existing repository, pin a
supported Node version, run npm ci/lint/typecheck/build in CI, and separate preview
and production environments. Use separate Supabase projects/credentials, approved
redirect URLs, server secrets and storage origins; previews must not access real
customer data. Review data regions/latency, costs, backup/restore, monitoring and
rollback before launch. Introduce appropriate CSP/security headers once actual
auth/storage origins are known. No deployment or cloud resource is created now.

## Decision record and Stage 02 blockers

Accepted: offer-based journey; no booking/payments/escrow/wallet/subscriptions/AI
quotes; private-by-default records; manual provider review; database messaging;
simple server-rendered placeholders. Proposed business policy: one active offer per
provider/job, customer-confirmed completion, admin-mediated post-assignment cancellation,
no pre-acceptance messaging, and disputes freeze progress until resolution.

Before functional Stage 02 work, confirm the launch category/area catalogue, accepted
verification documents and retention, auth delivery/cost and recovery, cancellation
and dispute operations, safe discovery/image policy, and Inter Tight/icon licenses.
Approve responsive wireframes and local schema/RLS tests before real data. A separate
approved PRD beyond the supplied brief was unavailable; reconcile it if supplied.

## Primary technical references

Checked during Stage 01; consult current docs again when integrating:

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Tailwind with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Phone sign-in and SMS provider setup](https://supabase.com/docs/guides/auth/phone-login)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase server-side auth](https://supabase.com/docs/guides/auth/server-side)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
