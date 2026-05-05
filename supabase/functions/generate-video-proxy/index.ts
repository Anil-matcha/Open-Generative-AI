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

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ detail: "Request must be multipart/form-data." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const forwardHeaders: Record<string, string> = {
      "Content-Type": contentType,
    };
    if (apiKey) {
      forwardHeaders["Authorization"] = `Bearer ${apiKey}`;
    }

    const body = await req.arrayBuffer();

    const upstream = await fetch(`${backendUrl}/generate-video`, {
      method: "POST",
      headers: forwardHeaders,
      body,
    });

    const upstreamBody = await upstream.arrayBuffer();

    return new Response(upstreamBody, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: "Proxy error: " + (err as Error).message }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
