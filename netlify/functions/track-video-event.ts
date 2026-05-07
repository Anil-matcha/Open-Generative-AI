import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async (req: Request) => {
  const { video_id, campaign_id, contact_id, workspace_id, event_type, metadata } = await req.json();
  if (!video_id || !campaign_id || !workspace_id || !event_type) return new Response('Bad request', { status: 400 });
  const ip = req.headers.get('x-forwarded-for') || '';
  const ip_hash = crypto.createHash('sha256').update(ip).digest('hex');
  await supabase.from('video_events').insert({ video_id, campaign_id, contact_id, workspace_id, event_type, metadata: metadata ?? {}, ip_hash, user_agent: req.headers.get('user-agent') ?? '' });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
