# Desktop Package Verification

Date: 2026-05-26
Scope: DSK-61 and DSK-62 active packaging verification after the shared Web/Desktop migration. DSK-63 macOS evidence is retained as historical CI evidence only and is deferred from the current active scope.

## 1. Summary

| Task | Environment used | Status | Result |
|---|---|---|---|
| DSK-61 Windows build and install | Windows x64, Node v24.13.0 | Pass | NSIS installer built, installed silently, and launched successfully |
| DSK-62 Linux AppImage and DEB | Linux Docker on Windows Docker Desktop plus GitHub Actions `ubuntu-24.04` | Pass with caveat | AppImage and DEB built; CI metadata, AppImage, DEB install, packaged secrets audit, and artifact upload passed |
| DSK-63 macOS DMG behavior | Historical Windows x64 attempt plus GitHub Actions `macos-latest` | Deferred | CI previously built and verified DMG artifacts, but macOS packaging/configuration is no longer in the current active scope because no real macOS account or hardware is available |

DSK-61 is accepted on this workstation. DSK-62 is accepted for Linux container/CI smoke and still benefits from a final visual desktop check on Ubuntu. DSK-63 is deferred and does not block the current Windows/Linux desktop cleanup or release-preparation work.

## 2. Windows Evidence

Initial Windows cross-build commands:

```powershell
npm run electron:build:win
```

Artifacts:

| Path | Size |
|---|---:|
| `release/MozenAIGC Setup 1.0.10.exe` | 172,440,393 bytes |
| `release/MozenAIGC Setup 1.0.10.exe.blockmap` | 179,468 bytes |
| `release/win-unpacked/MozenAIGC.exe` | 188,890,624 bytes |

Install smoke:

```powershell
release/MozenAIGC Setup 1.0.10.exe /S
```

Installed location:

```text
%LOCALAPPDATA%\MozenAIGC
```

Launch smoke result:

```json
{
  "processName": "MozenAIGC",
  "responding": true,
  "mainWindowTitle": ""
}
```

Notes:

- The Windows package is unsigned in this workstation build because no code-signing identity is configured.
- The installer uses the existing custom NSIS logic in `build/installer.nsh`.
- This was a process-level launch smoke, not a full packaged UI automation pass.

## 3. Linux Evidence

Commands:

```powershell
npm run electron:build:linux
npx electron-builder --linux deb --x64
```

Initial Windows cross-build results:

- Vite renderer build completed.
- `release/linux-unpacked` was produced.
- `release/linux-unpacked/resources/apparmor.profile` exists.
- AppImage packaging failed on Windows because electron-builder could not execute `mksquashfs` from its AppImage tool cache.
- DEB packaging failed on Windows because `fpm` was not available in `PATH`.

Key blocker messages:

```text
cannot execute ... appimage-12.0.1\linux-x64\mksquashfs: file does not exist
cannot execute cause=exec: "fpm": executable file not found in %PATH%
```

Required follow-up:

- Capture renderer, proxy health, and local model panel screenshots on a full Ubuntu desktop session.
- Confirm the AppArmor profile guidance remains valid on the target Ubuntu version.

Linux Docker/CI build command:

```powershell
docker run --rm -v "${PWD}:/project" -v ogai-linux-node-modules:/project/node_modules -v ogai-electron-cache:/root/.cache/electron -v ogai-eb-cache:/root/.cache/electron-builder -w /project public.ecr.aws/docker/library/node:22-bookworm-slim bash -lc 'apt-get update >/dev/null && apt-get install -y --no-install-recommends binutils >/dev/null && npx electron-builder --linux AppImage deb --x64 --config.directories.output=release-linux-docker --publish never'
```

Linux Docker artifacts:

| Path | Size |
|---|---:|
| `release-linux-docker/MozenAIGC-1.0.10.AppImage` | 290,075,040 bytes |
| `release-linux-docker/open-generative-ai_1.0.10_amd64.deb` | 173,985,028 bytes |
| `release-linux-docker/linux-unpacked/resources/apparmor.profile` | 189 bytes |

Linux package metadata:

```text
AppImage: ELF 64-bit LSB executable, x86-64
DEB: Debian binary package, Package=open-generative-ai, Version=1.0.10, Architecture=amd64, Maintainer=MozenAIGC Team
```

Linux launch smokes:

```text
LINUX_UNPACKED_SMOKE_EXIT=124
LINUX_UNPACKED_SMOKE=ran_until_timeout
LINUX_DEB_SMOKE_EXIT=124
LINUX_DEB_SMOKE=ran_until_timeout
LINUX_APPIMAGE_SMOKE_EXIT=124
LINUX_APPIMAGE_SMOKE=ran_until_timeout
```

