import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://videoagencyai.netlify.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const action = pathParts[pathParts.length - 1];

    if (req.method === 'GET' && action === 'makes') {
      // List user projects
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch projects' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ projects }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'POST' && action === 'makes') {
      // Create new project
      const projectData = await req.json();

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.title,
          description: projectData.description,
          settings: projectData.settings || {},
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create project' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ project }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'GET' && pathParts.includes('makes')) {
      // Get specific project
      const projectId = pathParts[pathParts.length - 1];

      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('created_by', user.id)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        return new Response(
          JSON.stringify({ error: 'Project not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ project }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'PUT' && pathParts.includes('makes')) {
      // Update project
      const projectId = pathParts[pathParts.length - 1];
      const updates = await req.json();

      const { data: project, error } = await supabase
        .from('projects')
        .update({
          name: updates.title,
          description: updates.description,
          settings: updates.settings || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update project' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ project }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'DELETE' && pathParts.includes('makes')) {
      // Delete project
      const projectId = pathParts[pathParts.length - 1];

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('created_by', user.id);

      if (error) {
        console.error('Error deleting project:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete project' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Project service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(handler);