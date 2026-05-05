import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET_NAME = "vimax-videos";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "track";

    if (action === "init") {
      const { data: buckets } = await adminClient.storage.listBuckets();
      const exists = (buckets ?? []).some((b: { name: string }) => b.name === BUCKET_NAME);

      if (!exists) {
        const { error: bucketErr } = await adminClient.storage.createBucket(BUCKET_NAME, {
          public: false,
          fileSizeLimit: 524288000,
          allowedMimeTypes: [
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
            "video/webm",
            "video/x-matroska",
            "video/avi",
            "video/mov",
          ],
        });
        if (bucketErr && !bucketErr.message?.includes("already exists")) {
          return jsonResponse({ error: bucketErr.message }, 500);
        }
      }

      return jsonResponse({ bucket: BUCKET_NAME, ready: true });
    }

    if (action === "track") {
      if (req.method !== "POST") {
        return jsonResponse({ error: "POST required for track action" }, 405);
      }

      const body = await req.json();
      const {
        user_id,
        original_filename,
        file_size,
        mime_type,
        format,
        duration_seconds,
        width,
        height,
        thumbnail_data,
        storage_path,
        storage_url,
        content_type,
        metadata,
      } = body;

      if (!user_id || !original_filename) {
        return jsonResponse({ error: "user_id and original_filename are required" }, 400);
      }

      const { data, error } = await adminClient
        .from("vimax_video_uploads")
        .insert({
          user_id,
          original_filename,
          file_size: file_size || 0,
          mime_type: mime_type || "",
          format: format || "",
          duration_seconds: duration_seconds ?? null,
          width: width ?? null,
          height: height ?? null,
          thumbnail_data: thumbnail_data || "",
          storage_path: storage_path || "",
          storage_url: storage_url || "",
          content_type: content_type || "general",
          status: "uploaded",
          metadata: metadata || {},
        })
        .select()
        .maybeSingle();

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ upload: data });
    }

    if (action === "signed-url") {
      const body = await req.json();
      const { storage_path } = body;
      if (!storage_path) {
        return jsonResponse({ error: "storage_path required" }, 400);
      }
      const { data, error } = await adminClient.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storage_path, 3600);
      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ signed_url: data.signedUrl });
    }

    if (action === "list") {
      const user_id = url.searchParams.get("user_id");
      if (!user_id) {
        return jsonResponse({ error: "user_id required" }, 400);
      }
      const { data, error } = await adminClient
        .from("vimax_video_uploads")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ uploads: data || [] });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
