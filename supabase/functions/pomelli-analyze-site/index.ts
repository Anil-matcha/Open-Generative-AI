import { serve } from 'https://deno.land/x/supabase@0.36.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, content-type, accept',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, workspace_id } = await req.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'url is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Pomelli-Brand-Analyzer/1.0' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const getMeta = (selector) => doc.querySelector(selector)?.getAttribute('content') || '';
    const getTitle = () => doc.title || getMeta('meta[property="og:title"]') || getMeta('meta[name="title"]') || '';
    const getDescription = () => getMeta('meta[name="description"]') || getMeta('meta[property="og:description"]') || '';
    const getOgImage = () => getMeta('meta[property="og:image"]') || '';
    const getFavicon = () => {
      const link = doc.querySelector('link[rel*="icon"]');
      return link ? new URL(link.getAttribute('href'), url).href : '';
    };

    const logoCandidates = [];
    doc.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      if (/logo/i.test(src) || /logo/i.test(alt)) {
        try {
          logoCandidates.push(new URL(src, url).href);
        } catch {}
      }
    });

    const primaryColors = ['#1a1a1a', '#ffffff', '#ff6b35', '#2563eb', '#10b981'];
    const secondaryColors = ['#6b7280', '#f3f4f6', '#ef4444', '#f59e0b'];
    const fonts = ['Inter', 'Helvetica', 'Arial', 'sans-serif'];
    const tone = ['Professional', 'Friendly', 'Authoritative'];
    const personality = ['Modern', 'Trustworthy', 'Innovative'];

    const brandProfile = {
      source_url: url,
      brand_name: getTitle(),
      logo_url: logoCandidates[0] || getOgImage() || getFavicon() || null,
      primary_colors: primaryColors,
      secondary_colors: secondaryColors,
      fonts: fonts,
      tone: tone,
      personality: personality,
      target_audience: 'General consumers',
      value_proposition: getDescription().slice(0, 200),
      offers: [],
      messaging_pillars: [getDescription().slice(0, 100)],
      visual_style: 'Modern and clean',
      cta_style: 'Direct and compelling',
      raw_analysis: {
        title: getTitle(),
        description: getDescription(),
        og_image: getOgImage()
      }
    };

    const { data, error } = await supabaseAdmin
      .from('pomelli_brand_profiles')
      .insert(brandProfile)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return new Response(JSON.stringify({ 
      brand_profile: data,
      analysis: {
        title: getTitle(),
        description: getDescription(),
        logo_candidates: logoCandidates.slice(0, 3)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in pomelli-analyze-site:', error);
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