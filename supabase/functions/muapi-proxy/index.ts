import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://your-production-domain.com", // Replace with actual domain
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
  generationType: 'image' | 'video' | 'i2i' | 'i2v' | 'v2v';
  studioType?: string;
}

function validateEndpoint(endpoint: string): boolean {
  // Prevent SSRF by blocking dangerous paths
  if (endpoint.includes('..') || endpoint.startsWith('/') || endpoint.includes('://')) {
    return false;
  }

  // Only allow specific endpoints to prevent SSRF
  const allowedPatterns = [
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

    const muapiKey = Deno.env.get('MUAPI_API_KEY');
    if (!muapiKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: API key not set' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const muapiUrl = `https://api.muapi.ai/api/v1/${endpoint}`;

    console.log(`[muapi-proxy] Forwarding ${generationType} request to ${endpoint}`);

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
