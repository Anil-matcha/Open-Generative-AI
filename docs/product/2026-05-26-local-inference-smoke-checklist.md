# Local Inference Smoke Checklist

Purpose: close DSK-45 by defining the manual desktop smoke matrix for sd.cpp image generation and Wan2GP video generation after the Web-to-desktop React migration.

Scope:
- Desktop React renderer only.
- Shared Image Studio and Video Studio surfaces.
- Electron `localRuntime` bridge for sd.cpp and Wan2GP.
- Local model/task persistence visible through Task Center.

Out of scope:
- Full packaging certification across Windows, Linux, and macOS.
- Long quality benchmarking or GPU performance profiling.
- Real paid provider image/video generation.

## Preconditions

| Area | Check | Pass Criteria |
|---|---|---|
| Desktop shell | Start the desktop React renderer with Electron bridge enabled | Header shows `MozenAIGC Desktop`; `Image`, `Video`, `Local Models`, `API Providers`, and `API Health` tabs are visible. |
| Local runtime bridge | Open `Local Models` | The page renders sd.cpp and Wan2GP sections without console errors. |
| sd.cpp engine | Inspect sd.cpp status | Installed engine reports ready, or install flow completes and status refreshes. |
| Wan2GP service | Start Wan2GP separately | Service is reachable from the configured URL. Recommended command: `python wgp.py --listen --server-name 0.0.0.0`. |
| Storage | Clear only task histories if a fresh run is needed | `hg_image_studio_persistent` and `hg_video_studio_persistent` can be cleared without touching provider config. |
| Logging | Keep DevTools and Electron main logs available | Failures capture renderer console, main process log, screenshots, and the local runtime status payload. |

## sd.cpp Image Path

| Step | Action | Expected Result | Evidence |
|---|---|---|---|
| SD-1 | Open `Local Models` | sd.cpp section shows engine status and model list. | Screenshot of local model manager. |
| SD-2 | If engine is missing, run install action | Engine install completes or returns a clear actionable error. | Install log/status text. |
| SD-3 | Download one small image model | Model status transitions to ready/downloaded. | Model row shows ready state. |
| SD-4 | If the selected model requires auxiliaries, download them | Auxiliary status shows ready before generation. | Auxiliary row/status text. |
| SD-5 | Open `Image` tab | Local image model appears alongside remote image models. | Dropdown screenshot. |
| SD-6 | Select the local sd.cpp model | Image mode is forced to text-to-image and reference images are cleared. | Control state screenshot. |
| SD-7 | Generate a simple prompt, for example `studio smoke test, clean product render` | A completed image appears in the gallery. | Result URL or preview screenshot. |
| SD-8 | Open `Tasks` | The generated image appears as an image task with local runtime metadata. | Task Center screenshot. |
| SD-9 | Reload desktop renderer | Generated image history and selected local model state are restored, or fall back to the first available ready model if the model is removed. | Reload screenshot. |

## Wan2GP Video Path

| Step | Action | Expected Result | Evidence |
|---|---|---|---|
| WG-1 | Start Wan2GP outside the app | Wan2GP Gradio server listens on the configured host/port. | Terminal log. |
| WG-2 | Open `Local Models` and save Wan2GP URL | URL persists after reload. | Saved URL screenshot. |
| WG-3 | Run Wan2GP probe | Probe succeeds and model list/status are refreshed. | Probe result and timestamp. |
| WG-4 | Open `Video` tab | Wan2GP T2V and I2V models appear in the model dropdown when runtime reports them ready. | Dropdown screenshot. |
| WG-5 | Select a Wan2GP T2V model and generate a short low-step prompt | Generation submits through `localRuntime.wan2gp.generate` and returns a video/file URL. | Video preview screenshot and renderer log. |
| WG-6 | Select a Wan2GP I2V model | Upload control stays available for a start frame. | I2V control screenshot. |
| WG-7 | Upload a start-frame image | Upload routes through `localRuntime.wan2gp.uploadFile` and produces a cached `/file=` URL or runtime file handle. | Upload result log/status. |
| WG-8 | Generate I2V with the uploaded start frame | Generation completes and preview plays or opens from a valid local URL. | Preview screenshot/video file path. |
| WG-9 | Open `Tasks` | T2V and I2V results appear as video tasks with Wan2GP runtime metadata. | Task Center screenshot. |
| WG-10 | Reload desktop renderer | Wan2GP URL, generated history, and task entries persist. | Reload screenshot. |

## Failure Capture

For every failed step, attach:
- Exact step ID, timestamp, OS, GPU/CPU mode, and model ID.
- Renderer console output.
- Electron main process output.
- Screenshot of the failing UI state.
- sd.cpp engine/model status or Wan2GP probe response.
- Relevant local storage keys: `hg_image_studio_persistent`, `hg_video_studio_persistent`.

## Release Gate

DSK-45 is considered documented when this checklist exists and is referenced by the progress ledger. The release branch should not enter packaging QA until at least one real desktop run completes:
- sd.cpp SD-1 through SD-9: pass or documented non-release blocker.
- Wan2GP WG-1 through WG-10: pass or documented non-release blocker.
- Task Center reflects both image and video local histories.
- Any failed item has a tracked follow-up before DSK-60 packaging smoke.
