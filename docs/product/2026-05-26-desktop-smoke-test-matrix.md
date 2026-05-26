# Desktop Smoke-Test Matrix

Date: 2026-05-26
Scope: DSK-60, release readiness matrix for the shared Web/Desktop Studio migration.

## 1. Purpose

This matrix defines the minimum evidence required before the migrated desktop client can be treated as release-ready for the current active Windows/Linux scope. It separates deterministic automated smoke checks from manual or environment-bound checks, especially local inference and packaged installer behavior. macOS packaging and launch checks are deferred until real macOS access is available again.

## 2. Required Evidence

| Lane | Environment | Command or action | Pass criteria | Artifact |
|---|---|---|---|---|
| Shared renderer build | Windows dev machine | `npm run vite:build` | Desktop Vite renderer builds without unresolved shared Studio imports | Console log |
| Web build parity | Windows dev machine | `npm run build` | Next Web app builds after shared Studio changes | Console log |
| API provider config | Windows dev machine | `npm run test:api-providers` | Provider normalization, persistence, export, and redaction checks pass | JSON/console output |
| Desktop API proxy | Windows dev machine | `npm run test:desktop-api-proxy` | `/api/provider`, `/api/api/v1`, `/api/workflow`, `/api/agents`, `/api/app`, and upload proxy checks pass | JSON/console output |
| Desktop/Web shell parity | Windows dev machine | `npm run test:studio-shell-smoke` | Desktop and Web render Image, Video, Marketing, Workflow, Agent, Apps, API Provider, API Health, Task Center, and Local Models surfaces with mocked provider routes | JSON/console output |
| Windows package | Windows clean VM or clean user profile | `npm run electron:pack` or release packaging command | NSIS installer installs, app launches, desktop proxy token is active, and smoke route checks pass | Installer path, launch log, screenshot |
| Linux package | Ubuntu LTS clean VM | AppImage and DEB launch smoke | App launches with documented AppArmor notes; renderer, local model panel, and proxy health open | Package path, launch log, screenshot |
| macOS package | Deferred | Deferred | Not part of the current active release scope | Re-scope decision before any new macOS artifact |
| Web runtime parity | Local Web dev server or preview deployment | Navigate key `/studio/*` routes | Web Image, Video, Marketing, Workflow, Agent, Apps, API Provider, and API Health routes still load | URL list, screenshot |
| Local sd.cpp image inference | Machine with sd.cpp configured | Open Local Models, detect sd.cpp model, run one tiny image smoke when available | Model catalog loads; generation task records success or a documented unavailable reason | Task record, screenshot |
| Local Wan2GP video inference | Machine with Wan2GP configured | Open Local Models, detect Wan2GP model, run one low-cost video smoke when available | Model catalog loads; generation task records success or a documented unavailable reason | Task record, screenshot |
| Optional real provider image | Provider with disposable key | Generate one low-cost image | No key is logged; task completes or returns a provider-specific actionable error | Redacted log, task record |
| Optional real provider video | Provider with disposable key | Generate one low-cost video or poll mocked async route | No key is logged; task completes or returns a provider-specific actionable error | Redacted log, task record |
| Secrets audit | Built artifacts and logs | Search built output, packaged asar/unpacked files, and logs for known test/disposable key prefixes | No provider API key appears in renderer bundles, packaged files, or logs | Search output |

## 3. Automated Smoke Coverage

`npm run test:studio-shell-smoke` is the deterministic gate for shared Web/Desktop parity. It must cover:

- Desktop shared shell boot, task center, absence of the retired legacy fallback action, and local model panel.
- Desktop API Provider create/save/reload with custom whitelists and capability flags.
- Desktop Image, Video, Marketing, Workflow, Agent, Apps, and API Health surfaces.
- Web `/studio/video`, `/studio/marketing`, `/studio/workflows`, `/studio/agents`, `/studio/apps`, `/studio/api-providers`, `/studio/api-health`, and `/studio/image`.
- Mocked route families for provider model discovery, workflow lists, agent lists/conversations, and app interest registration.

## 4. Manual Release Checks

Manual checks are required when hardware, OS packaging, or real model runtimes cannot be reproduced in CI:

- Windows installer: install as a non-admin user when possible, launch from Start menu, verify renderer and proxy status.
- Linux AppImage/DEB: document AppArmor behavior and confirm launch on a clean Ubuntu LTS machine.
- macOS DMG: deferred; reintroduce only when real macOS account/hardware access is available.
- Local inference: capture one successful or explicitly unavailable sd.cpp and Wan2GP result.
- Real provider: use disposable keys only, redact logs before attaching evidence.

## 5. Exit Criteria

DSK-60 is complete when this matrix exists and the deterministic smoke script covers the current shared parity surface. DSK-61 to DSK-65 can then consume the matrix row by row as release gates.

## 6. Current Packaging Evidence

The current DSK-61 to DSK-63 packaging attempt is recorded in `docs/product/2026-05-26-desktop-package-verification.md`.

Current state:

- Windows NSIS build, silent install, and process launch smoke passed on the Windows workstation.
- Linux AppImage and DEB packaging passed in Linux Docker; AppImage extract-and-run, DEB install, and `linux-unpacked` launch smokes stayed alive until timeout under `xvfb`.
- macOS DMG packaging is deferred from the current active scope; `.github/workflows/desktop-packaging.yml` now verifies Linux artifacts only.
