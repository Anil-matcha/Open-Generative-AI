import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, content-type, accept',
};

interface PromptEnhanceRequest {
  prompt: string;
  effect_name?: string;
  style?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: PromptEnhanceRequest = await req.json();
    const { prompt, effect_name, style } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ 
        enhanced_prompt: prompt,
        warning: 'OpenAI API key not configured, returning original prompt'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const effectContext = effect_name ? `Apply ${effect_name} effect. ` : '';
    const styleContext = style ? `Style: ${style}. ` : '';
    
    const systemPrompt = `You are a creative AI video effects prompt engineer. Given a user's description of a desired visual effect, enhance it into a more detailed, cinematic prompt optimized for AI video generation. ${effectContext}${styleContext}Return only the enhanced prompt, nothing else.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 256,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error(`OpenAI error: ${response.status}`);
      return new Response(JSON.stringify({ 
        enhanced_prompt: prompt,
        warning: 'Failed to enhance prompt'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();
    const enhancedPrompt = result.choices?.[0]?.message?.content?.trim() || prompt;

    return new Response(JSON.stringify({ 
      enhanced_prompt: enhancedPrompt,
      original_prompt: prompt,
      effect_name: effect_name || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in prompt-enhancer:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});