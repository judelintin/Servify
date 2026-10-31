# Initial domain model and validation contract

Source contracts: [marketplace.ts](../src/types/marketplace.ts). These are planning
types; TypeScript does not validate network inputs or authorize users. No database
tables, migrations or policies are created in Stage 01.

## Shared conventions

IDs are server-generated UUIDs. Timestamps are UTC ISO-8601 strings set by trusted
code; `createdAt` is immutable and `updatedAt` changes only on valid mutations.
Entity references must exist and be checked for ownership, status and relationship
consistency on the server and eventually in database constraints/RLS. Optional
values use null. Money is a nonnegative safe integer in kobo, never floating point
naira, with currency NGN. A submitted offer must be greater than zero. Normalize
phone numbers to E.164, verify ownership separately, and never use a supplied user
ID or role as proof of identity.

Proposed MVP limits: title 10–120 trimmed characters; job description 30–5,000;
provider bio at most 2,000; offer scope 20–3,000; estimated duration 1–200;
message 1–4,000; review comment at most 2,000; report/dispute description 20–5,000.
Plain text only. Reject blank input, invalid dates, unknown enum values, inactive
taxonomy, negative/reversed budgets and unexpected mutation fields. Allow at most
8 job images, 12 portfolio images and 4 verification documents per submission.
These are proposals to validate before implementing runtime schemas. Drafts may
be incomplete; publishing enforces required title, description, category and area.

## Relationships and ownership

| Model | Relationships / uniqueness | Ownership and validation |
| --- | --- | --- |
| User | ID maps 1:1 to future auth user; one or more roles | Owner reads private account; server assigns roles, suspension and verified timestamps. At least one verified auth identity required before publishing/offering. Public DTO exposes display name only as needed. |
| CustomerProfile | Unique userId; optional default ServiceArea | Owner edits preferences; never transfers userId. |
| ProviderProfile | Unique userId; categories and areas are many-to-many | Owner edits draft profile/portfolio; admin controls approval/suspension. At least one active category and area for submission. Normalize arrays into join tables later. |
| ServiceCategory | Unique slug | Admin-maintained active taxonomy; no arbitrary client category creation. |
| ServiceArea | Unique city/name; Ibadan, Oyo, NG | Admin-maintained coverage. Avoid public precise coordinates. |
| VerificationSubmission | Many per ProviderProfile; immutable submitted evidence | Owner submits/withdraws; assigned authorized admin reviews. No self-approval, approved evidence changes require a new submission. Reviewer/reason/date set together. |
| JobRequest | One CustomerProfile/category/area; acceptedOfferId optional | Customer owns drafts and publication; identity, owner and acceptance fields are server-controlled. Full record is private. Providers see only safe projection of eligible open jobs. |
| JobImage | Many per job; unique job/sortOrder | Only customer owner uploads; uploadedBy must match actor. Path must belong to job/customer prefix. Alt text at most 300 characters; sortOrder nonnegative integer. |
| ProviderOffer | One current offer per job/provider | Approved matching provider owns submission, edits while submitted and withdraws; no offering on own job. Only job customer can accept; only owner/customer can read offer terms. Competitors cannot read each other's offers. |
| Conversation | Exactly one per accepted job; two distinct participants | Participants derived from job/customer/accepted provider, never client-chosen. Created atomically on acceptance. Closed when job completes/cancels. |
| Message | Belongs to conversation, sender must be participant | Participant inserts text only while active; no sender spoofing or client edits/deletes. Moderation can hide with separate audit, never rewrite content. Closed history remains readable under retention policy. |
| JobStatusHistory | Append-only per job | Trusted transaction writes actor and valid transition; participants read job history. No client insert/update/delete. Null fromStatus only for initial draft creation. |
| Review | Unique job; customer/provider must match assignment | Only owning customer after confirmed completion; rating integer 1–5. Public sanitized reviews only; admin may hide with reason/audit. No arbitrary provider substitution. |
| Report | One discriminated target, reporter user, optional admin | Authenticated reporter must have access to the target; reporter/admin read, reported person cannot inspect reporter details. Resolve/dismiss requires admin, reason and timestamp. |
| Dispute | Job, opener, optional admin; one unresolved dispute per job | Only customer/assigned provider opens; participants see appropriate case view. Admin resolution with reason/audit; no authority to move funds. |

Use sanitized public provider/review projections rather than exposing account or
verification rows. Job images are participant-only in the proposed MVP; open-job
discovery is text-only until image privacy/redaction policy is approved. Exact
address is owner/assigned-provider only. Admin support access is scoped to a case,
audited and not a blanket public read policy. Verification files are a distinct
private storage class from portfolio images.

## Job lifecycle and actors

| From | To | Actor / preconditions |
| --- | --- | --- |
| initial | draft | Customer creates owned draft |
| draft | open | Owner publishes validated request in active coverage |
| draft, open | cancelled | Owner cancels with reason |
| open | assigned | Owner accepts one unexpired submitted eligible offer atomically |
| assigned | in_progress | Assigned provider acknowledges work start |
| in_progress | completion_requested | Assigned provider reports completion |
| completion_requested | completed | Owning customer confirms; no unresolved dispute |
| completion_requested | in_progress | Customer requests further work with reason; no unresolved dispute |
| assigned, in_progress, completion_requested | cancelled | Admin-mediated cancellation with reason and participant notice |

Completed and cancelled are terminal; a cancelled job is not silently reopened.
An unresolved dispute freezes normal progress/completion/review; resolution records
the authorized next action without silently changing status. No auto-completion
timeout in this baseline. Define withdrawal/cancellation fees separately if ever
needed; no financial penalties are implemented here.

`acceptedOfferId` is null before assignment; afterwards it references an offer on
that same job, retained even if later cancelled. `completedAt` is set only on
completion; `publishedAt` on publication. Lock the open job during acceptance,
re-check provider approval, ownership, category/area, offer status and expiry,
write all state changes/history/conversation in one transaction, and reject stale
or duplicate selections idempotently. A future unique partial constraint allows
at most one accepted offer per job. Never implement acceptance as independent
browser updates. Scope/price changes after acceptance require a separately approved
policy; accepted terms are immutable in this MVP.

## Other state machines

- Provider: draft → pending_review → approved/rejected; rejected → draft for
  revision; approved → suspended by admin; suspended → approved only after admin
  review. Approved service/coverage changes require review before becoming eligible.
- Verification: submitted → under_review → approved/rejected; submitted or
  under_review → withdrawn by owner. Terminal evidence remains immutable until
  retention deletion; resubmit as a new record. Submission approval does not
  automatically grant unrestricted profile approval.
- Offer: submitted → accepted/not_selected/withdrawn/expired. Provider may edit
  submitted terms before expiry/assignment; acceptance freezes terms. Expired and
  withdrawn records do not become accepted. Accepted records remain historical
  on cancellation. Other submitted offers become not_selected on assignment.
- Conversation: active → closed on completed/cancelled job. Historical messages
  are retained under the agreed policy; no pre-acceptance conversation.
- Report/dispute: open → under_review → resolved/dismissed. Terminal outcome
  requires resolution text, assigned admin and resolvedAt. An admin cannot
  adjudicate their own case. Further evidence uses an audited follow-up process.

## Future database enforcement

Plan foreign keys, unique profile user IDs, category/area joins, monetary and enum
checks, unique job reviews/conversations and append-only audit permissions. Use
transactional server/RPC operations for multi-row transitions. Split private job
addresses/account contacts from discovery projections before granting any SELECT.
Test owner, stranger, competing provider, suspended user, anonymous user and admin
access for every operation. Types and UI route grouping cannot substitute for RLS.
