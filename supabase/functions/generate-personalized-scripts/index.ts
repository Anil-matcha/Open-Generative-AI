import OpenAI from 'openai';
import { createClient } from 'npm:@supabase/supabase-js@2';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });
  const { campaignId, contactIds } = await req.json();

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
  const { data: contacts } = await supabase.from('contacts').select('*').in('id', contactIds).eq('campaign_id', campaignId);

  const results = [];
  for (const contact of contacts ?? []) {
    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: `Return JSON only for contact: ${JSON.stringify(contact)} campaign: ${JSON.stringify(campaign)}`,
      text: { format: { type: 'json_object' } },
    });
    const output = JSON.parse(completion.output_text || '{}');
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
