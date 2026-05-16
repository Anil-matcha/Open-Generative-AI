import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function grantAccess() {
  const sql = `
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON public.personalizer_apps TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON public.personalization_projects TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON public.profile_scan_results TO authenticated;
    GRANT SELECT, INSERT ON public.personalization_outputs TO authenticated;
    GRANT SELECT ON public.personalizer_templates TO authenticated;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('Error granting access:', error);
    process.exit(1);
  }
  console.log('Personalizer access granted successfully');
}

grantAccess();
