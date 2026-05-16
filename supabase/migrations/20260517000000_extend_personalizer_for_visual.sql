-- 20260517000000_extend_personalizer_for_visual.sql
-- Extends personalization system for image and video generation

-- Add visual personalization columns to projects
ALTER TABLE personalization_projects
  ADD COLUMN IF NOT EXISTS visual_style TEXT DEFAULT 'cinematic',
  ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '16:9',
  ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS reference_image_url TEXT;

-- Create table for generated personalized assets
CREATE TABLE IF NOT EXISTS personalized_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES personalization_projects(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'thumbnail', 'overlay', 'voiceover')),
  generation_prompt TEXT,
  reference_image_url TEXT,
  generated_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_personalized_assets_project_id ON personalized_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_personalized_assets_type ON personalized_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_personalized_assets_status ON personalized_assets(status);

-- Row Level Security
ALTER TABLE personalized_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own personalized assets"
  ON personalized_assets FOR ALL
  USING (
    project_id IN (
      SELECT id FROM personalization_projects WHERE user_id = auth.uid()
    )
  );

-- Seed visual personalization prompt templates
INSERT INTO personalizer_templates (app_id, mode, template_type, content) VALUES
  -- Image modes
  ('ai-video-agency', 'personalized-image', 'system', 'You are an expert at creating highly personalized visual prompts for AI image generation. Use the target''s public profile data, brand context, and visual style preferences to craft detailed, cinematic prompts.'),
  ('ai-video-agency', 'personalized-image', 'user', 'Create a personalized image prompt for {{targetName}} at {{targetCompany}}. Profile context: {{scanData}}. Style: {{visualStyle}}. Aspect ratio: {{aspectRatio}}. Additional notes: {{manualNotes}}. Generate a detailed prompt optimized for Flux/SDXL that includes accurate facial features, clothing, environment, and lighting based on public profile data.'),
  
  ('image-studio', 'personalized-image', 'system', 'You are an expert at creating highly personalized visual prompts for AI image generation.'),
  ('image-studio', 'personalized-image', 'user', 'Create a personalized image prompt for {{targetName}} at {{targetCompany}}. Profile context: {{scanData}}. Style: {{visualStyle}}. Aspect ratio: {{aspectRatio}}. Additional notes: {{manualNotes}}.'),
  
  ('video-studio', 'personalized-image', 'system', 'You are an expert at creating highly personalized visual prompts for AI image generation.'),
  ('video-studio', 'personalized-image', 'user', 'Create a personalized image prompt for {{targetName}} at {{targetCompany}}. Profile context: {{scanData}}. Style: {{visualStyle}}. Aspect ratio: {{aspectRatio}}. Additional notes: {{manualNotes}}.'),
  
  -- Video modes
  ('ai-video-agency', 'personalized-video', 'system', 'You are an expert at creating highly personalized video prompts and scene breakdowns for AI video generation. Use the target''s public profile data to create cinematic, emotionally resonant video concepts.'),
  ('ai-video-agency', 'personalized-video', 'user', 'Create a personalized video concept for {{targetName}} at {{targetCompany}}. Profile context: {{scanData}}. Story type: {{storyType}}. Duration: {{duration}} seconds. Style: {{visualStyle}}. Tone: {{tone}}. Offer: {{offer}}. CTA: {{cta}}. Generate: 1) Master video prompt 2) Scene-by-scene breakdown 3) Voiceover direction 4) Negative prompt.'),
  
  ('video-studio', 'personalized-video', 'system', 'You are an expert at creating highly personalized video prompts for AI video generation.'),
  ('video-studio', 'personalized-video', 'user', 'Create a personalized video concept for {{targetName}} at {{targetCompany}}. Profile context: {{scanData}}. Story type: {{storyType}}. Duration: {{duration}} seconds. Style: {{visualStyle}}. Tone: {{tone}}. Offer: {{offer}}. CTA: {{cta}}.'),
  
  ('cinema-studio', 'personalized-video', 'system', 'You are an expert at creating cinematic, high-production-value video concepts for personalized founder stories and brand films.'),
  ('cinema-studio', 'personalized-video', 'user', 'Create a cinematic personalized video concept for {{targetName}} at {{targetCompany}}. Profile context: {{scanData}}. Story type: {{storyType}}. Duration: {{duration}} seconds. Style: {{visualStyle}}. Tone: {{tone}}.'),
  
  ('timeline-editor', 'personalized-video', 'system', 'You are an expert at creating personalized video concepts optimized for timeline editing and multi-track composition.'),
  ('timeline-editor', 'personalized-video', 'user', 'Create a personalized video concept for {{targetName}} at {{targetCompany}}. Profile context: {{scanData}}. Story type: {{storyType}}. Duration: {{duration}} seconds. Style: {{visualStyle}}. Tone: {{tone}}.'),
  
  ('video-outreach', 'personalized-video', 'system', 'You are an expert at creating highly personalized outreach videos that drive engagement and conversions.'),
  ('video-outreach', 'personalized-video', 'user', 'Create a personalized outreach video concept for {{targetName}} at {{targetCompany}}. Profile context: {{scanData}}. Story type: {{storyType}}. Duration: {{duration}} seconds. Style: {{visualStyle}}. Tone: {{tone}}. Offer: {{offer}}. CTA: {{cta}}.')
ON CONFLICT (app_id, mode, template_type) DO NOTHING;
