# Universal Personalization System — Implementation Summary

**Status**: ✅ Complete and Integrated

**Date**: May 16, 2026

---

## Overview

A universal personalization popup module available across all video/image applications in the Higgsfield AI Video Agency platform. Users can personalize each video and content they create via a floating "🤖 Personalizer" button or contextual buttons in Video Generator, Video Library, Timeline Editor, and Campaign Builder.

The system supports:
- Public profile scanning via Maigret (500+ sites) with GitHub fallback
- AI-generated personalized content (cold emails, video scripts, proposals)
- Token-based merge fields for dynamic content
- Multi-step 8-step wizard workflow
- Report exports (HTML, JSON, Markdown, CSV)
- Deep linking and embeddable widget

---

## Architecture

### Database Schema (Supabase)

Tables created:
- `personalizer_apps` — Registry of 10 apps (AI Video Agency, Image Studio, Video Studio, Cinema Studio, Effects Studio, Character Studio, Influencer Studio, Audio Studio, Timeline Editor, Video Outreach)
- `personalization_projects` — User projects with target info, scan references, status
- `profile_scan_results` — Maigret/GitHub scan data (JSONB)
- `personalization_outputs` — Generated AI content per project
- `personalizer_templates` — 18 prompt templates (system/user) per app/mode

All tables have Row Level Security policies. Users can only access their own data.

### API Endpoints (Netlify Functions)

- `POST /api/personalizer/scan` — Scan public profiles (Maigret worker + GitHub fallback)
- `POST /api/personalizer/generate` — Generate AI content (OpenAI GPT-4 Turbo primary, Gemini Pro fallback)
- `POST /api/personalizer/save` — Save project
- `GET /api/personalizer/apps` — List available apps
- `GET /api/personalizer/history` — Paginated project history
- `GET /api/personalizer/output/:id` — Get specific output
- `POST /api/personalizer/send-to-app` — Generate deep link

### Client Components

- `PersonalizerDialog.tsx` — Main 8-step popup (React + Framer Motion)
- `GlobalPersonalizerButton.tsx` — Floating action button (bottom-right)
- `PersonalizerPage.tsx` — Deep link route handler
- `usePersonalizerStore.jsx` — State management hook with persistence
- `personalizer-api.js` — API client with auth + rate limiting

### Integration Points

1. **App Shell** (`src/main.js`) — Global floating button injected on all pages
2. **Router** (`src/lib/router.js`) — `personalizer` route added
3. **Modal Manager** (`src/lib/enhancedModalManager.js`) — `PersonalizerModal` registered
4. **Timeline Editor** (`src/components/TimelineEditorPage.js`) — Rail action + click handler
5. **Video Generator** (`src/routes/VideoGenerator.tsx`) — "🤖 Personalize Content" button
6. **Video Library** (`src/routes/VideoLibrary.tsx`) — Header "🤖 Personalize" button
7. **Campaign Builder** (`src/routes/CampaignBuilder.tsx`) — Header + inline buttons

### Embeddable Widget

`public/widget.js` provides a `HiggsfieldPersonalizer` class for external sites:
```javascript
const p = new HiggsfieldPersonalizer();
p.init({ appId: 'ai-video-agency', mode: 'cold-email' }).open();
```

---

## 8-Step Wizard Flow

1. **Select App & Mode** — Choose from 10 apps and 9 modes (cold email, video script, proposal, sales page, thumbnail, content campaign, agency pitch, lead summary, video script)
2. **Target Info** — Enter username(s), company (supports multiple usernames for recursive scanning)
3. **Public Scan (Optional)** — Configure Maigret scan (top N sites, timeout, permutations, recursive, parsing, domains, tag filtering with include/exclude/neutral cycle)
4. **Manual Notes** — Add context notes
5. **Generate** — Review settings and trigger AI generation
6. **Output** — View generated content with copy/save options
7. **Save** — Persist to project history
8. **Send to App** — Copy or deep-link to target app

---

## AI Generation

- **Primary**: OpenAI GPT-4 Turbo (temperature 0.7, max 2000 tokens)
- **Fallback**: Google Gemini Pro
- **Templates**: 18 seeded templates (system + user prompts) per app/mode
- **Variable substitution**: `{{targetName}}`, `{{targetCompany}}`, `{{manualNotes}}`, `{{scanData}}`, `{{offer}}`, `{{goal}}`, `{{tone}}`, `{{cta}}`

