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
    // URL format: /functions/v1/storyboarder-scenes or /functions/v1/storyboarder-scenes/:id
    const action = pathParts[pathParts.length - 1];
    const isCollectionEndpoint = action === "storyboarder-scenes";
    const resourceId = isCollectionEndpoint ? null : action;

    // GET /functions/v1/storyboarder-scenes?script_id=xxx - List scenes by script
    if (req.method === "GET" && isCollectionEndpoint) {
      const scriptId = url.searchParams.get("script_id");
      if (scriptId) {
        const { data: scenes, error } = await supabase
          .from("storyboarder_scenes")
          .select("*")
          .eq("script_id", scriptId)
          .order("scene_number", { ascending: true });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(scenes),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "script_id query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /functions/v1/storyboarder-scenes/:id - Get single scene
    if (req.method === "GET" && resourceId && !isNaN(Number(resourceId))) {
      const { data: scene, error } = await supabase
        .from("storyboarder_scenes")
        .select("*")
        .eq("id", resourceId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: "Scene not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(scene),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /functions/v1/storyboarder-scenes - Create scene
    if (req.method === "POST" && isCollectionEndpoint) {
      const body = await req.json();

      const { data: scene, error } = await supabase
        .from("storyboarder_scenes")
        .insert({
          script_id: body.script_id,
          scene_number: body.scene_number,
          title: body.title,
          location: body.location,
          time_of_day: body.time_of_day,
          description: body.description,
          characters: body.characters || [],
          mood_tension: body.mood_tension ?? 0.5,
          mood_emotion: body.mood_emotion ?? 0.5,
          mood_energy: body.mood_energy ?? 0.5,
          mood_darkness: body.mood_darkness ?? 0.5,
          mood_overall: body.mood_overall || 'neutral',
          soundtrack_genre: body.soundtrack_genre || 'ambient',
          soundtrack_tempo: body.soundtrack_tempo || 'moderate',
          soundtrack_instruments: body.soundtrack_instruments || ['piano'],
          soundtrack_reference: body.soundtrack_reference || 'N/A',
          soundtrack_energy: body.soundtrack_energy ?? 0.5,
          frame_image_path: body.frame_image_path
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
        JSON.stringify(scene),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT/PATCH /functions/v1/storyboarder-scenes/:id - Update scene
    if ((req.method === "PUT" || req.method === "PATCH") && resourceId) {
      const body = await req.json();

      const { data: scene, error } = await supabase
        .from("storyboarder_scenes")
        .update({
          scene_number: body.scene_number,
          title: body.title,
          location: body.location,
          time_of_day: body.time_of_day,
          description: body.description,
          characters: body.characters,
          mood_tension: body.mood_tension,
          mood_emotion: body.mood_emotion,
          mood_energy: body.mood_energy,
          mood_darkness: body.mood_darkness,
          mood_overall: body.mood_overall,
          soundtrack_genre: body.soundtrack_genre,
          soundtrack_tempo: body.soundtrack_tempo,
          soundtrack_instruments: body.soundtrack_instruments,
          soundtrack_reference: body.soundtrack_reference,
          soundtrack_energy: body.soundtrack_energy,
          frame_image_path: body.frame_image_path
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
        JSON.stringify(scene),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE /functions/v1/storyboarder-scenes/:id - Delete scene
    if (req.method === "DELETE" && resourceId) {
      const { error } = await supabase
        .from("storyboarder_scenes")
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
    console.error("Storyboarder scenes error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

Deno.serve(handler);