import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    });
  }

  try {
    const { project_id } = await req.json();

    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch complete project with all related data
    const { data: project, error: projectError } = await supabase
      .from('storyboarder_projects')
      .select(`
        *,
        storyboarder_scripts (
          *,
          storyboarder_scenes (
            *,
            storyboarder_shots (*)
          )
        )
      `)
      .eq('id', project_id)
      .single();

    if (projectError) throw projectError;
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate PDF content as HTML (client-side PDF generation from this data)
    // Return the data and let client handle PDF rendering
    const pdfData = {
      project_title: project.title,
      genre: project.genre,
      scripts: project.storyboarder_scripts?.map(script => ({
        title: script.title,
        logline: script.logline,
        scenes: script.storyboarder_scenes?.map(scene => ({
          scene_number: scene.scene_number,
          title: scene.title,
          location: scene.location,
          time_of_day: scene.time_of_day,
          description: scene.description,
          mood: scene.mood_overall,
          shots: scene.storyboarder_shots?.map(shot => ({
            shot_number: shot.shot_number,
            shot_type: shot.shot_type,
            camera_angle: shot.camera_angle,
            description: shot.description,
            sd_prompt: shot.sd_prompt
          }))
        }))
      })) || []
    };

    // Return PDF data for client-side PDF generation
    // In production, you might use a service like Puppeteer or a PDF API
    return new Response(JSON.stringify({
      success: true,
      data: pdfData,
      message: 'Use client-side PDF generation with the provided data'
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Export PDF error:', error);

    return new Response(JSON.stringify({
      error: 'Export failed',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
}