# Data access boundary

Stage 03 adds `local-drafts.ts`, an explicit browser-only persistence adapter for
customer draft form state and photo Blobs. It uses IndexedDB with atomic revision
checks and a clearly labeled temporary in-memory fallback. It is separate from
the future authenticated Supabase adapters described below; it creates no remote
tables or account records. See `docs/STAGE_03.md` for its local-only contract.

Reserved for server-only Supabase adapters and explicit public/private projections.
No client, database, migrations, credentials, seed accounts or remote resources
exist in Stage 01. Future adapters must enforce the access matrix in
`docs/ARCHITECTURE.md`; TypeScript types do not validate untrusted data.
