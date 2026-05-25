# Desktop Packaging Host and CI Runbook

Date: 2026-05-26
Scope: DSK-66, repeatable packaging and artifact validation for Windows, Linux, and macOS.

## 1. Goals

- Build desktop packages without publishing release assets by default.
- Verify package metadata, installability, launch behavior, and bundled secret safety.
- Keep OS-specific verification honest: Windows on Windows, Linux on Ubuntu or Linux Docker/CI, macOS on macOS.

## 2. Common Gates

Run these before packaging when time allows:

```powershell
npm run test:api-providers
npm run test:desktop-api-proxy
npm run test:studio-shell-smoke
npm run test:secrets-audit
```

After each final package build, rerun:

```powershell
npm run test:secrets-audit
```

The secrets audit scans Web/Desktop build output, release files, and packaged `.asar` archives.

## 3. Windows Package

Host:

- Windows x64.
- Node.js 22 or 24.
- Existing repository dependencies installed.

Command:

```powershell
npm run electron:build:win:ci
```

Validation:

```powershell
release\MozenAIGC Setup 1.0.10.exe /S
$app = "$env:LOCALAPPDATA\MozenAIGC\MozenAIGC.exe"
$p = Start-Process -FilePath $app -PassThru
Start-Sleep -Seconds 10
Get-Process -Id $p.Id
Stop-Process -Id $p.Id
```

Expected artifacts:

- `release/MozenAIGC Setup 1.0.10.exe`
- `release/MozenAIGC Setup 1.0.10.exe.blockmap`
- `release/win-unpacked/MozenAIGC.exe`

## 4. Linux Package from Windows Docker

This is the recommended local fallback when the Windows host cannot run Linux package tooling directly.

Prerequisites:

- Docker Desktop using Linux containers.
- A clean Docker volume for Linux `node_modules` so Windows dependencies are not overwritten.

Build:

```powershell
docker run --rm `
  -v "${PWD}:/project" `
  -v ogai-linux-node-modules:/project/node_modules `
  -v ogai-electron-cache:/root/.cache/electron `
  -v ogai-eb-cache:/root/.cache/electron-builder `
  -w /project `
  public.ecr.aws/docker/library/node:22-bookworm-slim `
  bash -lc 'set -euo pipefail
apt-get update >/dev/null
apt-get install -y --no-install-recommends ca-certificates git python3 make g++ binutils >/dev/null
npm ci
npm run electron:build:linux:ci'
```

If `npm ci` has already populated the Docker volume, it can be omitted for quick reruns.

AppImage smoke:

```powershell
docker run --rm `
  -v "${PWD}:/project" `
  -w /project `
  -e DEBIAN_FRONTEND=noninteractive `
  public.ecr.aws/docker/library/node:22-bookworm-slim `
  bash -lc 'set -euo pipefail
apt-get update >/dev/null
apt-get install -y --no-install-recommends xvfb xauth libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libuuid1 libsecret-1-0 libasound2 libgbm1 >/dev/null
chmod +x release/MozenAIGC-*.AppImage
set +e
APPIMAGE_EXTRACT_AND_RUN=1 timeout --kill-after=5s 25s xvfb-run -a release/MozenAIGC-*.AppImage --no-sandbox >/tmp/mozen-appimage-smoke.log 2>&1
status=$?
set -e
tail -n 120 /tmp/mozen-appimage-smoke.log
if [ "$status" != "0" ] && [ "$status" != "124" ]; then exit "$status"; fi'
```

DEB install smoke:

```powershell
docker run --rm `
  -v "${PWD}:/project" `
  -w /project `
  -e DEBIAN_FRONTEND=noninteractive `
  public.ecr.aws/docker/library/node:22-bookworm-slim `
  bash -lc 'set -euo pipefail
apt-get update >/dev/null
apt-get install -y --no-install-recommends xvfb xauth libasound2 libgbm1 ./release/open-generative-ai_*_amd64.deb >/dev/null
test -x /opt/MozenAIGC/open-generative-ai
test -f /opt/MozenAIGC/resources/apparmor.profile
set +e
timeout --kill-after=5s 25s xvfb-run -a /opt/MozenAIGC/open-generative-ai --no-sandbox >/tmp/mozen-deb-smoke.log 2>&1
status=$?
set -e
tail -n 120 /tmp/mozen-deb-smoke.log
if [ "$status" != "0" ] && [ "$status" != "124" ]; then exit "$status"; fi'
```

Exit code `124` is accepted for these smoke checks because it means the app stayed alive until the deliberate timeout.

Expected artifacts:

- `release/MozenAIGC-1.0.10.AppImage`
- `release/open-generative-ai_1.0.10_amd64.deb`
- `release/linux-unpacked/resources/apparmor.profile`

## 5. macOS Package

Host:

- macOS x64 or arm64 host, or GitHub Actions `macos-latest`.
- Xcode command line tools.
- Node.js 22.

Command:

```bash
npm ci
npm run electron:build:mac:ci
```

Validation:

```bash
ls -lh release/*.dmg
hdiutil verify release/*.dmg
find release -maxdepth 3 -name "MozenAIGC.app" -print -exec codesign --verify --deep --strict --verbose=2 {} \;
```

Manual clean-account launch:

1. Download or copy the DMG.
2. Open the DMG and drag `MozenAIGC.app` to Applications.
3. If Gatekeeper blocks an unsigned build, record the exact prompt and open from System Settings after confirming the build source.
4. Launch the app and capture renderer, provider config, API health, and local model panel evidence.

## 6. GitHub Actions

Workflow:

```text
.github/workflows/desktop-packaging.yml
```

Run modes:

- Manual: GitHub Actions > Desktop Packaging > Run workflow.
- Pull request: runs when desktop packaging, Electron, shared Studio, or workflow files change.

Artifacts:

- `desktop-linux`: AppImage, DEB, Linux metadata, AppArmor profile.
- `desktop-macos`: DMG and built app bundle.

Important:

- Packaging commands use `--publish never`; release publishing is intentionally separate.
- The workflow can build and verify macOS DMG metadata, but a final human launch check on a clean macOS account is still required before public release.
