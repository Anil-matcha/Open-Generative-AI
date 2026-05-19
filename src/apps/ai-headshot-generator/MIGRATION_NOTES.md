# AI Headshot Generator Migration Notes

Upstream: SamurAIGPT/ai-headshot-generator (Next.js SaaS with Stripe/Prisma/NextAuth)
Fork: deangilmoreremix/ai-headshot-generator
Stripped auth/billing/Prisma. Uses Higgsfield session + Supabase Storage.
Full upload → preset → generate → preview → Library/Edit Studio handoff.
No standalone SaaS takeover.