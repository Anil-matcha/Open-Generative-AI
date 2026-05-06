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

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter((p) => p);
    // URL format: /functions/v1/storyboarder-shots or /functions/v1/storyboarder-shots/:id
    const action = pathParts[pathParts.length - 1];
    const isCollectionEndpoint = action === "storyboarder-shots";
    const resourceId = isCollectionEndpoint ? null : action;

    // GET /functions/v1/storyboarder-shots?scene_id=xxx - List shots by scene
    if (req.method === "GET" && isCollectionEndpoint) {
      const sceneId = url.searchParams.get("scene_id");
      if (sceneId) {
        const { data: shots, error } = await supabase
          .from("storyboarder_shots")
          .select("*")
          .eq("scene_id", sceneId)
          .order("shot_number", { ascending: true });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(shots),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "scene_id query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /functions/v1/storyboarder-shots/:id - Get single shot
    if (req.method === "GET" && resourceId && !isNaN(Number(resourceId))) {
      const { data: shot, error } = await supabase
        .from("storyboarder_shots")
        .select("*")
        .eq("id", resourceId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: "Shot not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(shot),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /functions/v1/storyboarder-shots - Create shot
    if (req.method === "POST" && isCollectionEndpoint) {
      const body = await req.json();

      const { data: shot, error } = await supabase
        .from("storyboarder_shots")
        .insert({
          scene_id: body.scene_id,
          shot_number: body.shot_number,
          shot_type: body.shot_type || 'medium',
          camera_angle: body.camera_angle || 'eye-level',
          camera_movement: body.camera_movement || 'static',
          description: body.description || '',
          dialogue: body.dialogue || null,
          duration_seconds: body.duration_seconds || 3,
          sd_prompt: body.sd_prompt || ''
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(shot),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT/PATCH /functions/v1/storyboarder-shots/:id - Update shot
    if ((req.method === "PUT" || req.method === "PATCH") && resourceId) {
      const body = await req.json();

      const { data: shot, error } = await supabase
        .from("storyboarder_shots")
        .update({
          shot_number: body.shot_number,
          shot_type: body.shot_type,
          camera_angle: body.camera_angle,
          camera_movement: body.camera_movement,
          description: body.description,
          dialogue: body.dialogue,
          duration_seconds: body.duration_seconds,
          sd_prompt: body.sd_prompt
        })
        .eq("id", resourceId)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(shot),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE /functions/v1/storyboarder-shots/:id - Delete shot
    if (req.method === "DELETE" && resourceId) {
      const { error } = await supabase
        .from("storyboarder_shots")
        .delete()
        .eq("id", resourceId);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Storyboarder shots error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

Deno.serve(handler);