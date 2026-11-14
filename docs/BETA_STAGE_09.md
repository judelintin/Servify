# Stage 09 — Shared media and real-time messaging

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
