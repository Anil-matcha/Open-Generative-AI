import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const auth = req.headers.get('Authorization') ?? ''
  const { campaignId, contactIds } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: campaign } = await service.from('campaigns').select('id,workspace_id,name,offer,audience,cta_text').eq('id', campaignId).single()
  const { data: membership } = await service.from('workspace_members').select('id').eq('workspace_id', campaign?.workspace_id).eq('user_id', userData.user.id).maybeSingle()
  if (!campaign || !membership) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data: contacts } = await service.from('contacts').select('*').in('id', contactIds)
  const generated = (contacts ?? []).map((c) => ({
    campaign_id: campaignId,
    contact_id: c.id,
    hook: `Hey ${c.first_name ?? 'there'}, quick idea for ${c.company ?? 'your team'}.`,
    script: `I reviewed ${c.company ?? 'your website'} and have one practical idea tied to ${campaign.offer ?? 'your offer'}.`,
    subject_line: `Quick video for ${c.company ?? 'your team'}`,
    email_body: `Recorded this for ${c.first_name ?? 'you'} to show one conversion lift idea.`,
    cta: campaign.cta_text ?? 'Book a quick call',
    prompt: { muapi_prompt: `Cinematic personalized intro for ${c.first_name} at ${c.company}` },
    status: 'draft'
  }))

  const { data, error } = await service.from('personalized_scripts').upsert(generated, { onConflict: 'campaign_id,contact_id' }).select('*')
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ scripts: data })
})
