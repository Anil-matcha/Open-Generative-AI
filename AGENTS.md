# Project context and working preferences

Read this before starting any task in this repository or its submodules.

## Communication
- Summaries and chat responses should be in French. Code, commits, filenames, and identifiers stay in English.
- State assumptions explicitly before implementing. If multiple interpretations exist, present them instead of picking silently. Stop and ask if something is unclear.
- Touch only what the task requires: no unrelated refactors, cleanup, or abstractions. Flag dead code you notice instead of deleting it.
- No speculative features, configurability, or error handling for scenarios that can't happen.

## Repositories

### open-generative-ai (this repo root)
- `origin` = `https://github.com/Anil-matcha/Open-Generative-AI.git` — **no write access** (account `dvd94500-coder` gets 403 on direct push).
- `fork` = `https://github.com/dvd94500-coder/Open-Generative-AI.git` — personal fork, already configured as a remote.
- **Required workflow: fork + branch + Pull Request. Never push directly to `origin main`.**
- Package manager: **npm** (`package-lock.json` is authoritative — not pnpm/yarn).
- Full setup: `npm run setup` (inits git submodules + `npm install` + builds packages). Do not use `pnpm install`.
- Submodules: `packages/Open-AI-Design-Agent`, `packages/Open-Poe-AI`, `packages/Vibe-Workflow`. `packages/studio` is a regular (non-submodule) workspace package.
- Stack: Next.js (app router) + Electron desktop build; `studio` = React components for AI image/video generation.

### packages/Open-AI-Design-Agent (also a standalone project)
- Independent repo: `https://github.com/Anil-matcha/Open-AI-Design-Agent`
- Setup: `npm install` (no custom setup script).

## Code rules (always apply)

**Immutability** — never mutate, always return new objects:
```js
// WRONG
function updateUser(user, name) { user.name = name; return user }
// CORRECT
function updateUser(user, name) { return { ...user, name } }
```

**File organization** — many small files over few large ones: 200–400 lines typical, 800 max. Organize by feature/domain, not technical type.

**Error handling** — always comprehensive, with a clear user-facing message (try/catch, log, throw a descriptive error).

**Input validation** — always validate user input (zod or equivalent) at system boundaries.

**Before marking work complete:** functions < 50 lines, files < 800 lines, no nesting > 4 levels, no leftover `console.log`, no hardcoded values, no mutation.

## Git & commits
- Format: `<type>: <description>` (feat, fix, refactor, docs, test, chore, perf, ci).
- Only commit/push/open a PR when explicitly asked.
- PRs: review the full branch history (not just the latest commit), include a test plan.

## Tests
- Target 80%+ coverage. Use TDD for substantial features/bugfixes: failing test → minimal implementation → passing test → refactor.

## Security
- No hardcoded secrets (use `process.env`). Validate inputs, parameterize queries, escape HTML, verify auth/authz before committing.

## Tooling already set up on this machine
- `gh` (GitHub CLI) installed at `~/.local/bin/gh`, authenticated as `dvd94500-coder`.
- The `dvd94500-coder/Open-Generative-AI` fork exists and is already configured as the `fork` git remote in this repo.

## Handoff between agents (Claude ↔ Codex)
The user alternates between Claude and Codex on this project depending on usage/credits. **Read [HANDOFF.md](./HANDOFF.md) at the start of every session** to see what the other agent (or a past session) last did and what's next. **Update it before ending a session** if the task isn't finished, so whichever agent picks it up next has full context.

---
This file is the shared context for any coding agent (Claude, Codex, etc.). Also check for a more specific `CLAUDE.md`/`AGENTS.md` deeper in the tree if working inside a submodule — repo-specific rules take precedence over this summary.
