# Creator Studio Storyboard workspace

This document defines the first project-based Creator Studio UX pass. It records implementation state separately from deployment/provider state so a compiled interface is not mistaken for a live-tested production editor.

## Status vocabulary

| State | Meaning for this workspace |
|---|---|
| **Built** | Source exists locally, uses the existing authenticated Creator routes, and passes local compilation/automated checks. |
| **Configured** | The target deployment exposes a configured provider through the existing provider-status endpoint. No environment values are changed by this UI patch. |
| **Tested** | Retained evidence exists for the named test. Pure scene/request tests are not equivalent to a real provider generation. |
| **Production ready** | Built, configured, reviewed, merged, deployed, and successfully exercised end to end with security and release evidence. |

## Current phase status

| Capability | Built | Configured | Tested | Production ready |
|---|---|---|---|---|
| Project/scene workspace | Yes — integrated feature branch with durable Project manifests | Requires `BLOB_READ_WRITE_TOKEN` in the target environment | Automated scene/request, ownership, persistence, and shell-handoff tests only | No — completion candidate is not deployed |
| Generate Still bridge | Yes — existing `POST /api/creator/image` | Inherits MuAPI status | Request-shape test only in this patch | No — Storyboard E2E pending |
| Text → Video bridge | Yes — existing `POST /api/creator/video` | Inherits MuAPI status | Request shape and server T2V-selection tests | No — Storyboard E2E pending |
| Image → Video bridge | Yes — existing `POST /api/creator/video` with `firstFrameUrl` | Inherits MuAPI status | First-frame request and server I2V-selection tests | No — Storyboard E2E pending |
| Scene transitions | UI metadata only | Not applicable | Scene-state test | No compositor; not rendered |
| Final export | Planned/disabled | Not applicable | Not tested | No |
| Graphic Studio | Yes — reuses CreativeCanvas, ImageStudio/DrawModal, and LayersStudio | Embedded CreativeCanvas uses the Creator-authenticated server adapter; isolated legacy Image/Edit modes still retain BYOK compatibility | Proxy/security and source integration tests only | No — live owner smoke pending |

No deployment, Production environment edit, paid-generation activation, or provider request is part of this patch.

## Reused architecture

`CreatorStudio.jsx` remains the browser integration boundary. Storyboard calls one `runProjectMedia()` bridge in that component, which reuses:

- the authenticated `request()` function;
- `responseError()` sanitization;
- `generationTokenRef` cancellation semantics;
- `pollTask()` and its bounded polling schedule;
- the existing `/api/creator/image`, `/api/creator/video`, and `/api/creator/muapi/status` routes.

The existing gateway, MuAPI provider, GitHub owner authentication, same-origin checks, content safety, rate limits, request limits, timeouts, and server-only credentials remain unchanged.

## Scene model and behavior

The editor keeps active scene changes in local React state and saves the Storyboard into the selected owner-authenticated Project manifest. A scene contains an ID, title, prompt, image/video URLs, duration, aspect ratio, transition, status, and returned model metadata. Multi-user collaboration and document version history remain deferred.

The workspace supports:

- add, select, duplicate, and delete scene;
- edit title, prompt, aspect ratio, duration, and transition metadata;
- preview a scene video, otherwise its image, otherwise an empty canvas;
- display generated scene images/videos in the local asset panel;
- generate a still;
- generate video directly from text;
- animate the selected scene image;
- copy the previous scene image into the current scene without generating;
- show per-scene working and error states.

The local Storyboard panel does not reuse `DrawModal.jsx`'s browser-key upload/generation path. Secure Project uploads are available through Assets and can be handed into Scene Builder; a second inline upload implementation is intentionally not duplicated.

The shell-level Asset library can pass an already generated HTTPS image directly into Graphic Studio, Scene Builder, and Lip Sync. Music Video is a Storyboard-backed entry point and does not imply a finished compositor or audio mix.

## AI Engine: Auto

The UI never sends a provider model override:

```text
Generate Still
  → POST /api/creator/image
  → server-selected MUAPI_IMAGE_MODEL

Generate Video with no scene image
  → POST /api/creator/video without firstFrameUrl
  → server-selected MUAPI_VIDEO_MODEL (T2V; currently Seedance by default)

Animate Image
  → POST /api/creator/video with the scene image as firstFrameUrl
  → server-selected MUAPI_IMAGE_TO_VIDEO_MODEL (I2V; currently Kling by default)
```

Runway remains a preserved, deferred server adapter. A future Auto/Kling/Seedance/Runway override must extend the existing gateway safely; it must not add browser credentials or a second provider dispatch implementation.

## Graphic Studio and future embedded Design mode

Graphic Studio now consolidates CreativeCanvas, `ImageStudio`, `DrawModal`, and Layers. The embedded CreativeCanvas path no longer writes a provider token into browser storage and instead uses the Creator-authenticated server proxy. The older standalone Generate/Edit compatibility modes remain isolated BYOK code and are documented for incremental migration.

A future Storyboard-embedded Design mode should reuse the same canvas concepts—pointer selection, pencil, eraser, rectangles, arrows, text, inserted images, canvas objects, undo, and redo—without introducing another editor or direct browser provider call.

A safe implementation sequence is:

1. Audit and reuse CreativeCanvas document/history operations rather than extracting a competing canvas.
2. Add a `Storyboard | Design` entry switch backed by Graphic Studio.
3. Reuse Project Assets as inserted Design objects.
4. Migrate the remaining isolated BYOK generation/edit modes behind Creator routes.
5. Version the graphic document format before adding durable canvas-session persistence.

## Timeline manifest and future compositor

The completion candidate creates a versioned `creator.timeline.v1` manifest from the Storyboard. It represents ordered clips, timing, transition metadata, voice/music/caption/overlay tracks, aspect ratio, resolution, and render status. Transitions are explicitly marked `rendered: false`; it does not render a final program.

A future compositor should consume owned source references from that manifest and then process:

```text
ordered scene clips
  → trims / splits / scene timing
  → rendered transitions
  → voice-over and music tracks
  → captions
  → text and graphic overlays
  → final render job
  → validated downloadable export
```

The compositor needs real media probing, codec/frame-rate normalization, timeline validation, background render jobs, bounded polling, progress, cancellation, failure recovery, storage cleanup, and export authorization. Transition controls must remain labeled metadata-only until this pipeline produces retained output evidence.

## Separate provider issue

Voice stays available through `POST /api/creator/speech`. An ElevenLabs `401`/`403` is a server credential/permission problem and is not addressed by the Storyboard UI change. The key must remain server-only.
