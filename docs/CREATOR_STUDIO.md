# Creator Studio provider setup

Creator Studio is a private, Runway-inspired workspace that coordinates five specialist services:

| Tool | Provider | Required deployment variables |
|---|---|---|
| Creative assistant | Anthropic | `ANTHROPIC_API_KEY` |
| Image generation | OpenAI | `OPENAI_API_KEY` |
| Voice generation | ElevenLabs | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |
| Avatar video | HeyGen | `HEYGEN_API_KEY`, `HEYGEN_AVATAR_ID`, `HEYGEN_VOICE_ID` |
| Cinematic video | Runway | `RUNWAY_API_KEY` |

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

## Optional controls

The defaults are listed in `.env.example`:

- `CREATOR_SESSION_TTL_SECONDS=28800` limits a signed Studio session to eight hours. The code caps sessions at 24 hours.
- `CREATOR_STUDIO_RATE_LIMIT=5` limits each generation action per minute for the signed-in GitHub identity.
- `CREATOR_STUDIO_STATUS_RATE_LIMIT=120` permits provider task polling without relaxing generation limits.
- `CONTENT_SAFETY_MODE=enforce` blocks the built-in high-risk content classes before any paid provider call. `audit` and `off` remain explicit operator choices.
- `OPENAI_IMAGE_DEFAULT_QUALITY=low` keeps exploratory image calls less expensive; the UI can request medium or high quality.
- Provider model/version variables can be pinned without changing source code.

Rate limiting is an abuse guard, not a billing budget. Set spending limits and alerts in each provider account as well.

## Provider-specific notes

- An existing provider web subscription does not always include API usage. Confirm that each account has API access and an API balance before testing.
- ElevenLabs requires a reusable voice ID in addition to the API key.
- HeyGen requires an avatar ID and a voice ID. Its API billing can be separate from the HeyGen web-app plan.
- Runway video jobs are asynchronous. Creator Studio polls the task endpoint no more frequently than every five seconds and stops after about ten minutes.
- A Runway first-frame image must use a provider-reachable HTTPS URL. Direct local-file handoff is not part of this first version.

## Security model

- GitHub authorization uses the web application flow with an unguessable state and PKCE S256 challenge. The callback URL comes only from server configuration.
- The app requests no repository scope. It exchanges the temporary code server-side, verifies the current GitHub identity, and does not store the GitHub access token.
- Access is checked against the configured GitHub login and, when configured, the immutable numeric GitHub user ID.
- The browser receives only a signed, short-lived, HTTP-only, Secure, SameSite session cookie. Provider keys and GitHub tokens never enter browser storage.
- Server routes use a constant-time comparison, per-action rate limiting, request-size limits, content safety, fixed upstream hosts, strict input validation, timeouts, no-store responses, and sanitized provider errors.
- Provider-status responses expose only configuration booleans and model labels—not credential values.
- Paid generation mutations reject cross-origin requests. **Sign out** expires the Studio session cookie immediately.
- This is an owner-allowlisted identity gate. Add durable user records, roles, shared rate limiting, audit logs, and provider budgets before opening the deployment to customers or collaborators.
