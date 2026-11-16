# Stage 09 — Shared media, messaging, lifecycle and trust

## Stage 09E checkpoint review — 16 November 2026

The user approved committing and publishing the 29-file Stage 09E checkpoint. All files matched the snapshot from its passing automated checks before this documentation-only checkpoint note. Reused those integration, browser, RLS, lint, TypeScript, website build and local iOS export results; no application fix or test-account change was needed. Fresh read-only hosted checks confirmed unchanged migration/HTTP 409 hashes, RLS on every public table, denied direct application-table writes and zero artificial 40001 function codes. Device-local formats, originals and legacy records remain separate and explicitly labelled; website/Admin, dependencies and Expo configuration are unchanged.

The complete public main/origin-main history (20 commits, 526 historical blobs, 366 paths) and all outgoing candidates passed secret/private-identifier/generated-artifact review. Only main is approved for a normal fast-forward push; private backup refs are excluded. Physical-device approval, Expo Go identity/access, SMTP/recovery, leaked-password protection, image-inspection/signed-URL and existing moderate dependency limitations remain as documented below. This checkpoint authorizes no deployment, service/account changes or new development. Earlier uncommitted-status statements describe the implementation phase.

## Stage 09E — End-to-end integration and mobile beta readiness (16 November 2026)

### Decision

Ready for controlled, synthetic-data physical-device review, subject to the Expo Go account-access gate below. Automated testing is complete; actual two-phone approval is pending. This is not approval for unrestricted external admission or production release.

Started on main at ae2f49d3388ba88dafdd2fb855e7083528180d4e. Stage 09E remains uncommitted for review. No website/Admin/legacy desktop screen, dependency/lockfile, Expo project linkage, Supabase migration/configuration, existing test-account credential or authorization setting was changed. No commit, push, deployment, purchase or service upgrade. Earlier implementation/checkpoint statements below are historical.

### Integration findings and corrections

1. The signed-in Professional Offers tab still opened the device-local offer list. It now reuses the existing shared workspace's own-offer cards, without loading unrelated discovery data. Explicit View device-local offers / Back to shared offers preserves the approved local editing/withdrawal flow and labels its source.
2. Workspace offers used all RLS-readable rows. Because one account may act as customer and professional, those rows can include offers received as a customer. Reads now explicitly scope requests to the current customer, offers to those request IDs or the current professional, and profile revision to its owner. Account changes during a read reject reconciliation; account/mode/view keys reset stale workspace state. RLS remains the authoritative boundary.
3. The final posting step could hide the account-posting action when the source already had a local publication, and selected its destination after asynchronous saving. A signed-in reviewed request now posts directly through its captured account identity, independent of local preview state; session changes cannot silently publish locally. Signed-out publication still requires its explicit local confirmation. Source drafts, autosave and explicit save/exit remain intact. No automatic migration/upload.
4. Step 7 already contains the full review, so the extra signed-in prototype confirmation was removed. Post job is the deliberate final action, with the sharing/privacy notice on that review. Posting from draft details retains one meaningful publication confirmation. Pending photo failure accurately states that the job already exists; retry reuses the same publication command and resumes uploads. The integration test confirmed two attempts produced one server request.
5. Live account/jobs/offers/messages/media/reviews/progress copy now uses account/product language rather than Beta Workspace, Post Job to beta or broad preview labels. Draft, Pending, In Progress and Completed remain. Local drafts/profile editing/legacy records retain explicit device-local notices. Customer Profile no longer denies that a real signed-in account exists. Home's signed-in actions lead to shared jobs/offers; its local draft/completeness data remains labelled.
6. Screenshot inspection caught Home initially rendering the local-preview branch while authentication was still being verified. Home, shared job and conversation entry points now use the existing checking/retry session state instead of temporarily offering local content or sign-in during verification. Focused tests verify an authentication network failure recovers through Retry session without showing a local Jobs fallback.
7. Draft details now identify the source as a device draft rather than making an unconditional not-posted claim about a potentially existing server copy. Deleting a source draft does not delete a posted job or its uploaded media.

The approved hero photography, visual tokens, typography, card layout, native-safe image sizing, onboarding, navigation architecture, local data formats and backend lifecycle/permissions were preserved. No new Realtime channel, polling timer, database function or infrastructure was introduced. State hooks, cleanup, keyboard labels/focus and conditional rendering were reviewed with the React checklist.

### What is live and what stays local

| Area | Current source and behavior |
| --- | --- |
| Authentication | Real invite-only Supabase email/password sessions; sign-in/sign-out and native SecureStore adapter. Public registration is restricted. Mailbox delivery/recovery is unconfigured. |
| Professional details | Existing six-step editor saves a local draft. Save profile draft to account explicitly writes validated services, areas and introduction to Supabase; server completeness gates offers. A fresh device does not automatically download that record into the local editor. |
| Profile/portfolio media | Explicit authenticated private Storage uploads and authorized retrieval; originals remain local. No real identity verification. |
| Request preparation | Seven-step draft, photos, autosave, editing and source deletion are device-local. This is not cloud-draft synchronization or ownership isolation between people sharing one app installation. |
| Posting/discovery | Post job writes a real shared request; eligible professionals discover it through server rules. Photo upload can be pending after text publication and is safely resumable. |
| Offers/selection | Real submission, comparison, own-offer list and customer selection. Backend is authoritative. Rich local offer draft/edit/withdraw and local discovery filters remain prototype features; they are not represented as live commands. |
| Messaging | Real participant-only history and foreground Realtime/catch-up, retry and deduplication. No push/background-delivery promise or invented read receipts. |
| Scheduling/progress | Shared proposal/accept/reject/withdraw/reschedule, professional acceptance/start/completion request and customer confirmation. |
| Reviews/reputation | Shared eligible reviews, edits, responses, versions, visible server aggregates and private content reports. |
| Issues | Real private issue/open case, participant visibility and paused lifecycle. Administrative resolution/notification integration is deferred. |
| Local legacy records | Original local jobs/offers/messages/reviews/profile/portfolio, onboarding/role preferences and photographs remain separate. No automatic upload, conversion or deletion. |
| Website/Admin | Existing desktop/marketing and legacy workflows remain unchanged. Do not assume the legacy Admin interface operates these shared beta records. |

Editing/deleting a local source draft does not edit/delete an already posted job. Reusing an unchanged draft resumes its original publication; changed payloads are rejected rather than silently overwriting the server. Device-local profile completeness does not imply server completion or verification. Account roles come from server participation/profile rules, never the mode selector.

### Automated verification

