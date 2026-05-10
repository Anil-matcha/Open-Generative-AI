import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface SceneAnalysisInput {
  scene_description?: string;
  location?: string;
  time_of_day?: string;
  mood?: string;
  mood_visual?: string;
  mood_audio?: string;
  mood_tone?: string;
  characters?: string[];
  number_of_shots?: number;
}

interface ShotPrompt {
  shot_number: number;
  shot_type: string;
  camera_angle: string;
  camera_movement: string;
  description: string;
  sd_prompt: string;
  duration_seconds: number;
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SceneAnalysisInput = await req.json();
    const {
      scene_description,
      location,
      time_of_day,
      mood,
      mood_visual,
      mood_audio,
      mood_tone,
      characters,
      number_of_shots = 4,
    } = body;

    if (!scene_description) {
      return new Response(
        JSON.stringify({ error: "scene_description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shots = await generateShotPrompts({
      scene_description,
      location,
      time_of_day,
      mood,
      mood_visual,
      mood_audio,
      mood_tone,
      characters,
      number_of_shots,
    });

    return new Response(
      JSON.stringify({
        shots,
        scene_metadata: {
          location,
          time_of_day,
          mood,
          mood_visual,
          mood_audio,
          mood_tone,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scene analyze error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function generateShotPrompts(input: SceneAnalysisInput): Promise<ShotPrompt[]> {
  const MUAPI_API_KEY = Deno.env.get('MUAPI_API_KEY') || Deno.env.get("OPENAI_API_KEY");

  if (!MUAPI_API_KEY) {
    throw new Error("MUAPI_API_KEY environment variable is not configured");
  }

  const response = await fetch("https://api.muapi.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": MUAPI_API_KEY
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("No response generated from OpenAI");
  }

  return parseShotsFromResponse(content, input.number_of_shots || 4);
}

function buildSystemPrompt(): string {
  return `You are an expert cinematographer and storyboard artist specializing in creating highly detailed Stable Diffusion prompts for generating professional storyboard shots.

Your task is to analyze a scene description and generate a complete storyboard breakdown with SD prompts for each shot.

For each shot, you must provide:
1. shot_number: Sequential shot number (1, 2, 3, etc.)
2. shot_type: One of: EXTREME_WIDE, WIDE, MEDIUM_WIDE, MEDIUM, MEDIUM_CLOSEUP, CLOSEUP, EXTREME_CLOSEUP, TWO_SHOT, OVER_THE_SHOULDER, POV, INSERT
3. camera_angle: One of: EYE_LEVEL, LOW_ANGLE, HIGH_ANGLE, DUTCH_ANGLE, BIRD_EYE, WORMS_EYE
4. camera_movement: One of: STATIC, PAN_LEFT, PAN_RIGHT, TILT_UP, TILT_DOWN, DOLLIE_IN, DOLLIE_OUT, TRACKING_LEFT, TRACKING_RIGHT, CRANE_UP, CRANE_DOWN, ZOOM_IN, ZOOM_OUT, HANDHELD
5. description: A brief description of what happens in this shot (2-3 sentences)
6. sd_prompt: A highly detailed Stable Diffusion prompt describing the visual elements, style, lighting, and mood. Include specific details about composition, lighting (with specific lighting setup like "soft golden hour light from side", "dramatic rim lighting", "high-key lighting"), color palette, atmosphere, and any visual effects.
7. duration_seconds: Estimated duration (typically 3-10 seconds)

Return your response as a valid JSON array of shot objects. No markdown formatting, just clean JSON.`;
}

function buildUserPrompt(input: SceneAnalysisInput): string {
  const {
    scene_description,
    location,
    time_of_day,
    mood,
    mood_visual,
    mood_audio,
    mood_tone,
    characters,
    number_of_shots,
  } = input;

  let prompt = `Analyze this scene and generate ${number_of_shots} storyboard shots:

SCENE DESCRIPTION:
${scene_description}`;

  if (location) {
    prompt += `\n\nLOCATION: ${location}`;
  }

  if (time_of_day) {
    prompt += `\nTIME OF DAY: ${time_of_day}`;
  }

  if (mood) {
    prompt += `\nOVERALL MOOD: ${mood}`;
  }

  if (mood_visual) {
    prompt += `\nVISUAL MOOD: ${mood_visual}`;
  }

  if (mood_audio) {
    prompt += `\nAUDIO MOOD: ${mood_audio}`;
  }

  if (mood_tone) {
    prompt += `\nTONE: ${mood_tone}`;
  }

  if (characters && characters.length > 0) {
    prompt += `\n\nCHARACTERS:\n${characters.map((c) => `- ${c}`).join("\n")}`;
  }

  prompt += `
\nReturn a JSON array with ${number_of_shots} shot objects, each containing: shot_number, shot_type, camera_angle, camera_movement, description, sd_prompt, and duration_seconds.`;

  return prompt;
}

function parseShotsFromResponse(content: string, expectedCount: number): ShotPrompt[] {
  let jsonStr = content;

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const shots = JSON.parse(jsonStr);

    if (!Array.isArray(shots)) {
      throw new Error("Response is not an array");
    }

    return shots.slice(0, expectedCount).map((shot, index) => ({
      shot_number: shot.shot_number ?? index + 1,
      shot_type: shot.shot_type ?? "MEDIUM",
      camera_angle: shot.camera_angle ?? "EYE_LEVEL",
      camera_movement: shot.camera_movement ?? "STATIC",
      description: shot.description || "Shot description",
      sd_prompt: shot.sd_prompt || shot.description || "",
      duration_seconds: shot.duration_seconds ?? 5,
    }));
  } catch {
    const fallbackShots: ShotPrompt[] = [];
    for (let i = 0; i < expectedCount; i++) {
      fallbackShots.push({
        shot_number: i + 1,
        shot_type: "MEDIUM",
        camera_angle: "EYE_LEVEL",
        camera_movement: "STATIC",
        description: `Shot ${i + 1}`,
        sd_prompt: content,
        duration_seconds: 5,
      });
    }
    return fallbackShots;
  }
}

Deno.serve(handler);
