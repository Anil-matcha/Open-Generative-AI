import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, content-type, accept',
};

interface VFXGenerationRequest {
  prompt: string;
  image_url?: string;
  effect_name?: string;
  aspect_ratio?: string;
  resolution?: string;
  quality?: string;
  duration?: number;
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: VFXGenerationRequest = await req.json();
    const { prompt, image_url, effect_name, aspect_ratio, resolution, quality, duration, user_id } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const muapiKey = Deno.env.get('MUAPI_API_KEY');
    if (!muapiKey) {
      return new Response(JSON.stringify({ error: 'MuAPI API key not configured' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const sizeMap = {
      '480p': '480*832',
      '720p': '1280*720',
      '1080p': '1920*1088'
    };

    const size = sizeMap[resolution] || '480*832';
    const aspect = aspect_ratio || '9:16';

    const payload: Record<string, any> = {
      prompt,
      aspect_ratio: aspect,
      size,
      quality: quality || 'medium',
      duration: duration || 5,
    };

    if (image_url) {
      payload.image_url = image_url;
    }

    const response = await fetch('https://api.muapi.ai/api/v1/generate_wan_ai_effects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': muapiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MuAPI VFX error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: `MuAPI request failed: ${response.status}` }), { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const result = await response.json();
    const videoUrl = result.url || result.output?.[0];

    const generationData = {
      user_id: user_id || null,
      prompt,
      image_url: image_url || null,
      effect_name: effect_name || null,
      aspect_ratio: aspect,
      resolution: resolution || '480p',
      quality: quality || 'medium',
      duration: duration || 5,
      status: 'completed',
      video_url: videoUrl,
      provider: 'muapi',
      model: 'generate_wan_ai_effects',
      created_at: new Date().toISOString()
    };

    await supabaseAdmin
      .from('vfx_generations')
      .insert(generationData);

    return new Response(JSON.stringify({ 
      success: true,
      video_url: videoUrl,
      generation: generationData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in vfx-generation:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});