import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async (req: Request) => {
  const payload = await req.json();
  if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email)) return new Response('Invalid email', { status: 400 });
  await supabase.from('leads').insert(payload);
  await supabase.from('video_events').insert({
    workspace_id: payload.workspace_id,
    campaign_id: payload.campaign_id,
    video_id: payload.video_id,
    contact_id: payload.contact_id,
    event_type: 'form_submit',
    metadata: payload.form_data ?? {},
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
