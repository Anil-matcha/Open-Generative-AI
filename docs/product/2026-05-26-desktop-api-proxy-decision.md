# Desktop API Proxy Transport Decision

Date: 2026-05-26
Task: DSK-30
Status: Accepted

## 1. Decision

Use a local loopback HTTP server as the desktop API proxy transport.

The Electron main process will start a proxy server bound to `127.0.0.1` on a random available port. The preload layer will expose the proxy origin to the renderer and install a narrow compatibility shim that rewrites same-origin `/api/**` browser requests to that loopback origin.

In short:

```text
Shared Studio fetch('/api/...') or XHR('/api/...')
  -> desktop renderer compatibility shim
  -> http://127.0.0.1:<random-port>/api/...
  -> Electron main local proxy
  -> upstream provider or local adapter
```

The transport is the local HTTP server. The renderer fetch/XHR rewrite is only a compatibility layer so shared Web clients do not need to learn Electron IPC for every API route.

## 2. Why This Is The Best Fit

| Criterion | Local HTTP server plus path rewrite | IPC-only bridge | Fetch interception without server |
|---|---|---|---|
| Reuse `packages/studio` relative `/api/**` clients | Strong | Weak | Medium |
| Handles `fetch`, `XMLHttpRequest`, `FormData`, binary upload | Strong | Medium | Weak |
| Reuses Next API route behavior with minimal product changes | Strong | Medium | Weak |
| Keeps renderer free of provider secret handling | Strong | Strong | Weak |
| Packaging predictability | Strong | Medium | Medium |
| Implementation complexity | Medium | High | Medium |
| Security hardening surface | Clear and testable | Clear but broad API surface | Harder to reason about |

## 3. Rejected Alternatives

### IPC-only bridge

IPC is a good fit for desktop-only capabilities such as sd.cpp and Wan2GP, and the project already uses it through `window.localAI`. It is not the right primary transport for Web parity routes because the shared Studio package already calls browser APIs with relative `/api/**` URLs. Moving all provider, workflow, agent, app, upload, and polling flows to IPC would require changing every client call site and would make binary upload and response streaming more awkward.

### Fetch interception only

A renderer-only fetch wrapper is not enough. `packages/studio/src/muapi.js` also uses `XMLHttpRequest` for `/api/provider/upload`, and server-side provider adapters need a trusted place to normalize headers, redact credentials, apply timeouts, and transform upstream responses. Fetch interception can remain as a path rewrite, but it should not contain provider logic.

### Bundled Next server inside Electron

Running the Next app inside Electron would reduce route duplication but adds packaging weight, port management complexity, and production behavior drift between desktop and Web. The desktop renderer should stay a Vite/Electron app that consumes shared Studio UI and a small local API proxy.

## 4. Target Components

| Component | Responsibility |
|---|---|
| `electron/lib/desktopApiProxy.js` | Start/stop local HTTP server, route `/api/**`, normalize requests, forward upstream calls, redact logs. |
| `electron/main.js` | Start proxy before `BrowserWindow.loadFile`, pass proxy config to preload, stop proxy on app quit. |
| `electron/preload.js` | Expose `window.desktopAPI.getProxyConfig()` and install the `/api/**` fetch/XHR rewrite with an auth token header. |
| `src/desktop/main.js` | Read the exposed proxy base for runtime status and future shared Studio bootstrapping. |
| `packages/studio/src/*` | Keep using relative `/api/**` paths. Avoid Electron-specific imports in shared UI. |

## 5. Required Route Coverage

| Route family | Desktop proxy owner task | Behavior |
|---|---|---|
| `/api/api/v1/*` | DSK-31 | Image/video submit, poll, balance, upload-file and provider-specific normalization. |
| `/api/provider/v1/*` | DSK-32 | OpenAI-compatible provider requests, image edits, Ark image adapter. |
| `/api/provider/upload` | DSK-33 | HFSY temporary image upload with content validation and normalized errors. |
| `/api/provider/status` | DSK-34 | Provider/model readiness for API Health Studio. |
| `/api/workflow/*` | DSK-35 | Workflow list, definitions, execution, run status and node APIs. |
| `/api/agents/*` | DSK-35 | Agent list, templates, conversations, chat and mutation routes. |
| `/api/app/*` | DSK-35 | App center interest and upload-url alias behavior. |
| `/api/yunwu/v1/*` | DSK-32 | Yunwu/OpenAI-compatible provider compatibility route. |

## 6. Security Requirements

1. Bind only to `127.0.0.1`.
2. Use a random available port per app session.
3. Generate a high-entropy per-session token in the main process.
4. Require `x-mozenaigc-desktop-token` on every non-OPTIONS proxy request.
5. Allow CORS only for Electron file/null origin and local development origins.
6. Never log API keys, bearer tokens, cookies, request bodies, or upload payloads.
7. Replace current key-prefix logs with request IDs and provider IDs only.
8. Strip browser cookies before forwarding upstream unless a route explicitly owns them.
9. Accept only `http:` and `https:` upstream provider base URLs.
10. Apply request timeouts, response size limits where practical, and clear normalized errors.

## 7. Implementation Shape

The proxy should be implemented with Node core `http` APIs first to avoid adding a runtime dependency. If the route surface becomes too noisy, a later task may introduce a small router helper, but DSK-31 should begin with a dependency-free server.

Suggested server lifecycle:

```text
app.whenReady()
  -> startDesktopApiProxy()
  -> createWindow(proxyConfig)
  -> registerLocalInference()
  -> registerWan2gp()

app.before-quit/window-all-closed
  -> stopDesktopApiProxy()
```

Suggested renderer compatibility:

```text
if request URL starts with /api/
  rewrite to proxyOrigin + originalPathAndSearch
  add x-mozenaigc-desktop-token
else
  leave request untouched
```

This shim must cover both `window.fetch` and `XMLHttpRequest.prototype.open/send` because shared Studio code uses both.

## 8. Acceptance Criteria For Follow-Up Tasks

| Task | Acceptance |
|---|---|
| DSK-31 | `GET /api/api/v1/account/balance` reaches the desktop proxy and returns a normalized response or a missing-key error without renderer crash. |
| DSK-32 | `POST /api/provider/v1/images/generations` reaches the desktop proxy with provider headers and no credential leakage in logs. |
| DSK-33 | `POST /api/provider/upload` works through XHR path rewrite and returns JSON. |
| DSK-34 | `GET /api/provider/status` returns desktop-readable health JSON. |
| DSK-35 | Workflow, agent, and app route families forward through the same proxy server. |
| DSK-36 | Automated log scan confirms no API key, bearer token, cookie, or upload body is printed. |

## 9. Work Estimate

| Work item | Estimate |
|---|---:|
| Proxy server lifecycle and auth token | 0.75d |
| Fetch/XHR path rewrite in preload | 0.5d |
| `/api/api/v1/*` port from Next route | 2d |
| `/api/provider/v1/*`, upload, status | 2.5d |
| Workflow/agent/app route families | 2d |
| Security hardening and smoke tests | 2.25d |

Total implementation after this decision: about 10 person-days, with DSK-31 and DSK-32 as the next critical path.
