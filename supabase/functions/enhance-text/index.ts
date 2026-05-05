import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const backendUrl = Deno.env.get("VIMAX_BACKEND_URL");
    const apiKey = Deno.env.get("VIMAX_API_KEY");

    if (!backendUrl) {
      return new Response(
        JSON.stringify({ detail: "Backend URL not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      forwardHeaders["Authorization"] = `Bearer ${apiKey}`;
    }

    const upstream = await fetch(`${backendUrl}/enhance-text`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    const upstreamData = await upstream.json();

    return new Response(JSON.stringify(upstreamData), {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: "Proxy error: " + (err as Error).message }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
