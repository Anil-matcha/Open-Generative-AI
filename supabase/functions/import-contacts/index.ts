import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? ''
  const { campaignId, contacts } = await req.json()
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: campaign } = await service.from('campaigns').select('workspace_id').eq('id', campaignId).single()
  const rows = (contacts ?? []).map((c: Record<string, string>) => ({ ...c, campaign_id: campaignId, workspace_id: campaign?.workspace_id }))
  const { data, error } = await service.from('contacts').insert(rows).select('*')
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ contacts: data })
})
