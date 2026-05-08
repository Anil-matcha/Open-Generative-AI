import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? ''
  const { campaignId, contactId, workflowId, inputs } = await req.json()
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: campaign } = await service.from('campaigns').select('id,workspace_id').eq('id', campaignId).single()
  const { data: membership } = await service.from('workspace_members').select('id').eq('workspace_id', campaign?.workspace_id).eq('user_id', userData.user.id).maybeSingle()
  if (!campaign || !membership) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data: job } = await service.from('generation_jobs').insert({ workspace_id: campaign.workspace_id, campaign_id: campaignId, contact_id: contactId, provider: 'muapi', workflow_id: workflowId, input: inputs, status: 'queued' }).select('*').single()
  return Response.json({ jobId: job?.id, status: job?.status })
})
