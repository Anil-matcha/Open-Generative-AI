import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  }
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const user = await supabase.auth.getUser();

    // GET /api/templates - Get all templates
    if (req.method === 'GET' && url.pathname === '/api/templates') {
      const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(templates), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/template-categories - Get template categories
    if (req.method === 'GET' && url.pathname === '/api/template-categories') {
      const { data: categories, error } = await supabase
        .from('template_categories')
        .select('*')
        .eq('published', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(categories), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/projects - Get user's projects
    if (req.method === 'GET' && url.pathname === '/api/projects') {
      if (!user.data.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('author_id', user.data.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(projects), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/projects - Create new project
    if (req.method === 'POST' && url.pathname === '/api/projects') {
      if (!user.data.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const projectData = await req.json();

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          author_id: user.data.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(project), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});