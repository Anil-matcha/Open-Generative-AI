# Creator Studio provider setup

The authoritative Phase 1 reconciliation and production-readiness snapshot is [`PHASE_1_STATUS.md`](./PHASE_1_STATUS.md).

Creator Studio is a private, Runway-inspired workspace with one provider-neutral reasoning boundary and five production tools. Reasoning providers are brains used by Selena and the existing agents; they are not new agents and they do not execute media or publishing actions.

### Brain providers

| Role | Provider | Required server variable | Model configuration |
|---|---|---|---|
| Primary | Google Gemini | `GEMINI_API_KEY` | `GEMINI_MODEL` |
| Secondary fallback | Groq | `GROQ_API_KEY` | `GROQ_MODEL` |
| Tertiary development fallback | OpenRouter | `OPENROUTER_API_KEY` | `OPENROUTER_MODEL` |
| Optional premium / legacy assistant | Anthropic | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` |

### Generation and publishing providers

| Tool | Active provider | Required deployment variables |
|---|---|---|
| Image generation | MuAPI | `MUAPI_API_KEY`, `MUAPI_KEY_MODE` |
| Voice generation | ElevenLabs | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |
| Avatar video | HeyGen | `HEYGEN_API_KEY`, `HEYGEN_AVATAR_ID`, `HEYGEN_VOICE_ID` |
| Cinematic video | MuAPI | `MUAPI_API_KEY`, `MUAPI_KEY_MODE` |
| Manual private publishing | YouTube + Vercel Blob | `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`, `YOUTUBE_OAUTH_CALLBACK_URL`, `YOUTUBE_TOKEN_ENCRYPTION_KEY`, `BLOB_READ_WRITE_TOKEN` |

The direct OpenAI image and Runway video adapters remain in the repository as deferred compatibility boundaries. They are not reachable from the active private Creator Studio dispatch or UI.

All provider credentials are read only by the Next.js server. They are never sent to the browser, returned by the provider-status endpoint, or committed to the repository.

## Selena Brain Router

The server-only router in `src/lib/brainRouter.js` gives the existing Creator Studio assistant and future existing-agent callers one normalized interface:

```text
Selena / existing agent
  -> Brain Router
  -> Gemini | Groq | OpenRouter | Anthropic
  -> normalized reasoning result
  -> existing agent or approved tool workflow
```

The internal request supports `task`, `instructions`, `context`, `mode`, `tools`, `sensitivity`, and `desiredOutput`. The normalized result contains `provider`, `model`, `text`, `structuredOutput`, `toolCalls`, `usage`, and `finishReason`. Provider-specific response shapes stay inside the adapters. A returned tool call is only a recommendation/request; the router never executes a media generation, purchase, deployment, or publication.

The initial order is `gemini,groq,openrouter`. Anthropic remains fully supported through the existing `anthropic_assistant` compatibility boundary and can be selected with `BRAIN_PROVIDER=anthropic` or added later to `BRAIN_FALLBACK_ORDER`. It is intentionally absent from the initial fallback list.

Automatic fallback is bounded by `BRAIN_MAX_ATTEMPTS`. It is allowed for timeouts, transient provider failures, rate/quota limits, malformed provider responses, and explicitly unsupported capabilities. It is not allowed for safety rejection, invalid input, invalid/missing credentials, or requests marked as publishing, paid generation, another external mutation, or requiring explicit approval.

`PUBLIC` and `NORMAL` work may use the configured order. `PRIVATE` and `CLIENT_CONFIDENTIAL` work fail closed unless an operator explicitly reviews current provider/deployment terms and lists eligible providers in `BRAIN_PRIVATE_ELIGIBLE_PROVIDERS` or `BRAIN_CLIENT_CONFIDENTIAL_ELIGIBLE_PROVIDERS`. The repository does not claim that any provider is inherently suitable for confidential data.

The requested model identifiers were verified against current official documentation on 2026-08-25: Google documents [`gemini-3.7-flash`](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash), Groq lists [`openai/gpt-oss-120b`](https://console.groq.com/docs/models), and OpenRouter documents its [`openrouter/free`](https://openrouter.ai/docs/guides/routing/routers/free-router) router. Model IDs remain environment-configurable. “Free brain” means use of an available free/developer allowance; it is not a promise of perpetual zero-cost service, and each provider's current account tier, limits, and pricing still apply.

### Preview brain configuration

Add these three values as **Secret/Sensitive** variables in Vercel Preview. Each key comes from its own provider and must not be reused:

```dotenv
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
```

Add these seven values as normal non-secret Preview configuration:

```dotenv
BRAIN_PROVIDER=gemini
GEMINI_MODEL=gemini-3.7-flash
GROQ_MODEL=openai/gpt-oss-120b
OPENROUTER_MODEL=openrouter/free
BRAIN_FALLBACK_ORDER=gemini,groq,openrouter
BRAIN_ENABLE_AUTOMATIC_FALLBACK=true
BRAIN_MAX_ATTEMPTS=3
```

Do not copy the three Preview API-key values into Production automatically. After mocked/local validation and an explicitly approved Preview test, Production needs the same variable **names** in its own environment: `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `BRAIN_PROVIDER`, `GEMINI_MODEL`, `GROQ_MODEL`, `OPENROUTER_MODEL`, `BRAIN_FALLBACK_ORDER`, `BRAIN_ENABLE_AUTOMATIC_FALLBACK`, and `BRAIN_MAX_ATTEMPTS`. Production configuration and deployment require separate approval.