- Full real two-account isolated Chrome journey: PASS account sign-in, explicit profile-sharing preparation, reviewed request + synthetic JPEG, injected failed upload/retry with one publication, cross-account photo discovery, offer submission/shared Offers tab, customer comparison/selection, same-job two-way messages and offline catch-up without duplication, scheduling/rescheduling, professional work/completion request, customer confirmation, review/response/reputation, reload/session restoration, a separate active-job private issue and account switching.
- Existing server Professional profile was compared before/after and left unchanged. Its already-complete setup was reused; the sharing dialog was opened/cancelled, not used to overwrite existing account details. Profile creation/completeness rules are covered by rollback-only synthetic fixtures and local editor tests; fresh native profile entry/sharing still needs the manual procedure.
- Focused browser readiness: PASS real sign-ins, Customer account copy and keyboard account access, reviewed request/photo screens, stable Professional Home/Profile/Offers, reduced-motion contexts, 320/390/430px overflow checks, explicit local/shared Offers navigation, and injected authentication-read failure -> checking/error state -> successful retry with no local fallback.
- Test scope is explicit: the integrated publication starts from a synthetic reviewed seven-step draft. It is not a physical photo-picker test. Local request/professional/domain suites cover validation, draft edit/restart/delete, storage denial/recovery, completeness, local selection/lifecycle and preservation. Normal autosave may update the isolated test draft; actual user's Expo/local records are never opened/reset by these tests.
- Fresh state tests: PASS dual-role filtering, owner revision scoping, offers-only reads, account changes during reconciliation, wrong-account publication denial, SecureStore chunks/Unicode/restoration/failure, message queue ordering/deduplication, lifecycle pending instructions and feedback retry isolation.
- Actual independent HTTPS lifecycle regression: PASS schedule/reschedule/rejection/withdrawal, concurrent revision conflict, valid progress/completion, private access, idempotency and ordered history.
- Actual review/issue regression: PASS completed-job eligibility, duplicate/altered-command guards, edits/responses/versions, concurrent conflicts, aggregate ratings, private reports/issues, terminal-state denial and session isolation.
- Rollback-only beta_lifecycle_security.sql, beta_messaging_security.sql, beta_media_security.sql and beta_trust_security.sql: PASS participant/stranger, unverified/suspended/anonymous boundaries, spoofed admin metadata, raw-write denial, immutable history, moderation visibility and private projections.
- Actual direct-media regression: PASS MIME/size/count enforcement, owner/participant/stranger read/sign/upload/update/delete boundaries, immutable uploads, signed expiry and synthetic-asset cleanup. Publication/offer/selection is included. Integration-created jobs/messages/reviews/issues remain clearly labelled synthetic history; each media test deletes only its own synthetic reservations/files.
- Auth settings/API denial: PASS confirmation requirements, restricted signup and anonymous/uninvited denial. Successful account sessions are real; mailbox verification/recovery delivery is not claimed.
- Existing HTTP 409/two-way Realtime regression: PASS, profile conflict 375 ms and selection conflict 406 ms. Full integration initially exercised a valid stale-revision rejection by starting too soon after remote rescheduling; the test now waits for the new proposal state. A repeated synthetic offer-text locator was made unique. No business rule was weakened to pass tests.
- Website and mobile lint/TypeScript: PASS. Website production build: PASS across existing public/customer/professional/Admin routes. Final local iOS Hermes export: PASS under ignored artifacts/beta-stage09e/ios; no EAS build/deployment.
- Security advisor: existing leaked-password-protection warning only. Performance advisor: 25 unused-index INFO findings, no new missing-FK/duplicate-index finding. Existing indexes were retained.
- Dependency audit on 16 November: website 7 moderate; mobile 10 moderate; zero high/critical. No dependency or lockfile change. npm audit's nonzero exit reflects the reported findings; this is not a zero-vulnerability claim.
- All existing migration hashes match the hosted ledger; no new migration. HTTP 409 function hashes remain unchanged, all exposed public tables retain RLS and no live application function contains artificial SQLSTATE 40001. From 10:05:59 to 11:14:38 UTC, cumulative rollbacks increased by 291 across about 4,119 seconds including intentional denial/rollback tests; final deadlock, blocked and idle-in-transaction counts were zero. Available database logs from 10:05–11:15 UTC contain zero 40001/deadlock messages. No retry storm observed. Exact CPU percentage remains unverified.
- Final privacy/source scan: PASS across all 29 Stage 09E candidates (274 KB) plus the 20-commit public main history, 526 historical blobs and 366 paths. No secrets, actual controlled-account login identifiers, sensitive environment files or generated-artifact candidates found. Generated screenshots/exports and local environments stay ignored. Git remains main at ae2f49d3388ba88dafdd2fb855e7083528180d4e with 29 unstaged/uncommitted changes and no staged files. Website source, Supabase configuration and existing account credentials/roles remain untouched.

### Controlled two-phone procedure

Use synthetic job titles/content/photos only. Keep the computer and both development servers running.

1. Confirm each phone's Expo Go supports SDK 58 (the user's last reported client was 58.0.5). CLI is kodlin, project owner kodlins-team, slug servify, project UUID 1799c1ab-db36-4eb8-a421-9009642c625b; installed Expo is 58.0.23 and SecureStore 58.0.2. No upgrade was performed.
2. Resolve Expo Go access before attempting marketplace tests. Current official physical-iOS guidance requires matching Expo CLI and Expo Go account identities. An organization membership/tunnel HTTP 200 is not proof that a friend's separate identity is accepted. Do not share the kodlin password, token or MFA code. An owner can supervise testing on their own authorized devices; if a friend's independent account is rejected, stop and use a separately approved distribution plan.
3. Open the current direct /beta link below. On a fresh installation, complete the existing welcome/role selection if it appears before the workspace. Do not reset onboarding or storage on an existing phone.
4. Obtain each dedicated account's identifier/password through the existing approved private handoff. A trusted Windows operator may run scripts/copy-beta-test-password.ps1 -Account Customer or -Account Professional in their own terminal, transfer through a trusted password manager, then clear clipboard/history. Do not run the provisioning script, paste credentials into Codex, email/shared documents or store them in Git. The Windows encrypted vault is not a phone export.
5. Phone A: Sign in as Customer, choose Customer mode, open My Jobs/Post a job. Complete seven steps with a unique synthetic title and one non-sensitive work photo. Review and press Post job once. Confirm the request appears in My Jobs and its photo loads. If upload fails, the request may already exist: retry that same unchanged draft; never create a replacement just because the photo is pending.
6. Phone B: Sign in independently as Professional, choose Professional mode. If needed, complete the six-step local profile draft with authorized test details and explicitly Save profile draft to account from Find Jobs. Do not replace an existing shared profile merely to test. Photograph sharing remains separate. Refresh Find Jobs, locate A's unique request and confirm its image.
7. B: Submit price, scope and availability. Check the Offers tab. A: Refresh My Jobs, compare the offer, view shared reputation if desired, select once and open shared job progress. B accepts the selected job.
8. Open that same job's conversation on both phones. Send each direction; briefly disconnect one phone and confirm catch-up on return without duplicate messages. No read receipt/background-delivery expectation.
9. A proposes a future WAT appointment; B accepts. B proposes another window; A accepts/rejects and both verify consistent agreed/pending states before starting work. A stale-action conflict should be refreshed/reviewed, not repeatedly submitted with a new nonce.
10. B starts work and requests completion. A confirms completion. A submits stars/written feedback; B sees/responds; A sees the reply. Open the Professional reputation and refresh its count/average.
11. Use a second accepted, unfinished synthetic job to report an issue as Customer. Both participants should see the private open case and issue_reported status. Do not report against the completed review job: its lifecycle is intentionally ineligible. No resolution/notification guarantee.
12. Force-close/reopen Expo Go on each phone. Check account session restoration, same conversations/history/job/review, then exercise background/network interruption, keyboard/safe areas and VoiceOver. Record device model/iOS/Go version and exact reproduction steps without credentials or private image links.
13. Test sign-out explicitly. Private shared job/chat/review views must require sign-in. If switching accounts on one phone, sign out before signing in to the other, then select the desired interface mode separately. Mode switching alone does not change account identity. Local drafts/profile/preferences remain on the device by design and may be visible to another person with access to its storage; never mistake them for the signed-in account's private server records.

### Gates and recommended next steps

