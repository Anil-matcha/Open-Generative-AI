import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
export const handler: Handler = async (event) => {
  const payload = JSON.parse(event.body || '{}')
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  if (payload.user_id && payload.plan) {
    await supabase.from('profiles').update({ plan: payload.plan }).eq('id', payload.user_id)
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
