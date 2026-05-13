# Contributing

Thanks for considering a contribution. Open Pomelli is a small, opinionated codebase — keeping it small is part of the point.

## Setup

```bash
git clone https://github.com/SamurAIGPT/Open-Pomelli.git
cd Open-Pomelli
cp .env.example .env   # fill MUAPI_API_KEY (sandbox keys are free)
npm install
npx playwright install chromium
npx prisma db push
npm run dev
```

## Conventions

- **All AI calls go through `src/lib/muapi.ts`.** Never `fetch` MuAPI from anywhere else.
- **No new providers.** This project intentionally targets only MuAPI. If you want multi-provider switching, fork it.
- **No auth, no OAuth, no queues.** This is a local-first single-user tool. PRs adding NextAuth, BullMQ, Redis, OAuth publishing, or multi-tenant features will be closed.
- **TypeScript strict mode is on.** No `any` unless unavoidable, no `@ts-ignore`.
- **Array fields on SQLite are JSON strings.** PATCH endpoints accept arrays in the body and stringify before saving — keep that pattern.
- **Generation is synchronous.** Don't add a queue. The client side already does parallel requests with bounded concurrency.

## Pull requests

1. Fork, branch from `main`.
2. Run `npx tsc --noEmit` and verify the dev server boots.
3. If you touch `prisma/schema.prisma`, mention `npx prisma db push` in the PR description.
4. Keep PRs focused — one feature or fix per PR.

## Reporting bugs

Include: the URL or input that triggered the bug, the route that failed, browser console + server stderr, and your `node --version` / `npm --version`.

## Areas that welcome contribution

- HTML-to-PNG/MP4 export of canvas-edited assets.
- New Photo Studio categories or styles in `src/lib/photo-styles.ts`.
- New platform formats in `src/lib/platforms.ts`.
- Better default motion prompts in `src/lib/animate.ts`.
- A11y fixes on the canvas editor and form controls.
