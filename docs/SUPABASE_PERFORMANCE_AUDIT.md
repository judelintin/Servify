# Supabase CPU performance audit — 14 November 2026

Baseline: main at 7583db9487fadf4abede5caf6bb5b8df9914fcdf. Scope: servify-beta only; no Stage 09C implementation. All times below are UTC.

## Finding and evidence

This was an ongoing backend retry storm, not merely the normal short-lived cost of testing. At 15:18 the cumulative pg_stat_statements request-context setup count exceeded 407 million. Between 15:20:35.924 and 15:20:58.862, pg_stat_database rollbacks increased from 407197059 to 407214314: approximately 752 per second. Cumulative statistics are not CPU utilization measurements and include activity since their last reset.

The available rolling 24-hour Postgres logs initially contained 86327 SQLSTATE 40001 errors; 86326 had the exact message “Offer changed or request already selected”. A later rolling-window query found these errors from 13 November 15:29:07 through 14 November 15:23:44. Counts differ as the window moves; they are not counts of independent client requests. Two contemporaneous database activity samples showed PostgREST 14.18 executing beta_select_offer, while completed HTTP traffic was modest (816 edge records in the inspected window). The active statements contained placeholders, not credential values.

private.beta_select_offer deliberately raised 40001 for an already-selected request, changed offer or stale revision. private.beta_save_professional used the same code for a stale profile revision. These business conflicts cannot succeed by retrying the identical transaction. Supabase documents an infinite transaction-retry issue with this use of 40001 on PostgREST 14. It explains the continuing rollbacks despite low completed API traffic. Earlier negative selection tests are a plausible trigger, but the initiating request cannot be identified conclusively from retained logs. No claim is made that all prior CPU utilization came from this one cause.

## Narrow correction

Applied migration 20261114152344_beta_business_conflict_codes changes only these two deterministic business-conflict SQLSTATE values from 40001 to PT409 (HTTP 409). It uses CREATE OR REPLACE for the existing private functions, preserving their ownership, grants, pinned search_path, membership checks, transaction locks, revision checks, command idempotency, return types and all data-changing statements. Public invoker wrappers are unchanged. Historical migrations are untouched.

The local SQL and hosted migration ledger match exactly: MD5 229cf011688b382a6b01bd863b0ff298. The CLI-generated local filename was aligned to the version assigned by the hosted migration API. The first submission lacked statement separators between pg_get_functiondef outputs and was rejected atomically; inspection confirmed neither function changed. Separators were corrected before the successful application. No sessions were cancelled or terminated.

Existing in-flight retries stopped after function replacement, without a service restart. At 15:23:48 there were no active application client queries. From 15:23:48 to 15:26:03 rollbacks rose by five (407399524 to 407399529), rather than hundreds per second. At 15:29:21 the total was 407399547 despite the focused negative tests: about 0.07 rollbacks/second over that post-fix interval. Expected authorization/validation failures and audit queries explain some normal residual rollbacks; zero rollbacks is not a requirement. No statistics were reset.

## Client and connection review

- The mobile beta Supabase client is a module singleton. Authentication has one module-lifetime listener; auto-refresh pauses in background and resumes on foreground. There is no per-screen client creation or application interval polling in the beta path.
- Workspace loading occurs on mount/role change, explicit refresh and successful commands. Normal app code does not repeatedly resubmit a failed selection. Tests previously waited for an error from the server, which was affected by the server retry bug.
- Conversation subscriptions are keyed by user/job and removed during effect cleanup; REST requests are bounded/aborted and catch-up is single-flight with 50-message pagination. Reconnection is SDK/event driven, not a tight application timer loop.
- Inbox subscriptions have account keys, event debounce and cleanup. Initial fetch plus SUBSCRIBED catch-up intentionally closes the initial history/subscription gap. This is bounded duplication, not the observed storm.
- Private-media signing uses an expiry timeout that clears the URL; it does not continuously poll. Uploads use explicit actions/retries and existing idempotency. Gallery reads follow mount/refresh.
- No long-lived idle-in-transaction sessions (over five seconds), deadlocks, persistent blocking or evidence of connection/subscription leaks was found. Some pre-fix millisecond-lived failed transactions were visible and consistent with the retry storm. Post-fix samples had zero active application queries and 7 client backends, versus a 60-connection limit. A quiet sample had zero realtime subscriptions; the small two-account regression removes its channels in finally.
- Realtime logical-decoding queries averaged about 102 ms in cumulative stats; this includes its polling/wait behavior and is not evidence of 102 ms CPU per call. Successful application RPC means were roughly 3–20 ms on this small dataset (message send about 11 ms). These are cumulative elapsed execution statistics, not a capacity benchmark.

