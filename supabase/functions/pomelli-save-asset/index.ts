import { serve } from 'https://deno.land/x/supabase@0.36.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, content-type, accept',
};

const TARGET_CONFIG = {
  library: { action: 'save', message: 'Asset saved to library' },
  render: { action: 'queue', message: 'Asset queued for render' },
  director: { action: 'director', message: 'Asset sent to director' },
  timeline: { action: 'timeline', message: 'Asset added to timeline' }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { asset_id, target, campaign_id } = await req.json();

    if (!asset_id || !target) {
      return new Response(JSON.stringify({ error: 'asset_id and target are required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: asset, error: assetError } = await supabaseAdmin
      .from('pomelli_assets')
      .select('*')
      .eq('id', asset_id)
      .single();

    if (assetError || !asset) {
      return new Response(JSON.stringify({ error: 'Asset not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const config = TARGET_CONFIG[target] || TARGET_CONFIG.library;
    let result = { success: true, message: config.message, asset_id };

    switch (target) {
      case 'library':
        result.library_entry = {
          id: asset.id,
          type: asset.asset_type,
          platform: asset.platform,
          url: asset.public_url,
          thumbnail: asset.thumbnail_url,
          status: asset.status,
          saved_at: new Date().toISOString()
        };
        break;

      case 'render':
        result.render_job = {
          id: `render_${asset.id}`,
          asset_id: asset.id,
          status: 'queued',
          priority: 'normal',
          created_at: new Date().toISOString()
        };
        break;

      case 'director':
        result.director_entry = {
          id: `dir_${asset.id}`,
          asset_id: asset.id,
          source: 'pomelli',
          status: 'available',
          created_at: new Date().toISOString()
        };
        break;

      case 'timeline':
        result.timeline_entry = {
          id: `tl_${asset.id}`,
          asset_id: asset.id,
          duration: 5,
          position: 0,
          status: 'added'
        };
        break;
    }

    if (campaign_id) {
      await supabaseAdmin
        .from('pomelli_campaigns')
        .update({ selected_concept: { ...asset, saved_to: target } })
        .eq('id', campaign_id);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in pomelli-save-asset:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

if (import.meta.hot) {
  import.meta.hot.accept();
}