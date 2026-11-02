# Sign-language research video collection

Local research prototype with React/TypeScript/Vite, Python/FastAPI, SQLAlchemy and SQLite or PostgreSQL. Private local storage works immediately; Google Drive is optional after owner-authorised OAuth setup. This is **not deployed** and is not production-ready. No translation, model training, avatar generation or automated emotion/sign-quality assessment.

## Install and start

Requirements: Python 3.12+, a supported Node.js version for Vite 6 (Node 22+ recommended), npm, and **FFmpeg/FFprobe installed on PATH**. No GPU required.

From the project root:

```bash
python -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

On Windows PowerShell, run these from the project root instead:

```powershell
python -m venv backend\.venv
& .\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
```

Edit `backend/.env` as appropriate. Load it into the backend shell (POSIX shell):

```bash
set -a
. ./backend/.env
set +a
backend/.venv/bin/python -m backend.app.manage migrate
backend/.venv/bin/python -m backend.app.manage create-admin --code ADMIN
backend/.venv/bin/python -m backend.app.manage seed-demo
backend/.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

The admin command prompts privately for a password (12+ characters); no default password exists. Start a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to FastAPI on port 8000, including OAuth callbacks and authorised video requests. Windows: activate the venv using `backend\.venv\Scripts\Activate.ps1` and load environment variables using your shell's mechanism.

### Seed synthetic demo data

After `migrate` and creating an administrator, run `python -m backend.app.manage seed-demo` from the project root (PowerShell: `& .\backend\.venv\Scripts\python.exe -m backend.app.manage seed-demo`). This creates 20 linked synthetic teacher accounts, consent rows, expired login rows, Tamil prompt versions, batches, assignments, sessions, pending takes, placeholder annotations/reviews, audit rows, and demo settings. Use `--count 30` to create 30 of each applicable record; the minimum is 20. The generated shared teacher password is printed once by the command. Demo teacher codes are `DEMO001` through `DEMO020` by default.

Demo prompts and annotations are explicitly marked synthetic and unvalidated. Demo takes are pending and contain **no video file**. Demo consent permits recording for interface testing but does not permit research, avatar, or public export. The seeder refuses to run again in the same database. It does not fabricate schema migration history or replace existing records.

## First complete recording

1. Log in as administrator; create a teacher account under Contributors, or register a teacher account from the sign-in screen.
2. Review the seeded **draft examples** under Prompts & batches. They are not validated translations. Use Revise to create reviewed approved versions, or explicitly create a **draft pilot** batch. The optional synthetic demo seed is only for interface testing.
3. Select exact prompt versions and teacher codes; create an assigned batch.
4. Log out; log in as the teacher. Read the versioned consent explanation and choose separate recording/research/avatar/public permissions. Public sharing starts unchecked.
5. Choose a batch and domain, open the camera, check framing, read the sentence and press Start.
6. After the countdown, sign the **translation**, not an answer. Manually stop before ten minutes.
7. Review the actual video, enter the sign-language/regional variety and annotations, then save approval. Re-recording creates a new take. Unsaved discarded takes never enter the research dataset.
8. Wait for server confirmation. Upload progress reaching 100% is not a saved confirmation: video validation/storage may still be running.
9. As administrator, review the take under Dataset & export. Default exports require a selected teacher-approved take and a separate administrator approval.

Camera preview can be mirrored via CSS. MediaRecorder uses the original stream, so **the application never flips the saved video**. Camera drivers may have their own transformations. Test a known asymmetric sign with the teacher before collection. Preferred capture is 1280×720, 30 FPS; actual camera/browser capabilities determine the result. Audio is disabled and uploaded audio streams are rejected.

## Database setup

`manage migrate` creates schema version 1 using SQLAlchemy's metadata and records it in `schema_migrations`. This is an initial-schema setup, not a general migration framework. Future schema changes require explicit, versioned migrations; `create_all` does not alter existing columns. For hosted use set `DATABASE_URL=postgresql+psycopg://...` **before initialisation**. SQLite is for local testing; switching databases does not migrate existing data automatically. SQLite foreign keys are enabled on connection.

## Prompt import

See `examples/prompts-template.csv`, `examples/demo-prompts.csv`, and `docs/PROMPTS.md`. Upload UTF-8 CSV in the admin screen, validate/preview, then commit. Existing codes create new immutable text versions; batch assignments reference a specific version. Lifecycle status may be updated by a future explicit migration; current revisions create a new version. Creating an archived revision does not silently alter older assigned versions.

## Google Drive

See **docs/GOOGLE_DRIVE.md**. Google Sites is only an optional introduction/link page. This application and backend still require their own host. Do not embed the camera workflow before verifying iframe camera permissions; opening the application directly is preferable.

## Private storage, access and reliability

`DATA_DIR` contains `research.sqlite3`, recordings, temporary uploads and ephemeral export ZIPs. Never serve this directory statically, commit it, or put it inside `frontend/public`. Every playback request is authenticated and authorised. Local playback supports byte ranges through FileResponse; Drive videos are downloaded to a short-lived private temporary file for playback, so Drive retrieval is slower and consumes backend disk/bandwidth.

