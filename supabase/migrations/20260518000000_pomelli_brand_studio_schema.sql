-- Pomelli Studio Schema
-- Brand DNA profiles for marketing campaigns

-- Tables
CREATE TABLE IF NOT EXISTS public.pomelli_brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  source_url text NOT NULL,
  brand_name text,
  logo_url text,
  screenshot_url text,
  primary_colors jsonb DEFAULT '[]'::jsonb,
  secondary_colors jsonb DEFAULT '[]'::jsonb,
  fonts jsonb DEFAULT '[]'::jsonb,
  tone jsonb DEFAULT '[]'::jsonb,
  personality jsonb DEFAULT '[]'::jsonb,
  target_audience text,
  value_proposition text,
  offers jsonb DEFAULT '[]'::jsonb,
  messaging_pillars jsonb DEFAULT '[]'::jsonb,
  visual_style text,
  cta_style text,
  raw_analysis jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.pomelli_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  brand_profile_id uuid REFERENCES public.pomelli_brand_profiles(id) ON DELETE CASCADE,
  campaign_goal text,
  campaign_direction text,
  concepts jsonb DEFAULT '[]'::jsonb,
  selected_concept jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS public.pomelli_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  brand_profile_id uuid REFERENCES public.pomelli_brand_profiles(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.pomelli_campaigns(id) ON DELETE SET NULL,
  asset_type text,
  platform text,
  aspect_ratio text,
  prompt text,
  copy jsonb DEFAULT '{}'::jsonb,
  muapi_job_id text,
  storage_path text,
  public_url text,
  thumbnail_url text,
  status text DEFAULT 'created',
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.pomelli_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  brand_profile_id uuid REFERENCES public.pomelli_brand_profiles(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.pomelli_campaigns(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES public.pomelli_assets(id) ON DELETE SET NULL,
  generation_type text,
  provider text DEFAULT 'muapi',
  model text,
  request_payload jsonb DEFAULT '{}'::jsonb,
  response_payload jsonb DEFAULT '{}'::jsonb,
  status text,
  error_message text
);

-- Storage bucket for Pomelli assets
INSERT INTO storage.buckets (id, name, created_at, updated_at)
VALUES ('pomelli-assets', 'pomelli-assets', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pomelli-assets bucket
CREATE POLICY "Users can view pomelli assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pomelli-assets');

CREATE POLICY "Users can insert pomelli assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pomelli-assets');

CREATE POLICY "Users can update pomelli assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pomelli-assets');

-- Table RLS policies
ALTER TABLE public.pomelli_brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomelli_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomelli_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomelli_generations ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (can be restricted later)
CREATE POLICY "Allow all on pomelli_brand_profiles"
ON public.pomelli_brand_profiles FOR ALL
TO authenticated;

CREATE POLICY "Allow all on pomelli_campaigns"
ON public.pomelli_campaigns FOR ALL
TO authenticated;

CREATE POLICY "Allow all on pomelli_assets"
ON public.pomelli_assets FOR ALL
TO authenticated;

CREATE POLICY "Allow all on pomelli_generations"
ON public.pomelli_generations FOR ALL
TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pomelli_campaign_brand_id ON public.pomelli_campaigns(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_pomelli_assets_brand_id ON public.pomelli_assets(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_pomelli_assets_campaign_id ON public.pomelli_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pomelli_generations_brand_id ON public.pomelli_generations(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_pomelli_generations_asset_id ON public.pomelli_generations(asset_id);
