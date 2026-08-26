# G.FURY Creator Studio v1 — Phase 1 Status

Authoritative reconciliation snapshot for `lalambert1982-eng/Open-Generative-AI`. Deployment evidence was last reconciled on 2026-08-26, including the approved Brain Router, Greg Digital Twin release, and MuAPI Creator Studio Production deployment.

This document distinguishes four independent states:

- **Built**: the source implementation, authenticated server route, and Creator Studio connection exist.
- **Configured**: the required variables exist in the named Vercel environment.
- **Test passed**: a real request reached the external provider and completed successfully.
- **Production ready**: built, configured, real-tested, secure, documented, merged, and deployed.

Configuration is not implementation. A provider with a missing API key remains **Built — configuration required**.

## Brain Router release — Production deployed

PR #6 merged the provider-neutral Selena reasoning boundary and Greg Digital Twin hardening into `main` without recreating the existing agents. Vercel reports Production commit `3d6ea7882e8033b374dd9b9d65a51a2dcc30f1ff` as Ready. The release passed mocked/local and CI verification, but no real external-provider generation was run as part of deployment.

| Brain provider | Code Built | Preview Configured | Production Configured | Test Passed | Production Ready |
|---|---|---|---|---|---|
| Gemini | Built (Production) | Not re-verified | Not re-verified | Mock test passed | No |
| Groq | Built (Production) | Not re-verified | Not re-verified | Mock test passed | No |
| OpenRouter | Built (Production) | Not re-verified | Not re-verified | Mock test passed | No |
| Anthropic | Built (existing + router compatibility) | Not re-verified | Not re-verified | Mock test passed | No |

Initial routing is Gemini → Groq → OpenRouter with at most three attempts. Anthropic remains selectable but is not included in the initial free/developer fallback order. “Free/developer” describes the intended account tier, not a guarantee of zero cost; provider limits and billing still apply.

Provider availability still depends on the exact Preview and Production variables documented in `CREATOR_STUDIO.md`. The deployment did not copy credentials between environments or reveal saved Secret values. No real provider request was made during this release.

## MuAPI media-backbone cutover — Production deployed

The private Creator Studio image and cinematic-video tools now use one server-owned MuAPI adapter. Direct OpenAI image and Runway video implementations remain in source and in the tool registry as deferred compatibility boundaries, but they are absent from the active private dispatch and UI.

The adapter pins server-selected image, text-to-video, and image-to-video models; calls only `https://api.muapi.ai`; authenticates through the existing GitHub owner session; enforces same-origin mutations, content safety, rate limits, strict inputs, timeouts, bounded output handling, and sanitized errors; and never returns the API key. Sandbox is the default. Production mode fails closed unless the separate paid-generation flag is explicitly enabled.

A live `$0` MuAPI Sandbox mock request completed through the existing general Image Studio on 2026-08-26. PR #8 then passed CI, CodeQL, Vercel Preview, 91 security tests, 17 repository tests, Studio compilation, and the optimized Next.js production build. It merged as `3f18f446cb24d88c3b0b1b59ec53d944896d24c8`, Vercel reported the matching Production deployment Ready, and the signed-in private Creator Studio completed Sandbox image task `8c3dc22a-f59a-4c74-abbd-587ad4c84730`. The active MuAPI image/video backbone is therefore Production ready within the explicitly limited `$0` Sandbox scope; paid generation remains disabled and untested.

## Current Git and deployment state

| Item | Verified state |
|---|---|
| Repository | `lalambert1982-eng/Open-Generative-AI` |
| Default branch | `main` |
| Current `main` state | Contains the PR #8 MuAPI media-backbone release |
| `main` branch protection | Not enabled |
| Production implementation commit | `3f18f446cb24d88c3b0b1b59ec53d944896d24c8` |
| Production deployment | Ready (Vercel) |
| Production URL | `https://open-generative-ai-lemon.vercel.app` |
| Release pull request | #8 (merged) |
| Release-candidate commit | `efcee5ff85bb360c870e86be40733ece361e8aa3` |
| Preview deployment | Ready |
| Release Preview URL | `https://open-generative-ai-git-feat-03ac60-lalambert1982-7239s-projects.vercel.app` |

