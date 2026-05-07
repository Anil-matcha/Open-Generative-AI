# Marketing Studio Setup (Why pnpm vs npm)

## Why this repo uses `pnpm`
This repository is a multi-workspace monorepo and contains `workspace:*` and local `file:` linked packages.
`pnpm` is the expected package manager for this setup because it resolves workspace dependencies consistently.

Using plain `npm install` can fail on workspace protocol/package linking in this repo layout.

## Recommended commands
```bash
# install dependencies
pnpm install

# start app
pnpm dev

# open route
# http://localhost:5173/#/marketing-studio
```

## npm compatibility note
If you must use npm, use it only for non-workspace, already-installed flows (e.g., `npm run dev` after a successful `pnpm install`).
For fresh installs, use `pnpm install`.

## Marketing Studio env
Set:
- `VITE_OPEN_POMELLI_APP_URL` (optional standalone embed)
- `VITE_MARKETING_STUDIO_PROXY_URL` (required for analyze/generate API calls)
