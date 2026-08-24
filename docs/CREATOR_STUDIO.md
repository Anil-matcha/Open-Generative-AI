# Creator Studio provider setup

Creator Studio is a private, Runway-inspired workspace that coordinates six specialist services:

| Tool | Provider | Required deployment variables |
|---|---|---|
| Creative assistant | Anthropic | `ANTHROPIC_API_KEY` |
| Image generation | OpenAI | `OPENAI_API_KEY` |
| Voice generation | ElevenLabs | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |
| Avatar video | HeyGen | `HEYGEN_API_KEY`, `HEYGEN_AVATAR_ID`, `HEYGEN_VOICE_ID` |
| Cinematic video | Runway | `RUNWAY_API_KEY` |
| Manual private publishing | YouTube + Vercel Blob | `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`, `YOUTUBE_OAUTH_CALLBACK_URL`, `YOUTUBE_TOKEN_ENCRYPTION_KEY`, `BLOB_READ_WRITE_TOKEN` |

All provider credentials are read only by the Next.js server. They are never sent to the browser, returned by the provider-status endpoint, or committed to the repository.

## Configure GitHub sign-in and Vercel

1. In GitHub, open **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Use the exact deployment origin as the homepage URL and the exact callback URL `https://YOUR-HOST/api/auth/github/callback`. Keep callback wildcard matching disabled.
3. Create a separate OAuth app for Preview and Production. This avoids sharing a callback or secret across environments.
4. Open the Vercel project and go to **Settings → Environment Variables**.
5. Add the following authentication variables to the matching environment and branch:

   - `GITHUB_OAUTH_CLIENT_ID`
   - `GITHUB_OAUTH_CLIENT_SECRET`
   - `GITHUB_OAUTH_CALLBACK_URL`
   - `CREATOR_GITHUB_ALLOWED_LOGINS`
   - `CREATOR_GITHUB_ALLOWED_USER_IDS` (recommended immutable identity pin)
   - `CREATOR_SESSION_SECRET`

6. Generate `CREATOR_SESSION_SECRET` independently from every provider and OAuth secret:

   ```bash
   openssl rand -base64 48
   ```

7. Add each provider variable from the table above. Select the Production, Preview, and Development targets where that provider should be available.
8. Redeploy the project after saving the variables.
9. Open `/studio/creator`, choose **Continue with GitHub**, and authorize only the allowlisted account.

Never paste an API key into a GitHub file, issue, pull request, build log, or browser-side `NEXT_PUBLIC_*` variable. Rotate a credential immediately if it was exposed in any of those places.

## Configure private YouTube publishing

YouTube publishing is deliberately manual. Creator Studio uploads only with YouTube's `youtube.upload` OAuth scope, always initializes videos as **private**, disables subscriber notifications, and requires an approval checkbox for each upload. Creator Studio never changes a video to public automatically.

1. In the Vercel project, open **Storage**, create a **private Blob** store, and connect it to this project. Confirm that Vercel added `BLOB_READ_WRITE_TOKEN` to the intended environments.
2. In Google Cloud, create or select a project, enable **YouTube Data API v3**, and configure the OAuth consent screen. For an owner-only testing app, add the publishing Google account as an allowed test user where applicable.
3. Create an OAuth 2.0 **Web application** client. Register the exact redirect URI `https://YOUR-HOST/api/social/youtube/callback`. Use a separate client for Preview and Production because their redirect URIs differ.
4. Add these server-only Vercel variables to the same environment as the matching callback:

   - `YOUTUBE_OAUTH_CLIENT_ID`
   - `YOUTUBE_OAUTH_CLIENT_SECRET`
   - `YOUTUBE_OAUTH_CALLBACK_URL`
   - `YOUTUBE_TOKEN_ENCRYPTION_KEY`
   - `BLOB_READ_WRITE_TOKEN` (normally injected when the Blob store is connected)

5. Generate the encryption key independently:

   ```bash
   openssl rand -base64 32
   ```

6. Redeploy, sign in to Creator Studio, open **YouTube**, and choose **Connect YouTube**. Verify Google's consent screen requests permission to upload videos—not broad account or channel-management access.
7. Choose a finished video, complete the title/audience/synthetic-media fields, approve the private upload, and review the result in YouTube Studio before manually changing visibility.

