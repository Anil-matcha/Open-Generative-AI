# Supabase Deployment Complete Guide

## Current Status

✅ **Repository Loaded**: Open-Higgsfield-AI is cloned and ready
✅ **Dependencies Installed**: pnpm install completed
✅ **Dev Server Running**: http://localhost:8080
⚠️ **Supabase Credentials**: Need to be configured in .env
✅ **Migrations Prepared**: 26 SQL migration files ready
✅ **Edge Functions**: 35 functions ready to deploy

## Quick Setup Steps

### Step 1: Get Supabase Credentials

1. Go to **[supabase.com](https://supabase.com)** and log in
2. Create a new project (or use existing)
3. Wait for project to initialize
4. Go to **Settings → API** (or use Connect dialog)
5. Copy these values:

```bash
# Legacy keys (still supported) - from "API Keys" → "Legacy API Keys"
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OR new key format:
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLIC_KEY=sb_publishable_xxx
SUPABASE_SERVICE_KEY=sb_secret_xxx
```

6. Edit `.env` file and replace placeholders:

```bash
# Current .env has placeholders:
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Replace with actual values from your Supabase project
```

### Step 2: Deploy Database Migrations

**Method A: SQL Editor (Recommended for first-time setup)**

1. Generate combined SQL file:
   ```bash
   node scripts/combine-migrations.js > combined-migrations.sql
   ```

2. Go to Supabase Dashboard → SQL Editor

3. Copy the entire contents of `combined-migrations.sql`

4. Paste into SQL Editor and click **Run**

5. Wait for completion (should see "Success" messages)

**Method B: Using Supabase CLI** (if installed)

```bash
# Install CLI
npm i -g supabase

# Login
supabase login

# Link project (navigate to your project directory first)
cd /Users/shasheemoore/Downloads/Higgsfield
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Or deploy individual migrations
supabase db reset  # ⚠️ WARNING: This drops all data!
```

### Step 3: Deploy Edge Functions (Optional but Recommended)

The application includes 35 Edge Functions for serverless API endpoints:

```bash
# Deploy all functions
supabase functions deploy --all

# Or deploy individually
supabase functions deploy remix-api
supabase functions deploy muapi-webhook
supabase functions deploy director-agent
# ... etc
```

**Important**: Each function has its own environment variables. You need to set them:

1. Go to Supabase Dashboard → Edge Functions
2. Click on each function
3. Configure environment variables from `supabase/functions/.env.example`
4. Key variables needed:
   - `SUPABASE_URL` (auto-filled)
   - `SUPABASE_ANON_KEY` (auto-filled)
   - `OPENAI_API_KEY` (for AI functions)
   - `MUAPI_API_KEY` (for video generation)
   - `PUBLIC_SITE_URL` (your deployed site URL)
   - `MUAPI_WEBHOOK_URL` (webhook callback URL)

### Step 4: Verify Deployment

**Check Database:**
```bash
# In Supabase Dashboard, go to Table Editor
# You should see tables like:
# - profiles
# - workspaces
# - campaigns
# - contacts
# - personalized_scripts
# - generation_jobs
# - personalized_videos
# - templates (for remix-api)
# - projects
# - media_assets
# - etc.
```

**Test API:**
```bash
# Test templates endpoint (after deploying remix-api function)
curl https://your-project.supabase.co/functions/v1/remix-api/templates \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Should return JSON list of templates
```

**Check Functions:**
```bash
# View function logs
supabase functions logs remix-api --limit 50
```

## Migration Details

### Database Schema Overview

The migrations create a comprehensive multi-tenant system:

**Core Tables:**
- `profiles` - User profiles
- `workspaces` - Multi-tenant workspaces
- `workspace_members` - Team collaboration
- `campaigns` - Video campaign definitions
- `contacts` - Lead/contact management
- `personalized_scripts` - AI-generated scripts
- `generation_jobs` - Async job tracking
- `personalized_videos` - Generated videos
- `video_events` - Analytics/events
- `leads` - Lead capture
- `brand_kits` - Branding assets
- `usage_credits` - Billing/quotas
- `api_keys_optional_byok` - BYOK support

**Remix API Tables:**
- `templates` - Video templates with Popcorn.js data
- `template_categories` - Template categorization
- `projects` - User projects
- `media_assets` - Uploaded media files

**ViMax Tables:**
- `videos` - Video storage
- `scenes` - Scene breakdowns
- `shots` - Individual shots
- `style_references` - Character/style references
- `generation_pipelines` - Pipeline definitions

**Storage Buckets:**
- `templates` - Template thumbnails
- `media` - User uploads
- `generations` - AI-generated content
- `exports` - Final video exports

### Edge Functions Overview

35 serverless functions handle all backend operations:

**Core Services:**
- `remix-api` - Main template/project API
- `muapi-proxy` - Proxy for MuAPI AI services
- `muapi-webhook` - Webhook handler for async callbacks
- `user-service` - User auth/profile
- `project-service` - Project CRUD
- `template-service` - Template management

**AI Agent Functions:**
- `director-agent` - Video agent orchestration
- `videoagent` - Video processing agent
- `frame-agent` - Frame extraction
- `enhance-text` - Text enhancement
- `create-share` - Social sharing
- `generate-personalized-scripts` - Script generation
- `generate-video-proxy` - Video preview generation

**Media Processing:**
- `process-upload` - File upload handling
- `video-upload` - Video processing pipeline
- `media-service` - Media transformations
- `ltx-processor` - LTX model processing
- `cinegen-processor` - CineGen integration
- `yucut-processor` - YuCut integration
- `cutai-processor` - CutAI processing
- `cutai-scene-analyze` - Scene analysis
- `cutai-export-json` - Export to JSON
- `cutai-export-pdf` - Export to PDF

**Business Logic:**
- `lead-processor` - Lead scoring/enrichment
- `score-lead` - Lead scoring
- `import-contacts` - Contact import
- `generate-followups` - Follow-up generation
- `email-service` - Email sending
- `track-event` - Analytics tracking

**Specialized:**
- `rendiv-render` - Rendiv rendering
- `start-muapi-workflow` - Workflow initiation
- `start-muapi-media-job` - Media job start
- `storyboarder-scenes` - Scene generation
- `storyboarder-shots` - Shot generation
- `ai-video-prompt-generator` - Prompt generation

## Environment Variables Reference

### Frontend (VITE_ prefix - exposed to browser)

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase key | Yes | - |
| `VITE_MUAPI_URL` | MuAPI endpoint URL | No | `https://api.muapi.ai` |
| `VITE_FAL_KEY` | fal.ai API key | No | - |
| `VITE_OPENAI_KEY` | OpenAI API key | No | - |
| `VITE_ANTHROPIC_KEY` | Anthropic API key | No | - |
| `VITE_PUBLIC_SITE_URL` | Public site URL | Conditional | - |

### Backend (Server-only - NOT exposed)

| Variable | Purpose | Used By | Required |
|----------|---------|----------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB access | Migrations, server code | Yes |
| `OPENAI_API_KEY` | OpenAI integration | AI functions | No |
| `MUAPI_API_KEY` | MuAPI authentication | Video generation | No |
| `STRIPE_SECRET_KEY` | Stripe billing | Payment functions | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | Payment webhooks | No |
| `MUAPI_WEBHOOK_URL` | Callback URL for video completions | muapi-webhook | Conditional |

## Common Issues & Solutions

### Issue 1: "relation does not exist" errors
**Solution**: Run migrations first! The database tables haven't been created yet.

### Issue 2: RLS policy violations
**Solution**: Make sure you're using correct credentials. Service role key bypasses RLS for admin operations.

### Issue 3: Edge Functions not found (404)
**Solution**: Deploy functions with `supabase functions deploy <function-name>`

### Issue 4: Functions can't access database
**Solution**: Check that `SUPABASE_SERVICE_ROLE_KEY` is set in function environment variables

### Issue 5: OpenAI/MuAPI calls failing
**Solution**: Set `OPENAI_API_KEY` and `MUAPI_API_KEY` in function environment variables

### Issue 6: Uploads failing
**Solution**: Create storage buckets in Supabase Storage:
```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name) VALUES 
  ('templates', 'templates'),
  ('media', 'media'),
  ('generations', 'generations'),
  ('exports', 'exports')
ON CONFLICT DO NOTHING;
```

## Post-Deployment Checklist

- [ ] Database tables exist (check Table Editor)
- [ ] RLS policies enabled (check Policies tab)
- [ ] Storage buckets created
- [ ] Edge Functions deployed (check Edge Functions page)
- [ ] Function environment variables set
- [ ] Test API endpoints (use Postman or curl)
- [ ] Test file uploads
- [ ] Test AI generation (if credentials configured)
- [ ] Check function logs for errors
- [ ] Set up custom domain (optional)
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring/alerts

## Rollback Instructions

If something goes wrong:

### Rollback Database
```sql
-- Option 1: Reset entire database (⚠️ destroys all data!)
supabase db reset

-- Option 2: Manually drop specific tables
DROP TABLE IF EXISTS personalized_videos CASCADE;
DROP TABLE IF EXISTS generation_jobs CASCADE;
-- ... etc

-- Option 3: Use migration history to undo specific migrations
-- (Not implemented - you'd need to write DOWN migrations)
```

### Rollback Functions
```bash
# Delete specific function
supabase functions delete remix-api

# Or disable via dashboard
```

## Next Steps After Deployment

1. **Configure Custom Domain** (optional)
   - In Supabase Settings → Domain
   - Add custom domain
   - Update DNS records

2. **Set Up Monitoring**
   - Supabase logs are automatic
   - Set up alerting for errors
   - Monitor function invocations

3. **Configure CORS** (if needed)
   - Edit `vite.config.js` proxy settings
   - Or update function CORS headers

4. **Production Build**
   ```bash
   pnpm run build
   # Deploy dist/ to Vercel/Netlify
   ```

5. **Set Up CI/CD** (optional)
   - GitHub Actions for automatic deployment
   - Preview deployments for PRs

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Issues: https://github.com/deangilmoreremix/Open-Higgsfield-AI/issues

---

**Last Updated**: 2026-05-10  
**Project Version**: 1.0.0  
**Supabase Schema Version**: 20260507
