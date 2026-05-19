# App Module Contract Design (Approach A)

**Date**: 2026-05-19
**Status**: Approved
**Author**: Kilo (brainstorming phase)
**Goal**: Prevent shell apps by enforcing a repeatable, self-contained app-module contract via convention + lightweight validation.

## Decision
We adopt **Approach A: Convention + Validation Layer**.

### Why Approach A
- Keeps `src/apps/[app-id]/` layout unchanged.
- No Vite plugin, no monorepo package migration, no new AppModule abstraction.
- Adds enforceable contract so apps must prove they are real before being accepted.
- Enables `npm run apps:validate` and `npm run apps:audit` to catch shells early.
- Minimal risk to existing Higgsfield routing/import behavior.

Non-goals for this phase:
- No Vite/Webpack config changes.
- No conversion of existing apps (Remix Go, Vibe Workflow, Open Pomelli, AI Headshot Generator, Marketing Studio, Workflows, Agents, Design Agent remain untouched).
- No complex plugin or loader rewrite.

## Required Folder Contract
Every real Higgsfield app module MUST follow exactly:

```
src/apps/[app-id]/
  index.jsx          # or index.js (main export)
  manifest.js
  routes.js
  FEATURE_CHECKLIST.md
  components/
  hooks/             # conditional (see rules)
  services/
  adapters/          # optional but recommended for generation
  data/              # conditional (see rules)
  assets/
  styles.css
 ```

Apps that are purely informational or utility-based do not need `hooks/` or `data/` unless their manifest claims capabilities that require async state, generation, presets, templates, workflow configs, or agent configs. This prevents over-strict validation on simple apps.

## Manifest Shape Requirement
`manifest.js` MUST export:

```js
export const appManifest = {
  id: string,
  name: string,
  description: string,
  category: string,
  route: string,
  thumbnail: string,
  status: "production" | "partial" | "shell" | "disabled",
  sourceRepos: {
    upstream: string,
    fork: string
  },
  requiredCapabilities: string[],
  outputTypes: string[],
  handoffTargets: string[],
  requiredServices: string[]
};
```

Missing or malformed manifest → development warning + audit failure.

## FEATURE_CHECKLIST.md
Every app MUST include a filled `FEATURE_CHECKLIST.md` using the template from `templates/FEATURE_CHECKLIST.template.md`.

Key sections:
- Source Repos
- Required Screens
- Required Components (input, generate, preview, save-to-library, handoff)
- Required Services (API, storage, Supabase, MuAPI/OpenAI adapter, output handoff)
- Required Assets (thumbnail, icons, demos)
- Definition of Done (not a shell, route loads, workflow works, output saves/previews, build passes)

## Validation Rules (`scripts/validate-apps.mjs`)
- Scan `src/apps/*`
- Required files: `index.{js,jsx}`, `manifest.js`, `routes.js`, `FEATURE_CHECKLIST.md`
- Required folders: `components/`, `services/`, `assets/`
- Conditional:
  - `hooks/` if app claims generation/upload/workflow/agent/async state
  - `data/` if app claims presets/templates/node configs/agent templates/campaign templates/headshot styles/workflow configs
- Detect shell if:
  - Only has `index.*`
  - Renders only placeholder
  - No services/handlers
  - No manifest/routes/checklist
  - Claims generation without MuAPI/OpenAI service
  - Claims persistence without Supabase
  - Claims output without Library/handoff logic
  - Has buttons/forms but no submit/generate/run/save handlers

Exit code 1 on any shell/partial in strict mode.

## Audit Script (`scripts/audit-shell-apps.mjs`)
Outputs:
- `shell-app-audit.md`
- `shell-app-audit.json`

Report fields per app:
- id, status (complete/partial/shell/broken)
- missing files/folders/services/assets/routes/output-handling
- recommendation

## Registry / Loader Behavior
Minimal change only:
- On import/register, validate manifest shape.
- Development: clear console warning for incomplete records.
- If `status === "production"` but required files/services missing → throw clear dev error.
- Never silently accept incomplete app records.
- No change to production runtime behavior or existing router.

## Definition of Done for This Phase
- `scripts/validate-apps.mjs` and `scripts/audit-shell-apps.mjs` exist and run successfully.
- `apps:audit` produces a complete report.
- `apps:validate` correctly fails in strict mode when shell/partial apps are detected.
- `package.json` has `"apps:validate"` and `"apps:audit"`.
- `templates/FEATURE_CHECKLIST.template.md` created.
- Manifest shape enforced with warnings/errors.
- Audit report lists current shell/partial/complete apps.
- Existing app behavior (routing, imports, rendering) unchanged.
- `npm run build` still passes.
- No app conversions performed.

## Next Phase (after this spec)
Use audit report to fix one app at a time (e.g., `npm run apps:validate` must pass for Open Pomelli before proceeding).

## Risks & Mitigations
- Over-strict validation breaking legitimate simple apps → conditional rules + clear status levels.
- Audit false positives → human review of generated report before acting.

This design locks the contract and tooling so shell apps become impossible to accept silently.