Exit code `124` is expected here because the smoke uses a deliberate 25 second timeout. DBus and GPU initialization warnings were observed in the minimal container and should be rechecked in a full desktop session, but they did not prevent the app from staying alive.

Linux GitHub Actions evidence:

| Field | Value |
|---|---|
| Repository | `MookeeHugo/Open-Generative-AI` fork |
| Branch | `codex/internal-multimodal-lab` |
| Run | `Desktop Packaging` run `26420279302` |
| URL | `https://github.com/MookeeHugo/Open-Generative-AI/actions/runs/26420279302` |
| Head SHA | `fcfe13b7f8bbb607736e5593802447f616b76d5d` |
| Artifact | `desktop-linux` |
| Artifact archive size | 462,203,226 bytes |

Linux CI steps passed:

- `npm run electron:build:linux:ci`
- Package metadata inspection for AppImage and DEB
- AppImage `xvfb` smoke
- DEB install plus `/opt/MozenAIGC/open-generative-ai` `xvfb` smoke
- `npm run test:secrets-audit`
- Upload Linux artifacts

## 4. Deferred macOS Evidence

This section is retained only as historical evidence from the earlier all-platform packaging pass. The active source configuration no longer includes macOS build scripts or the macOS GitHub Actions job.

Historical command:

```powershell
npm run electron:build
```

Observed result:

- Vite renderer build completed.
- macOS packaging did not start because the command was executed on Windows.

Key blocker message:

```text
Build for macOS is supported only on macOS
```

Deferred follow-up if macOS is reapproved:

- Restore a macOS package script and GitHub Actions job.
- Re-run the DMG build on a real macOS x64/arm64 host or a reintroduced `macos-latest` workflow.
- Verify signing behavior from `afterPack.js`.
- Launch the DMG on a clean macOS account.
- Document Gatekeeper/quarantine steps and any notarization decision.

macOS GitHub Actions evidence:

| Field | Value |
|---|---|
| Repository | `MookeeHugo/Open-Generative-AI` fork |
| Branch | `codex/internal-multimodal-lab` |
| Run | `Desktop Packaging` run `26420279302` |
| URL | `https://github.com/MookeeHugo/Open-Generative-AI/actions/runs/26420279302` |
| Head SHA | `fcfe13b7f8bbb607736e5593802447f616b76d5d` |
| Artifact | `desktop-macos` |
| Artifact archive size | 1,310,710,224 bytes |

Downloaded artifact evidence on the Windows workstation:

| File | Size | SHA256 |
|---|---:|---|
| `MozenAIGC-1.0.10.dmg` | 225,635,768 bytes | `D1DD297A13A1412D84FE94D0CA7B41205CD794F5597FF08706B210FD5948C41B` |
| `MozenAIGC-1.0.10-arm64.dmg` | 219,612,057 bytes | `0770271438955856373723D79AE0D863661AF330DE500A6043B9FE4C97500BAB` |

The artifact was downloaded outside the repository workspace to preserve a clean git worktree. The downloaded artifact also includes expanded `mac/MozenAIGC.app` and `mac-arm64/MozenAIGC.app` directories.

Historical macOS CI steps passed:

- `npm run electron:build:mac:ci` before that script was removed from the current active config
- `hdiutil verify release/*.dmg`
- `codesign --verify --deep --strict --verbose=2` on `MozenAIGC.app`
- `npm run test:secrets-audit`
- Upload macOS artifacts

Current macOS status:

- Deferred from active release scope.
- Not a blocker for DSK-70, DSK-71, DSK-72, or Windows/Linux release notes.
- Must be re-scoped before any new macOS public artifact is promised.

## 5. Secrets Audit

Command:

```powershell
npm run test:secrets-audit
```

Result:

```json
{
  "ok": true,
  "scannedRoots": [
    "dist",
    ".next/server",
    ".next/static",
    "release",
    "release-linux-docker",
    "output"
  ],
  "scannedFiles": 160,
  "scannedAsarFiles": 4,
  "findings": []
}
```

The audit now scans `.asar` archives in release artifacts while skipping unpacked asar entries that are already scanned from the filesystem or were removed by `afterPack.js`.

## 6. Acceptance State

| Task | Acceptance state |
|---|---|
| DSK-61 | Accepted for Windows workstation smoke. Recommended remaining evidence: full UI smoke on installed app. |
| DSK-62 | Accepted for Linux Docker/CI smoke. Recommended remaining evidence: full Ubuntu desktop screenshot or Playwright-assisted packaged UI smoke. |
| DSK-63 | Deferred from current active scope. Historical CI artifact hashes are recorded above, but macOS package scripts/workflow config are not maintained in this stage. |