The upload pipeline enforces 150 MB by default while copying, inspects video with FFprobe, rejects audio, reads actual properties, calculates SHA-256, and saves only after storage confirmation. Browser upload filenames are ignored. A unique submission key and atomic take-state claim prevent duplicate concurrent submissions. Retries after a lost response return the existing uploaded take. A storage interruption returns failure and permits retry of the browser's retained blob. It does **not** resume chunks after closing/reloading the tab. Google Drive uses its resumable protocol, but automatic chunk recovery across server restarts is not implemented.

If the backend is killed during upload, stop all backend workers and run `python -m backend.app.manage recover-uploads`, then restart. This resets interrupted claims and removes temporary files; inspect orphaned remote Drive files manually if a failure occurred between remote upload and database commit. A reverse proxy must enforce a matching request-body limit: multipart parsing occurs before route-level inspection. Do not expose the development server publicly.

## Export

Filter domain and batch, choose intended use, and check eligibility. CSV/JSON downloads include exact prompt version, semantics, contributor code, session/take IDs, review status, reviewer code, signing variety, annotations and actual video properties. ZIP adds selected videos and a manifest with `schema_version=1.0`, timestamp and filters. Filenames use random take IDs, never contributor codes. Consent details and credentials are excluded. Rejected takes require explicit rejected selection and consent permission. An incomplete ZIP is not reported as complete.

ZIP creation and Drive retrieval are synchronous and intended for a small pilot. A hosted deployment needs background export jobs, per-user quotas, pagination, upload rate limits and stronger operational controls.

## Withdrawal and backups

Teachers can inspect affected take/annotation counts, then confirm **WITHDRAW AND DELETE**. The backend commits withdrawal and blocks video access/exports before deleting storage files and annotations/reviews. Failed external deletions stay blocked and are reported; retry the withdrawal. Minimal take tombstones and audit events remain for traceability. The prototype withdraws all recordings for a contributor, not individual takes. Administrators can call the same authorised endpoints for a specified contributor ID.

Exports are deleted from the server after delivery. Already downloaded copies cannot be recalled. Keep an export distribution register outside this prototype, and apply withdrawals to those copies. For local SQLite backups stop the server and copy the entire private data directory, including database and recordings. For PostgreSQL use pg_dump alongside a consistent storage snapshot. Google Drive originals require an independently managed backup. Protect backups with encryption and restricted access. Keep a deletion register and reapply withdrawals after restoring any old backup.

The database contains consent records, password hashes, session tokens and an OAuth refresh token. Restrict filesystem access and use encrypted disks. Do not promise anonymisation: signing videos identify people. Do not log secrets or sentence/video content.

## Hosted deployment (Render + Cloudflare + Neon)

This prototype is ready for a hosted deployment using:

- Cloudflare Pages Free for the React + TypeScript frontend
- Render Free for the FastAPI backend
- Neon Free for PostgreSQL
- Google Drive API with the research owner’s OAuth app and private `drive.file` scope

The backend is configured for HTTPS-friendly cookies and database TLS, and the frontend accepts a `VITE_API_BASE_URL` override for deployment. For the free tiers, the safest production pattern is:

1. Host the frontend on Cloudflare Pages.
2. Host the FastAPI app on Render.
3. Configure CORS for the exact HTTPS frontend origin. Set `COOKIE_SECURE=true`; use `COOKIE_SAMESITE=none` for cross-site frontend/API hosts. A custom frontend and API domain under the same site is preferable because browsers may block third-party cookies.
4. Keep the upload and video playback on the Render API, because Cloudflare Pages request limits and streaming limits are not a reliable replacement for authenticated video upload and playback at scale.
5. Use the Pages static host for the UI and let the backend handle private file operations.

The repository includes `render.yaml`, a Dockerfile for the backend, and Cloudflare redirect rules for SPA routing. Use `backend/.env.example` for backend settings and `frontend/.env.example` for Vite settings. Keep real secrets in the backend environment only; do not commit them or expose them through frontend variables.

### Required account setup before deployment

- Create a Neon project and copy its Postgres connection string into the Render environment as `DATABASE_URL`.
- Enable `sslmode=require` for Neon in the app configuration.
- Add `TOKEN_ENCRYPTION_KEY` to the Render environment for encrypted Google refresh-token storage.
- Create the Google OAuth Web application, enable the Drive API, and add the exact production callback URL: `https://<your-pages-domain>/api/storage/drive/callback`.
- Publish the app or add the research owner to the Google OAuth test users before using it for live collection.
- Create the admin account on the hosted backend after the first deploy: `python -m backend.app.manage create-admin --code ADMIN`.

### Render and Cloudflare limits

- Render Free limits CPU, memory and cold starts; expect the first response after idle to take longer.
- Cloudflare Pages Free is suitable for the UI, but not for a long-running Python API or authenticated video storage service.
- Do not add keep-alive traffic to evade free-tier limits.
- Do not promise permanent free availability or long-term persistence without checking the current service terms at deployment time.

## Verify

```bash
backend/.venv/bin/python -m pytest backend/tests -q
cd frontend
npm run build
```

Tests generate synthetic video fixtures and temporary SQLite databases. They are not validation of physical webcam image quality or signing correctness. A teacher must test real camera framing, finger/face clarity, regional variety and meaning before collecting the dataset. See `docs/VERIFICATION.md` for the exact checks performed and remaining limitations.