The Production commit contains private YouTube publishing, the Greg Digital Twin adapter, the provider-neutral Brain Router, and the MuAPI Sandbox-first private Creator Studio image/video cutover. Direct OpenAI and Runway implementations are preserved but deferred.

### Merged pull requests

| PR | Capability | Merge commit | State |
|---|---|---|---|
| #1 | Authentication, upload, and content-safety hardening | `f3ac9415f648038cb75182cdf8e01c95c9ee46c1` | Merged |
| #2 | Continuous scanning and reporting policy | `87518818a387ef11d16b2072f468bef4b6f010ea` | Merged |
| #3 | Build workspaces before the production app | `fe20c6607245ab226f4e2b2646080c62bb7a06a3` | Merged |
| #4 | Secure multi-provider Creator Studio | `4853f9e76632ea48f07f805ea1b325762f22906d` | Merged |
| #5 | Secure private YouTube publishing | `b7a1722c43f4d3b85de1929e4202c9fd18085e8b` | Merged |
| #6 | Brain Router and Greg Digital Twin Production release | `3d6ea7882e8033b374dd9b9d65a51a2dcc30f1ff` | Merged |
| #7 | Record Creator Studio Production deployment | `2e6ab01e88f03057cf0a5f01295a4dc0b4d609d2` | Merged |
| #8 | MuAPI private Creator Studio media backbone | `3f18f446cb24d88c3b0b1b59ec53d944896d24c8` | Merged |

Vercel shows the PR #8 Preview and matching `main` Production deployment as Ready. The live owner-authenticated Creator Studio reports `MuAPI · Sandbox · $0 mock data` for both Image and Video.

## Existing capabilities

- GitHub OAuth owner authentication with state, PKCE, a signed short-lived session, immutable user-ID allowlisting, login allowlisting, logout, and same-origin mutation checks.
- Authenticated Creator Studio provider-status reporting that exposes readiness, model labels, and safe provider identity labels without credential values.
- A Production-deployed provider-neutral Brain Router for Gemini, Groq, OpenRouter, and the preserved Anthropic implementation, with normalized requests/results, bounded safe fallback, and fail-closed sensitivity routing.
- Anthropic creative assistant for strategy, planning, prompts, and scripts.
- MuAPI image generation through a server-owned Sandbox-first adapter with a fixed model and normalized immediate/asynchronous results.
- ElevenLabs speech generation using a server-configured reusable voice.
- HeyGen text-to-avatar submission and asynchronous polling with Greg's default Digital Twin identity, portrait `9:16` / `1080p` defaults, normalized responses, stricter validation, safe errors, and a future audio-input boundary.
- MuAPI text-to-video and image-to-video submission with asynchronous polling, fixed server-selected models, and provider-reachable HTTPS first-frame validation.
- Preserved but deferred direct OpenAI image and Runway video adapters.
- Private YouTube OAuth, private Vercel Blob staging, encrypted refresh-token/history storage, short-lived constrained browser upload tokens, duplicate-publish claims, explicit approval, and forced private uploads.
- Per-user/per-action rate limits, body/output limits, fixed provider hosts, request timeouts, no-store responses, content-safety enforcement, and sanitized provider errors.
- Security regression tests, repository tests, GitHub CI definitions, and CodeQL definitions.

### Primary implementation files

| Area | Files |
|---|---|
| GitHub authentication | `src/lib/creatorAuth.js`, `app/api/auth/github/start/route.js`, `app/api/auth/github/callback/route.js`, `app/api/auth/session/route.js`, `app/api/auth/logout/route.js` |
| Provider gateway | `src/lib/creatorProviderGateway.js`, `app/api/creator/[[...path]]/route.js` |
| Brain Router | `src/lib/brainRouter.js` |
| MuAPI media adapter | `src/lib/muapiCreatorProvider.js` |
| HeyGen adapter | `src/lib/heygenProvider.js` |
| Tool registry | `src/lib/creatorToolRegistry.js` |
| YouTube and Blob | `src/lib/youtubePublishing.js`, `app/api/social/youtube/[[...path]]/route.js` |
| Creator Studio UI | `packages/studio/src/components/CreatorStudio.jsx` |
| Safety and rate limits | `src/lib/contentSafety.js`, `src/lib/clientContentSafety.js`, `src/lib/rateLimit.js` |
| Security tests | `tests/security/*.test.js` |

