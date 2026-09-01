# Security configuration

## Authentication

The web app uses bring-your-own-key authentication. Browser requests send the key only in an `x-api-key` or `Authorization: Bearer` header to same-origin `/api/` routes. The legacy `muapi_key` cookie is deleted during migration and is not accepted by server routes.

The Next.js web shell stores MuAPI bring-your-own keys in per-tab session storage and migrates/removes its legacy persistent local-storage value. Preventing script injection remains important because any script running in the page can access session storage. The Design Agent's pinned compatibility `token` entry exists only while that studio is mounted and is removed on logout, tab change, or unmount. The Electron app retains its existing local desktop storage until an operating-system credential-vault migration is designed.

Creator Studio does not use that browser-readable key flow. It uses GitHub OAuth with state and PKCE, verifies an owner allowlist, then issues a signed, short-lived, HTTP-only session cookie. This is an identity-session cookie—not an API-key cookie. GitHub access tokens and provider credentials are never stored in browser storage or returned to the client.

Durable Creator Projects use the existing private Vercel Blob store. The server derives an HMAC owner namespace from the authenticated immutable GitHub user ID and never accepts an owner ID from the browser. Project and Asset routes apply the existing Creator authentication, same-origin mutation checks, content safety, request limits, and per-owner rate limits. Client uploads receive short-lived tokens only after the server verifies Project ownership and an exact Project pathname prefix. Asset deletion requires explicit approval and can remove only an exact storage path recorded inside that owned Project.

## Creator Studio provider gateway

The Gemini, Groq, OpenRouter, Anthropic, MuAPI, ElevenLabs, and HeyGen integrations used by Creator Studio are server-side only. Configure their credentials as deployment environment variables. The preserved direct OpenAI and Runway adapters are deferred and are not reachable through the active private Creator Studio dispatch or UI. Protect `/api/creator/*` with a separate GitHub OAuth application, `CREATOR_SESSION_SECRET`, and the `CREATOR_GITHUB_ALLOWED_USER_IDS` and/or `CREATOR_GITHUB_ALLOWED_LOGINS` allowlist.

The Selena Brain Router separates reasoning from generation. `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, and `ANTHROPIC_API_KEY` are read only inside the server adapters and are never placed in `NEXT_PUBLIC_*`, browser storage, URLs, response bodies, or provider-status payloads. API keys are sent only as authorization headers to fixed official provider hosts. Model names and routing order are normal configuration values, not credentials.

Fallback is bounded and is allowed only for transient availability/capacity failures, provider timeouts, malformed responses, or unsupported required capabilities. Invalid input, missing/invalid credentials, and safety rejection stop immediately. Requests classified as paid generation, publishing, another external mutation, or requiring explicit approval also disable fallback. The router returns tool calls but does not execute them, preventing a reasoning retry from duplicating an external side effect.

Private Creator Studio image and cinematic-video requests use `MUAPI_API_KEY` only on the server and only against the fixed `https://api.muapi.ai` host. `MUAPI_KEY_MODE=sandbox` is the zero-cost mock path. Production mode fails closed unless `MUAPI_ALLOW_PAID_GENERATION=true` is also explicitly configured. Model identifiers come from server configuration (`MUAPI_IMAGE_MODEL`, `MUAPI_VIDEO_MODEL`, and `MUAPI_IMAGE_TO_VIDEO_MODEL`); client input cannot select an arbitrary model or upstream host. The general Image Studio and Workflow Builder retain their separate per-tab bring-your-own-key proxy.

The CreativeCanvas path inside authenticated Creator Studio no longer writes a MuAPI credential to `localStorage.token`. Its compatibility requests use a Creator-authenticated server adapter that injects the active safe MuAPI credential only after authentication, same-origin/rate-limit checks, and the existing MuAPI mode gate. Standalone Agent and older Studio paths still contain isolated BYOK client code and remain on the incremental migration roadmap.

`PRIVATE` and `CLIENT_CONFIDENTIAL` requests fail closed unless the operator explicitly configures reviewed eligible providers. Empty eligibility lists make no privacy claim and send the material nowhere. Eligibility must be revisited when provider terms, account controls, or deployment policy change.

