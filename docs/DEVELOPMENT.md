# Local development

Current customer functionality is documented in [Stage 03](STAGE_03.md): browser-local
drafts, the guided job form, draft details and customer dashboard. Use
`npm run verify:customer` for its end-to-end checks. All prior route URLs remain
available; existing provider/admin/public surfaces retain their approved shells.

The original root README remains unchanged. Start with [PRODUCT_SPEC.md](../PRODUCT_SPEC.md),
[architecture](ARCHITECTURE.md), [data contract](DATA_MODEL.md) and
[design foundations](DESIGN_FOUNDATIONS.md).
See [Stage 01 verification](VERIFICATION.md) for recorded checks and limitations.
The current [Stage 02 implementation record](STAGE_02.md) documents the design system,
role shells, additional routes, responsive checks and browser-test setup. Original
Stage 01 URLs in the table below remain available inside the new shells.

## Setup and commands

Use Node 24 (or a supported Node >=22) and npm. No environment variables, Supabase
account or other cloud resources are required for Stage 01.

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm run verify:routes
```

`dev` serves localhost:3000. The route checker starts a temporary production server
on 127.0.0.1:3199, checks prepared routes and a missing-page response, then stops it.
Run it after a successful build; use SERVIFY_VERIFY_PORT to choose another port.
Typecheck generates Next route types before checking TypeScript; generated Next
files and incremental compiler output are ignored by Git.

## Structure

```text
src/app/          App Router pages, layout, styles, not-found page
src/components/   Shared placeholder UI; future shared components
src/features/     Reserved domain feature modules (boundary documented)
src/lib/          Shared utilities and route inventory
src/types/        Initial domain contracts
src/data/         Reserved server-only data access (boundary documented)
docs/             Product architecture, design, data and verification notes
scripts/          Basic production route verification
```

## Prepared routes

| Route | Future purpose |
| --- | --- |
| / | Public homepage |
| /customer/dashboard | Customer jobs and activity |
| /jobs/new | Customer job posting |
| /jobs/[jobId] | Job details and relevant offers |
| /provider/onboarding | Provider profile and verification |
| /provider/dashboard | Relevant requests and own offers |
| /offers | Offer management/comparison |
| /conversations | Job conversation list |
| /conversations/[conversationId] | Accepted-job communication |
| /admin/dashboard | Verification and moderation |
| /auth/sign-in | Authentication |
| /auth/sign-up | Registration |

All are intentionally content-only and unauthenticated. Dynamic IDs are not
looked up or echoed and do not represent real resources. Future implementations
must validate identifiers, authorize the actor and return not-found/forbidden
responses as appropriate. Existing descriptions must never become a substitute
for protected data access.
