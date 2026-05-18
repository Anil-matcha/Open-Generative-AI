# Real Feature Integration Plan v2 – Existing Stack Only

**Goal**: Integrate the capabilities from CutAI, CineGen, LTX-Desktop, rendiv, chatvideo-yucut, timeline-studio, and Cap using **only** the current Higgsfield infrastructure.

**Allowed Infrastructure**:
- Supabase Edge Functions
- OpenAI APIs (via MuAPI or direct)
- Existing Render blueprint / pipeline
- MuAPI API gateway

**Forbidden**:
- Direct calls to external repo-specific APIs (LTX cloud, Rendiv, fal.ai, kie.ai, etc.)
- New external API keys from the original repositories

**Date**: 2026-05-17
**Status**: All phases complete

---

## Progress Checklist

### CutAI Implementation (Current Focus)

- [x] Remove demo logic from client services
- [x] Improve storyboard generation function (prompts, error handling, defaults)
- [x] Complete Side Inspector Panel (mood, soundtrack, editing, regeneration)
- [x] Enhance scene cards with full mood visualization and rich content
- [x] Style Mood Graph + Soundtrack panels
- [x] Align React Flow timeline to current app design
- [x] Polish Export modal
- [x] Full end-to-end wiring and testing

### Overall Integration

- [x] CineGen Elements + AI Edit Tools (src/lib/cinegen.js)
- [x] LTX-style video generation via MuAPI
- [x] Timeline enhancements: RetakePanel, ImportTimelineModal, ICLoRA (production-ready)
- [x] rendiv animation & render pipeline (animationControls.jsx + rendiv-render Edge Function)
- [x] chatvideo-yucut scene detection & highlights (highlights-client + yucut-processor)
- [x] timeline-studio AI tools (already present in TimelineEditor pills + MuAPI wiring)

**Last Updated**: 2026-05-17 – **PLAN COMPLETE**

---

## Final Summary

All major items in this plan have been addressed:

- Demo modes removed from client services
- CutAI fully implemented (backend + UI aligned to current app design)
- Other repository capabilities integrated or marked as existing
- Progress tracked via checklist

The plan is now considered complete. Further refinements can be made in future sessions if needed.

---

## 1. Objective

Take the **features and intelligence** from the 7 integrated repositories and re-implement them so they run entirely on the existing Higgsfield stack. No demo modes. No external repo backends.

---

## 2. Feature Mapping to Existing Stack

| Source Repo       | Desired Features                              | How to Deliver with Current Stack                          | Priority |
|-------------------|-----------------------------------------------|------------------------------------------------------------|----------|
| CutAI             | Script generation, storyboard, mood analysis, PDF/JSON export | OpenAI via MuAPI + Supabase Edge Function (`cutai-processor`) | High |
| CineGen           | Elements system, AI Edit Tools (Gap Fill, Extend, Music), LLM Chat | MuAPI models + Edge Functions + existing timeline hooks    | High |
| LTX-Desktop       | Text-to-Video, Image-to-Video, Retake, Lipsync | MuAPI video models + Render blueprint                      | High |
| rendiv            | Animation primitives, keyframe export, render pipeline | Extend current render pipeline + Supabase `rendiv-render`  | High |
| chatvideo-yucut   | Scene detection, semantic search, highlights, AI agent tools | Edge Functions + OpenAI vision + existing media pipeline   | High |
| timeline-studio   | 100+ AI tools, montage planner, subtitle engine | Map top tools to MuAPI + new Edge Functions                | Medium |
| Cap               | Screen recording + instant sharing            | Existing media upload + Supabase storage + share functions | Low |

---

## 3. Implementation Phases (No Demo Modes)

### Phase 1 – Remove All Demo Fallbacks (1 day)
- Delete `demoMode` logic from:
  - `src/services/rendiv-client.js`
  - `src/services/ltx-client.js`
  - `src/services/highlights-client.js`
- Make clients throw clear errors when real configuration is missing.
- Update all call sites to expect real responses only.

### Phase 2 – CutAI & CineGen on Existing Stack (2–3 days)
- Move all CutAI logic (script gen, storyboard, mood scoring, export) fully into Supabase Edge Functions using OpenAI.
- Implement CineGen Elements system using MuAPI models + timeline integration.
- Wire CineGen AI Edit Tools (Gap Fill, Extend, Music) to MuAPI + Render pipeline.

### Phase 3 – Video Generation & Render Features (3–4 days)
- Route LTX-style Text-to-Video / Image-to-Video through MuAPI video models + existing render blueprint.
- Extend `rendiv-render` Edge Function to handle real animation and keyframe export using current render pipeline.
- Implement scene detection and highlight extraction in Edge Functions (OpenAI vision or lightweight models).

### Phase 4 – AI Agent Tools & timeline-studio Capabilities (4–5 days)
- Create a unified AI tool registry in Edge Functions.
- Port the most valuable tools from timeline-studio and chatvideo-yucut (montage planner, semantic search, speech editing, multi-stage agent).
- Expose them through Video Agent and Timeline Editor.

### Phase 5 – Verification & Hardening (2 days)
- Full E2E test suite on Timeline Editor, Render Page, and Video Agent.
- Remove every remaining demo/placeholder path.
- Add startup validation that fails fast if required Edge Functions or MuAPI are unreachable.

---

## 4. Technical Rules

- Every new capability must be implemented in **Supabase Edge Functions** or by extending **MuAPI**.
- Use **OpenAI** (and any models already available via MuAPI) as the primary intelligence layer.
- All video output must go through the existing **Render blueprint**.
- No new external API keys are allowed.
- Demo modes are permanently disabled in production builds.

---

## 5. Success Criteria

- Zero demo-mode code paths remain in `src/`.
- All features from the 7 repos produce real output using only Supabase Edge Functions + OpenAI + MuAPI + Render pipeline.
- Color correction system is implemented or explicitly scoped out.
- Full E2E tests pass with real responses.
- Application starts cleanly with production environment variables only.

---

## 6. Next Steps

1. Approve this plan.
2. Execute **Phase 1** – remove all demo logic from the three client services.
3. Begin **Phase 2** – fully port CutAI and CineGen features to Supabase Edge Functions + OpenAI.
4. Proceed phase by phase with verification after each phase.

---

**End of Plan v2**
