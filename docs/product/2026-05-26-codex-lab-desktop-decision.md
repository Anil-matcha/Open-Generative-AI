# Codex Lab Desktop Decision

Date: 2026-05-26
Task: DSK-58

## Decision

Codex Lab stays Web-only for this migration cycle and is explicitly hidden from the Electron desktop shell.

## Rationale

Codex Lab is an internal experiment page built as a Next.js server page. It reads `experiments/codex-internal-multimodal-lab/output/asset-index.json`, documents a human/Codex imagegen workflow, and states that it does not call runtime product APIs. Moving it into the desktop renderer would require a local asset-path adapter and a separate execution model, but it would not improve the current desktop parity target for Image, Video, Marketing, Workflow, Agent, Apps, Provider, API Health, Task Center, or local inference.

## Acceptance

- Web route `/codex-lab` remains available and is covered by Web smoke.
- Desktop shell does not expose a Codex Lab tab, button, or route.
- Future desktop inclusion requires a new task that defines local asset loading, script execution, and packaging behavior for `experiments/codex-internal-multimodal-lab`.

## Verification

`npm run test:studio-shell-smoke` checks both sides of the decision:

- Desktop: no `Codex Lab` / `Codex 多模态实验台` text is exposed in the shared shell.
- Web: `/codex-lab` renders `Codex 多模态实验台`, `任务单`, `功能测试矩阵`, and `项目资产落点`.