| Item | Readiness effect |
| --- | --- |
| Core tested marketplace | No known blocking integration defect remains in the covered automated journey. Controlled synthetic-data device review can proceed after resolving device access. |
| Actual native approval | Blocking sign-off for claiming physical mobile readiness: two phones, SecureStore force-close, safe areas, keyboards, VoiceOver/TalkBack, media picker/XHR interruption and foreground recovery remain unverified. Browser reload/iOS export do not prove them. |
| Expo Go identity gate | Potential blocker for a remote friend's independent Expo identity. Current tunnel is responsive, but native account authorization requires manual confirmation. Do not solve it by distributing owner credentials. |
| SMTP/admission/recovery | Blocks broader external admission. Configure an approved verified sender/provider and exact web/mobile confirmation/invitation/recovery redirects, then test delivery and recovery before admitting new users. Do not disable confirmation or open public signup. No setup/purchase occurs in 09E. |
| Password protection | Existing leaked-password-protection warning requires a separate availability/risk review before wider admission. Controlled accounts retain securely generated credentials; no auth setting/plan change was made. |
| Image inspection | Direct authenticated Storage checks permissions, declared MIME/size and reservation metadata; client compression is not trusted content inspection. Untrusted/sensitive uploads require a separately approved hosted decode/re-encode/quarantine design. No localhost service/admin key or public bucket. |
| Signed URLs | Bearer links remain usable until their short expiry, even after logout. Do not share/log them; downloaded images cannot be recalled. Display clears/refreshes links, but this is not immediate revocation. |
| Local features/operations | Draft/profile-editor synchronization, shared offer editing/withdrawal, advanced discovery filters, Admin case/moderation resolution, notification delivery and commercial dispute/cancellation policy remain limited/deferred. Non-blocking for the stated controlled journey; disclose before a wider beta. |
| Dependencies/index notices | Existing moderate audits and unused-index INFO findings remain maintenance items; no high/critical finding in this audit. No blind upgrades/index removal. |
| Distribution | Continue only supervised trusted-device Expo Go review now. For broader external iPhone testers, propose an approved signed development/TestFlight distribution route with separate tester identities. First assess existing signing/program access, plan limits and any costs; no purchase, EAS build, publication or deployment is authorized/performed here. |

Recommended sequence: review these uncommitted Stage 09E changes; run the two-phone checklist and record actual results; resolve secure Expo tester access; separately approve sender/recovery/admission and distribution work. Do not begin a later stage automatically. Supabase accounts, secrets, project settings and existing records must remain intact.

### Current preview and references

Website: http://localhost:3001. Metro: http://127.0.0.1:8081/status. Current Expo Go account route:

exp://c-kodlinsteam-qg883e-mwj3eadut4su43ha.on.expo.app/--/beta

Website, Metro and public tunnel returned HTTP 200. The terminal has the current Expo Go QR code. This replaces older tunnel links below; the URL is ephemeral and needs this computer online. It does not grant Supabase access or prove a phone's Expo-account compatibility.

Documentation checked without upgrading services:
- https://supabase.com/changelog.md
- https://supabase.com/docs/guides/auth/quickstarts/react-native
- https://docs.expo.dev/get-started/start-developing/
- https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/


## Stage 09D checkpoint review — 16 November 2026

The user approved committing and publishing Stage 09D. Reviewed all 21 candidate files against e8f596380633770e185b260763d1e952c04f57e9. The 20 code/test/migration files match the previously verified snapshot; website source, Expo configuration, dependencies, local environments and records are unchanged. Reused passing lint, TypeScript, production build, local iOS export and independent-account browser/integration results rather than repeating comprehensive tests. Fresh feedback/local-trust, SecureStore, lifecycle and messaging state tests pass.

Both new migration ledger hashes and all 11 current feedback function bodies match local SQL; pinned search paths, invoker/definer boundaries, participant/author RLS and denied anonymous execution remain intact. The prior HTTP 409 function hashes are unchanged, no live application function contains artificial 40001 codes, and all public tables retain RLS. Reviewed the complete main/origin-main history: 19 existing commits, 505 unique historical blobs and 354 paths; secret scanning and a private in-memory controlled-account identifier comparison found no credentials, real beta login identifiers, private environment files or generated artifacts. Private backup refs are excluded from publication; only main is authorized for a normal fast-forward push. Physical-device, SMTP, dependency-audit and existing leaked-password-protection limitations below remain outstanding. No application deployment or Stage 09E work is included.

## Stage 09D — Shared reviews, reputation and issues (15 November 2026)

### Scope and data preservation

Implemented from main e8f596380633770e185b260763d1e952c04f57e9. This section supersedes older statements below that shared reviews/reputation and issue reporting are deferred. Earlier Git-checkpoint statements are historical. Stage 09D remains uncommitted for review; no later subphase, app deployment, package upgrade or account-policy change was made.

The approved feedback editor is now a shared presentation component with separate local and authenticated persistence. Existing job/review/profile cards, stars, text inputs, confirmations and navigation are reused. No home, website or onboarding redesign. Source=beta review/job links never fall back to local records on authentication failure. Explicit device-local links preserve the original review and lifecycle workflows.

No prototype requests, photographs, profiles, portfolios, messages, reviews, roles or onboarding preferences are automatically uploaded, rewritten or deleted. Tests use two independent authenticated clients/browser contexts and labelled synthetic jobs; SQL-only fixtures roll back. Real-account credentials remain outside Git in the existing encrypted Windows vault, supplied privately on stdin. No service-role key is used by the mobile app or the integration tests.

### Migrations and authorization

Applied only to servify-beta:

- 20261114165919_beta_shared_trust.sql — local/hosted normalized-LF SQL MD5 dd1559ea21e6092b3a165b248d30d310.
- 20261114170400_beta_feedback_snapshot.sql — MD5 a070b7be46b8b23db788b7de36bb245a. Participant job, schedules, events, feedback and issues are read as one atomic snapshot; the original beta_job contract remains intact.

Existing reviews, professional_responses, review_versions, response_versions, job_issues, issue_cases, content_reports and private.commands are reused. Added a bounded report explanation, unique pending report per reporter/review/target and profile/version cursor indexes. The previously unused issue-description constraint is aligned to the existing local 15–2,000-character rule; preflight found no existing issue/review/response/report rows to truncate or transform.

New public invoker RPCs call pinned-search-path private helpers:

- beta_save_feedback: customer review/edit, reviewed professional response/edit and customer issue reporting.
- beta_feedback: authorized participant snapshot, including private case status.
- beta_reputation: member-only safe professional projection, server count/average and 50-row cursor pagination.
- beta_review_jobs: own completed jobs, 50-row cursor pagination.
- beta_report_review: private, deduplicated report without silently hiding content.

All commands require active invited/confirmed membership and derive actor, job parties, status and timestamps on the server. Account-command locks then job/review locks serialize writes; expected revisions prevent silent overwrites. Matching command UUID/payload returns the original result. Changed command reuse and ordinary stale-state conflicts return PT409/HTTP 409, never artificial SQLSTATE 40001. Prior offer/profile conflict functions remain byte-for-byte unchanged.

Reviews require completed status, server completed_at and an actual customer-authored completion event. Only that job's customer may submit/edit, one review per job; stars 1–5, optional text up to 2,000 characters. Responses require the reviewed professional, visible eligible review and 3–2,000 characters. Both preserve up to 30 immutable authored versions, with no edit deadline, matching approved local rules. Editing never clears moderation-hidden flags. Review and response edits share an optimistic review revision; they do not change the job lifecycle revision.

Raw review/response rows retain sensitive job/account associations and are restricted to job participants/administrators. Old text versions are available only to their author or authorized administrators. The authenticated reputation projection exposes current visible eligible ratings/text and visible responses, without customer IDs, job IDs, issue data, private report explanations or old text versions. Hidden reviews contribute neither count nor average; hidden response text stays off profiles. Counts aggregate current reviews, not historical versions. Ratings are not identity verification.

