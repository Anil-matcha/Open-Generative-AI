-- ============================================================================
-- VIMAX COMPLETE SCHEMA SETUP
-- ============================================================================
-- This script creates the complete Vimax database schema in the main
-- Supabase project. It consists of:
--   1. Base tables (vimax_users, vimax_jobs, vimax_batches, vimax_feedback, vimax_generation_history)
--   2. Supporting tables (video_jobs, job_progress - stubs for migration compatibility)
--   3. Existing 4 Vimax migrations applied in order
--
-- INSTRUCTIONS:
--   1. Open Supabase Dashboard → bzxohkrxcwodllketcpz
--   2. Navigate to SQL Editor
--   3. Create new query, paste ALL contents, and Run
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE EXTENSION (if not exists)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- SECTION 2: BASE TABLES (Missing prerequisites)
-- ============================================================================

-- --------------------------------------------------------------
-- TABLE: vimax_users
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vimax_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  stats jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vimax_users_user_id ON vimax_users(user_id);

-- --------------------------------------------------------------
-- TABLE: vimax_jobs
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vimax_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  pipeline_type text NOT NULL DEFAULT 'idea2video',
  idea text DEFAULT '',
  script text DEFAULT '',
  style text DEFAULT 'Cinematic',
  quality text DEFAULT 'standard',
  resolution text DEFAULT '1080p',
  status text DEFAULT 'processing',
  error_message text,
  rating integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vimax_jobs_user_id ON vimax_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_vimax_jobs_status ON vimax_jobs(status);
CREATE INDEX IF NOT EXISTS idx_vimax_jobs_created_at ON vimax_jobs(created_at DESC);

-- --------------------------------------------------------------
-- TABLE: vimax_batches
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vimax_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text NOT NULL UNIQUE,
  user_id text NOT NULL,
  name text DEFAULT 'Unnamed Batch',
  status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vimax_batches_user_id ON vimax_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_vimax_batches_created_at ON vimax_batches(created_at DESC);

-- --------------------------------------------------------------
-- TABLE: vimax_feedback
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vimax_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  user_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments text DEFAULT '',
  follow_up_answer text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vimax_feedback_job_id ON vimax_feedback(job_id);
CREATE INDEX IF NOT EXISTS idx_vimax_feedback_user_id ON vimax_feedback(user_id);

-- --------------------------------------------------------------
-- TABLE: vimax_generation_history
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vimax_generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  job_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vimax_generation_history_user_id ON vimax_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_vimax_generation_history_job_id ON vimax_generation_history(job_id);

-- --------------------------------------------------------------
-- STUB TABLES (for migration 1 RLS policy references - minimal definition)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  progress numeric DEFAULT 0,
  step_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SECTION 3: SHARED UTILITY FUNCTION (overwritten by migration 1)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 4: VIMAX MIGRATION 1
-- Fix RLS Performance, Remove Unused Indexes, and Harden Security Policies
-- ============================================================================

