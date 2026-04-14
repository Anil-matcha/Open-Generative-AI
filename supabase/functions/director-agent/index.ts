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

interface DirectorRequest {
  action: string;
  videoUrl?: string;
  prompt?: string;
  script?: string;
  style?: string;
}

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

    const requestData: DirectorRequest = await req.json();
    const { action, videoUrl, prompt, script, style } = requestData;

    // Director agent logic - AI-powered scene planning and direction
    switch (action) {
      case 'analyze-script':
        // Analyze script for scene structure, pacing, emotional beats
        const analysis = {
          scenes: [],
          pacing: 'moderate',
          emotionalArc: ['introduction', 'conflict', 'resolution'],
          keyMoments: [],
          suggestions: []
        };

        // Basic script analysis
        if (script) {
          analysis.scenes = script.split('\n\n').filter(s => s.trim().length > 0);
          analysis.keyMoments = analysis.scenes.filter(scene =>
            scene.toLowerCase().includes('climax') ||
            scene.toLowerCase().includes('turning point') ||
            scene.toLowerCase().includes('emotional')
          );
        }

        return new Response(
          JSON.stringify({
            analysis,
            recommendations: {
              cameraAngles: ['medium shot', 'close-up', 'wide shot'],
              lighting: style === 'dramatic' ? 'high contrast' : 'natural',
              pacing: analysis.pacing
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'generate-shot-list':
        // Generate detailed shot list for video production
        const shotList = [
          {
            shotNumber: 1,
            description: 'Establishing wide shot of location',
            duration: '5-7 seconds',
            cameraMovement: 'slow pan',
            audio: 'ambient sound',
            notes: 'Set the scene and mood'
          },
          {
            shotNumber: 2,
            description: 'Medium shot of subject introduction',
            duration: '3-5 seconds',
            cameraMovement: 'static',
            audio: 'voiceover or dialogue',
            notes: 'Introduce main character/concept'
          },
          {
            shotNumber: 3,
            description: 'Close-up of key element',
            duration: '2-3 seconds',
            cameraMovement: 'slow zoom in',
            audio: 'emphasized sound',
            notes: 'Highlight important detail'
          }
        ];

        return new Response(
          JSON.stringify({ shotList }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'optimize-pacing':
        // Analyze and optimize video pacing
        const pacingAnalysis = {
          currentPacing: 'moderate',
          recommendations: [
            'Add more dynamic transitions',
            'Vary shot lengths for better rhythm',
            'Use music cues to enhance emotional beats'
          ],
          optimizedTimeline: {
            segments: [
              { time: '0:00-0:15', type: 'introduction', pace: 'slow' },
              { time: '0:15-1:00', type: 'main-content', pace: 'moderate' },
              { time: '1:00-1:15', type: 'conclusion', pace: 'fast' }
            ]
          }
        };

        return new Response(
          JSON.stringify({ pacingAnalysis }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'generate-storyboard':
        // Generate storyboard from script
        const storyboard = {
          panels: [
            {
              panelNumber: 1,
              description: 'Opening scene - subject enters frame',
              visualElements: ['subject', 'background environment'],
              cameraAngle: 'eye level',
              mood: 'confident',
              keyAction: 'entrance'
            },
            {
              panelNumber: 2,
              description: 'Development - subject demonstrates skill/expertise',
              visualElements: ['subject', 'props/tools', 'action lines'],
              cameraAngle: 'dynamic',
              mood: 'focused',
              keyAction: 'demonstration'
            },
            {
              panelNumber: 3,
              description: 'Climax - key moment of success/transformation',
              visualElements: ['subject', 'result', 'celebration elements'],
              cameraAngle: 'close-up',
              mood: 'triumphant',
              keyAction: 'achievement'
            }
          ],
          styleGuide: {
            colorPalette: ['primary brand colors', 'accent colors'],
            typography: 'clean, modern, readable',
            transitions: 'smooth, professional cuts'
          }
        };

        return new Response(
          JSON.stringify({ storyboard }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({
            error: 'Unknown action',
            supportedActions: ['analyze-script', 'generate-shot-list', 'optimize-pacing', 'generate-storyboard']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Director agent error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(handler);