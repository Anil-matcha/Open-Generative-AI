import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
serve(async (req) => {
  const body = await req.json()
  const score = Math.min(100, (body.views ?? 0) * 5 + (body.plays ?? 0) * 10 + (body.cta_clicks ?? 0) * 20 + (body.form_submits ?? 0) * 25)
  const status = score > 70 ? 'hot' : score > 35 ? 'warm' : 'cold'
  return Response.json({ score, status, next_action: status === 'hot' ? 'Book call now' : 'Send follow-up email' })
})
