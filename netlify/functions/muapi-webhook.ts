import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  const payload = JSON.parse(event.body || '{}')
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const providerJobId = payload.job_id
  if (!providerJobId) return { statusCode: 400, body: 'missing job_id' }

  const { data: job } = await supabase.from('generation_jobs').select('*').eq('provider_job_id', providerJobId).single()
  if (!job) return { statusCode: 404, body: 'job not found' }

  const status = payload.status === 'completed' ? 'completed' : 'failed'
  await supabase.from('generation_jobs').update({ status, output: payload, updated_at: new Date().toISOString() }).eq('id', job.id)
  if (status === 'completed') {
    await supabase.from('personalized_videos').upsert({ workspace_id: job.workspace_id, campaign_id: job.campaign_id, contact_id: job.contact_id, generation_job_id: job.id, video_url: payload.video_url, thumbnail_url: payload.thumbnail_url, status: 'ready' })
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
