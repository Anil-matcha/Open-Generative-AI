# G.FURY Creator Studio operating system

This document records the integrated shell implemented on `feature/integrated-creator-shell`. It separates source existence from configuration and real provider evidence. No deployment, Production change, paid generation, or social post is part of this branch.

## Product hierarchy

Creator Studio is the shell. Selena is the primary agent identity. Provider brains and execution APIs remain infrastructure beneath it.

```text
User
  → Selena
  → POST /api/creator/assistant
  → Brain Router (Gemini, bounded fallbacks)
  → plan / recommendation
  → explicit tool or workflow action
  → validation / approval
  → existing provider adapter
```

The shell now organizes working destinations as:

- **Home:** intent-first Selena prompt and working quick actions.
- **Agent:** Selena, using the secure Creator assistant route without agent creation.
- **Tools:** secure Image, Video, Voice, and Avatar plus preserved legacy Music, Advanced Video, Lip Sync, Motion Graphics, Transform, and Smart Clip.
- **Apps:** AI Generator, AI Influencer, Graphic Studio, Scene Builder, Music Video, Marketing Studio, and Edit Studio.
- **Workflows:** the existing MuAPI workflow list, playground, and builder.
- **Projects:** owner-authenticated durable manifests with recent/open/rename flows plus a Project workspace that launches Selena, generation, Storyboard, Graphic Studio, Assets, and Publish with the selected Project retained as context.
- **Assets:** Project-owned generated media/uploads with Graphic Studio, Scene Builder, Lip Sync, and Publish handoffs; a session cache remains for compatibility.
- **Publish:** unified Instagram/TikTok review through MuAPI Social plus the preserved direct private YouTube workflow.
- **Advanced:** Agent Blueprints, Marketplace/Developer Templates, and legacy provider settings.

Projects appear in primary navigation because this completion candidate adds a server-owned durable Project/Asset source of truth. Music Video reuses the real Storyboard workspace as a scene-planning app; it does not claim music-track mixing or final video composition.

## Source dependencies and clean checkout

The three Git repositories below are source dependencies, not runtime services:

| Submodule | Pinned source | Workspace package | Runtime GitHub connection |
|---|---|---|---|
| `packages/Vibe-Workflow` | `SamurAIGPT/Vibe-Workflow` | `packages/workflow-builder` → `workflow-builder` | None |
| `packages/Open-Poe-AI` | `Anil-matcha/Open-Poe-AI` | `packages/agents` → `ai-agent` | None |
| `packages/Open-AI-Design-Agent` | `Anil-matcha/Open-AI-Design-Agent` | `packages/design-agent` → `design-agent` | None |

GitHub CI and CodeQL use `actions/checkout` with `submodules: recursive`. Local setup uses `npm run setup`, which initializes submodules before `npm install`. Vercel's Git checkout has successfully built the same public submodule pins, but a missing/empty submodule must be treated as a checkout failure—not solved with a runtime GitHub token or another service.

## Reused architecture

| Capability | Reused implementation |
|---|---|
| Selena reasoning | `CreatorStudio.jsx` → `POST /api/creator/assistant` → `handleBrainAssistant()` → `reasonWithBrain()` |
| Image/video generation | Existing Creator gateway, `muapiCreatorProvider.js`, shared request/polling functions |
| Storyboard | Existing `StoryboardWorkspace.jsx`, Creator media request/polling bridge, and Project persistence |
| Graphic Studio | Wrapper around `DesignAgentStudio`/`CreativeCanvas`, `ImageStudio`/`DrawModal`, and `LayersStudio` |
| Workflow | Existing `WorkflowStudio`, `WorkflowUI`, and MuAPI workflow functions |
| Agent Blueprints | Existing `AgentStudio` and generic MuAPI Agent endpoints |
| Video utilities | Existing Lip Sync, Vibe Motion, Recast, Clipping, Video, and Cinema components |
| YouTube | Existing direct OAuth, private Blob staging, encrypted token storage, approval gate, and forced-private publishing |
| Instagram/TikTok | Existing server-only MuAPI Social adapter; opaque owner mapping, account connection/listing, explicit review, fixed publish endpoints, and prediction polling |
| Projects/Assets | Existing private Vercel Blob infrastructure plus owner-derived namespaces and Creator-authenticated routes |

## Selena boundary

Selena owns the conversational identity and project intent. Brain providers return normalized reasoning only. A plan or tool call does not itself spend money, publish, schedule, delete, or perform another external side effect. Existing same-origin, owner-auth, content-safety, rate-limit, timeout, and provider-error controls remain in force.