## Configure Greg's HeyGen Digital Twin

Add these server-only variables to Vercel for every environment where HeyGen should be available:

```dotenv
HEYGEN_API_KEY=<add securely in Vercel; never commit this value>
HEYGEN_AVATAR_ID=cae16de37d204cdc98a8c36dd859cd46
HEYGEN_VOICE_ID=aecf8d74f6b8467b84d24e9dc541b19a
```

`HEYGEN_AVATAR_ID` is Greg's **Digital Twin look ID**. Do not replace it with the avatar group ID `e998e58ee3094ecbb1787d478b6fa082`; groups contain looks, while video generation requires the selected look ID. The voice ID is Greg's completed default HeyGen voice.

Creator Studio submits text-to-avatar jobs to HeyGen asynchronously and polls the fixed HeyGen video-status endpoint. The default canvas is portrait `9:16` at `1080p`, with social captions enabled in the UI. The authenticated browser receives only a normalized job ID, status, HTTPS video and thumbnail URLs, duration, and sanitized error information.

The reusable server-side tool registry exposes provider-neutral reasoning as `brain_reasoning`, active `muapi_image` and `muapi_video` boundaries, and the existing `elevenlabs_voice`, `heygen_avatar_video`, and `youtube_publish` boundaries. The preserved `anthropic_assistant`, `openai_image`, and `runway_video` definitions remain available as compatibility metadata; OpenAI and Runway are explicitly marked deferred. These definitions do not recreate agents or duplicate generation-provider adapters.

The `heygen_avatar_video` boundary resolves the default avatar and voice from `HEYGEN_AVATAR_ID` and `HEYGEN_VOICE_ID`, never from browser input or a client-readable environment variable. It accepts validated optional avatar/voice overrides, background configuration, captions, and supported motion settings. The payload builder already separates script input from media input so a later `ElevenLabs → audio URL/asset → HeyGen lip-sync` path can be added without replacing the current HeyGen voice workflow.

If any required HeyGen variable is missing, the provider status is **Setup Required** and the generation route returns a safe configuration error instead of calling HeyGen or crashing.

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
- `BRAIN_PROVIDER=gemini` selects the default reasoning provider without changing any agent.
- `BRAIN_FALLBACK_ORDER=gemini,groq,openrouter` and `BRAIN_MAX_ATTEMPTS=3` bound the initial free/developer routing path.
- `BRAIN_ENABLE_AUTOMATIC_FALLBACK=true` enables only the safe fallback cases described above.
- `BRAIN_PRIVATE_ELIGIBLE_PROVIDERS` and `BRAIN_CLIENT_CONFIDENTIAL_ELIGIBLE_PROVIDERS` are empty by default so sensitive work fails closed.
- `CONTENT_SAFETY_MODE=enforce` blocks the built-in high-risk content classes before any paid provider call. `audit` and `off` remain explicit operator choices.
- `MUAPI_KEY_MODE=sandbox` keeps the private Creator Studio on MuAPI's zero-cost mock path.
- `MUAPI_ALLOW_PAID_GENERATION=false` is the fail-closed default. A production-mode key is rejected unless this variable is deliberately changed to `true`.
- `MUAPI_IMAGE_MODEL`, `MUAPI_VIDEO_MODEL`, and `MUAPI_IMAGE_TO_VIDEO_MODEL` pin server-selected models; browser input cannot override them.
- `OPENAI_IMAGE_DEFAULT_QUALITY=low` remains available only to the deferred direct OpenAI adapter.
- `YOUTUBE_UPLOAD_MAX_BYTES=524288000` caps each private staged video at 500 MiB by default.
- `YOUTUBE_UPLOAD_TIMEOUT_MS=285000` gives the server 285 seconds to stream the staged file to YouTube while preserving a small margin inside the route's 300-second Hobby limit.
- Provider model/version variables can be pinned without changing source code.