The YouTube integration reuses that signed Creator Studio identity gate and adds a separate Google OAuth state/PKCE exchange. It requests only `youtube.upload`, encrypts long-lived refresh tokens and upload history with AES-256-GCM in private Vercel Blob, and never returns Google credentials to the browser. Browser staging tokens are short-lived and restricted to the signed-in user's private pathname, allowed video MIME types, and configured size limit. Publication requires an explicit approval flag and forces `privacyStatus=private` with subscriber notifications disabled. Disconnect revokes the Google token before deleting the encrypted local record.

Instagram and TikTok use the fixed MuAPI Social REST endpoints behind `/api/social/muapi/*`. The browser never receives the MuAPI credential or platform OAuth tokens. Creator Studio sends MuAPI an HMAC-derived opaque owner identifier rather than the GitHub user ID, validates account ownership and platform before publishing, restricts media to configured public HTTPS hosts, applies content safety and per-action limits, and sanitizes provider failures. Publishing fails closed unless `MUAPI_ALLOW_SOCIAL_PUBLISHING=true` and the request contains explicit review approval. TikTok is forced to `SELF_ONLY` until the operator separately confirms platform approval with `MUAPI_TIKTOK_PUBLIC_PUBLISHING_APPROVED=true`.

Creator routes validate the signed session, reject cross-origin paid mutations, apply per-identity action limits, and use fixed upstream hosts, input and output-size limits, provider timeouts, strict ID/URL validation, sanitized error responses, and the content-safety policy below. The provider-status response exposes configuration booleans, readiness/model labels, and safe display identity metadata only. It does not expose API keys, provider asset IDs, or environment values. The default limiter is a per-process backstop; use an external shared limiter before scaling to multiple application instances.

The current allowlist is appropriate for a private owner deployment. It is not a substitute for durable user records, roles, quotas, audit logs, or centralized session revocation in a public or multi-user product. See [Creator Studio provider setup](CREATOR_STUDIO.md) for the complete variable list.

## Upload proxy

Set `UPLOAD_PROXY_TICKET_SECRET` to at least 32 random characters in every deployed environment. Upload signing responses are encrypted into five-minute tickets bound to a hash of the requesting API key. The browser receives the object key but not the storage hostname, policy, signature, or other signing fields.

Successful tickets are marked used to prevent replay in the same server process. Multi-instance deployments that require globally single-use tickets should back this reservation with a shared store; the encrypted ticket remains short-lived, API-key-bound, and restricted to its signed object key in every deployment.

Uploads use an allowlist of media and text formats, validate the filename extension, MIME type, and leading file signature, and default to 50 MiB. The storage request refuses redirects and times out after 30 seconds. Custom storage hostnames must be listed exactly in `UPLOAD_PROXY_ALLOWED_HOSTS`.

The legacy `/api/v1/upload_file` path is also intercepted and subjected to the same file allowlist, signature, size, authentication, timeout, redirect, and rate-limit checks. Electron validates files before its direct upstream upload as an additional client-side boundary.

The built-in rate limiter is a per-process backstop. Multi-instance deployments should also enforce upload rate limits at the CDN, load balancer, or platform firewall.

## Content safety

`CONTENT_SAFETY_MODE` defaults to `enforce`. It can be set to `audit` to report policy matches without blocking or `off` only as an explicit operator decision. Built-in rules block sexual content involving minors and non-consensual sexual content. `CONTENT_SAFETY_BLOCKED_TERMS` adds operator-defined comma-separated terms.

Electron/Vite builds apply the same policy before direct generation requests. Their compile-time settings are `VITE_CONTENT_SAFETY_MODE` and `VITE_CONTENT_SAFETY_BLOCKED_TERMS`; enforcement is still the default when those values are absent.

The local rules are a minimum policy boundary, not a complete moderation system. Production deployments that accept untrusted public prompts should add a dedicated moderation service before the MuAPI proxy.
