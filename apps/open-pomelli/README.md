# Open Pomelli

Open-source alternative to Google's Pomelli. Paste any website URL → get an editable Brand DNA, on-brand campaign concepts, platform-specific creatives, AI product photography, and short-form videos. Self-hosted, single-user, no auth, no cloud queues — runs locally on SQLite.

All AI calls (text, vision, image, image-edit, video) route through a single provider: [MuAPI](https://muapi.ai). Free **sandbox keys** are available for testing.

## Features

- **Brand DNA extraction** — paste a URL, Playwright scrapes the site, the screenshot is uploaded to MuAPI, and `gpt-5-nano` (text + vision) merges with CSS-extracted colors / fonts / logo into an editable brand profile.
- **Editable DNA review** — chips for tone / personality / messages, native color pickers for primary and secondary palettes.
- **Campaign generation** — pick a goal (product launch, lead gen, awareness, engagement, thought leadership, sales) and an optional direction → 4 distinct on-brand concepts.
- **Platform-specific asset generation** — one click produces ready-to-post creatives across **8 formats** (Instagram feed/story, LinkedIn, Facebook ad, X/Twitter, web banner, email header, YouTube thumbnail), each with its own aspect ratio, copy word-caps, and tone. Logo (when detected) is passed as a reference image to `nano-banana-edit` for brand consistency.
- **In-browser canvas editor** — every generated asset opens an editor with a 9-position grid for headline / body / CTA blocks, controls for size / color / background / font / alignment. Swap the AI image, regenerate a clean (text-free) background, or upload your own.
- **AI Photo Studio** — **6 categories × 5 styles = 30 product-photography presets** (Studio white, marble clean, urban street, golden hour, restaurant plated, scandi living, dark techy, …). Powered by `nano-banana-2-edit` with the product photo and brand logo as references.
- **Animate** — turn any asset, photoshoot, or fresh upload into a 3–12 second video via `seedance-lite-i2v`. 480p / 720p / 1080p. Aspect ratio inherits from the source frame, so 9:16 stories drop right in.

## Quickstart

```bash
git clone https://github.com/SamurAIGPT/Open-Pomelli.git
cd Open-Pomelli

cp .env.example .env
# Fill MUAPI_API_KEY (sandbox keys are free at muapi.ai)

npm install
npx playwright install chromium
npx prisma db push
npm run dev
```

Open http://localhost:3000 and paste a website URL.

## Stack

- **Framework**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4
- **Storage**: SQLite via Prisma (single `dev.db` file, zero-config)
- **Scraping**: Playwright (headless Chromium)
- **AI provider**: MuAPI (single client at `src/lib/muapi.ts`)

No Postgres, Redis, BullMQ, or Docker required. No auth, no OAuth. One-machine, one-user.

## MuAPI endpoints used

| Capability | Endpoint |
| --- | --- |
| File upload | `POST /upload_file` (multipart) |
| Text + vision | `POST /gpt-5-nano` |
| Image generation | `POST /nano-banana`, `POST /nano-banana-edit` |
| Premium image (Photo Studio) | `POST /nano-banana-2`, `POST /nano-banana-2-edit` |
| Image-to-video | `POST /seedance-lite-i2v` |
| Text-to-video | `POST /seedance-lite-t2v` |
| Result polling | `GET /predictions/{request_id}/result` |

Auth is sent via the `x-api-key` header.

## Architecture

```
src/
  app/
    page.tsx                                     # URL input + entry points
    brand/[id]/                                  # editable Brand DNA
    brand/[id]/campaigns/new/                    # goal picker
    brand/[id]/photo-studio/                     # brand-aware product photography
    campaign/[id]/                               # 4 concepts + asset generation
    asset/[id]/edit/                             # canvas editor
    photo-studio/                                # standalone product photography
    animate/                                     # image-to-video
    api/                                         # all server routes
  lib/
    muapi.ts                                     # the only MuAPI client
    scraper.ts                                   # Playwright site scraper
    brand-analyzer.ts                            # text + vision DNA orchestrator
    campaign-generator.ts                        # 6 goals → 4 concepts
    asset-generator.ts                           # copy + image per asset
    platforms.ts                                 # 8-platform catalog
    layout.ts                                    # canvas overlay schema
    photo-styles.ts                              # 6 categories × 5 styles
    photo-studio.ts                              # photoshoot orchestrator
    animate.ts                                   # i2v orchestrator
    colors.ts, prisma.ts                         # utils
prisma/schema.prisma                             # BrandDNA, Campaign, Asset, Photoshoot, Animation
```

### Conventions
- Every AI call goes through `src/lib/muapi.ts` — never `fetch` MuAPI elsewhere.
- Array fields on SQLite rows are stored as JSON strings; PATCH endpoints accept arrays and stringify on the server.
- Generation is synchronous: routes block until MuAPI returns, the client paginates with N parallel requests (concurrency 2–3) and shows live per-task progress.

## Roadmap ideas

- HTML-to-PNG/MP4 export for canvas-edited assets
- Optional OAuth publishing to Meta / X / LinkedIn (currently out of scope)
- Multi-brand workspace switcher
- Template library for Photo Studio styles
- Veo-based Animate when MuAPI exposes it

PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
