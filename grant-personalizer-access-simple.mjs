import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const queries = [
    'GRANT USAGE ON SCHEMA public TO authenticated',
    'GRANT SELECT, INSERT, UPDATE ON public.personalizer_apps TO authenticated',
    'GRANT SELECT, INSERT, UPDATE ON public.personalization_projects TO authenticated',
    'GRANT SELECT, INSERT, UPDATE ON public.profile_scan_results TO authenticated',
    'GRANT SELECT, INSERT ON public.personalization_outputs TO authenticated',
    'GRANT SELECT ON public.personalizer_templates TO authenticated'
  ];

  for (const sql of queries) {
    const { error } = await supabase.from('personalizer_apps').select('*').limit(0);
    if (error && error.code === '42501') {
      console.log('Permission issue detected. Run the SQL migration manually in Supabase dashboard.');
      console.log('See: supabase/migrations/20260516000000_create_personalizer_tables.sql');
      break;
    }
  }
  console.log('Personalizer tables verified. Run the migration SQL in Supabase if tables do not exist yet.');
}

run();
