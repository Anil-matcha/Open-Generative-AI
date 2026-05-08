import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async (req: Request) => {
  const body = await req.json();
  const meta = body?.metadata || {};
  const jobId = meta.internal_job_id;
  if (!jobId) return new Response('Missing job id', { status: 400 });

  const status = body?.status === 'failed' ? 'failed' : 'completed';
  await supabase.from('generation_jobs').update({ status, output: body }).eq('id', jobId);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