Issue reporting follows the existing customer-only path for confirmed, scheduled, in-progress or completion-requested jobs. Category and 15–2,000-character description are validated server-side. One atomic command creates the private issue/open case, withdraws pending schedules and advances the job to issue_reported with a generic activity event. Sensitive description text is not copied into public reputation or generic event notes. Participants can read relevant issue/case data; unrelated, unverified, suspended and anonymous users cannot. Clients cannot resolve cases or directly mutate issue/review/version tables. No automatic dispute settlement or support-notification claim.

### Mobile synchronization and failure handling

Completed shared jobs link to the existing feedback screen. Customer offer cards link to the relevant professional's shared reputation. The Professional profile displays server reputation, including when a new device has no local profile draft; its existing local profile remains separate.

Review/response writes append generic job activity. Detail screens reuse the existing authorized job_events subscription with debounced/coalesced snapshot reads, cleanup on unmount/account change, foreground/reconnection catch-up and explicit refresh. No additional Realtime table publication, per-review channel, polling interval or automatic command retry loop was added. Profile aggregates/list pages read on entry, foreground, connectivity recovery and explicit refresh; they do not claim live push, read receipts or background notification delivery.

Before transmission the exact action, revision and nonce are saved in a separate account/scope/resource namespace through the intended SecureStore adapter (native WHEN_UNLOCKED_THIS_DEVICE_ONLY; web sessionStorage). Failed/unknown results preserve a manual retry instruction across reload. Retry uses the identical nonce/payload. Serialized writes reject changed payloads or other pending commands; compare-and-clear prevents an older success from removing a newer instruction. Nothing silently rebases to a newer review revision. Users may explicitly dismiss only the instruction after refreshing; this never deletes server history. Invalid/unavailable storage blocks further writes and is preserved for recovery. Account changes unmount private data; another account cannot open the saved instruction. Confirmed reads are not saved into prototype storage.

Loading, empty, retry, pending, error and confirmed-save messages reflect actual backend results. Content reports are stored privately but do not imply moderation has occurred. Shared case status comes from Supabase; resolution administration remains outside this mobile milestone.

### Verification and findings

- Independent real HTTPS accounts: PASS eligible and rating-only review submission, same-command retry, duplicate/changed-command prevention, edits, professional responses/edits, retained versions, competing expected revisions (one succeeds, one 409), server rating/count calculations, private content reports/issues, invalid lifecycle states and independent logout.
- supabase/tests/beta_trust_security.sql: PASS rollback-only unrelated/unverified/anonymous denial, spoofed administrator metadata, raw-write and version deletion denial, writer-only history, required customer completion event, hidden-review/response preservation, safe aggregate projection and private issue/case access.
- Existing beta_messaging_security.sql and beta_media_security.sql rollback regressions: PASS.
- Browser checks: PASS two actual independent sign-ins, counterpart review/response refresh through Realtime, editing/history, server profile reputation, reporting, private issue status, failed-save -> reload -> same-command retry, sign-out isolation, keyboard validation/focus, reduced motion and 320/390/430px overflow checks. Original local draft/profile/marketplace fixture bytes remain unchanged.
- Existing device-local review browser suite: PASS at 320/390/430px, including rating-only submission, edit, professional response/edit, local reputation, mode switching/reload, hidden content, incomplete-job denial and failed-storage recovery.
- Retry-state unit test: PASS account/scope isolation, immutable pending payloads, guarded clearing, uncertain/stale/unauthorized results, corrupted storage preservation and unchanged local-draft key. Existing secure-session, messaging-state, lifecycle-state and local delivery/trust tests: PASS.
- Existing actual scheduling/lifecycle regression: PASS acceptance, scheduling/rejection/rescheduling/withdrawal, concurrent conflict, live activity, work/completion, ordered history and private reads/writes.
- Existing actual media regression: PASS authorized job/profile/portfolio upload/readback, MIME/size/count constraints, owner/participant/stranger/anonymous boundaries, immutable files, signed expiry and cleanup of its own synthetic assets. Publication/offer/selection remains intact.
- Invite-only Auth regression: PASS confirmation enabled, anonymous/uninvited access and public signup denied; no delivery/recovery claim. The HTTP 409/two-way messaging performance regression passes (419 ms profile conflict, 288 ms selection conflict in this run).
- Website/mobile lint and TypeScript: PASS. Website production build: PASS. Local iOS Hermes export: PASS; generated artifacts remain ignored, with no EAS build or deployment. No dependency or lockfile change.
- Screenshot review exposed a literal JSX space directly inside the existing shared-job View. It produced React Native's Unexpected text node development warning. Removed only that whitespace, preserving layout/actions, and added console-error coverage; the deliberately injected network failure is excluded explicitly. Initial browser fixture/network startup failures did not justify changing application authorization.
- Changed-source secret scan: PASS across all 21 Stage 09D source/test/migration/documentation files (197 KB reviewed). No environment, vault, generated artifact or dependency changes are candidates. Git remains on main at e8f5963; all 21 changes remain unstaged/uncommitted. Website source and Expo ownership/configuration are unchanged. Website, Metro status and public tunnel all returned HTTP 200.
- Security advisor: existing [leaked-password-protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) only. Performance advisor: 27 [unused-index INFO findings](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index); no missing-FK/duplicate-index warning. No index removal or service upgrade.
- At 16:32:27–16:41:05 UTC, rollback counter increased by 39 across 518 seconds including intentional denial/rollback tests, with zero deadlocks, blocked sessions or idle-in-transaction sessions at the final snapshot. All public tables retain RLS. No live application function contains artificial 40001 retry codes; prior conflict-function hashes match. Available postgres logs for 15:30–16:42 UTC contain zero 40001 or deadlock messages. No retry storm was observed; these are counter/log observations, not a CPU-percentage measurement or load test.

### Review, limitations and next checkpoint

Website: http://localhost:3001. Expo Go: exp://c-kodlinsteam-qg883e-mwi16nh6v1ml6e0e.on.expo.app/--/beta. Both stopped development servers were restored from C:\Projects\servify using existing configuration; this replaces historical tunnel links below. Keep this computer online.

Manual flow: independent Customer/Professional beta accounts select a shared offer, accept/start/request/confirm work through Job progress, then open View completed-job review. Customer submits/edits feedback; Professional opens that same completed job to respond. View shared professional reputation refreshes aggregate records. To test issues, use a separate accepted unfinished job: Customer describes the issue, confirms, and both participants inspect its private open case. Issue reporting intentionally pauses that job; do not use a valuable test job unintentionally.

Automated database/API/browser tests and local iOS compilation are not physical-iPhone approval. Still pending: two actual phones, native SecureStore failed-action restoration after force-close, VoiceOver/TalkBack, keyboards/safe areas and background/network interruptions. Device-local records remain device-local; sessionStorage is not cross-tab/device draft synchronization. Synthetic shared jobs/reviews/issues from integration runs remain clearly labelled test history, never presented as real customer activity. Test only with synthetic, non-sensitive review/issue text.

SMTP/mailbox verification/recovery delivery, external tester admission, notification delivery, administrative moderation/resolution integration, dispute/cancellation policy and the documented Stage 09A content-inspection limitation remain unresolved. Existing moderate dependency-audit findings remain recorded; no package update was undertaken. Authentication restrictions and private buckets were not weakened.

Next checkpoint: review the uncommitted Stage 09D implementation and authorize any Git checkpoint separately. Perform deferred physical-device review when ready. Do not begin another subphase automatically.