## Provider and environment matrix

`Test pending` means there is no retained evidence of a successful real external-provider completion; it does not mean the adapter is absent or that a provider returned a failure.

| Integration | Code Built | Preview Configured | Production Configured | Real Test Passed | Production Ready |
|---|---|---|---|---|---|
| GitHub Auth | Built | Configured | Configured | Test passed (Preview) | No |
| Anthropic | Built | Missing | Missing | Test pending | No |
| MuAPI Image + Video | Built (Production) | Missing | Configured (Sandbox only) | General + private Production Sandbox passed | Yes — Sandbox scope |
| OpenAI Images (deferred) | Preserved; inactive | Configured | Configured | Not required for active cutover | No |
| ElevenLabs | Built | Missing | Configured | Test pending | No |
| HeyGen | Built | Missing | Missing | Test pending | No |
| Runway (deferred) | Preserved; inactive | Missing | Missing | Not required for active cutover | No |
| YouTube OAuth | Built | Missing | Configured | Test pending | No |
| Vercel Blob | Built | Configured | Configured | Test pending | No |

Preview GitHub variables are restricted to `feature/heygen-digital-twin`. The OAuth app has the stable Preview callback registered without wildcard matching, and an authenticated owner session was completed successfully on 2026-08-24.

### Configuration evidence

Only variable names and configuration state are recorded here. No credential value was read or copied.

#### Production configured

- GitHub Auth: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GITHUB_OAUTH_CALLBACK_URL`, `CREATOR_GITHUB_ALLOWED_LOGINS`, `CREATOR_GITHUB_ALLOWED_USER_IDS`, `CREATOR_SESSION_SECRET`
- MuAPI Sandbox: `MUAPI_API_KEY`, `MUAPI_KEY_MODE`, `MUAPI_ALLOW_PAID_GENERATION`, `MUAPI_IMAGE_MODEL`, `MUAPI_VIDEO_MODEL`, `MUAPI_IMAGE_TO_VIDEO_MODEL`
- OpenAI Images: `OPENAI_API_KEY`
- ElevenLabs: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- YouTube OAuth: `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`, `YOUTUBE_OAUTH_CALLBACK_URL`, `YOUTUBE_TOKEN_ENCRYPTION_KEY`
- Vercel Blob: `BLOB_READ_WRITE_TOKEN` (with a connected Blob store)

#### Production missing

- `ANTHROPIC_API_KEY`
- `HEYGEN_API_KEY`
- `HEYGEN_AVATAR_ID`
- `HEYGEN_VOICE_ID`
- `RUNWAY_API_KEY`

#### Preview configured

- All Preview branches: `BLOB_READ_WRITE_TOKEN`, `OPENAI_API_KEY`
- `feature/heygen-digital-twin` only: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GITHUB_OAUTH_CALLBACK_URL`, `CREATOR_GITHUB_ALLOWED_LOGINS`, `CREATOR_GITHUB_ALLOWED_USER_IDS`, `CREATOR_SESSION_SECRET`
- `feature/heygen-digital-twin` only: `ELEVENLABS_VOICE_ID`
- `feature/heygen-digital-twin` only: `HEYGEN_AVATAR_ID`, `HEYGEN_VOICE_ID`
- `feature/heygen-digital-twin` only: `YOUTUBE_OAUTH_CALLBACK_URL`

#### Preview missing for a full Phase 1 test

- `MUAPI_API_KEY`
- `MUAPI_KEY_MODE`
- `ANTHROPIC_API_KEY`
- `ELEVENLABS_API_KEY`
- `HEYGEN_API_KEY`
- `RUNWAY_API_KEY`
- `YOUTUBE_OAUTH_CLIENT_ID`
- `YOUTUBE_TOKEN_ENCRYPTION_KEY`

