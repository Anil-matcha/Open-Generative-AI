# Contributing to Open Generative AI

Thanks for contributing. This guide covers the setup steps that are easy to
get wrong in this repo, so a first pull request does not fail on setup alone.

## Before you start

- This repo is MIT licensed. By opening a pull request you agree your
  contribution can be distributed under the same license.
- Keep each pull request to **one concern** (one bug, one docs fix, one
  component). Do not bundle unrelated changes.
- There is currently **no CI** in this repo, so the maintainer cannot check
  your work automatically. Run the checks below yourself before opening a PR
  and say in the PR description which commands you ran and what they reported.
- Do not commit API keys, tokens, or any secret. A MuAPI key is entered in
  the app itself (see README Quick Start) and must never be pasted into code,
  config, or a PR description.

## Setup (from source)

Prerequisites: Node.js v18+ (README Quick Start). A MuAPI key is only needed
for cloud generations; local-model and test work does not need one.

```bash
# Clone WITH submodules — this is required, not optional.
# The workflow, agent, and design-agent packages live in submodules, and a
# plain clone leaves those directories empty, which breaks the build.
git clone --recurse-submodules https://github.com/Anil-matcha/Open-Generative-AI.git
cd Open-Generative-AI

# If you already cloned without --recurse-submodules, run this once:
git submodule update --init --recursive

# Install dependencies AND build the workspace packages
# (studio, workflow, agents). `npm install` alone is not enough.
npm run setup
```

Then start one entry point:

```bash
npm run electron:dev   # Desktop app (Electron + Vite) — recommended
npm run dev            # Web version (Next.js) → http://localhost:3000
```

If Next.js reports `Couldn't find a 'pages' directory`, check that you are
in the repo root (the directory containing `app/`, `package.json`, and
`next.config.mjs`) and that the submodule directories under `packages/` are
not empty. Re-run `npm run setup` if they are.

## Tests

The test suite covers local inference (Electron / Wan2GP) only. It uses
Node's built-in test runner and a fake Wan2GP fixture, so it needs no API
key and makes no network calls to MuAPI.

```bash
npm test
```

This runs `node --test`, which discovers the test files in `tests/`
(8 files, 50 tests at the time this guide was added, verified on Node 24).

Note: `node --test tests/` does **not** work as a script on Node 24 — Node
treats `tests/` as a single entry file instead of a directory. That is why
the `test` script uses the bare `node --test` form. Do not "fix" it back
to `node --test tests/` without verifying it on your Node version first.

There are currently no tests for the MuAPI client, the studio components,
or the Next.js proxy routes. If your change touches one of those areas,
explain in your PR how you verified it manually (steps + what you saw),
since `npm test` will not cover it.

## Lint

```bash
npm run lint
```

Run it before opening a PR. If lint reports a pre-existing failure that is
unrelated to your change, say so in the PR description instead of fixing
unrelated files in the same PR.

## Pull request checklist

- [ ] One concern only, with a clear title and description
- [ ] `npm test` passes (or, for docs-only changes, state that no code changed)
- [ ] `npm run lint` passes, or unrelated failures are noted
- [ ] No API keys, tokens, or secrets added
- [ ] Docs updated if behaviour, setup, or a command changed
- [ ] PR description says which commands you ran and their results

## What to avoid in a first PR

- Do not edit `packages/studio/src/models.js` to add or rename models unless
  you have verified the model id against the provider — it is a 35k-line
  data file and a wrong id breaks generation silently.
- Do not edit both UI copies of a studio (the Next.js app in `app/` and the
  Vite/Electron app in `src/`) in one PR without checking which one the
  change belongs to.
- Do not loosen Electron security defaults (`webSecurity`, `contextIsolation`,
  `nodeIntegration`) or bypass upload-proxy validation to make something work.
- Do not change safety, moderation, lip-sync, body-swap, or influencer
  behaviour without explicit maintainer direction.

## Questions

If you are unsure whether an issue is still open, unassigned, or already
has a linked PR, ask on the issue first rather than starting work that
someone else has already claimed.
