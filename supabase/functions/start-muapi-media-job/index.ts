import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });
  const payload = await req.json();

  const { data: job } = await supabase.from('generation_jobs').insert({
    workspace_id: payload.workspaceId,
    campaign_id: payload.campaignId,
    contact_id: payload.contactId,
    script_id: payload.scriptId,
    provider: 'muapi',
    workflow_id: payload.workflowId,
    job_type: payload.jobType,
    status: 'processing',
    input: payload.inputs ?? {},
  }).select('*').single();

  const response = await fetch(`https://api.muapi.ai/workflows/${payload.workflowId}/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${Deno.env.get('MUAPI_API_KEY')}` },
    body: JSON.stringify({
      inputs: payload.inputs ?? {},
      webhook: Deno.env.get('MUAPI_WEBHOOK_URL'),
      metadata: {
        internal_job_id: job.id,
        workspace_id: payload.workspaceId,
        campaign_id: payload.campaignId,
        contact_id: payload.contactId,
        script_id: payload.scriptId,
        job_type: payload.jobType,
      },
    }),
  });

  const provider = await response.json();
  await supabase.from('generation_jobs').update({ provider_job_id: provider.id ?? provider.run_id }).eq('id', job.id);
  return Response.json({ jobId: job.id, provider });
});