Rate limiting is an abuse guard, not a billing budget. Set spending limits and alerts in each provider account as well.

## Provider-specific notes

- An existing provider web subscription does not always include API usage. Confirm that each account has API access and an API balance before testing.
- ElevenLabs requires a reusable voice ID in addition to the API key.
- HeyGen requires the API key, Greg Digital Twin look ID, and Greg voice ID shown above. Its API billing can be separate from the HeyGen web-app plan.
- HeyGen generation is asynchronous. Creator Studio polls no more frequently than every five seconds and stops after about ten minutes, while retaining the job ID for provider-side follow-up.
- MuAPI image and video jobs may complete immediately or asynchronously. Creator Studio polls the fixed prediction-result endpoint no more frequently than every five seconds and stops after about ten minutes.
- A MuAPI video first-frame image must use a provider-reachable HTTPS URL. Direct local-file handoff is not part of this first version.
- Direct OpenAI and Runway adapters are preserved but deferred; active image and cinematic-video actions do not call them.
- YouTube publishing requires a private Vercel Blob store and a Google OAuth web client. A normal YouTube Premium or Google subscription does not replace YouTube Data API OAuth.

## MuAPI media backbone and generation-cost controls

The authenticated private Creator Studio uses a server-owned MuAPI credential for both image and cinematic-video generation:

```dotenv
MUAPI_API_KEY=<add securely in Vercel; never commit this value>
MUAPI_KEY_MODE=sandbox
MUAPI_ALLOW_PAID_GENERATION=false
MUAPI_IMAGE_MODEL=nano-banana
MUAPI_VIDEO_MODEL=seedance-lite-t2v
MUAPI_IMAGE_TO_VIDEO_MODEL=kling-v2.1-master-i2v
```

Active routes are `POST /api/creator/image`, `POST /api/creator/video`, and `GET /api/creator/muapi/status`. The browser sends prompts and supported rendering options only. The server selects the model, attaches `x-api-key` only to the fixed `https://api.muapi.ai` host, normalizes job responses, validates HTTPS outputs, and returns no credential value. All routes retain the Creator Studio GitHub identity gate, same-origin mutation checks, content safety, request limits, timeouts, rate limits, and sanitized errors.

Sandbox mode is deliberately fail closed. `MUAPI_KEY_MODE=sandbox` enables MuAPI's `$0` mock-data path. Changing the mode to `production` does not enable paid calls by itself: `MUAPI_ALLOW_PAID_GENERATION=true` must also be set explicitly. The Brain Router never changes either value and cannot initiate a generation.

The existing general Image Studio and Workflow Builder keep their secured per-tab bring-your-own-key proxy. That browser-scoped flow is separate from the private Creator Studio server-owned credential. Workflow Builder continues to display MuAPI's live cost estimate where supported and still requires an explicit user click.

A live MuAPI Sandbox mock request completed through the existing general Studio on 2026-08-26 with a `$0` balance. The private Creator Studio adapter passed mocked security and regression tests and the production build; its live server-owned Sandbox verification is performed only after the release is configured and deployed.

Project revenue/margin budgets, persisted amount-spent ledgers, DRAFT/STANDARD/PREMIUM policy, and configurable warning/strong-approval thresholds remain future controls. Until they are implemented, keep Sandbox mode enabled, require explicit user action, and retain provider-account spending limits before any separately approved paid rollout.

## Security model

- GitHub authorization uses the web application flow with an unguessable state and PKCE S256 challenge. The callback URL comes only from server configuration.
- The app requests no repository scope. It exchanges the temporary code server-side, verifies the current GitHub identity, and does not store the GitHub access token.
- Access is checked against the configured GitHub login and, when configured, the immutable numeric GitHub user ID.
- The browser receives only a signed, short-lived, HTTP-only, Secure, SameSite session cookie. Provider keys and GitHub tokens never enter browser storage.
- Server routes use a constant-time comparison, per-action rate limiting, request-size limits, content safety, fixed upstream hosts, strict input validation, timeouts, no-store responses, and sanitized provider errors.
- Provider-status responses expose only configuration booleans, readiness labels, model labels, and the safe identity labels `Greg` / `Digital Twin`—not credential values or provider asset IDs.
- The YouTube flow binds OAuth state and PKCE to the signed GitHub identity, encrypts the refresh token at rest, validates private staging paths, MIME types, sizes, age, and file signatures, and accepts only Google's fixed token/revocation/upload hosts.
- Paid generation mutations reject cross-origin requests. **Sign out** expires the Studio session cookie immediately.
- This is an owner-allowlisted identity gate. Add durable user records, roles, shared rate limiting, audit logs, and provider budgets before opening the deployment to customers or collaborators.