---

## Public Profile Scanning

- **Primary**: Maigret worker (FastAPI on Render.com)
  - Loads Maigret database at startup
  - Semaphore-limited concurrent scans (max 5)
  - 30s timeout per scan, 60s overall
  - Returns normalized platforms with URL, status, rank, HTTP status, optional ids_data
- **Fallback**: GitHub API user lookup
- **Rate limit**: 20 requests/minute per user (enforced via Supabase count)

---

## Report Exports

- **HTML** — Styled table with summary stats + platform rows
- **JSON** — Raw scan data
- **Markdown** — GitHub-flavored table
- **CSV** — Spreadsheet-compatible with headers

---

## Security & Compliance

- JWT verification on all API calls
- Row Level Security on all tables
- Rate limiting (20 req/min)
- Timeout wrappers on all external API calls
- Input validation (username regex, length limits)
- Disclaimer footer on every dialog
- AbortController support for cancellation

---

## Environment Variables

```
MAIGRET_WORKER_URL=https://your-maigret-worker.onrender.com
MAIGRET_WORKER_SECRET=<generated>
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
GITHUB_TOKEN=ghp_...
ALLOWED_ORIGINS=https://app.higgsfield.ai,https://studio.higgsfield.ai
```

---

## Deployment

1. Run migration: `supabase/migrations/20260516000000_create_personalizer_tables.sql`
2. Grant access: `psql -f grant-personalizer-access.sql`
3. Deploy Maigret worker to Render.com (see `render.yaml`)
4. Deploy Netlify function: `netlify/functions/personalizer-api.js`
5. Set environment variables in Netlify dashboard
6. Build & deploy: `npm run build`

---

## Usage

### Floating Button
Click the 🤖 icon in the bottom-right corner on any page to open the personalizer.

### Timeline Editor Rail
Click "🤖 AI Personalizer" in the floating rail.

### Video Apps
- Video Generator: "🤖 Personalize Content" button next to Generate
- Video Library: "🤖 Personalize" button in header
- Campaign Builder: "🤖 AI Personalizer" button in header

### Deep Link
```
https://app.higgsfield.ai/#/personalizer?app=ai-video-agency&mode=cold-email&target=johnsmith
```

### Programmatic (Widget)
```html
<script src="https://app.higgsfield.ai/widget.js" data-auto-init="true" data-app-id="ai-video-agency" data-mode="cold-email"></script>
```

---

## Files Summary

**New Files (12)**:
- `supabase/migrations/20260516000000_create_personalizer_tables.sql`
- `src/lib/personalizer-api.js`
- `src/hooks/usePersonalizerStore.jsx`
- `src/components/personalizer/PersonalizerDialog.tsx`
- `src/components/personalizer/GlobalPersonalizerButton.tsx`
- `src/components/personalizer/index.ts`
- `src/pages/PersonalizerPage.tsx`
- `netlify/functions/personalizer-api.js`
- `public/widget.js`
- `grant-personalizer-access.sql`
- `grant-personalizer-access.mjs`
- `.env.example.personalizer`

**Modified Files (7)**:
- `src/main.js`
- `src/lib/router.js`
- `src/lib/enhancedModalManager.js`
- `src/components/TimelineEditorPage.js`
- `src/routes/VideoGenerator.tsx`
- `src/routes/VideoLibrary.tsx`
- `src/routes/CampaignBuilder.tsx`

---

## Lint & Typecheck

- **ESLint**: 0 errors, 2 pre-existing warnings (unused imports in VideoGenerator.tsx/VideoLibrary.tsx)
- **TypeScript**: 0 errors on all new/modified files
- **Prettier**: Consistent formatting applied

---

## Next Steps (Optional Enhancements)

1. Add real-time subscription for scan progress updates
2. Add voiceover generation mode
3. Add thumbnail generation mode
4. Add A/B test variant generation
5. Add CRM integration (HubSpot, Salesforce)
6. Add analytics dashboard for personalization performance
7. Add team collaboration (shared projects)
8. Add template marketplace

---

**Implementation Complete** ✅
All core functionality delivered and integrated across the platform.
