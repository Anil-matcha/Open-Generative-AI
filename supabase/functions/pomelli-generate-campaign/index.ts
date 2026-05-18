import { serve } from 'https://deno.land/x/supabase@0.36.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, content-type, accept',
};

const CAMPAIGN_GOALS = {
  'product_launch': 'Product Launch Campaign',
  'lead_generation': 'Lead Generation Campaign',
  'awareness': 'Brand Awareness Campaign',
  'engagement': 'Audience Engagement Campaign',
  'thought_leadership': 'Thought Leadership Campaign',
  'sales': 'Sales Campaign',
  'webinar_promotion': 'Webinar Promotion Campaign',
  'local_business': 'Local Business Campaign',
  'agency_client': 'Agency Client Campaign',
  'software_promotion': 'Software Promotion Campaign'
};

const CAMPAIGN_PROMPTS = {
  'product_launch': 'Create a campaign concept for launching a new product. Focus on excitement, innovation, and clear value proposition. Include a compelling hook, target audience, offer angle, and CTA.',
  'lead_generation': 'Create a campaign concept focused on generating qualified leads. Emphasize pain points, solution benefits, and conversion optimization. Include hook, audience, offer, and CTA.',
  'awareness': 'Create a brand awareness campaign concept. Focus on memorable messaging, brand recall, and broad reach. Include creative hook, target audience, and engagement strategy.',
  'engagement': 'Create a social media engagement campaign concept. Focus on conversation starters, community building, and interactive elements. Include hook, audience, and engagement tactics.',
  'thought_leadership': 'Create a thought leadership campaign concept. Focus on expertise, insights, and industry authority. Include valuable content angle, target audience, and professional positioning.',
  'sales': 'Create a sales campaign concept. Focus on persuasion, urgency, and clear conversion paths. Include compelling offer, target audience, and strong CTA.',
  'webinar_promotion': 'Create a webinar promotion campaign concept. Focus on education value, speaker expertise, and registration optimization. Include hook, audience, and registration CTA.',
  'local_business': 'Create a local business campaign concept. Focus on community connection, local relevance, and geographic targeting. Include local hook, community angle, and local CTA.',
  'agency_client': 'Create an agency client campaign concept. Focus on professional services, results-driven messaging, and client value. Include case study angle, target audience, and professional CTA.',
  'software_promotion': 'Create a software promotion campaign concept. Focus on productivity, automation, and user benefits. Include feature highlights, target audience, and trial/demo CTA.'
};

function generateConcepts(brandProfile, goal, direction) {
  const goalKey = goal || 'product_launch';
  const conceptPrompt = CAMPAIGN_PROMPTS[goalKey] || CAMPAIGN_PROMPTS.product_launch;
  const goalName = CAMPAIGN_GOALS[goalKey] || CAMPAIGN_GOALS.product_launch;
  
  const brandName = brandProfile.brand_name || 'Brand';
  const valueProp = brandProfile.value_proposition || '';
  const targetAudience = brandProfile.target_audience || 'consumers';
  const tone = brandProfile.tone?.[0] || 'Professional';
  const visualStyle = brandProfile.visual_style || 'Modern';

  const concepts = [];
  for (let i = 0; i < 4; i++) {
    concepts.push({
      id: `concept_${i + 1}`,
      name: `${goalName} - Variant ${i + 1}`,
      big_idea: `${brandName} helps ${targetAudience} achieve ${valueProp} through ${tone.toLowerCase()} ${visualStyle.toLowerCase()} design.`,
      hook: `Discover how ${brandName} transforms ${targetAudience} experience with innovative ${tone.toLowerCase()} solutions.`,
      audience: targetAudience,
      offer_angle: `Exclusive ${i % 2 === 0 ? 'early access' : 'premium'} benefits for ${targetAudience}.`,
      cta: `Get Started Now`,
      recommended_platforms: ['Instagram Feed', 'LinkedIn Post', 'YouTube Thumbnail'],
      mood: tone,
      style: visualStyle
    });
  }

  return concepts;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { brand_profile_id, campaign_goal, campaign_direction } = await req.json();

    if (!brand_profile_id) {
      return new Response(JSON.stringify({ error: 'brand_profile_id is required' }), { 
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

    const concepts = generateConcepts(brandProfile, campaign_goal, campaign_direction);

    const campaignData = {
      brand_profile_id,
      campaign_goal: campaign_goal || 'product_launch',
      campaign_direction: campaign_direction || '',
      concepts,
      selected_concept: concepts[0],
      status: 'draft'
    };

    const { data, error } = await supabaseAdmin
      .from('pomelli_campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return new Response(JSON.stringify({ campaign: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in pomelli-generate-campaign:', error);
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