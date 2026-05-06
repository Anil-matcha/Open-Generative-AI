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

    // Format export data
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      project: {
        id: project.id,
        title: project.title,
        genre: project.genre,
        created_at: project.created_at,
        updated_at: project.updated_at
      },
      scripts: project.storyboarder_scripts?.map(script => ({
        id: script.id,
        title: script.title,
        genre: script.genre,
        logline: script.logline,
        raw_text: script.raw_text,
        total_duration_seconds: script.total_duration_seconds,
        scenes: script.storyboarder_scenes?.map(scene => ({
          id: scene.id,
          scene_number: scene.scene_number,
          title: scene.title,
          location: scene.location,
          time_of_day: scene.time_of_day,
          description: scene.description,
          characters: scene.characters,
          mood: {
            tension: scene.mood_tension,
            emotion: scene.mood_emotion,
            energy: scene.mood_energy,
            darkness: scene.mood_darkness,
            overall: scene.mood_overall
          },
          soundtrack: {
            genre: scene.soundtrack_genre,
            tempo: scene.soundtrack_tempo,
            instruments: scene.soundtrack_instruments,
            reference: scene.soundtrack_reference,
            energy: scene.soundtrack_energy
          },
          shots: scene.storyboarder_shots?.map(shot => ({
            id: shot.id,
            shot_number: shot.shot_number,
            shot_type: shot.shot_type,
            camera_angle: shot.camera_angle,
            camera_movement: shot.camera_movement,
            description: shot.description,
            dialogue: shot.dialogue,
            duration_seconds: shot.duration_seconds,
            sd_prompt: shot.sd_prompt
          }))
        }))
      })) || []
    };

    return new Response(JSON.stringify(exportData), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Export JSON error:', error);

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