import { createClient } from 'npm:@supabase/supabase-js@2';

const MUAPI_KEY = Deno.env.get('MUAPI_KEY') || Deno.env.get('OPENAI_API_KEY');
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });
  const { campaignId, contactIds } = await req.json();

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
  const { data: contacts } = await supabase.from('contacts').select('*').in('id', contactIds).eq('campaign_id', campaignId);

  const results = [];
  for (const contact of contacts ?? []) {
    const response = await fetch('https://api.muapi.ai/api/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MUAPI_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: `Return JSON only for contact: ${JSON.stringify(contact)} campaign: ${JSON.stringify(campaign)}`,
        text: { format: { type: 'json_object' } },
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`muapi.ai API error: ${error.message || 'Unknown error'}`);
    }

    const result = await response.json();
    const output = JSON.parse(result.output_text || '{}');
    const { data } = await supabase.from('personalized_scripts').upsert({
      workspace_id: campaign.workspace_id,
      campaign_id: campaign.id,
      contact_id: contact.id,
      ...output,
      openai_response: output,
    }).select('*').single();
    results.push(data);
  }

  return Response.json({ scripts: results });
});