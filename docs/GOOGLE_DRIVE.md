# Connect private Google Drive storage

No connection or cloud upload is performed automatically. The research owner authorises the app; teachers never supply Google passwords.

1. Use a research-controlled Google account and inspect its available Drive storage. Space is shared with Gmail/Photos. Video count alone does not determine capacity.
2. In Google Cloud Console create/select a project and enable **Google Drive API**. This uses Drive storage, not Google Cloud Storage buckets.
3. Configure the OAuth consent screen. For testing, add the research owner as an authorised test user. Explain the collection purpose and limited `drive.file` scope.
4. Create an OAuth **Web application** client. Add the exact redirect URI for your hosted environment, for example: `https://<your-pages-domain>/api/storage/drive/callback`.
5. Add the local development redirect URI as well: `http://localhost:5173/api/storage/drive/callback`.
6. On the backend configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the correct `GOOGLE_REDIRECT_URI`. Also set `TOKEN_ENCRYPTION_KEY` to a secret Fernet key in the host environment. Never put the client secret, refresh token or database password in React code or share it in chat.
7. Restart the backend. Log in as administrator at localhost:5173. Open Google Drive → Connect Google Drive. Google's own consent page opens.
8. Approve access. The application creates **Sign Research Private Recordings** in that account. It receives access to files it creates through `drive.file`; it does not request full-Drive access. No public permissions are added.
9. Set `STORAGE_BACKEND=drive` and restart the backend. Use a consenting adult's test recording first. Confirm upload, playback, export and withdrawal in the real account.

Existing local takes remain local; switching configuration affects only new uploads. Reconnecting creates another app folder; existing authorised file IDs remain linked. Protect the research account with appropriate account security. OAuth testing tokens may expire; review Google's testing/publishing rules before actual long-term collection. Refresh tokens are encrypted server-side using a host secret before they are stored in PostgreSQL.

The backend receives a private temporary upload, validates it and forwards it to Drive. This avoids exposing Drive credentials to contributors, but sends video through the backend and is not a high-throughput direct-to-cloud design. Resumable Drive session creation is implemented; automatic retry from a partial byte offset is not. For larger collections, add a persistent upload queue and recovery worker.

A normal connected ChatGPT Drive account is not the deployed application's OAuth identity. Application credentials must be created for this app; do not reuse connector credentials. Do not share the folder publicly or change videos to “Anyone with the link.”