The completion candidate adds a bounded structured contract containing `message`, `plan`, `suggestedActions`, `referencedAssets`, `requiresApproval`, and `estimatedSideEffects`. The server accepts only allowlisted actions, derives destinations/approval/side-effect metadata itself, and discards arbitrary functions and URLs. Selena renders plan/action cards and opens the appropriate workspace; consequential execution remains behind that workspace's explicit control.

When a Project is selected, Selena receives only server-loaded, bounded Project, Storyboard, recent-Asset, and conversation summaries. Conversation history is saved to the Project manifest. Attachments are supported through the secure Project Asset upload and handoff boundary; the route does not trust browser-supplied owner context or media metadata.

## Agent Blueprints

`AgentStudio` is preserved and renamed in navigation as **Advanced → Agent Blueprints**. Its templates, agents, chats, create flow, and conversations remain the generic MuAPI Agent product. Studio use now supplies `/studio/advanced/agents` as its base path so create/chat/back transitions stay inside the shell. Standalone `/agents/*` pages remain available and unchanged.

## Graphic Studio and CreativeCanvas

Graphic Studio is a consolidation wrapper, not a new editor. It exposes:

1. **Creative Canvas:** existing conversational sessions, assets, uploads, canvas state, generation jobs, and asset-aware edits.
2. **Generate & Edit:** existing image generation/upload plus `DrawModal` pencil, eraser, rectangles, arrows, text, inserted images, undo, redo, and export concepts.
3. **Layers:** existing layer decomposition and composition workspace.

Graphic Studio itself no longer requires a legacy key to open. Secure Creator image Assets can enter **Generate & Edit** and open directly in `DrawModal`. CreativeCanvas requests made inside authenticated Creator Studio use the secure server adapter. Older standalone Generate/Edit and Agent paths retain isolated compatibility credentials.

Security result: `DesignAgentStudio` no longer copies a MuAPI credential into `localStorage.token`. The Creator-authenticated server adapter injects the active safe MuAPI credential only after the existing authentication and paid-generation gate. The broader repository still contains isolated BYOK request code in older Agent/Studio components; that compatibility surface remains an incremental migration item.

## Storyboard and Auto routing

Storyboard remains distinct from Workflow. Its state persists to the selected Project. Saving generates a versioned `creator.timeline.v1` manifest, but scene transitions are metadata only and no compositor renders them.

```text
Generate Still → /api/creator/image → MUAPI_IMAGE_MODEL
Generate Video without image → /api/creator/video (no firstFrameUrl) → MUAPI_VIDEO_MODEL
Animate Image → /api/creator/video (firstFrameUrl) → MUAPI_IMAGE_TO_VIDEO_MODEL
```

The browser cannot select provider keys or arbitrary model IDs. The UI reports **AI Engine: Auto**.

## Durable Projects and Assets

Project manifests are private JSON records in the existing Vercel Blob infrastructure. The server derives an HMAC owner namespace from the immutable authenticated GitHub identity and session secret; it never trusts a browser owner ID. The initial schema retains Project metadata, bounded Selena conversation history, Assets, Storyboard state, a versioned timeline, and reserved workflow-reference/publish-draft arrays.

Generated images/videos, voice outputs, and validated uploads can become durable Assets when a Project is open. Images can enter Graphic Studio or Scene Builder; image/video Assets can populate contextual media tools and Publish without copying a URL. Upload authorization is scoped to the owned Project path, allowed media types, and configured size. Asset deletion requires explicit approval and an exact recorded owned Blob path. The browser session cache remains only for compatibility when no Project is selected. Workflow-reference and publish-draft UI persistence are not complete, and this is still an owner-only—not collaborative—Project model.

## Publish and current social API verification

The direct YouTube implementation remains preserved. It requires per-upload approval and forces private visibility.

MuAPI's official Social Publishing REST documentation was rechecked on 2026-08-28 and now documents end-user connection URLs, account listing, fixed Instagram/TikTok publish endpoints, and standard prediction-result polling. The new implementation uses those documented paths. It does not expose the MuAPI credential or platform OAuth tokens to the browser. A successful publish costs `$0.01`, so `MUAPI_ALLOW_SOCIAL_PUBLISHING=true` and a per-post review checkbox are both required.

Implemented Instagram/TikTok architecture:

```text
Browser
  → Creator-authenticated same-origin route
  → server-only MuAPI social credential
  → validated account + public HTTPS media URL
  → review screen
  → explicit approval
  → async publish + confirmed provider status
```

The documented REST publish endpoints do not include `scheduled_at`. Scheduling remains unavailable; the application does not run the MCP CLI inside Vercel or invent a REST field. TikTok defaults to `SELF_ONLY` unless `MUAPI_TIKTOK_PUBLIC_PUBLISHING_APPROVED=true` confirms the application has completed the platform's public-post audit.

## Provider and feature status

| Area | Built | Configured | Tested | Production ready |
|---|---|---|---|---|
| Integrated shell/navigation | Yes, feature branch | No provider change required | Automated source/routes + production build; public existing Preview Home loaded | No; completion candidate not deployed and owner smoke incomplete |
| Selena secure reasoning/orchestration | Yes | Inherits Brain status | Route, allowlist, approval, and context tests; no new live reasoning request | No |
| Agent Blueprints role/routes | Yes | Requires legacy BYOK for MuAPI data | Automated route tests | No live create/chat test |
| Graphic Studio wrapper | Yes | Creator CreativeCanvas uses server adapter; older modes retain BYOK | Proxy/security + compile/source tests | No live editor E2E |
| Storyboard | Yes, with Project persistence and timeline manifest | Inherits Blob/MuAPI status | State/request/routing/manifest tests | No live Storyboard generation on this branch |
| Timeline/compositor | v1 manifest only; renderer absent | Not applicable | Manifest tests | No |
| Workflow | Preserved | Requires legacy BYOK | Production build only in this pass | Not claimed |
| Durable Projects/Assets | Yes | Requires target Blob configuration | Ownership, upload-policy, persistence, deletion, and handoff tests | No live owner E2E |
| YouTube | Preserved | Environment-specific | Existing security tests; no live publish | No new claim |
| Instagram | Yes — MuAPI Social REST adapter and unified review UI | Requires server social credential + connected Business account + enable flag | Mocked request/auth/approval/poll tests only | No |
| TikTok | Yes — MuAPI Social REST adapter and unified review UI | Requires server social credential + connected account + enable flag; public posting also requires TikTok approval | Mocked request/auth/approval/poll tests only | No |
| Social scheduling | No REST contract verified | No | No | No |
| MuAPI media | Existing | Environment-specific | Existing retained evidence; no paid request here | Sandbox scope only where configured |
| Runway | Adapter preserved/deferred | Key optional | No paid test | No |
| ElevenLabs | Secure route preserved | Credential currently returns 401/403 | Failed provider evidence, not success | No |
| HeyGen | Secure route preserved | Environment-specific | No request in this pass | No new claim |

## MuAPI environment reconciliation

Current source in `muapiConfiguration()` is authoritative:

- `MUAPI_KEY_MODE=sandbox` selects `MUAPI_API_KEY`.
- `MUAPI_KEY_MODE=production` selects `MUAPI_PRODUCTION_API_KEY`.
- Production mode fails closed unless `MUAPI_ALLOW_PAID_GENERATION=true`.
- Model selection remains server-side through `MUAPI_IMAGE_MODEL`, `MUAPI_VIDEO_MODEL`, and `MUAPI_IMAGE_TO_VIDEO_MODEL`.

Social publishing is independent of generation mode. It uses `MUAPI_SOCIAL_API_KEY` when configured, otherwise the server-only `MUAPI_PRODUCTION_API_KEY`, and fails closed unless `MUAPI_ALLOW_SOCIAL_PUBLISHING=true`. It does not change `MUAPI_KEY_MODE` or `MUAPI_ALLOW_PAID_GENERATION`.

This branch does not alter any environment value. It does not enable paid generation.

## Remaining release increments

1. Commit/push only after review, allow the feature branch Preview to deploy, and complete an owner-authenticated smoke test.
2. Verify Preview Brain, Blob, MuAPI, ElevenLabs, HeyGen, YouTube, and Social configuration by name/status without exposing values.
3. Run one safe real Brain reasoning request; separately approve any provider test that costs money or creates an external side effect.
4. Migrate remaining isolated Agent/Studio BYOK code behind Creator routes incrementally.
5. Execute a safe real Workflow before calling Workflow tested.
6. Implement a compositor/render-job service only after selecting a runtime capable of consuming `creator.timeline.v1` with ownership, progress, cancellation, and output retention.
7. Leave scheduling unavailable until an official REST contract exists.
