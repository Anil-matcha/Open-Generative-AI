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

const MUAPI_API_KEY = Deno.env.get('MUAPI_KEY') || Deno.env.get('OPENAI_API_KEY');

if (!MUAPI_API_KEY) {
  console.error('[director-agent] Missing MUAPI_KEY environment variable');
}

if (!DIRECTOR_API_BASE_URL) {
  console.error('[director-agent] Missing DIRECTOR_API_BASE_URL environment variable');
}

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
        // Analyze script using OpenAI for advanced script analysis
        if (!script) {
          return new Response(
            JSON.stringify({ error: 'Script is required for analysis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const analysisPrompt = `Analyze this script for video production. Provide:
1. Scene breakdown with timing estimates
2. Emotional arc analysis
3. Key moments and turning points
4. Pacing recommendations
5. Visual style suggestions
6. Camera angle recommendations

Script:
${script}

Style preference: ${style || 'general'}
Respond in JSON format with keys: scenes, pacing, emotionalArc, keyMoments, suggestions, cameraAngles, lighting, visualStyle`;

        const analysisResponse = await callOpenAI(analysisPrompt);
        const analysis = JSON.parse(analysisResponse);

        return new Response(
          JSON.stringify({
            analysis,
            recommendations: {
              cameraAngles: analysis.cameraAngles || ['medium shot', 'close-up', 'wide shot'],
              lighting: analysis.lighting || (style === 'dramatic' ? 'high contrast' : 'natural'),
              pacing: analysis.pacing || 'moderate',
              visualStyle: analysis.visualStyle || style
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'generate-shot-list':
        // Generate detailed shot list using Director API
        if (!script && !prompt) {
          return new Response(
            JSON.stringify({ error: 'Either script or prompt is required for shot list generation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const shotListPrompt = `Generate a detailed shot list for video production based on:
${script ? `Script: ${script}` : `Concept: ${prompt}`}

Style: ${style || 'cinematic'}
Include for each shot: shotNumber, description, duration, cameraMovement, audio, notes.
Provide 5-8 shots that create a complete narrative sequence.`;

        const shotListResponse = await callOpenAI(shotListPrompt);
        const shotList = JSON.parse(shotListResponse);

        return new Response(
          JSON.stringify({ shotList: shotList.shots || shotList }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'optimize-pacing':
        // Analyze and optimize video pacing using Director API
        const pacingPrompt = `Analyze and optimize the pacing for this video content:
${script ? `Script: ${script}` : `Concept: ${prompt || 'General video content'}`}

Current estimated duration: ${requestData.duration || 60} seconds
Style: ${style || 'general'}

Provide:
1. Current pacing analysis
2. Optimization recommendations
3. Detailed timeline breakdown with time segments, content type, and pacing rhythm
4. Transition suggestions
5. Music cue recommendations

Respond in JSON format.`;

        const pacingResponse = await callOpenAI(pacingPrompt);
        const pacingAnalysis = JSON.parse(pacingResponse);

        return new Response(
          JSON.stringify({ pacingAnalysis }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'generate-storyboard':
        // Generate storyboard using Director API
        const storyboardPrompt = `Create a detailed storyboard for video production:

${script ? `Script: ${script}` : `Concept: ${prompt || 'General video concept'}`}

Style: ${style || 'cinematic'}

For each panel include:
- panelNumber
- description (detailed visual description)
- visualElements (array of key visual components)
- cameraAngle
- mood
- keyAction
- dialogue (if applicable)
- timing (estimated duration)

Also provide:
- styleGuide with colorPalette, typography, transitions
- aspectRatio recommendation
- total estimated duration

Create 4-6 panels that tell a complete story.
Respond in JSON format.`;

        const storyboardResponse = await callOpenAI(storyboardPrompt);
        const storyboard = JSON.parse(storyboardResponse);

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

// Helper functions for API calls
async function callOpenAI(prompt: string, model: string = 'gpt-4'): Promise<string> {
  if (!MUAPI_API_KEY) {
    throw new Error('MUAPI_KEY not configured');
  }

  console.log('[director-agent] Calling muapi.ai API');

  const response = await fetch('https://api.muapi.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': MUAPI_API_KEY
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional video director and storyboard artist. Provide detailed, actionable responses in the requested JSON format. Be specific and technical in your recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`muapi.ai API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || '';
}

async function callDirectorAPI(endpoint: string, params: Record<string, any>): Promise<any> {
  if (!DIRECTOR_API_BASE_URL) {
    throw new Error('Director API base URL not configured');
  }

  const url = `${DIRECTOR_API_BASE_URL}/${endpoint}`;

  console.log(`[director-agent] Calling Director API: ${endpoint}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('DIRECTOR_API_KEY') || ''}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Director API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

Deno.serve(handler);