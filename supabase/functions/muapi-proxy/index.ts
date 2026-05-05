import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Configure CORS - dynamic origin support
const ALLOWED_ORIGINS = Deno.env.get('MUAPI_ALLOWED_ORIGINS')?.split(',')?.map(o => o.trim()) || ['*'];
const isProduction = Deno.env.get('ENV') === 'production';

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '*';
  
  // In production, only allow specific origins
  if (isProduction && ALLOWED_ORIGINS[0] !== '*') {
    const allowed = ALLOWED_ORIGINS.some(allowedOrigin => 
      origin === allowedOrigin || origin.endsWith('.' + allowedOrigin)
    );
    if (!allowed) {
      return { "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0] }; // Return first allowed as default
    }
  }
  
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-User-Api-Key",
    "Access-Control-Allow-Credentials": "true"
  };
}

// Rate limiting - simple in-memory store (use Redis for multi-instance deployments)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100; // requests per window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

interface GenerateRequest {
  endpoint: string;
  params: Record<string, any>;
  generationType: 'image' | 'video' | 'i2i' | 'i2v' | 'v2v' | 'enhanced';
  studioType?: string;
}

function validateEndpoint(endpoint: string): boolean {
  // Prevent SSRF by blocking dangerous paths
  if (endpoint.includes('..') || endpoint.startsWith('/') || endpoint.includes('://')) {
    return false;
  }

  // Only allow specific endpoints to prevent SSRF
  const allowedPatterns = [
  // MuAPI standard endpoints
  /^predictions(\/.*)?$/,
  /^image-generation(\/.*)?$/,
  /^video-generation(\/.*)?$/,
  /^image-to-image(\/.*)?$/,
  /^image-to-video(\/.*)?$/,
  /^video-to-video(\/.*)?$/,
  /^flux-dev-image$/,
  /^generate_wan_ai_effects$/,
  /^ai-image-face-swap$/,
  /^api\/storyboard\/projects$/,
  /^upload_file$/,
  
  // Lip sync & audio models
  /^sync-lipsync$/,
  /^latentsync-video$/,
  /^mmaudio-v2\/text-to-audio$/,
  /^mmaudio-v2\/video-to-video$/,
  
  // Suno music models
  /^suno-create-music$/,
  /^suno-remix-music$/,
  /^suno-extend-music$/,
  /^suno-add-vocals$/,
  /^suno-generate-mashup$/,
  /^suno-generate-lyrics$/,
  
  // Style transfer models
  /^ai-ghibli-style$/,
  /^ai-anime-generator$/,
    
    // LTX Video models (via MuAPI)
    /^ltx-2-pro-text-to-video$/,
    /^ltx-2-fast-text-to-video$/,
    /^ltx-2-19b-text-to-video$/,
    /^ltx-2-pro-image-to-video$/,
    /^ltx-2-fast-image-to-video$/,
    /^ltx-2-19b-image-to-video$/,
    
    // Additional video models available on MuAPI
    /^seedance-.+$/,
    /^kling-.+$/,
    /^veo3-.+$/,
    /^wan2-.+$/,
    /^minimax-hailuo-.+$/,
    /^openai-sora-.+$/,
    /^pixverse-.+$/,
    /^runway-.+$/,
    /^hunyuan-.+$/,
  ];
  return allowedPatterns.some(pattern => pattern.test(endpoint));
}

function getClientId(req: Request): string {
  // Use API key or IP as client identifier
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    // Hash the API key for privacy
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      hash = ((hash << 5) - hash) + apiKey.charCodeAt(i);
      hash |= 0;
    }
    return `key_${Math.abs(hash).toString(36)}`;
  }
  return `ip_${req.headers.get('cf-connecting-ip') || 'unknown'}`;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Rate limiting
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
      }
    );
  }

  try {
    const body: GenerateRequest = await req.json();
    const { endpoint, params, generationType, studioType } = body;

    // Validate endpoint to prevent SSRF
    if (!endpoint || typeof endpoint !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!validateEndpoint(endpoint)) {
      console.error(`[muapi-proxy] Blocked invalid endpoint: ${endpoint}`);
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

const muapiKey = req.headers.get('x-user-api-key');
      if (!muapiKey) {
        console.error('[muapi-proxy] No MuAPI key provided - x-user-api-key header is required');
        return new Response(
          JSON.stringify({
            error: 'API key required',
            details: 'Please add your MuAPI API key in the Settings. The system requires a personal API key for all AI generation requests.'
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

console.log(`[muapi-proxy] Forwarding ${generationType} request to ${endpoint} using user-provided key`);

     const muapiUrl = generationType === 'poll'
       ? `https://api.muapi.ai/api/v1/predictions/${endpoint.split('/')[1]}/result`
       : `https://api.muapi.ai/api/v1/${endpoint}`;

     const method = generationType === 'poll' ? 'GET' : 'POST';
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': muapiKey
      }
    };

    if (method === 'POST') {
      fetchOptions.body = JSON.stringify(params);
    }

    const muapiResponse = await fetch(muapiUrl, fetchOptions);

    if (!muapiResponse.ok) {
      const errorText = await muapiResponse.text();
      console.error(`[muapi-proxy] API error: ${muapiResponse.status} - ${errorText}`);

      return new Response(
        JSON.stringify({
          error: `API Request Failed: ${muapiResponse.status} ${muapiResponse.statusText}`,
          details: errorText.slice(0, 200)
        }),
        {
          status: muapiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await muapiResponse.json();

    console.log(`[muapi-proxy] Success: ${JSON.stringify(result).slice(0, 100)}`);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[muapi-proxy] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