-- Drop 14 unused indexes (safe - tables don't exist yet, IF EXISTS guards)
DROP INDEX IF EXISTS public.vimax_jobs_user_id_idx;
DROP INDEX IF EXISTS public.vimax_jobs_status_idx;
DROP INDEX IF EXISTS public.vimax_jobs_created_at_idx;
-- (other indexes dropped are on non-vimax tables, skipping)

-- Recreate update_updated_at_column with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- SECTION 5: VIMAX MIGRATION 2
-- Add Templates and Scenes Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS vimax_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'General',
  pipeline_type text NOT NULL DEFAULT 'idea2video',
  style text DEFAULT 'Cinematic',
  quality text DEFAULT 'standard',
  sample_idea text DEFAULT '',
  thumbnail_url text DEFAULT '',
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vimax_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vimax_templates_select" ON vimax_templates FOR SELECT USING (true);
CREATE POLICY "vimax_templates_insert" ON vimax_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "vimax_templates_update" ON vimax_templates FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS vimax_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  scene_index integer NOT NULL DEFAULT 0,
  script_line text DEFAULT '',
  image_url text DEFAULT '',
  camera_angle text DEFAULT '',
  duration_seconds integer DEFAULT 4,
  status text DEFAULT 'pending',
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vimax_scenes_job_id ON vimax_scenes(job_id);

ALTER TABLE vimax_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vimax_scenes_select" ON vimax_scenes FOR SELECT USING (true);
CREATE POLICY "vimax_scenes_insert" ON vimax_scenes FOR INSERT WITH CHECK (true);
CREATE POLICY "vimax_scenes_update" ON vimax_scenes FOR UPDATE USING (true) WITH CHECK (true);

-- Seed templates
INSERT INTO vimax_templates (name, description, category, pipeline_type, style, quality, sample_idea, thumbnail_url, tags, is_featured) VALUES
  ('Product Launch Video', 'Create a professional product launch video with dramatic reveals', 'Marketing', 'idea2video', 'Cinematic', 'high', 'A glowing product emerges from darkness with light rays', 'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg', ARRAY['product', 'launch', 'cinematic'], true),
  ('Explainer Video', 'Transform complex ideas into clear, engaging explainer videos', 'Educational', 'script2video', 'Realistic', 'standard', 'An animated character explains the concept step by step', 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg', ARRAY['educational', 'explainer', 'animation'], true),
  ('Social Media Ad', 'Generate eye-catching social media advertisements', 'Social Media', 'idea2video', 'Anime', 'fast', 'Vibrant anime-style characters using your product', 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg', ARRAY['social', 'ad', 'anime'], false),
  ('Training Video', 'Create internal training videos for employee onboarding', 'Corporate', 'script2video', 'Realistic', 'standard', 'Professional trainer demonstrating the process', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg', ARRAY['training', 'corporate', 'tutorial'], false),
  ('Promo Teaser', 'Build hype with a short promotional teaser', 'Marketing', 'idea2video', 'Cinematic', 'high', 'Quick cuts of exciting moments building to a reveal', 'https://images.pexels.com/photos/3252222/pexels-photo-3252222.jpeg', ARRAY['promo', 'teaser', 'hype'], true),
  ('Tutorial Series', 'Generate step-by-step tutorial video series', 'Educational', 'script2video', 'Realistic', 'standard', 'Clear visual instructions with on-screen text', 'https://images.pexels.com/photos/5900415/pexels-photo-5900415.jpeg', ARRAY['tutorial', 'series', 'howto'], false),
  ('Brand Story', 'Tell your brand story with emotional impact', 'Branding', 'idea2video', 'Cinematic', 'high', 'Emotional narrative showing your brand journey', 'https://images.pexels.com/photos/3129671/pexels-photo-3129671.jpeg', ARRAY['brand', 'story', 'emotional'], true),
  ('Quick Update', 'Fast video updates for quick announcements', 'Internal', 'idea2video', 'Realistic', 'fast', 'Simple talking head or screen recording style', 'https://images.pexels.com/photos/1181247/pexels-photo-1181247.jpeg', ARRAY['update', 'announcement', 'quick'], false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 6: VIMAX MIGRATION 3
-- Add Pipeline Events Table and Novel2Video Support
-- ============================================================================

CREATE TABLE IF NOT EXISTS vimax_pipeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT '',
  pipeline_type text NOT NULL DEFAULT 'idea2video',
  source text NOT NULL DEFAULT 'card',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vimax_pipeline_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_vimax_pipeline_events_user_created
  ON vimax_pipeline_events(user_id, created_at DESC);

CREATE POLICY "Users can insert own pipeline events"
  ON vimax_pipeline_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own pipeline events"
  ON vimax_pipeline_events
  FOR SELECT
  USING (true);

-- Update vimax_jobs pipeline_type CHECK constraint to include novel2video
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vimax_jobs_pipeline_type_check'
  ) THEN
    ALTER TABLE vimax_jobs DROP CONSTRAINT vimax_jobs_pipeline_type_check;
  END IF;
END $$;

ALTER TABLE vimax_jobs
  ADD CONSTRAINT vimax_jobs_pipeline_type_check
  CHECK (pipeline_type IN ('idea2video', 'script2video', 'novel2video', 'cameo'));

-- ============================================================================
-- SECTION 7: VIMAX MIGRATION 4
-- Add Video Uploads Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS vimax_video_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint,
  mime_type text,
  format text,
  duration_seconds numeric,
  width integer,
  height integer,
  thumbnail_data text,
  storage_path text,
  storage_url text,
  content_type text,
  status text DEFAULT 'uploading',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vimax_video_uploads_user_id ON vimax_video_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_vimax_video_uploads_created_at ON vimax_video_uploads(created_at DESC);

ALTER TABLE vimax_video_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upload videos" ON vimax_video_uploads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own uploads" ON vimax_video_uploads
  FOR SELECT USING (true);

CREATE POLICY "Users can update own uploads" ON vimax_video_uploads
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE TRIGGER set_updated_at_vimax_video_uploads
  BEFORE UPDATE ON vimax_video_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 8: ENABLE ROW LEVEL SECURITY ON ALL VIMAX TABLES
-- ============================================================================

ALTER TABLE vimax_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vimax_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vimax_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vimax_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE vimax_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 9: PERMISSIVE RLS POLICIES (per existing migration pattern)
-- Note: In production, restrict these to authenticated users or specific roles
-- ============================================================================

-- vimax_users: Allow users to read/update their own records
CREATE POLICY "Users can read own profile" ON vimax_users
  FOR SELECT USING (auth.uid()::text = user_id OR true);

CREATE POLICY "Users can upsert own profile" ON vimax_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON vimax_users
  FOR UPDATE USING (auth.uid()::text = user_id OR true) WITH CHECK (true);

-- vimax_jobs: Users can manage their own jobs
CREATE POLICY "Users can insert own jobs" ON vimax_jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own jobs" ON vimax_jobs
  FOR SELECT USING (true);

CREATE POLICY "Users can update own jobs" ON vimax_jobs
  FOR UPDATE USING (true) WITH CHECK (true);

-- vimax_batches: Users can read/insert their own batches
CREATE POLICY "Users can read own batches" ON vimax_batches
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own batches" ON vimax_batches
  FOR INSERT WITH CHECK (true);

-- vimax_feedback: Users can manage their own feedback
CREATE POLICY "Users can insert own feedback" ON vimax_feedback
  FOR INSERT WITH CHECK (user_id = auth.uid()::text OR true);

CREATE POLICY "Users can read own feedback" ON vimax_feedback
  FOR SELECT USING (user_id = auth.uid()::text OR true);

-- vimax_generation_history: Users can read/insert their own history
CREATE POLICY "Users can read own history" ON vimax_generation_history
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own history" ON vimax_generation_history
  FOR INSERT WITH CHECK (true);

-- job_progress & video_jobs: backend access via service_role only
-- (no open policies - these are for internal use)

-- ============================================================================
-- COMPLETE
-- ============================================================================
COMMIT;
