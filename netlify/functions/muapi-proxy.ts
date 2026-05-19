/**
 * Netlify Function: MuAPI Proxy
 * 
 * Proxies requests to MuAPI for AI video generation.
 * Handles POST to /generate_wan_ai_effects and GET for polling results.
 * 
 * This function converts the upstream Next.js API route (pages/api/proxy-muapi.js)
 * to Netlify Functions format.
 */

interface MuAPIRequest {
  prompt?: string;
  image_url?: string;
  name?: string;
  aspect_ratio?: string;
  quality?: string;
  duration?: number;
}

interface MuAPIResponse {
  request_id?: string;
  id?: string;
  status?: string;
  output?: any;
  url?: string;
  video?: { url?: string };
  error?: string;
}

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Rate limiting store (use Redis in production multi-instance deployments)
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

function getClientId(event: any): string {
  const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-API-Key'];
  if (apiKey) {
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      hash = ((hash << 5) - hash) + apiKey.charCodeAt(i);
      hash |= 0;
    }
    return `key_${Math.abs(hash).toString(36)}`;
  }
  return `ip_${event.headers?.['x-nf-client-connection-ip'] || event.headers?.['X-NF-Client-Connection-Ip'] || 'unknown'}`;
}

export async function handler(event: any, context: any) {
  const { httpMethod, queryStringParameters, headers, body } = event;

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Rate limiting
  const clientId = getClientId(event);
  if (!checkRateLimit(clientId)) {
    return {
      statusCode: 429,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
    };
  }

  // Proxy POST to /generate_wan_ai_effects
  if (httpMethod === 'POST') {
    const apiKey = headers?.['x-api-key'] || headers?.['X-API-Key'];
    if (!apiKey) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing x-api-key header' }),
      };
    }

    let payload: MuAPIRequest;
    try {
      payload = body ? JSON.parse(body) : {};
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON payload' }),
      };
    }

    if (!payload || Object.keys(payload).length === 0) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing or empty payload' }),
      };
    }

    try {
      const muApiUrl = 'https://api.muapi.ai/api/v1/generate_wan_ai_effects';
      const muApiRes = await fetch(muApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      let data: MuAPIResponse;
      try {
        data = await muApiRes.json();
      } catch (jsonErr) {
        const text = await muApiRes.text();
        return {
          statusCode: muApiRes.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Non-JSON response from MuApi', details: text }),
        };
      }

      return {
        statusCode: muApiRes.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    } catch (error) {
      console.error('[MuApi Proxy] Error:', error);
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: (error as Error).message }),
      };
    }
  }

  // Proxy GET to /predictions/:id/result for video/status polling
  if (httpMethod === 'GET') {
    const apiKey = headers?.['x-api-key'] || headers?.['X-API-Key'];
    if (!apiKey) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing x-api-key header' }),
      };
    }

    const { id } = queryStringParameters || {};
    if (!id) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing id query parameter' }),
      };
    }

    try {
      const muApiStatusUrl = `https://api.muapi.ai/api/v1/predictions/${id}/result`;
      const muApiRes = await fetch(muApiStatusUrl, {
        method: 'GET',
        headers: { 'x-api-key': apiKey },
      });

      let data: MuAPIResponse;
      try {
        data = await muApiRes.json();
      } catch (jsonErr) {
        const text = await muApiRes.text();
        return {
          statusCode: muApiRes.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Non-JSON response from MuApi', details: text }),
        };
      }

      return {
        statusCode: muApiRes.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    } catch (error) {
      console.error('[MuApi Proxy] Error:', error);
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: (error as Error).message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}