The Vercel entries named `ANTHPOC`, `runway`, `Elevenlabs`, `myvocie`, and `openai` do not satisfy the exact server-side names expected by the application. Vercel does not reveal saved Secret values, so API-key values stored under those misspelled names must be re-entered under the correct names. The lowercase `openai` entry is redundant because `OPENAI_API_KEY` is already configured.

## Provider implementation details

### GitHub Auth

- Routes: `GET /api/auth/github/start`, `GET /api/auth/github/callback`, `GET /api/auth/session`, and `POST /api/auth/logout`
- Production OAuth application and required Vercel variables: configured
- Live Production start flow: reached GitHub's authorization screen for G.FURY Creator Studio and used `https://open-generative-ai-lemon.vercel.app/api/auth/github/callback`
- Repository permissions: not requested
- Owner controls: immutable GitHub user-ID allowlist configured; login allowlist also configured in Production
- Signed Production session: HttpOnly, Secure, SameSite=Lax, eight-hour default expiration
- Preview OAuth application, exact callback, owner allowlists, and branch-scoped secrets: configured
- Preview authorization callback and signed-session test: passed for `@lalambert1982-eng` on 2026-08-24
- Production callback/session, expiration, and logout test: pending

### Anthropic

- Compatibility handler/tool: `handleAnthropicAssistant` / `anthropic_assistant`
- Production Creator Studio route: `POST /api/creator/assistant` through the provider-neutral Brain Router
- Default model: `claude-sonnet-5`
- Credential use: server-side `ANTHROPIC_API_KEY` only
- Source/UI: existing implementation preserved; optional brain provider
- Production and Preview: configuration required
- Real request: pending

### OpenAI Images

- Active route: none; the private `POST /api/creator/image` route is assigned to MuAPI
- Default model: `gpt-image-2`
- Default quality: `low`
- Credential use: server-side `OPENAI_API_KEY` only
- Source/tool registry: preserved and marked deferred
- Private Creator Studio UI/dispatch: inactive
- Production and Preview: configured
- Real request: not required for the active MuAPI cutover

### MuAPI Image and Video

- Routes: `POST /api/creator/image`, `POST /api/creator/video`, and `GET /api/creator/muapi/status`
- Default image model: `nano-banana`
- Default text-to-video model: `seedance-lite-t2v`
- Default image-to-video model: `kling-v2.1-master-i2v`
- Credential use: server-side `MUAPI_API_KEY` only
- Cost gate: `MUAPI_KEY_MODE=sandbox`; production mode also requires `MUAPI_ALLOW_PAID_GENERATION=true`
- Source/UI: built, merged, and deployed through PR #8
- General Studio live Sandbox mock: passed at `$0` on 2026-08-26
- Private Creator Studio live Sandbox mock: passed task `8c3dc22a-f59a-4c74-abbd-587ad4c84730` on Production on 2026-08-26
- Paid generation: disabled by `MUAPI_ALLOW_PAID_GENERATION=false`; not tested or approved

### ElevenLabs

- Route: `POST /api/creator/speech`
- Default model: `eleven_multilingual_v2`
- Credential use: server-side `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`
- Source/UI: built
- Production: configured
- Preview: voice ID configured; `ELEVENLABS_API_KEY` still required
- Real speech generation: pending

The existing production voice ID was not revealed or overwritten during this audit.

### HeyGen

- Routes: `POST /api/creator/heygen`, `GET /api/creator/heygen/status`
- Default engine label: `Avatar IV`
- Credential use: server-side `HEYGEN_API_KEY`, `HEYGEN_AVATAR_ID`, and `HEYGEN_VOICE_ID`
- Asynchronous job polling: built
- Source/UI: built
- Greg Digital Twin hardening: complete and deployed to Production through PR #6
- Preview: approved avatar and voice IDs configured; `HEYGEN_API_KEY` still required
- Production: configuration required
- Real avatar generation: pending

### Runway

