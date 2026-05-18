-- 20260516000000_create_personalizer_tables.sql
-- Universal Personalization System tables
-- Supports: profile scanning, project management, output storage, app registry, prompt templates

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- App registry: each video/image app that supports personalization
CREATE TABLE IF NOT EXISTS personalizer_apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User personalization projects
CREATE TABLE IF NOT EXISTS personalization_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON delete CASCADE NOT NULL,
  app_id TEXT REFERENCES personalizer_apps(id) ON delete SET NULL,
  mode TEXT NOT NULL DEFAULT 'cold-email',
  target_name TEXT NOT NULL,
  target_company TEXT,
  manual_notes TEXT,
  scan_id UUID,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profile scan results (from Maigret or other sources)
CREATE TABLE IF NOT EXISTS profile_scan_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) on delete CASCADE NOT NULL,
  target_name TEXT NOT NULL,
  scan_data JSONB DEFAULT '{}'::jsonb,
  source TEXT DEFAULT 'maigret',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Generated personalization outputs
CREATE TABLE IF NOT EXISTS personalization_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES personalization_projects(id) on delete CASCADE NOT NULL,
  output_type TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt templates per app/mode
CREATE TABLE IF NOT EXISTS personalizer_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT REFERENCES personalizer_apps(id) on delete CASCADE NOT NULL,
  mode TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, mode, template_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personalization_projects_user_id ON personalization_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_personalization_projects_app_id ON personalization_projects(app_id);
CREATE INDEX IF NOT EXISTS idx_personalization_projects_status ON personalization_projects(status);
CREATE INDEX IF NOT EXISTS idx_profile_scan_results_user_id ON profile_scan_results(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_scan_results_target_name ON profile_scan_results(target_name);
CREATE INDEX IF NOT EXISTS idx_personalization_outputs_project_id ON personalization_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_personalizer_templates_app_mode ON personalizer_templates(app_id, mode);

-- Add scan_id foreign key (after profile_scan_results exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'personalization_projects_scan_id_fkey'
  ) THEN
    ALTER TABLE personalization_projects
      ADD CONSTRAINT personalization_projects_scan_id_fkey
      FOREIGN KEY (scan_id) REFERENCES profile_scan_results(id) ON delete SET NULL;
  END IF;
END $$;

-- Row Level Security
ALTER TABLE personalization_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalizer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalizer_apps ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can manage their own projects"
  ON personalization_projects FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scans"
  ON profile_scan_results FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own outputs"
  ON personalization_outputs FOR ALL
  USING (
    project_id IN (
      SELECT id FROM personalization_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read templates"
  ON personalizer_templates FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read apps"
  ON personalizer_apps FOR SELECT
  USING (true);

-- Seed default apps
INSERT INTO personalizer_apps (id, name, description) VALUES
  ('ai-video-agency', 'AI Video Agency', 'Main video editing and generation studio'),
  ('image-studio', 'Image Studio', 'AI image generation and editing'),
  ('video-studio', 'Video Studio', 'AI video generation and editing'),
  ('cinema-studio', 'Cinema Studio', 'Cinematic film production'),
  ('effects-studio', 'Effects Studio', 'Visual effects and compositing'),
  ('character-studio', 'Character Studio', 'AI character creation'),
  ('influencer-studio', 'Influencer Studio', 'Influencer content creation'),
  ('audio-studio', 'Audio Studio', 'Audio mixing and effects'),
  ('timeline-editor', 'Timeline Editor', 'Multi-track timeline editing'),
  ('video-outreach', 'Video Outreach', 'Personalized video outreach campaigns')
ON CONFLICT (id) DO NOTHING;

-- Seed default prompt templates
INSERT INTO personalizer_templates (app_id, mode, template_type, content) VALUES
  ('ai-video-agency', 'cold-email', 'system', 'You are an expert at writing highly personalized cold emails for video production services. Use the target''s public profile data to craft a compelling, relevant message.'),
  ('ai-video-agency', 'cold-email', 'user', 'Write a personalized cold email for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Offer: {{offer}}. Call to action: {{cta}}.'),
  ('ai-video-agency', 'video-script', 'system', 'You are an expert video script writer. Create personalized video scripts that speak directly to the target using their public profile information.'),
  ('ai-video-agency', 'video-script', 'user', 'Write a personalized video script for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Goal: {{goal}}. CTA: {{cta}}.'),
  ('ai-video-agency', 'proposal', 'system', 'You are an expert at writing personalized business proposals for video production services.'),
  ('ai-video-agency', 'proposal', 'user', 'Write a personalized proposal for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Offer: {{offer}}. Goal: {{goal}}. CTA: {{cta}}.'),
  ('image-studio', 'cold-email', 'system', 'You are an expert at writing personalized emails for AI image generation services.'),
  ('image-studio', 'cold-email', 'user', 'Write a personalized cold email for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Offer: {{offer}}. CTA: {{cta}}.'),
  ('video-studio', 'cold-email', 'system', 'You are an expert at writing personalized emails for AI video generation services.'),
  ('video-studio', 'cold-email', 'user', 'Write a personalized cold email for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Offer: {{offer}}. CTA: {{cta}}.'),
  ('cinema-studio', 'cold-email', 'system', 'You are an expert at writing personalized emails for cinematic production services.'),
  ('cinema-studio', 'cold-email', 'user', 'Write a personalized cold email for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Offer: {{offer}}. CTA: {{cta}}.'),
  ('timeline-editor', 'cold-email', 'system', 'You are an expert at writing personalized emails for video editing services.'),
  ('timeline-editor', 'cold-email', 'user', 'Write a personalized cold email for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Offer: {{offer}}. CTA: {{cta}}.'),
  ('video-outreach', 'cold-email', 'system', 'You are an expert at writing personalized outreach emails for video campaigns.'),
  ('video-outreach', 'cold-email', 'user', 'Write a personalized cold email for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Offer: {{offer}}. CTA: {{cta}}.'),
  ('video-outreach', 'video-script', 'system', 'You are an expert at writing personalized video scripts for outreach campaigns.'),
  ('video-outreach', 'video-script', 'user', 'Write a personalized video script for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Goal: {{goal}}. CTA: {{cta}}.'),
  ('video-outreach', 'proposal', 'system', 'You are an expert at writing personalized proposals for video outreach campaigns.'),
  ('video-outreach', 'proposal', 'user', 'Write a personalized proposal for {{targetName}} at {{targetCompany}}. Context: {{manualNotes}}. Public profile data: {{scanData}}. Tone: {{tone}}. Offer: {{offer}}. Goal: {{goal}}. CTA: {{cta}}.')
ON CONFLICT (app_id, mode, template_type) DO NOTHING;
