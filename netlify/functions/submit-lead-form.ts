import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
export const handler: Handler = async (event) => {
  const body = JSON.parse(event.body || '{}')
  if (!body.campaign_id || !body.video_id || !body.email) return { statusCode: 400, body: 'missing required fields' }
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  await supabase.from('leads').insert(body)
  await supabase.from('video_events').insert({ campaign_id: body.campaign_id, video_id: body.video_id, contact_id: body.contact_id, event_type: 'form_submit', metadata: { source: 'public_form' } })
  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