- Active routes: none; the private `POST /api/creator/video` and MuAPI status routes replace the old dispatch
- Default model: `gen4.5`
- API version: `2024-11-06`
- First-frame rule: optional provider-reachable HTTPS URL; local file paths are rejected
- Credential use: server-side `RUNWAY_API_KEY` only
- Source/tool registry and polling: preserved and marked deferred
- Private Creator Studio UI/dispatch: inactive
- Production and Preview: configuration required
- Real video generation: not required for the active MuAPI cutover

### YouTube and Vercel Blob

- OAuth scope: `https://www.googleapis.com/auth/youtube.upload`
- OAuth state/PKCE and identity binding: built
- Refresh-token/history encryption: AES-256-GCM before private Blob storage
- Staging: private Blob with authenticated user-bound path, type, size, age, and signature checks
- Publish approval: explicit `approved === true` required
- Visibility: forced `private`; subscriber notification disabled
- Connect/status/stage/publish/disconnect routes: built
- Production variables and Blob store: configured
- Private store existence and private-Blob mode: verified in Vercel
- Exact live Google redirect registration: not independently visible because Google Cloud Console was unavailable to the audit browser
- Real connect/disconnect and private upload: pending

## Known safe production identifiers

These identifiers are safe configuration metadata, not credentials. They are the approved application defaults; saved Vercel Secret values were not exposed or copied during deployment, and exact Production environment presence still requires a settings-level recheck.

| Identifier | Value |
|---|---|
| Greg Digital Twin look ID | `cae16de37d204cdc98a8c36dd859cd46` |
| Greg HeyGen voice ID | `aecf8d74f6b8467b84d24e9dc541b19a` |
| Greg Avatar Group ID (reference only) | `e998e58ee3094ecbb1787d478b6fa082` |

The Avatar Group ID must never replace `HEYGEN_AVATAR_ID`; HeyGen video generation requires the Digital Twin look ID.

## Phase 1 tool registry

The Production release exposes the existing implementations through one metadata registry without duplicating provider logic:

| Tool ID | Existing implementation |
|---|---|
| `brain_reasoning` | Provider-neutral Gemini/Groq/OpenRouter/Anthropic reasoning boundary |
| `anthropic_assistant` | Anthropic assistant handler |
| `muapi_image` | Active MuAPI image job adapter and poller |
| `muapi_video` | Active MuAPI text/image-to-video job adapter and poller |
| `openai_image` | Preserved, deferred OpenAI image handler |
| `elevenlabs_voice` | ElevenLabs speech handler |
| `heygen_avatar_video` | HeyGen job adapter and poller |
| `runway_video` | Preserved, deferred Runway job handler and poller |
| `youtube_publish` | Authenticated private YouTube publisher |

The Brain Router is a reusable reasoning boundary for the existing agents. It does not add Phase 2 company memory, project memory, workflow state, approval queues, autonomous tool execution, or Selena-specific business logic.

## Security posture

- Provider and OAuth credentials remain in server-only environment variables; no provider secret is placed in `NEXT_PUBLIC_*` state or browser storage.
- Production Creator Studio uses a `__Host-creator_session` HttpOnly, Secure, SameSite=Lax cookie.
- The default session lifetime is eight hours and is capped at 24 hours.
- Paid mutations, logout, YouTube connect, Blob staging, and publishing enforce authenticated identity and same-origin restrictions.
- The owner gate supports immutable GitHub user IDs and optional matching logins; when both are configured, both must match.
- Content safety defaults to `enforce`. `audit` and `off` require an explicit operator configuration and are not the default.
- Provider requests have fixed destinations, strict inputs, timeouts, size caps, sanitized errors, and per-user/per-action rate limits.
- MuAPI paid generation fails closed: Sandbox is the default, and a production key also requires an explicit paid-generation enable flag.
- YouTube refresh tokens and history remain encrypted; browser responses do not include provider keys, GitHub tokens, Google access tokens, or Google refresh tokens.
- YouTube publication cannot become public automatically.

## Verification results

