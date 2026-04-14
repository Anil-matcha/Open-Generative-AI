import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://videoagencyai.netlify.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const action = pathParts[pathParts.length - 1];

    if (req.method === 'GET' && action === 'media-assets') {
      // List user media assets
      const limit = parseInt(url.searchParams.get('limit') ?? '50');
      const offset = parseInt(url.searchParams.get('offset') ?? '0');

      const { data: assets, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching media assets:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch media assets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ assets }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'POST' && action === 'media-assets') {
      // Upload media asset
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'bin';
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${fileExt}`;
      const filePath = `remix-media-assets/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('remix-media-assets')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload file' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('remix-media-assets')
        .getPublicUrl(fileName);

      // Create media asset record
      const { data: asset, error } = await supabase
        .from('media_assets')
        .insert({
          user_id: user.id,
          filename: fileName,
          original_name: file.name,
          url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          metadata: {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating media asset record:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create media asset record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ asset }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'GET' && pathParts.includes('media-assets')) {
      // Get specific media asset
      const assetId = pathParts[pathParts.length - 1];

      const { data: asset, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', assetId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching media asset:', error);
        return new Response(
          JSON.stringify({ error: 'Media asset not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ asset }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'DELETE' && pathParts.includes('media-assets')) {
      // Delete media asset
      const assetId = pathParts[pathParts.length - 1];

      // First get the asset to get the filename for storage deletion
      const { data: asset, error: fetchError } = await supabase
        .from('media_assets')
        .select('filename')
        .eq('id', assetId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching media asset for deletion:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Media asset not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('remix-media-assets')
        .remove([asset.filename]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting media asset record:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete media asset' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Media service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(handler);