# VideoRemix MVP Implementation (Supabase + Netlify + OpenAI + MuAPI)

## What was added
- Supabase migration with schema + RLS for profiles, workspaces, campaigns, contacts, scripts, jobs, videos, events, leads, and workflow registry.
- Supabase Edge Function scaffolds:
  - generate-personalized-scripts
  - start-muapi-workflow
  - import-contacts
  - generate-followups
  - score-lead
- Netlify Functions:
  - muapi-webhook
  - track-video-event
  - submit-lead-form
  - stripe-webhook

## Architecture notes
- Browser only uses anon key and authenticated client.
- OpenAI/MuAPI keys remain server-side in Edge/Netlify functions.
- Public endpoints are isolated to Netlify Functions.
- Data access is workspace-scoped through RLS.

## Upstream reference usage
The upstream repo `ZapDigits/videco_ai_platform` should be treated as a UX/product benchmark only.
Suggested parity map:
- Video Library → `personalized_videos`
- Campaign + Personalization workflow → `campaigns`, `contacts`, `personalized_scripts`
- AI Generation queue → `generation_jobs`
- Public pages + tracking → `personalized_videos`, `video_events`, `leads`
- Team/workspace + billing → `workspaces`, `workspace_members`, `profiles.plan`

## Setup
1. Apply migration:
   - `supabase db push`
2. Deploy edge functions:
   - `supabase functions deploy generate-personalized-scripts`
   - `supabase functions deploy start-muapi-workflow`
   - `supabase functions deploy import-contacts`
   - `supabase functions deploy generate-followups`
   - `supabase functions deploy score-lead`
3. Deploy Netlify Functions with env vars.

## Required environment variables
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- MUAPI_API_KEY
- PUBLIC_SITE_URL
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