## Stage 09C — Shared scheduling and job lifecycle (14 November 2026)

### Status and entry points

Implemented from approved main checkpoint 807e2cd1835facf265b5bdbe51dff08ac2822cde. This section supersedes older statements below that scheduling/lifecycle are not connected. Stage 09C is uncommitted for review. No later subphase was started.

The existing /active-jobs and /job routes now offer authenticated shared progress using the approved Page, Type, Badge, Button, Confirm, RequestDate and card components. The seven-step posting flow, home screens, visual tokens and website were not redesigned. My Jobs/Find Jobs provides View shared job progress. Shared inbox and conversation views link to the same job, and job progress links back to that job's existing Supabase conversation.

The shared job route explicitly uses source=beta. A signed-out or failed beta route never falls back to a similarly named prototype job. Active Jobs retains View device-local job progress and a return link. Original local requests, photos, profiles, portfolios, messages, reviews, role preferences and onboarding records are not automatically migrated, rewritten or deleted. Existing local lifecycle controls and rules remain available.

### Database migration and rules

Applied 20261114155803_beta_shared_lifecycle to servify-beta only. Local/hosted SQL MD5: d74db4babc67da99ecdf111a2312dcaf. The filename was aligned to the version assigned by the hosted migration API. Previous migrations, including the PT409 performance fix, remain unchanged.

Reused jobs, schedule_proposals, job_events and private.commands. Added rejected proposal status, nullable server resolved_at, one pending proposal per job, an activity identity sequence and optional schedule reference. Ordering/FK indexes support the existing participant reads. Existing schedules were empty at preflight; no existing job was advanced and no old schedule resolution time was fabricated. New columns/constraints are additive except extending the allowed proposal-status set.

New authenticated invoker RPCs call private, pinned-search-path helpers:

- beta_job_command: one participant-derived command surface for confirmation/decline, pre-start cancellation, proposal/acceptance/rejection/withdrawal, work start, completion request and customer completion confirmation.
- beta_job: participant-only job/title, proposals and ordered activity snapshot.
- beta_jobs: participant-only list with 50-row creation-time/UUID pagination.

Commands require active confirmed/invited membership, derive identity from auth.uid(), lock account command scope then the job, and compare expected revision. A matching user/command UUID and identical payload returns the original result before revision checking; changed command reuse and stale revisions return PT409. No actor, status, timestamp or owner is accepted from the client. Client mode and user_metadata are never authorization inputs. Direct table mutations remain denied.

Professional confirmation is required before scheduling or work. Either participant may propose a future same-day WAT window; only the counterpart accepts or rejects, and only its proposer withdraws. A new proposal supersedes an older pending proposal while preserving the confirmed appointment. Acceptance replaces the old confirmed window atomically; rejection/withdrawal preserve it. A pending proposal blocks starting work. As in the approved local rules, accepted work may start without a scheduled window when no proposal is pending.

Only the professional starts work and requests completion; only the customer confirms completion. The server records completed_at only for customer-confirmed completion. Terminal states reject further transitions. Existing pre-start cancellation/decline rules require a reason and withdraw pending proposals; no penalties, payments, refund rules, automatic reopening/reselection or calendar notifications are introduced. Commercial cancellation/dispute policies remain unresolved.

Each successful command increments job revision once and creates one immutable server-ID/time activity event, including proposal linkage. Sequence-based ordering is independent of client clocks. Existing beta limits remain 150 activity events and 30 proposals per job. Historical selected-job activity is retained; no existing prototype history is uploaded.

### Synchronization, retries and privacy

Only job_events was added to the existing messages Realtime publication. Participant SELECT RLS protects activity and proposals. The client watches authorized INSERT activity, debounces bursts and coalesces reads, then reloads the committed snapshot. Loaded list pages refresh through their stable cursor; no interval polling was introduced. One channel belongs to each mounted account/view, with cleanup and abort on unmount/account change. Initial subscription, foreground/online events and explicit reconnect restore current state after missed events.

Commands are explicitly confirmed. Before transmission, the exact command ID, revision and payload are saved under a new account/job-scoped lifecycle-intent namespace using the intended native SecureStore chunk adapter (WHEN_UNLOCKED_THIS_DEVICE_ONLY). The browser adapter uses sessionStorage, whose lifetime is the browser tab. Unknown results remain Unconfirmed action and retry uses the same payload/ID. There is no automatic retry loop, silent revision rebasing or automatic replay on launch. Users can explicitly dismiss the saved instruction after reviewing server state; that never deletes server activity. Invalid/failed storage is preserved and cannot silently authorize another action. Action buttons remain blocked while retry storage is unreadable.

A successful command response is checked against the correct job, then fresh server state is loaded. Network, authentication, validation and stale-state failures never report assumed success. Snapshot state unmounts on account changes, and saved pending instructions remain isolated to their owning account/job. Changing UI mode does not change the job role. No confirmed server snapshots are saved in the shared prototype store.

### Verification

