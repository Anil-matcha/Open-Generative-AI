import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
export const handler: Handler = async (event) => {
  const body = JSON.parse(event.body || '{}')
  if (!body.video_id || !body.campaign_id || !body.event_type) return { statusCode: 400, body: 'invalid payload' }
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: video } = await supabase.from('personalized_videos').select('id').eq('id', body.video_id).single()
  if (!video) return { statusCode: 404, body: 'video not found' }
  await supabase.from('video_events').insert(body)
  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
