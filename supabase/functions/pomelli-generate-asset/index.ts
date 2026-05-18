import { serve } from 'https://deno.land/x/supabase@0.36.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, content-type, accept',
};

const PLATFORM_CONFIG = {
  'instagram_feed': { aspect_ratio: '4:5', width: 1080, height: 1350 },
  'instagram_story': { aspect_ratio: '9:16', width: 1080, height: 1920 },
  'facebook_ad': { aspect_ratio: '1.91:1', width: 1200, height: 630 },
  'linkedin_post': { aspect_ratio: '1.91:1', width: 1200, height: 627 },
  'twitter_post': { aspect_ratio: '1:1', width: 1200, height: 1200 },
  'youtube_thumbnail': { aspect_ratio: '16:9', width: 1280, height: 720 },
  'web_banner': { aspect_ratio: '16:9', width: 1200, height: 600 },
  'email_header': { aspect_ratio: '4:1', width: 1200, height: 300 },
  'short_form_video': { aspect_ratio: '9:16', width: 1080, height: 1920 },
  'product_photo': { aspect_ratio: '1:1', width: 1024, height: 1024 }
};

function buildPrompt(platform, concept, copy, brandProfile) {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.instagram_feed;
  const brandName = brandProfile?.brand_name || 'Brand';
  const headline = copy?.headline || concept?.headline || '';
  const body = copy?.body || concept?.body || '';
  const cta = copy?.cta || concept?.cta || '';
  
  return `Professional ${platform.replace('_', ' ')} design for ${brandName}. 
Brand: ${brandName}
Headline: ${headline}
Body: ${body}
CTA: ${cta}
Style: ${brandProfile?.visual_style || 'Modern'}
Colors: ${brandProfile?.primary_colors?.slice(0, 3).join(', ') || '#1a1a1a, #ffffff, #ff6b35'}
Aspect Ratio: ${config.aspect_ratio}
High quality, marketing grade, clean design, brand consistent`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { brand_profile_id, campaign_id, platform, asset_type, concept, custom_instructions } = await req.json();

    if (!brand_profile_id || !platform || !asset_type) {
      return new Response(JSON.stringify({ error: 'brand_profile_id, platform, and asset_type are required' }), { 
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

    const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.instagram_feed;
    const prompt = buildPrompt(platform, concept || {}, custom_instructions || {}, brandProfile);
    const muapiKey = Deno.env.get('MUAPI_API_KEY');

    if (!muapiKey) {
      return new Response(JSON.stringify({ error: 'MuAPI API key not configured' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const requestId = `pomelli_${Date.now()}`;
    let imageUrl = null;
    let status = 'processing';
    let errorMessage = null;

    try {
      const response = await fetch('https://api.muapi.ai/api/v1/sd-1-text-to-image/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': muapiKey
        },
        body: JSON.stringify({
          prompt,
          aspect_ratio: config.aspect_ratio,
          width: config.width,
          height: config.height,
          steps: 30,
          cfg_scale: 7.5
        })
      });

      if (!response.ok) {
        throw new Error(`MuAPI request failed: ${response.status}`);
      }

      const result = await response.json();
      imageUrl = result.url || result.output?.[0];
      status = 'completed';

      if (imageUrl) {
        const uploadResponse = await fetch(imageUrl);
        if (uploadResponse.ok) {
          const buffer = await uploadResponse.arrayBuffer();
          const fileName = `pomelli_${requestId}.${imageUrl.endsWith('.png') ? 'png' : 'jpg'}`;
          
          const storageResponse = await supabaseAdmin.storage
            .from('pomelli-assets')
            .upload(fileName, buffer, {
              contentType: imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg'
            });

          if (storageResponse.data) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('pomelli-assets')
              .getPublicUrl(fileName);
            imageUrl = publicUrlData.publicUrl;
          }
        }
      }
    } catch (err) {
      console.error('MuAPI error:', err);
      errorMessage = err.message;
      status = 'failed';
    }

    const assetData = {
      brand_profile_id,
      campaign_id: campaign_id || null,
      asset_type,
      platform,
      aspect_ratio: config.aspect_ratio,
      prompt,
      copy: concept?.copy || {},
      muapi_job_id: requestId,
      storage_path: imageUrl ? `pomelli-assets/pomelli_${requestId}` : null,
      public_url: imageUrl,
      thumbnail_url: imageUrl,
      status,
      metadata: { 
        generation_time: new Date().toISOString(),
        brand_name: brandProfile.brand_name
      }
    };

    const { data, error } = await supabaseAdmin
      .from('pomelli_assets')
      .insert(assetData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return new Response(JSON.stringify({ asset: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in pomelli-generate-asset:', error);
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