import { serve } from 'https://deno.land/x/supabase@0.36.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, content-type, accept',
};

const VIDEO_CONFIGS = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1088 }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { brand_profile_id, campaign_id, source_asset_id, duration, resolution, motion_style } = await req.json();

    if (!brand_profile_id || !source_asset_id) {
      return new Response(JSON.stringify({ error: 'brand_profile_id and source_asset_id are required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: brandProfile, error: brandError } = await supabaseAdmin
      .from('pomelli_brand_profiles')
      .select('*')
      .eq('id', brand_profile_id)
      .single();

    if (brandError || !brandProfile) {
      return new Response(JSON.stringify({ error: 'Brand profile not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: sourceAsset, error: assetError } = await supabaseAdmin
      .from('pomelli_assets')
      .select('*')
      .eq('id', source_asset_id)
      .single();

    if (assetError || !sourceAsset) {
      return new Response(JSON.stringify({ error: 'Source asset not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const config = VIDEO_CONFIGS[resolution] || VIDEO_CONFIGS['720p'];
    const muapiKey = Deno.env.get('MUAPI_API_KEY');

    if (!muapiKey) {
      return new Response(JSON.stringify({ error: 'MuAPI API key not configured' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const prompt = `${brandProfile.brand_name} promotional video. Style: ${motion_style || 'cinematic'}. Duration: ${duration || 8} seconds. Aspect ratio: 9:16. Professional marketing video. ${brandProfile.visual_style || 'Modern'} style.`;

    let videoUrl = null;
    let status = 'processing';
    let errorMessage = null;

    try {
      const response = await fetch('https://api.muapi.ai/api/v1/sd-1-image-to-video/image-to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': muapiKey
        },
        body: JSON.stringify({
          image_url: sourceAsset.public_url,
          prompt,
          duration: duration || 8,
          resolution: resolution || '720p',
          aspect_ratio: '9:16',
          motion_bucket: 8,
          augment: true
        })
      });

      if (!response.ok) {
        throw new Error(`MuAPI request failed: ${response.status}`);
      }

      const result = await response.json();
      videoUrl = result.url || result.output?.[0];
      status = 'completed';

      if (videoUrl) {
        const uploadResponse = await fetch(videoUrl);
        if (uploadResponse.ok) {
          const buffer = await uploadResponse.arrayBuffer();
          const fileName = `pomelli_video_${Date.now()}.mp4`;
          
          const storageResponse = await supabaseAdmin.storage
            .from('pomelli-assets')
            .upload(fileName, buffer, {
              contentType: 'video/mp4'
            });

          if (storageResponse.data) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('pomelli-assets')
              .getPublicUrl(fileName);
            videoUrl = publicUrlData.publicUrl;
          }
        }
      }
    } catch (err) {
      console.error('MuAPI video error:', err);
      errorMessage = err.message;
      status = 'failed';
    }

    const videoData = {
      brand_profile_id,
      campaign_id: campaign_id || null,
      asset_id: source_asset_id,
      generation_type: 'video',
      provider: 'muapi',
      model: 'sd-1-image-to-video',
      request_payload: {
        image_url: sourceAsset.public_url,
        prompt,
        duration: duration || 8,
        resolution: resolution || '720p'
      },
      response_payload: { url: videoUrl },
      status,
      error_message: errorMessage
    };

    await supabaseAdmin
      .from('pomelli_generations')
      .insert(videoData);

    const { data: newAsset, error: assetUpdateError } = await supabaseAdmin
      .from('pomelli_assets')
      .update({ 
        public_url: videoUrl,
        status: status === 'completed' ? 'completed' : 'failed'
      })
      .eq('id', source_asset_id)
      .select()
      .single();

    return new Response(JSON.stringify({ 
      video: newAsset,
      generation: videoData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in pomelli-generate-video:', error);
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