| Verification | Result |
|---|---|
| Security/auth/brain/provider/YouTube tests | 91 passed, 0 failed |
| Existing repository tests | 17 passed, 0 failed |
| Total automated tests | 108 passed, 0 failed |
| Workflow Builder compilation | 22 files compiled |
| AI Agent compilation | 11 files compiled |
| Design Agent compilation | 4 files compiled |
| Studio compilation | 26 files compiled |
| Next.js production build | Passed |
| MuAPI release-candidate strong-secret scan | 0 matches |
| GitHub CI | Passed |
| GitHub CodeQL | Passed |
| Vercel Preview | Ready |
| Vercel Production commit `3f18f44` | Ready |
| Private Creator Studio MuAPI Sandbox task | Completed at `$0` |
| Tracked non-example `.env` files | 0 |

The generic credential-assignment scan matched only synthetic test fixtures in `tests/security`; it found no deployment credential file or production credential value. The build emitted an existing outdated Browserslist database warning, which is non-blocking.

The PR #6 release candidate passed GitHub CI, CodeQL, Vercel Preview, 99 local tests, and the local production build before merge. The MuAPI PR #8 release separately passed 108 local tests, the production build, CI, CodeQL, and Vercel Preview. Vercel reported merge commit `3f18f446cb24d88c3b0b1b59ec53d944896d24c8` Ready in Production before the authenticated `$0` Sandbox completion test.

## Remaining real tests

1. Complete Production GitHub authorization, callback, signed-session, session-expiry, and logout testing with the allowlisted account.
2. Generate one short Anthropic concept/script after adding its key.
3. Generate one short ElevenLabs clip with the configured canonical Greg/G.FURY voice.
4. Generate one short Greg HeyGen Digital Twin video and poll it to completion after all three HeyGen variables are present in the test environment.
5. Keep paid MuAPI generation disabled until a separate budget, credits, and artifact-specific approval are recorded; no paid video test is required for this Sandbox cutover.
6. Complete YouTube connect, private Blob staging, explicit approval, PRIVATE upload, history, and disconnect/revoke testing.
7. Confirm the exact Production YouTube callback in both Vercel and the Google OAuth web client during the connect test.

Use the shortest, lowest-cost safe artifacts possible. Do not make a YouTube test video public.

## Genuine remaining blockers

1. Preview does not contain the server-owned MuAPI configuration; the verified deployment scope is Production Sandbox only.
2. The Production YouTube OAuth/Blob flow has not completed a real PRIVATE upload, and the exact Google redirect registration was not independently visible during this audit.
3. The `main` branch is not protected, so merge review and CI are not enforced by a branch rule.
4. Provider API credits/quota must be sufficient for the remaining non-MuAPI live tests; the active MuAPI cutover remains in `$0` Sandbox mode.

## Manual actions still required

1. Re-verify every remaining non-MuAPI Preview and Production variable under its exact application name. Do not delete a misspelled Secret entry until its correctly named replacement has been verified.
2. In the Google OAuth web client, confirm the Preview and Production redirects exactly match the URLs documented above and that the publishing account is allowed while the app is in testing mode.
3. Complete the minimal real-test sequence above and record successful job/video IDs without recording credentials.
4. Add a GitHub branch ruleset for `main` that requires pull requests and passing CI/security checks before merge.

## Phase 1 completion criteria

Phase 1 can be frozen as **G.FURY Creator Studio v1** only after all of the following are true:

- The release changes remain merged to `main` and the matching Production commit remains Ready.
- Required Production variables are configured without exposing their values.
- GitHub owner authentication completes successfully in Production.
- MuAPI completes the approved `$0` private Creator Studio Sandbox test; Anthropic, ElevenLabs, and HeyGen each complete any separately agreed minimal real test. Deferred OpenAI/Runway adapters are not Phase 1 active-path requirements.
- YouTube connects, stages privately, uploads one approved test video as PRIVATE, records safe history, and disconnects/revokes correctly.
- Security tests, provider tests, authentication tests, YouTube tests, committed-secret scan, CI/CodeQL, and the production build pass on the merge candidate.
- A `main` branch rule requires pull-request review and the passing CI/security checks.
- This document is updated with the deployed commit and real-test evidence.

## Determination

**PHASE 1 NOT COMPLETE**
