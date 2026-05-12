-- Create BrandDNA table
CREATE TABLE IF NOT EXISTS public.brand_dna (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  url TEXT NOT NULL,
  brand_name TEXT,
  industry TEXT,
  tagline TEXT,
  value_proposition TEXT,
  tone_of_voice JSONB,
  brand_personality JSONB,
  target_audience TEXT,
  key_messages JSONB,
  primary_colors JSONB,
  secondary_colors JSONB,
  fonts JSONB,
  logo_url TEXT,
  screenshot_url TEXT,
  imagery_style TEXT,
  layout_style TEXT,
  raw_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Campaign table
CREATE TABLE IF NOT EXISTS public.campaign (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT REFERENCES public.brand_dna(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  prompt TEXT,
  concepts JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Photoshoot table
CREATE TABLE IF NOT EXISTS public.photoshoot (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT REFERENCES public.brand_dna(id) ON DELETE SET NULL,
  product_image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  style_id TEXT NOT NULL,
  style_label TEXT NOT NULL,
  prompt TEXT,
  image_url TEXT,
  aspect TEXT DEFAULT '1:1',
  resolution TEXT DEFAULT '2k',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Animation table
CREATE TABLE IF NOT EXISTS public.animation (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT REFERENCES public.brand_dna(id) ON DELETE SET NULL,
  source_image_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  prompt TEXT NOT NULL,
  video_url TEXT,
  duration INT DEFAULT 5,
  resolution TEXT DEFAULT '720p',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Asset table
CREATE TABLE IF NOT EXISTS public.asset (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT REFERENCES public.campaign(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  format TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  headline TEXT,
  body TEXT,
  cta TEXT,
  variants JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (optional, adjust as needed)
ALTER TABLE public.brand_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photoshoot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaign_brand_id ON public.campaign(brand_id);
CREATE INDEX IF NOT EXISTS idx_photoshoot_brand_id ON public.photoshoot(brand_id);
CREATE INDEX IF NOT EXISTS idx_animation_brand_id ON public.animation(brand_id);
CREATE INDEX IF NOT EXISTS idx_asset_campaign_id ON public.asset(campaign_id);