Health advisor: no findings. Performance advisor: 36 unused-index INFO findings only. No indexes were removed or added; small beta traffic does not justify removing integrity/authorization indexes. Existing leaked-password-protection warning remains unchanged; see https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. Unused-index explanation: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index.

## Verification

- Existing controlled two-account job publication/discovery/offer/view/selection, idempotency, session restoration/refresh and isolated logout: PASS.
- Existing real private-media job/profile/portfolio upload, ownership/MIME/size/count rules, stranger/anonymous denial, signing/expiry, independent readback and synthetic-media cleanup: PASS.
- Existing rollback-only beta_security.sql and beta_messaging_security.sql: PASS. No existing customer/professional records were migrated or deleted.
- New scripts/verify-beta-performance.mjs, through pwsh -File scripts/verify-controlled-beta.ps1 -Performance: PASS. Reuses the encrypted private vault through stdin; no account identifiers or passwords are logged or hardcoded. A stale professional revision and repeat selection returned exactly PT409/HTTP 409 in 584 ms and 273 ms respectively (end-to-end network timings). Two synthetic messages on an existing controlled job verified independent-session Realtime send/reply, persisted history and idempotent retry. This is a focused regression, not a load test.
- HTTPS invite-only authentication settings and anonymous/uninvited access denials: PASS.
- Focused ESLint, Node syntax and PowerShell runner parser checks: PASS. No application TypeScript, UI, dependency or build configuration changed; previously passing TypeScript/build results remain applicable, so expensive builds were not repeated for a SQL/error-code fix.
- Existing website port 3001 and Expo port 8081: HTTP 200. No restart, account change, local-data reset, push or deployment.

## Observability limitations and next step

The connected Supabase tools expose health/advisors, rolling logs and cumulative Postgres statistics, but no historical CPU-percentage series. Dashboard browser inspection was blocked because Computer Use could not reliably determine Chrome's current URL; this safeguard was not bypassed. The privileged Metrics API requires a secret credential, which was neither requested nor retrieved for this audit. Exact historical peaks and the current CPU percentage therefore remain unverified. Inspect the project's CPU chart manually after its normal refresh interval to confirm resource recovery. No monitoring integration, plan upgrade or privileged key was created.

The confirmed retry cause is corrected and regression-tested. Stage 09C can proceed as controlled development; verify the CPU chart before expanding external testing. This is not a load/capacity certification. Native two-phone tests, SMTP/recovery readiness, broader beta admission and the already documented direct-upload content-inspection limitations remain pending. Monitor conflict response codes, rollback rates, pool saturation and Realtime subscription counts as usage grows. Screens retained in a navigation stack can legitimately retain more than one channel; audit focus/background subscription scope if actual concurrent-user metrics later show pressure.

## References

- https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b
- https://supabase.com/docs/guides/observability/metrics
- https://www.postgresql.org/docs/17/monitoring-stats.html

## Final observation — 15:37:10 UTC

Over 13 minutes after the fix, the rollback total was 407399552: only 28 additional rollbacks since 15:23:48, including the negative regression tests and audit activity (about 0.035/second). Post-fix logs from 15:23:50 onward showed zero serialization errors and three normally handled PT409 conflicts. Final samples showed zero active application queries, blocked sessions, long-lived idle transactions or Realtime subscription leftovers; every public application table still had RLS enabled. No exact CPU-percentage claim is made.
