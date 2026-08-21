# Security configuration

## Authentication

The web app uses bring-your-own-key authentication. Browser requests send the key only in an `x-api-key` or `Authorization: Bearer` header to same-origin `/api/` routes. The legacy `muapi_key` cookie is deleted during migration and is not accepted by server routes.

The Next.js web shell stores API keys in per-tab session storage and migrates/removes its legacy persistent local-storage value. Preventing script injection remains important because any script running in the page can access session storage. The Design Agent's pinned compatibility `token` entry exists only while that studio is mounted and is removed on logout, tab change, or unmount. The Electron app retains its existing local desktop storage until an operating-system credential-vault migration is designed.

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