- Actual independent Customer/Professional HTTPS sessions: PASS acceptance, schedule proposal and opposite-party rejection/acceptance, rescheduling while preserving prior agreement, withdrawal, pending-start guard, valid work/completion sequence, duplicate commands, changed payload reuse, competing same-revision proposals (one succeeds; one HTTP 409), invalid windows/states, raw-write and anonymous denial, ordered history and new reads after disconnection.
- New rollback-only supabase/tests/beta_lifecycle_security.sql: PASS unrelated, unverified and suspended contexts, forged role/admin metadata, private lookup/list/activity/proposal boundaries, raw job/activity writes, idempotency, stale revision conflicts, required cancellation reasons, pending withdrawal on cancellation and professional-only decline.
- Actual isolated-browser app tests: PASS two real sign-ins, live counterpart updates, shared Active Jobs/local-progress return navigation, future-date validation and keyboard focus, keyboard confirmation, failed network action -> reload -> same-command retry, rescheduling, customer-only completion, offline counterpart catch-up, correct messaging/job links, signed-out beta-route privacy, reduced-motion contexts and 320/390/430px no horizontal overflow. Raw local request/profile/marketplace/message fixture values remain unchanged.
- Browser test findings: an error-text locator matched the page and dialog, so it was scoped to one visible match. Another test started its next proposal before the other account's rejection arrived via Realtime; it now waits for that authoritative revision before the separate offline-retry scenario. The application continues to reject stale pending actions rather than rebasing them. A stale list-error reference found by TypeScript during refactoring was corrected before final passing checks.
- New native-adapter state test: PASS account-scoped action restoration, stable retry IDs, wrong-account rejection, conflict/unexpected-result handling, storage failure/corruption preservation, isolated clearing and WAT date conversion.
- Existing local delivery regression: PASS selection migration, transition/role rules, schedule/reschedule, pending-start guard, message idempotency, failed saves, completion/restart and local issue path.
- Existing SecureStore/session and messaging-state tests: PASS.
- Existing actual private-media regression: PASS job/profile/portfolio uploads, MIME/size/count enforcement, owner/participant/stranger/anonymous boundaries, immutable files, signed expiry and fixture cleanup. Its shared publication/offer/selection slice remains intact.
- Existing beta_messaging_security.sql and beta_media_security.sql rollback suites: PASS. Invite-only HTTPS Auth settings and anonymous/uninvited API rejection: PASS.
- Recent performance-fix regression: PASS both HTTP 409 business conflicts (486 ms and 257 ms end to end), plus real two-way messaging/history and idempotency.
- Website/mobile lint and TypeScript: PASS. Website production build: PASS. Final local iOS Hermes export: PASS under ignored artifacts/beta-stage09c/ios; no EAS build. Screenshots remain ignored under artifacts/beta-stage09c.
- Security advisor: only the existing [leaked-password-protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Performance advisor: 35 [unused-index INFO findings](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), no new missing-FK/duplicate-index warning. No index was removed.
- Post-migration log window: zero SQLSTATE 40001 or deadlock errors; 12 normally handled PT409 conflicts. At 16:28:59 UTC: zero blocked sessions, active application queries or idle-in-transaction sessions older than five seconds. All public tables retain RLS. No artificial retry codes remain in live application functions; no retry storm was observed. Exact CPU-percentage charts remain subject to the performance audit's dashboard-access limitation.
- Changed-source secret scan: PASS. Website source, dependencies/lockfiles and Expo owner/project configuration are unchanged. Existing moderate dependency-audit findings remain applicable; no dependency was added or upgraded.

Automated integration/browser runs retain clearly labelled synthetic selected/completed jobs and event history in the beta database. SQL-only fixtures always roll back, and media cleanup targets only its own synthetic assets. Test identifiers and passwords are supplied privately from the existing encrypted vault through stdin, never hardcoded or logged. No real personal information is used.

### Review and remaining limitations

Website http://localhost:3001, Metro http://127.0.0.1:8081/status and the existing public Expo tunnel returned HTTP 200. Servers/tunnel were kept running. In Expo Go, sign in through /beta, open the shared workspace, select a new offer, then use View shared job progress from each independent account. The selected professional accepts before either participant proposes a schedule; the other participant accepts/rejects. Professional starts and requests completion; customer confirms it. Existing local records remain accessible separately.

These are automated database, API, browser and iOS-compilation results, not physical-iPhone approval. Still required: two actual phones, native SecureStore action restoration after force-close, background interruption, picker/media behavior, safe areas, keyboards and VoiceOver/TalkBack. Native signed-in action notes are encrypted locally; browser sessionStorage is not cross-tab/device draft synchronization. Realtime is foreground synchronization with catch-up, not push or guaranteed background delivery.

Shared issues, review/reputation integration, administrative resolution, notification delivery, commercial cancellation terms, SMTP/verification/recovery delivery and Stage 09A content inspection remain deferred. No admin UI was added to mobile and no trust/identity-verification claim was introduced.

Next checkpoint: review Stage 09C, authorize its Git checkpoint separately, and perform the agreed physical-device review when ready. Do not begin another Stage 09 subphase automatically. No commit, push, application deployment, service upgrade or purchase occurred in Stage 09C.


## Stage 09B — Real-time messaging and recovery (14 November 2026)

### Recovered baseline and scope

Started from main at e61e6058494e7e87a185d33aaf03039541fc8e21. The interrupted session's implementation, tests, two applied migrations and local iOS export were retained, not rebuilt from scratch. Stage 09B remains uncommitted. Recovery only corrected the signed-link regression test and finished verification/documentation; website/dependency configuration, local data adapters, credentials and prototype records were preserved. No application deployment, push, reset or cleanup of existing user records occurred.

Messaging uses the existing Messages/conversation routes and shared approved JobChat composition (bubbles, composer, safe-area layout, keyboard handling and scroll behavior). Signed-in accounts see the Supabase inbox; an explicit View device-local conversations action retains access to prototype messages. Conversation links use source=beta so a failed or signed-out beta route never silently falls back to a similarly named local record.

### Database and security boundary

- 20261113101849_beta_realtime_messaging.sql and 20261113102118_beta_conversation_lookup.sql are applied to servify-beta only; both local SQL files match their hosted ledger hashes. Earlier five migrations remain intact.
- Existing selected jobs receive one conversation through idempotent backfill; future job selection creates one via a database trigger. No job status is advanced and no scheduling, acceptance or other lifecycle command is introduced. Messaging before provider confirmation matches the existing local rule.
- beta_send_message derives sender_id from auth.uid(), requires current active/confirmed/invited job participation, locks that job, validates nonblank plain text up to 2,000 characters and rejects unsupported controls. It preserves the existing 500-message beta limit. Client-supplied sender/time/ID fields are not accepted.
- UUIDs and timestamps are generated in PostgreSQL. An identity sequence provides stable server ordering; gaps are normal and client clocks do not decide order. Concurrent sends for one job are serialized. The existing unique(sender_id,client_id) boundary returns the same server message for a matching retry and rejects changed text/job reuse.
- Existing participant SELECT RLS remains on messages/conversations. Direct insert/update/delete remain denied. Narrow invoker RPCs call private helpers with pinned search_path and no PUBLIC/anonymous execute permission. Lookup/inbox projections expose titles and previews only for the caller's jobs; interface mode and user_metadata do not authorize access.
- Only public.messages is in the Supabase Realtime publication. Postgres Changes uses the subscriber's authenticated SELECT RLS, including for the inbox subscription. Channel names are not the access-control boundary. No Broadcast/Presence or read-receipt policy was added.

### History, delivery and failure behavior

Opening a conversation loads the latest 50 rows; Load earlier messages uses a sequence cursor, merges stable IDs and preserves the reading position. Inbox pagination uses job creation time plus UUID. Realtime INSERT events update the thread and inbox without manual refresh. Subscription/re-subscription catches up from a separately tracked reconciled sequence, avoiding gaps when live events overlap history requests. Foreground and online events recreate the connection; a visible Reconnect action remains available, including during loading. Network operations are bounded and cancelled when their owning view/account changes.

Messages render Sending, Not confirmed/retry, and saved to server based on actual state. Saved means database persistence, not delivery to the recipient or reading. Failed/retried sends reuse one client UUID. New incoming history, acknowledgements and pending rows reconcile by server ID/client ID so reconnects and lost acknowledgements do not render duplicates.

Unsent beta messages use new account/job-scoped chat-index/chat-outbox keys through the established native SecureStore chunk adapter; browser preview uses its separate sessionStorage adapter. Queues are serialized, limited to eight messages per conversation/50 queued conversations, restored as unconfirmed after restart and retried explicitly. Corrupt/failed storage is preserved rather than overwritten. Confirmed server history is not persisted in a shared device-wide cache.

Logout/account change unmounts private messaging state, removes subscriptions and clears only that account's new beta outbox namespace. It never clears local marketplace/draft/profile/message/review keys or server records. If secure-queue cleanup fails, the Auth screen reports it; encrypted leftover keys remain account-scoped and cannot be loaded for a different signed-in identity. Sign-out copy states that unsent beta messages are discarded; native behavior still needs device confirmation.

### Signed-link regression — confirmed cause and narrow test fix

The interrupted test grouped valid signed access and expiry into one step. Re-running it unchanged initially passed, so no application defect was inferred from the old generic failure. A test-only repeated probe reproduced the failure on probe 6: the initial GET of a newly issued one-second URL returned HTTP 400, before the expiry assertion. That short TTL could lapse during signing/network/second-boundary latency; the test had incorrectly assumed its first GET must succeed. Other probes succeeded and subsequent requests were rejected.

The corrected test verifies positive access with a separate 30-second URL, then verifies a one-second URL's expiry with a bounded server-observed wait. It checks the actual structured InvalidJWT error (not only the generic human-readable message) and confirms that authenticated participant downloads still work after the signed URL expires. It does not treat an arbitrary 404/500 as proof of expiry. Temporary token/probe diagnostics were removed; signed URLs, tokens and credentials are never printed. Application 60-second links, media UI, bucket privacy, MIME/size limits and Storage RLS were not changed. This was a regression-test timing assumption, not a confirmed application authorization defect.

### Verification and review boundary

- Recovery reran existing rollback-only beta_messaging_security.sql successfully: participant/nonparticipant, revoked/unverified identity, role-metadata spoofing, raw writes, sender/time authority, blank/oversized/control-character content, stable retries, the 500-message cap and Realtime publication checks. SQL fixtures always roll back.
- pwsh -File scripts/verify-controlled-beta.ps1 -Messaging passes genuine independent Auth sessions, customer-to-professional and professional-to-customer Realtime events, persisted history/new-session restoration, 50-message keyset pagination, retries/payload conflicts, disconnected catch-up, anonymous event/read denial and unchanged selected-job status.
- -MessagingBrowser passes actual UI logins in separate Chrome contexts, bidirectional live messages, failed send → reload → retry, disconnected-socket catch-up without manual refresh, pagination, preserved local conversation rendering, raw local draft/profile/message preservation, mode-independent sender identity and logout/account switching without exposing the previous private outbox. Keyboard send, reduced motion and 320/390/430px bounds pass with no page errors.
- Secure-session and messaging-state tests pass deduplication/order, queue acknowledgement reconciliation, restart restoration, concurrent indexing, failed-write preservation and account-isolated clearing without touching prototype data.
- Corrected full -Media regression: PASS, including authorized 30-second signed access, bounded short-token expiry, continued authenticated access, private/public endpoint boundaries and fixture cleanup. Its job/offer/selection workflow also verifies unchanged Stage 08/09A behavior. Test cleanup targets only images/reservations created by that run; existing shared images and local records are preserved.
- Fresh mobile/web lint and TypeScript, website production build and local iOS Hermes export pass. Screenshots/export are ignored under artifacts/beta-stage09b. No dependency was added or upgraded. Security advisor reports only the previously documented disabled leaked-password-protection warning; no new database/RLS finding. The earlier performance check found unused-index INFO notices only.

Automated tests use synthetic messages/jobs labelled Controlled messaging or Controlled chat browser. These are actual shared beta fixtures, retained as synthetic test history, not claimed customer activity. Test credentials remain in the Windows vault and are supplied privately through the existing runner. No service-role credential is used by the app or these integration tests.

These results are automated API, database, browser and compilation verification, not physical-iPhone approval. Still pending: actual two phones, native SecureStore force-close restoration, iOS/Android keyboards/safe areas, background/foreground interruption and native accessibility. Realtime is foreground live updates with server-history catch-up, not guaranteed background delivery or push notifications. Read/delivery receipts and attachments are not implemented. SMTP/recovery and Stage 09A content-inspection limitations remain unchanged.

Review: website http://localhost:3001; Expo Go beta exp://c-kodlinsteam-qg883e-mwghq3xpflz7vweq.on.expo.app/--/beta. Recovery restored both stopped servers under the same migrated configuration; keep this computer online. New tunnel links replace historical links below.

Next checkpoint: review the completed uncommitted Stage 09B changes and then explicitly authorize any local Git checkpoint. Physical-device testing remains pending; do not start a later Stage 09 subphase automatically.

Current Realtime reference: https://supabase.com/docs/guides/realtime/postgres-changes . Its example anonymous permissions were not adopted; Servify retains authenticated participant-only RLS.

## Approved local checkpoint — 13 November 2026

The user approved a combined Stage 08 + Stage 09A implementation checkpoint. Earlier statements about keeping work uncommitted describe the implementation/review phase and are historical. The checkpoint review confirmed that all five migration versions/names match servify-beta; the four older ledger entries differ only in trailing newlines, and the Stage 09A SQL matches byte-for-byte. Candidate source contains no literal secret keys, runtime environments, vault files or generated artifacts.

Fresh checkpoint verification passed website/mobile lint and TypeScript, SecureStore adapter tests, HTTPS invite-only Auth checks, rollback-only database/media authorization checks and the real two-account job/offer/private-media test. Successful production build, iOS export and focused responsive/browser results from the approved implementation were reused because application code was unchanged. Physical-device checks, SMTP/recovery, the existing leaked-password-protection warning, dependency findings and the documented direct-upload content-inspection limitations remain outstanding. No functionality or later-stage scope was added for this checkpoint. Local records/environments and running website/Expo processes are preserved; no push or deployment is authorized.

## Status — 13 November 2026

Direct authenticated Supabase uploads are implemented for mobile customer request photos and professional profile/portfolio photos. Only servify-beta (ucfzvrkvrrxtkyxysvzx, Ireland) was accessed. No media server, service-role credential, cloud function deployment, new dependency, public bucket or authentication relaxation was introduced. Physical Stage 08C testing is postponed until Stage 09 is ready, at the user's request.

Mobile is the product priority. Existing website screens remain intact; its future marketing/app-download focus and desktop-only administration do not authorize removing today's workflows.

## Baseline and checkpoint

Started on main at 501f1c6d08cfc1570b2f0e6e86d12cf8e9183681, with the uncommitted Stage 08A/B database/auth/shared-job-and-offer work and approved Expo owner/project linkage already present. Reviewed the tree and reconciled all four Stage 08 migrations with the hosted ledger. Both real controlled accounts authenticated; the complete HTTPS publish/discover/offer/view/select workflow passed. An initial sign-in attempt failed transiently; identical credentials subsequently passed without account/security changes.

The user subsequently explicitly prohibited commits. No checkpoint commit, staging, reset, push or application deployment occurred. Last committed rollback point remains 501f1c6; Stage 08 and Stage 09A must both be reviewed before the next local checkpoint. The preserved old OneDrive source and external migration hash inventory also retain the pre-09A Stage 08 files; neither was changed by this stage. Secrets, vault contents, ignored environments, exports and screenshots are excluded from any future checkpoint.

Baseline findings fixed without changing product behavior: SQL discovery assertions now target their transaction's own request instead of counting older retained fixtures; root ESLint explicitly ignores preserved generated artifacts, matching Git/TypeScript intent. Website interfaces were not redesigned.

## Authorization and lifecycle

Migration 20261113084425_beta_shared_media.sql is applied and matches the hosted ledger. Existing image_assets becomes the reservation/registry with pending/ready state, expected byte size and content type. Private helper functions pin search_path, derive identity from auth.uid(), require active verified invited membership and expose narrow invoker RPC wrappers. No caller can supply an owner ID or directly mutate the registry.

1. Client persists an account/resource/local-photo-scoped retry UUID in a separate servify.beta.media namespace. It never reads or rewrites prototype record keys.
2. beta_reserve_media checks resource ownership, required professional profile, portfolio category/title/description, MIME/size, ID/payload reuse and limits under a per-account transaction lock. Paths are server generated: owner UUID / asset UUID + fixed allowed extension.
3. Storage INSERT requires that exact owner reservation, still pending and created/renewed within 24 hours. Arbitrary paths, other owners and feedback uploads are denied. Storage UPDATE/upsert is deliberately unavailable, including to the owner.
4. The client uploads the optimized JPEG bytes directly to Storage using only its access token and publishable key. XHR supplies real bytes-sent progress, timeout, cancellation and actionable retry errors.
5. beta_complete_media checks actual Storage object ownership, existence, recorded size and MIME against the reservation before ready state. Repeating a matching reservation/completion is safe. This checks Storage metadata, not decoded file contents.
6. Owner deletion removes only an explicitly confirmed shared copy through Storage, then beta_forget_media clears its registry/portfolio row only when the object is absent. Cancelled pending reservations use the same flow. Local originals are never removed.

Limits: existing private buckets retain 5 MiB server-side limits and JPEG/PNG/WebP MIME allowlists. The existing mobile picker resizes to 1600px, JPEG quality .78 and local maximum 1 MiB; the shared adapter checks saved JPEG size/signature for UX. Eight images per request, eight profile-image versions, eight portfolio entries and 64 total reservations/assets per account. Pending reservations count toward limits; expired reservations are not silently discarded. Retry renews the owner reservation, or the owner may explicitly cancel it. Profile replacements use new immutable photos; old shared versions can be removed explicitly, preserving the last good image during failures.

## Read boundaries

- Owners can view/manage their own registered images and see pending states.
- Job photos are visible to matching professionals while the request is open; after selection only its selected professional retains access (plus the customer owner). Unrelated professionals/customers are denied.
- Profile/portfolio photos are visible to the owner and customers with that professional's submitted/accepted offer. No unrestricted profile gallery or public bucket.
- Private gallery signing uses the authenticated client's RLS checks and 60-second URLs held in component memory only. Images clear before expiry, refresh on foreground or explicit action, and unmount on account change/logout. Stable aspect-ratio placeholders prevent loading/expiry layout jumps.

Signed URLs are bearer capabilities until expiry: someone given a valid URL can read it without signing in. Logout/role changes do not revoke an already-issued URL immediately; existing downloads/screenshots cannot be recalled. Do not log, persist or share these links. Authenticated stranger downloads and URL creation are denied. Tests verified actual expiry and denial of public-bucket URLs.

## Mobile behavior and preservation

Existing seven-step form and local draft detail retain explicit confirmation before beta publication. The text request is published once, then its photographs are uploaded. If media fails after posting, the message states that the request already exists; retry uses the same publication/media IDs, fills missing uploads and does not create another job. Users can inspect pending photos in My Jobs. Source drafts and photos remain available.

Customer request and professional discovery cards display the same private request gallery. Customer offer cards display authorized professional photographs. Professional Profile adds an explicit shared-media section using existing design components. Each local portrait/work sample requires its own upload confirmation; valid portfolio details accompany that one chosen image. Saving profile details in Find Jobs remains separate. Nothing is automatically imported, synchronized or deleted from the local profile.

Pending/uploading/confirming/success/failure states, progress, retry, private-image errors and owner removal use existing buttons, alerts and confirmation dialogs. No messaging, scheduling, reviews, mobile admin or later Stage 09 integration was started.

## Security limitation and later hosted hardening

Direct Storage upload MIME restrictions inspect the declared content type; they do not guarantee image decoding, benign content or metadata stripping. Client compression/signature checks can be bypassed and are not trusted server validation. Malformed/polyglot bytes sent as an allowed MIME type may be stored. Consumers here render images only; no HTML/SVG/WebView rendering or public file serving is introduced. Controlled testers must avoid sensitive photographs, faces, identity documents, exact addresses and confidential material.

For stronger external/untrusted admission, separately propose a hosted quarantine → validated decode/re-encode → ready pipeline (for example a Supabase Edge Function/worker with a maintained image codec and explicit CPU/memory limits). It should strip metadata, reject oversized pixel dimensions and malformed content, enforce quotas and promote only validated objects; privileged credentials stay in hosted secret storage. Review Free-plan feasibility/cost and obtain deployment approval first. This solution was not deployed or configured. No guaranteed server-side re-encoding/content-inspection claim is made for 09A.

## Verification

- HTTPS Auth settings confirmed email confirmation enabled and anonymous users disabled; uninvited signup, unknown-account login and anonymous table/RPC access were rejected.
- Stage 08 actual two-account HTTPS sign-in/session restoration/refresh, publication, discovery, offer, selection, RLS/idempotency and independent logout: PASS.
- Existing rollback-only supabase/tests/beta_security.sql: PASS after fixture scoping. New beta_media_security.sql: PASS, including owner/competitor, unverified, suspended, uninvited, pending visibility, raw registry write denial, incomplete confirmation and removal of unselected-competitor photo access after selection.
- pwsh -File scripts/verify-controlled-beta.ps1 -Media: PASS real direct job/profile/portfolio uploads with independent authenticated clients; arbitrary/foreign/anonymous upload denial; unrelated authenticated read/sign/update/delete denial; owner overwrite denial; MIME and >5MiB rejection; idempotency; pre-upload confirmation denial; actual owner and eligible/selected participant readback; offer-related professional images; public URL denial; signed URL expiry; concurrent eight-image resource limit. Synthetic image/portfolio/reservation fixtures are cleaned in finally. Final readback confirms zero synthetic image registry entries and zero Storage objects after cleanup. Labelled synthetic request/offer records remain for review; they are not real customer activity.
- -MediaBrowser: PASS isolated Chrome contexts with actual app sign-ins, failed request-photo upload/retry without repeat publication, remote customer/professional image display, explicit portrait/portfolio sharing, keyboard Enter confirmation, owner deletion, reload, reduced motion, 320/390/430px no-overflow checks, logout and byte-for-byte local draft/profile/photo preservation. The professional discovery gallery omission found during verification was fixed. No real user's browser storage was used.
- Mobile lint/TypeScript and secure-session adapter tests: PASS. Local iOS Hermes export: PASS; no EAS build/publication. Focused UI screenshots and generated export stay under ignored artifacts/beta-stage09a.
- Website lint, TypeScript and production build: PASS, including marketing/customer/professional/admin and existing beta session API. Existing website screen source remains unchanged.
- Security advisor: existing leaked-password-protection warning only; no new database/storage findings. Performance advisor: 42 unused-index INFO notices on the small beta dataset; no new duplicate-index/unindexed-FK warning. Retain security/integrity indexes until workload evidence supports changes.
- Dependency audit on 13 November: website 7 moderate, mobile 10 moderate; zero high/critical. No new dependencies or lockfile upgrades in 09A; these supersede historical audit counts.

## Local review and remaining tests

Website: http://localhost:3001. Expo Go tunnel restored under the existing account/project (kodlin / kodlins-team / 1799c1ab-db36-4eb8-a421-9009642c625b). Current beta route: exp://c-kodlinsteam-qg883e-mweqap91z087u1hi.on.expo.app/--/beta. Tunnels rotate and require this computer online; media itself goes directly to Supabase and does not depend on localhost.

Physical iPhone/Android photo picker, native XHR progress/interruption/background handling, SecureStore force-close restoration, safe areas and two physical remote devices are still outstanding. Browser isolation and iOS compilation do not constitute those device tests. SMTP, mailbox verification, password recovery, external beta admission and broader shared lifecycle remain deferred. No public registration, SMTP or Expo account changes.

Next checkpoint: review these uncommitted changes and the documented direct-upload/content-inspection trade-off, approve the local Git checkpoint, then perform the deferred two-phone test when the agreed Stage 09 scope is ready. Do not start another subphase automatically.

## Documentation consulted

- https://supabase.com/changelog.md (relevant CLI v3 target/confirmation changes reviewed; no CLI/package upgrade).
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/uploads/standard-uploads
- https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- https://supabase.com/docs/guides/storage/serving/downloads


## CPU audit before Stage 09C — 14 November 2026

See [SUPABASE_PERFORMANCE_AUDIT.md](SUPABASE_PERFORMANCE_AUDIT.md). An ongoing PostgREST 14 retry storm came from deterministic business conflicts raised as SQLSTATE 40001. Applied migration 20261114152344 changes only the private offer-selection and professional-profile conflict codes to PT409/HTTP 409; earlier migrations, authorization and local records remain unchanged. The retry rate collapsed without terminating sessions. Job/offer, media, RLS/auth and focused two-account Realtime regressions passed. Exact CPU-percentage charts require manual dashboard confirmation because browser inspection was blocked. No Stage 09C work, commit, push or application deployment occurred.
