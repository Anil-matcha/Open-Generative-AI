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

// CutAI API configuration
const CUTAI_API_URL = Deno.env.get('CUTAI_API_URL') || 'http://localhost:8001';

interface CutAIRequest {
  action: 'generate-script' | 'analyze-mood' | 'create-storyboard' | 'regenerate-scene' | 'export-script';
  genre?: string;
  premise?: string;
  scriptText?: string;
  sceneId?: string;
  options?: any;
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

    const requestData: CutAIRequest = await req.json();
    const { action, genre, premise, scriptText, sceneId, options = {} } = requestData;

    // CutAI processing logic
    switch (action) {
      case 'generate-script':
        // Generate script from genre and premise
        if (!genre || !premise) {
          return new Response(
            JSON.stringify({ error: 'Genre and premise are required for script generation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const scriptResult = await generateScript({ genre, premise, ...options });

        return new Response(
          JSON.stringify({
            script: scriptResult.script,
            scenes: scriptResult.scenes,
            moodAnalysis: scriptResult.moodAnalysis,
            generationTime: scriptResult.generationTime,
            method: scriptResult.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'analyze-mood':
        // Analyze mood and soundtrack suggestions
        if (!scriptText) {
          return new Response(
            JSON.stringify({ error: 'Script text is required for mood analysis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const moodResult = await analyzeMood({ scriptText, ...options });

        return new Response(
          JSON.stringify({
            moodScores: moodResult.moodScores,
            soundtrackSuggestions: moodResult.soundtrackSuggestions,
            visualThemes: moodResult.visualThemes,
            method: moodResult.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'create-storyboard':
        // Create storyboard from script
        if (!scriptText) {
          return new Response(
            JSON.stringify({ error: 'Script text is required for storyboard creation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const storyboardResult = await createStoryboard({ scriptText, ...options });

        return new Response(
          JSON.stringify({
            storyboard: storyboardResult.storyboard,
            sceneCards: storyboardResult.sceneCards,
            timelineData: storyboardResult.timelineData,
            method: storyboardResult.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'regenerate-scene':
        // Regenerate a specific scene
        if (!sceneId || !scriptText) {
          return new Response(
            JSON.stringify({ error: 'Scene ID and script text are required for scene regeneration' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const regeneratedScene = await regenerateScene({ sceneId, scriptText, ...options });

        return new Response(
          JSON.stringify({
            scene: regeneratedScene.scene,
            updatedScript: regeneratedScene.updatedScript,
            improvements: regeneratedScene.improvements,
            method: regeneratedScene.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'export-script':
        // Export script in different formats
        if (!scriptText) {
          return new Response(
            JSON.stringify({ error: 'Script text is required for export' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const exportResult = await exportScript({ scriptText, format: options.format || 'pdf', ...options });

        return new Response(
          JSON.stringify({
            exportUrl: exportResult.exportUrl,
            format: exportResult.format,
            fileSize: exportResult.fileSize,
            method: exportResult.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({
            error: 'Unknown CutAI action',
            supportedActions: ['generate-script', 'analyze-mood', 'create-storyboard', 'regenerate-scene', 'export-script']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('CutAI processor error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Helper functions
async function generateScript(params: any): Promise<any> {
  try {
    // Try real CutAI API call
    const response = await fetch(`${CUTAI_API_URL}/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        genre: params.genre,
        premise: params.premise,
        length: params.length || 'short',
        style: params.style || 'professional'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        script: result.script,
        scenes: result.scenes,
        moodAnalysis: result.moodAnalysis,
        generationTime: result.generationTime,
        method: 'Real CutAI'
      };
    }
  } catch (error) {
    console.warn('CutAI script generation failed:', error.message);
  }

  // Mock script generation
  const mockScenes = [];
  const sceneCount = Math.floor(Math.random() * 3) + 3; // 3-5 scenes

  for (let i = 0; i < sceneCount; i++) {
    mockScenes.push({
      id: `scene_${i + 1}`,
      title: `Scene ${i + 1}`,
      setting: ['INT. LIVING ROOM - DAY', 'EXT. CITY STREET - NIGHT', 'INT. OFFICE - EVENING'][i % 3],
      description: `Character performs action ${i + 1} in an engaging way.`,
      dialogue: [
        { character: 'CHARACTER A', line: 'This is dialogue line 1.' },
        { character: 'CHARACTER B', line: 'This is dialogue line 2.' }
      ],
      shotType: ['Wide', 'Medium', 'Close-up'][i % 3],
      cameraAngle: ['Eye level', 'Low angle', 'High angle'][i % 3],
      cameraMovement: ['Static', 'Pan', 'Tracking'][i % 3],
      duration: 15 + Math.floor(Math.random() * 30), // 15-45 seconds
      mood: {
        tension: Math.random(),
        emotion: Math.random(),
        energy: Math.random(),
        darkness: Math.random()
      }
    });
  }

  return {
    script: {
      title: `${params.genre.charAt(0).toUpperCase() + params.genre.slice(1)} Story`,
      genre: params.genre,
      premise: params.premise,
      logline: `A ${params.genre} story about ${params.premise.toLowerCase()}.`,
      scenes: mockScenes
    },
    scenes: mockScenes,
    moodAnalysis: {
      overallTone: 'dramatic',
      targetAudience: 'general',
      commercialPotential: 0.75
    },
    generationTime: '2.3 seconds',
    method: 'Mock CutAI (API not available)',
    note: 'Real CutAI instance required for actual script generation'
  };
}

async function analyzeMood(params: any): Promise<any> {
  try {
    // Try real CutAI API call
    const response = await fetch(`${CUTAI_API_URL}/analyze-mood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script: params.scriptText,
        detailed: params.detailed || false
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        moodScores: result.moodScores,
        soundtrackSuggestions: result.soundtrackSuggestions,
        visualThemes: result.visualThemes,
        method: 'Real CutAI'
      };
    }
  } catch (error) {
    console.warn('CutAI mood analysis failed:', error.message);
  }

  // Mock mood analysis
  return {
    moodScores: {
      tension: 0.6,
      emotion: 0.8,
      energy: 0.7,
      darkness: 0.4
    },
    soundtrackSuggestions: [
      {
        scene: 1,
        genre: 'dramatic',
        tempo: 'slow',
        instruments: ['piano', 'strings'],
        reference: 'Similar to: Hans Zimmer — Time'
      },
      {
        scene: 2,
        genre: 'suspense',
        tempo: 'moderate',
        instruments: ['percussion', 'brass'],
        reference: 'Similar to: John Williams — Jaws'
      }
    ],
    visualThemes: ['warm lighting', 'urban environment', 'emotional close-ups'],
    method: 'Mock CutAI (API not available)',
    note: 'Real CutAI instance required for mood analysis'
  };
}

async function createStoryboard(params: any): Promise<any> {
  try {
    // Try real CutAI API call
    const response = await fetch(`${CUTAI_API_URL}/create-storyboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script: params.scriptText,
        style: params.style || 'cinematic'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        storyboard: result.storyboard,
        sceneCards: result.sceneCards,
        timelineData: result.timelineData,
        method: 'Real CutAI'
      };
    }
  } catch (error) {
    console.warn('CutAI storyboard creation failed:', error.message);
  }

  // Mock storyboard creation
  const mockSceneCards = [];
  const sceneCount = Math.floor(Math.random() * 3) + 3;

  for (let i = 0; i < sceneCount; i++) {
    mockSceneCards.push({
      id: `card_${i + 1}`,
      sceneNumber: i + 1,
      title: `Scene ${i + 1}`,
      description: `Visual description for scene ${i + 1}`,
      shotType: ['Wide', 'Medium', 'Close-up'][i % 3],
      cameraAngle: ['Eye level', 'Low angle', 'Dutch'][i % 3],
      moodColor: ['#FF6B6B', '#4ECDC4', '#45B7D1'][i % 3],
      timeOfDay: ['Day', 'Night', 'Evening'][i % 3],
      characters: ['Protagonist', 'Antagonist', 'Supporting'][i % 3],
      props: ['Object A', 'Object B'],
      duration: 15 + Math.floor(Math.random() * 20)
    });
  }

  return {
    storyboard: {
      title: 'Generated Storyboard',
      totalScenes: mockSceneCards.length,
      totalDuration: mockSceneCards.reduce((sum, card) => sum + card.duration, 0),
      style: 'cinematic'
    },
    sceneCards: mockSceneCards,
    timelineData: {
      nodes: mockSceneCards.map(card => ({
        id: card.id,
        position: { x: card.sceneNumber * 200, y: 100 },
        data: { label: card.title, mood: card.moodColor }
      })),
      edges: mockSceneCards.slice(0, -1).map((card, index) => ({
        id: `edge_${index}`,
        source: card.id,
        target: mockSceneCards[index + 1].id
      }))
    },
    method: 'Mock CutAI (API not available)',
    note: 'Real CutAI instance required for storyboard creation'
  };
}

async function regenerateScene(params: any): Promise<any> {
  try {
    // Try real CutAI API call
    const response = await fetch(`${CUTAI_API_URL}/regenerate-scene`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sceneId: params.sceneId,
        script: params.scriptText,
        improvements: params.improvements || []
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        scene: result.scene,
        updatedScript: result.updatedScript,
        improvements: result.improvements,
        method: 'Real CutAI'
      };
    }
  } catch (error) {
    console.warn('CutAI scene regeneration failed:', error.message);
  }

  // Mock scene regeneration
  return {
    scene: {
      id: params.sceneId,
      title: `Improved Scene ${params.sceneId}`,
      description: 'Regenerated scene with enhanced description and dialogue.',
      improvements: ['Better pacing', 'Stronger dialogue', 'Clearer visual direction']
    },
    updatedScript: 'Updated script text with regenerated scene...',
    improvements: ['Enhanced character development', 'Improved scene transitions', 'Stronger emotional impact'],
    method: 'Mock CutAI (API not available)',
    note: 'Real CutAI instance required for scene regeneration'
  };
}

async function exportScript(params: any): Promise<any> {
  try {
    // Try real CutAI API call
    const response = await fetch(`${CUTAI_API_URL}/export-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script: params.scriptText,
        format: params.format,
        includeStoryboard: params.includeStoryboard || false
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        exportUrl: result.exportUrl,
        format: result.format,
        fileSize: result.fileSize,
        method: 'Real CutAI'
      };
    }
  } catch (error) {
    console.warn('CutAI script export failed:', error.message);
  }

  // Mock export
  return {
    exportUrl: `https://example.com/script-export-${Date.now()}.${params.format}`,
    format: params.format,
    fileSize: '2.3 MB',
    method: 'Mock CutAI (API not available)',
    note: 'Real CutAI instance required for script export'
  };
}

Deno.serve(handler);</content>
<parameter name="filePath">supabase/functions/cutai-processor/index.ts