The browser uploads the file directly into the private Blob store using a short-lived, pathname- and size-constrained client token. The long-lived Google refresh token and upload history are encrypted with AES-256-GCM before private Blob storage. Google access tokens remain server-side. A non-overwritable private publish claim blocks concurrent replay of the same staged file. A successfully published staging object is deleted; abandoned staging objects become eligible for cleanup after 24 hours.

Private Blob storage, data transfer, Vercel function execution, and YouTube API use can be subject to provider quotas or charges. The default staged-file limit is 500 MiB and can be changed with `YOUTUBE_UPLOAD_MAX_BYTES` up to 2 GiB. The YouTube route uses Vercel Hobby's 300-second function limit; `YOUTUBE_UPLOAD_TIMEOUT_MS` defaults to and is capped at 285 seconds so authorization, initialization, and cleanup retain a small execution margin. Large videos still need enough server-to-server bandwidth to finish within that limit.

Treat `YOUTUBE_TOKEN_ENCRYPTION_KEY` as permanent deployment infrastructure. Changing or losing it makes the stored connection unreadable; disconnect/revoke the old Google authorization and reconnect after an intentional rotation.

## Optional controls

The defaults are listed in `.env.example`:

- `CREATOR_SESSION_TTL_SECONDS=28800` limits a signed Studio session to eight hours. The code caps sessions at 24 hours.
- `CREATOR_STUDIO_RATE_LIMIT=5` limits each generation action per minute for the signed-in GitHub identity.
- `CREATOR_STUDIO_STATUS_RATE_LIMIT=120` permits provider task polling without relaxing generation limits.
- `CONTENT_SAFETY_MODE=enforce` blocks the built-in high-risk content classes before any paid provider call. `audit` and `off` remain explicit operator choices.
- `OPENAI_IMAGE_DEFAULT_QUALITY=low` keeps exploratory image calls less expensive; the UI can request medium or high quality.
- `YOUTUBE_UPLOAD_MAX_BYTES=524288000` caps each private staged video at 500 MiB by default.
- `YOUTUBE_UPLOAD_TIMEOUT_MS=285000` gives the server 285 seconds to stream the staged file to YouTube while preserving a small margin inside the route's 300-second Hobby limit.
- Provider model/version variables can be pinned without changing source code.

Rate limiting is an abuse guard, not a billing budget. Set spending limits and alerts in each provider account as well.

## Provider-specific notes

- An existing provider web subscription does not always include API usage. Confirm that each account has API access and an API balance before testing.
- ElevenLabs requires a reusable voice ID in addition to the API key.
- HeyGen requires an avatar ID and a voice ID. Its API billing can be separate from the HeyGen web-app plan.
- Runway video jobs are asynchronous. Creator Studio polls the task endpoint no more frequently than every five seconds and stops after about ten minutes.
- A Runway first-frame image must use a provider-reachable HTTPS URL. Direct local-file handoff is not part of this first version.
- YouTube publishing requires a private Vercel Blob store and a Google OAuth web client. A normal YouTube Premium or Google subscription does not replace YouTube Data API OAuth.

## Security model

- GitHub authorization uses the web application flow with an unguessable state and PKCE S256 challenge. The callback URL comes only from server configuration.
- The app requests no repository scope. It exchanges the temporary code server-side, verifies the current GitHub identity, and does not store the GitHub access token.
- Access is checked against the configured GitHub login and, when configured, the immutable numeric GitHub user ID.
- The browser receives only a signed, short-lived, HTTP-only, Secure, SameSite session cookie. Provider keys and GitHub tokens never enter browser storage.
- Server routes use a constant-time comparison, per-action rate limiting, request-size limits, content safety, fixed upstream hosts, strict input validation, timeouts, no-store responses, and sanitized provider errors.
- Provider-status responses expose only configuration booleans and model labels—not credential values.
- The YouTube flow binds OAuth state and PKCE to the signed GitHub identity, encrypts the refresh token at rest, validates private staging paths, MIME types, sizes, age, and file signatures, and accepts only Google's fixed token/revocation/upload hosts.
- Paid generation mutations reject cross-origin requests. **Sign out** expires the Studio session cookie immediately.
- This is an owner-allowlisted identity gate. Add durable user records, roles, shared rate limiting, audit logs, and provider budgets before opening the deployment to customers or collaborators.
