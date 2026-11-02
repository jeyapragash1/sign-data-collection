# Verification and remaining limitations

## Passed automated checks

- 14 pytest workflow tests, using isolated temporary SQLite databases and generated synthetic WebM video.
- Password-based login, backend administrator/contributor authorisation, CSRF checks and cross-contributor video denial.
- Unauthenticated private-video denial and authorised HTTP range playback.
- Recording consent and assignment checks; missing or withdrawn consent denies access.
- Prompt word-limit validation, immutable original prompt version linkage, draft pilot restriction and archival.
- Duplicate submission keys and retry-after-success do not create duplicate takes.
- Invalid video contents are rejected; the take remains retryable.
- Simulated storage disconnection returns failure and can be retried.
- Browser-style WebM without a container duration: duration derived from packet timestamps.
- Re-recorded take history, selected take switching, required signing variety and valid segment timestamps.
- Original/current consent purpose checks, separate teacher/admin approval, rejected-take opt-in, domain filtering.
- JSON/ZIP metadata, manifest and video consistency; no consent credentials in exports.
- Withdrawal blocks access/exports and deletes stored videos plus annotations/reviews.
- CSV invalid-row reporting with no partial writes.
- Google connection configuration errors and OAuth state checks.
- Frontend strict TypeScript check and Vite production build passed.

## Not verified

- Physical webcam acquisition, actual browser MediaRecorder output, finger/face clarity and real signing correctness.
- Browser UI end-to-end: the available remote browser could not connect to this workspace's local preview (ERR_CONNECTION_REFUSED). No successful browser walkthrough or visual screenshot verification is claimed.
- Live Google OAuth connection, real Drive upload/download/deletion, account quota and token lifetime. Requires the research owner's OAuth configuration and consent.
- PostgreSQL runtime/concurrency: the adapter is configured, but automated tests used SQLite.
- Hosting, HTTPS/domain setup, cross-device/mobile compatibility and concurrent contributors under load.

## Prototype limits

- No deployment has occurred; no real contributor videos were collected or uploaded.
- Current local schema uses explicit version-1 initialisation, not Alembic incremental migrations.
- No automatic lighting, occlusion, emotion, sign recognition or translation correctness analysis.
- No resumable browser-to-backend uploads after tab close. Google upload uses a resumable endpoint but recovery from byte offsets is not automated.
- Drive playback retrieves a private temporary copy before serving. Large exports are synchronous. Suitable for a pilot; scaling requires background jobs and resource controls.
- No session-start camera/device metadata beyond server-inspected video properties; measured FPS can be unavailable.
- No production rate limiting, OAuth refresh-token encryption, password reset/account disable UI, contributor-level purge from backups or export-recipient register.
- Batch management creates assignments and retains them; in-place batch editing is not implemented. Create a new batch for revised assignments.
- No automatic reconnect/reconciliation for a backend crash between remote file creation and its database commit. Follow README recovery steps and reconcile remote orphan files before continuing collection.
- SQLAlchemy stores annotations/reviews as history; meaningful segments are structured arrays in annotation rows rather than a separate table.
- Consent metadata is separate from exported metadata, but remains in the same protected database.
- An API session expires after eight hours; an unsaved browser video may need a re-login in another tab before retrying. Reloading the recording page loses its local unsaved blob.
- One harmless Starlette TestClient/httpx deprecation warning is present in the tested dependency set.

Before real research collection: perform a consenting-adult webcam pilot, connect and verify Drive, agree the sign-language variety and prompt content with teachers, and complete the institution's research/hosting approval process.
