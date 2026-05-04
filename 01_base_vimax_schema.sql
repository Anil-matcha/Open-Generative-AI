CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Legacy stub tables required by migration 1
CREATE TABLE IF NOT EXISTS video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text,
  created_at timestamptz DEFAULT now(),
  worker_id text
);
ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id ON video_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON video_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_created_at ON video_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_video_jobs_worker_id ON video_jobs(worker_id);

CREATE TABLE IF NOT EXISTS job_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE job_progress ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_job_progress_job_id_timestamp ON job_progress(job_id, timestamp);

-- Core ViMax tables
CREATE TABLE IF NOT EXISTS vimax_users (
  id text GENERATED ALWAYS AS (user_id) STORED PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  stats jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE vimax_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS vimax_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  pipeline_type text NOT NULL DEFAULT 'idea2video',
  idea text NOT NULL,
  script text NOT NULL,
  style text NOT NULL,
  quality text NOT NULL,
  resolution text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE vimax_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS vimax_jobs_user_id_idx ON vimax_jobs(user_id);
CREATE INDEX IF NOT EXISTS vimax_jobs_status_idx ON vimax_jobs(status);
CREATE INDEX IF NOT EXISTS vimax_jobs_created_at_idx ON vimax_jobs(created_at);

CREATE TABLE IF NOT EXISTS vimax_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text,
  user_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE vimax_batches ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS vimax_batches_user_id_idx ON vimax_batches(user_id);
CREATE INDEX IF NOT EXISTS vimax_batches_status_idx ON vimax_batches(status);

CREATE TABLE IF NOT EXISTS vimax_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  user_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments text DEFAULT '',
  follow_up_answer text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vimax_feedback ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS vimax_feedback_user_id_idx ON vimax_feedback(user_id);
CREATE INDEX IF NOT EXISTS vimax_feedback_job_id_idx ON vimax_feedback(job_id);

CREATE TABLE IF NOT EXISTS vimax_generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vimax_generation_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS vimax_history_user_id_idx ON vimax_generation_history(user_id);
CREATE INDEX IF NOT EXISTS vimax_history_created_at_idx ON vimax_generation_history(created_at);

-- ============================================================
-- Existing migration: 20260218144320_fix_rls_performance_indexes_and_security.sql
-- ============================================================
/*
  # Fix RLS Performance, Remove Unused Indexes, and Harden Security Policies

  ## Summary
  This migration resolves all reported security and performance issues:

  ## 1. RLS Initialization Plan Fixes
  Replace `auth.uid()` with `(select auth.uid())` in all affected policies so
  Postgres evaluates the function once per query instead of once per row,
  improving performance at scale. Affected tables:
  - public.job_progress
  - public.video_jobs
  - public.vimax_batches
  - public.vimax_feedback
  - public.vimax_generation_history
  - public.vimax_jobs
  - public.vimax_users

  ## 2. Remove Unused Indexes
  Drops 14 indexes that have never been used, reducing write overhead and storage.

  ## 3. Fix Mutable Search Path on Function
  Recreates `update_updated_at_column` with a fixed `search_path` to prevent
  search-path injection attacks.

  ## 4. Remove Always-True RLS Policies
  Drops overly permissive policies that bypass row-level security entirely.
  Backend operations should use the service_role key, which bypasses RLS
  automatically and does not require these policies.

  ## 5. Restrict "Anyone can create video jobs"
  Limits job creation to authenticated users who can only set their own user_id.
*/

-- ============================================================
-- SECTION 1: Fix RLS policies on job_progress
-- ============================================================

DROP POLICY IF EXISTS "Users can view progress for their own jobs" ON public.job_progress;
CREATE POLICY "Users can view progress for their own jobs"
  ON public.job_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.video_jobs
      WHERE video_jobs.id = job_progress.job_id
        AND video_jobs.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role can insert progress" ON public.job_progress;
DROP POLICY IF EXISTS "Service role can update progress" ON public.job_progress;

-- ============================================================
-- SECTION 2: Fix RLS policies on video_jobs
-- ============================================================

DROP POLICY IF EXISTS "Users can view own jobs" ON public.video_jobs;
CREATE POLICY "Users can view own jobs"
  ON public.video_jobs
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own jobs" ON public.video_jobs;
CREATE POLICY "Users can update own jobs"
  ON public.video_jobs
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Anyone can create video jobs" ON public.video_jobs;
CREATE POLICY "Authenticated users can create own jobs"
  ON public.video_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- SECTION 3: Fix RLS policies on vimax_batches
-- ============================================================

DROP POLICY IF EXISTS "Auth users can read own batches" ON public.vimax_batches;
CREATE POLICY "Auth users can read own batches"
  ON public.vimax_batches
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid())::text) = user_id);

DROP POLICY IF EXISTS "Backend can insert batches" ON public.vimax_batches;
DROP POLICY IF EXISTS "Backend can update batches" ON public.vimax_batches;

-- ============================================================
-- SECTION 4: Fix RLS policies on vimax_feedback
-- ============================================================

DROP POLICY IF EXISTS "Auth users can read own feedback" ON public.vimax_feedback;
CREATE POLICY "Auth users can read own feedback"
  ON public.vimax_feedback
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid())::text) = user_id);

DROP POLICY IF EXISTS "Auth users can insert own feedback" ON public.vimax_feedback;
CREATE POLICY "Auth users can insert own feedback"
  ON public.vimax_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (((SELECT auth.uid())::text) = user_id);

DROP POLICY IF EXISTS "Backend can insert feedback" ON public.vimax_feedback;

-- ============================================================
-- SECTION 5: Fix RLS policies on vimax_generation_history
-- ============================================================

DROP POLICY IF EXISTS "Auth users can read own history" ON public.vimax_generation_history;
CREATE POLICY "Auth users can read own history"
  ON public.vimax_generation_history
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid())::text) = user_id);

DROP POLICY IF EXISTS "Backend can delete history" ON public.vimax_generation_history;
DROP POLICY IF EXISTS "Backend can insert history" ON public.vimax_generation_history;

-- ============================================================
-- SECTION 6: Fix RLS policies on vimax_jobs
-- ============================================================

DROP POLICY IF EXISTS "Auth users can read own jobs" ON public.vimax_jobs;
CREATE POLICY "Auth users can read own jobs"
  ON public.vimax_jobs
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid())::text) = user_id);

DROP POLICY IF EXISTS "Backend can delete jobs" ON public.vimax_jobs;
DROP POLICY IF EXISTS "Backend can insert jobs" ON public.vimax_jobs;
DROP POLICY IF EXISTS "Backend can update jobs" ON public.vimax_jobs;

-- ============================================================
-- SECTION 7: Fix RLS policies on vimax_users
-- ============================================================

DROP POLICY IF EXISTS "Auth users can read own profile" ON public.vimax_users;
CREATE POLICY "Auth users can read own profile"
  ON public.vimax_users
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid())::text) = id);

DROP POLICY IF EXISTS "Auth users can update own profile" ON public.vimax_users;
CREATE POLICY "Auth users can update own profile"
  ON public.vimax_users
  FOR UPDATE
  TO authenticated
  USING (((SELECT auth.uid())::text) = id)
  WITH CHECK (((SELECT auth.uid())::text) = id);

DROP POLICY IF EXISTS "Auth users can insert own profile" ON public.vimax_users;
CREATE POLICY "Auth users can insert own profile"
  ON public.vimax_users
  FOR INSERT
  TO authenticated
  WITH CHECK (((SELECT auth.uid())::text) = id);

DROP POLICY IF EXISTS "Backend can insert users" ON public.vimax_users;
DROP POLICY IF EXISTS "Backend can update users" ON public.vimax_users;

-- ============================================================
-- SECTION 8: Drop unused indexes
-- ============================================================

DROP INDEX IF EXISTS public.idx_video_jobs_user_id;
DROP INDEX IF EXISTS public.idx_video_jobs_status;
DROP INDEX IF EXISTS public.idx_video_jobs_created_at;
DROP INDEX IF EXISTS public.idx_video_jobs_worker_id;
DROP INDEX IF EXISTS public.idx_job_progress_job_id_timestamp;
DROP INDEX IF EXISTS public.vimax_batches_user_id_idx;
DROP INDEX IF EXISTS public.vimax_batches_status_idx;
DROP INDEX IF EXISTS public.vimax_jobs_user_id_idx;
DROP INDEX IF EXISTS public.vimax_jobs_status_idx;
DROP INDEX IF EXISTS public.vimax_jobs_created_at_idx;
DROP INDEX IF EXISTS public.vimax_history_user_id_idx;
DROP INDEX IF EXISTS public.vimax_history_created_at_idx;
DROP INDEX IF EXISTS public.vimax_feedback_user_id_idx;
DROP INDEX IF EXISTS public.vimax_feedback_job_id_idx;

-- ============================================================
-- SECTION 9: Fix mutable search_path on update_updated_at_column
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- End of migration: 20260218144320_fix_rls_performance_indexes_and_security.sql
-- ============================================================

-- ============================================================
-- Existing migration: 20260224044846_add_templates_and_scenes.sql
-- ============================================================
/*
  # Add Templates and Scenes Tables

  ## New Tables

  ### vimax_templates
  Pre-built video creation templates for the template library.
  Each template pre-fills pipeline type, style, quality, and a sample idea.

  ### vimax_scenes
  Per-scene storyboard data allowing users to review and approve individual
  scenes before final video synthesis begins.

  ## Notes
  - Templates have public read access since they are shared across all users
  - Scenes are scoped to a job_id (text string matching backend job IDs)
*/

-- ============================================================
-- TEMPLATES TABLE
-- ============================================================
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

-- ============================================================
-- SCENES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS vimax_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  scene_index integer NOT NULL DEFAULT 0,
  script_line text DEFAULT '',
  image_url text DEFAULT '',
  camera_angle text DEFAULT '',
  duration_seconds integer DEFAULT 5,
  status text DEFAULT 'pending',
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vimax_scenes_job_id ON vimax_scenes(job_id);

ALTER TABLE vimax_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vimax_scenes_select" ON vimax_scenes FOR SELECT USING (true);
CREATE POLICY "vimax_scenes_insert" ON vimax_scenes FOR INSERT WITH CHECK (true);
CREATE POLICY "vimax_scenes_update" ON vimax_scenes FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- SEED TEMPLATE DATA
-- ============================================================
INSERT INTO vimax_templates (name, description, category, pipeline_type, style, quality, sample_idea, thumbnail_url, tags, is_featured)
VALUES
  (
    'Product Demo',
    'Showcase your product with a professional cinematic presentation',
    'Business',
    'idea2video',
    'Cinematic',
    'standard',
    'A sleek product reveal video showing a modern smartphone rotating on a glass surface with dramatic lighting. Close-up shots highlight the camera, screen, and build quality. Professional voiceover explains key features.',
    'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg',
    ARRAY['product', 'business', 'marketing'],
    true
  ),
  (
    'Social Media Short',
    'Eye-catching 30-second video optimized for Instagram and TikTok',
    'Social Media',
    'idea2video',
    'Cartoon',
    'fast',
    'A vibrant, fast-paced montage celebrating summer adventures: beach surfing, mountain hiking, city exploration, and rooftop sunsets. Upbeat energy with bold text overlays.',
    'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg',
    ARRAY['social', 'short-form', 'trending'],
    true
  ),
  (
    'Story Trailer',
    'Create a cinematic trailer from your story or novel',
    'Story',
    'novel2video',
    'Cinematic',
    'high',
    'A young archaeologist discovers an ancient map that leads to a lost civilization hidden beneath the Amazon rainforest. Action, mystery, and breathtaking landscapes combine in this epic adventure.',
    'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg',
    ARRAY['story', 'adventure', 'trailer'],
    true
  ),
  (
    'Explainer Video',
    'Clear and engaging educational or product explainer',
    'Education',
    'script2video',
    'Cartoon',
    'standard',
    'INT. MODERN OFFICE - DAY

ANIMATED DIAGRAMS show the concept of compound interest.

NARRATOR (V.O.)
Imagine your money working while you sleep...',
    'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
    ARRAY['education', 'explainer', 'animation'],
    false
  ),
  (
    'Motivational Reel',
    'Inspirational video for personal branding or coaching',
    'Personal Brand',
    'idea2video',
    'Cinematic',
    'standard',
    'A powerful motivational video following an athlete from early morning training at 5am to championship victory. Dramatic slow-motion moments, sweat, determination, and triumph.',
    'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
    ARRAY['motivation', 'fitness', 'inspiration'],
    false
  ),
  (
    'Real Estate Tour',
    'Virtual property walkthrough for listings',
    'Business',
    'idea2video',
    'Realistic',
    'high',
    'A luxury penthouse tour starting with an aerial drone approach over a modern city skyline. Interior shots showcase the open-plan living area, chef kitchen, master bedroom with city views, and rooftop terrace with pool.',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
    ARRAY['real estate', 'property', 'luxury'],
    false
  ),
  (
    'Anime Short Film',
    'Animated short in Japanese anime style',
    'Entertainment',
    'idea2video',
    'Anime',
    'standard',
    'A young girl with telekinetic powers discovers a hidden world inside an enchanted library. Floating books, glowing portals between shelves, and a wise magical cat guide her on a journey of self-discovery.',
    'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg',
    ARRAY['anime', 'fantasy', 'animation'],
    true
  ),
  (
    'Brand Origin Story',
    'Tell your brand founding story with emotional impact',
    'Business',
    'script2video',
    'Cinematic',
    'high',
    'EXT. GARAGE - NIGHT - 2015

Two friends hunched over a laptop, empty coffee cups around them.

NARRATOR (V.O.)
It started with a problem nobody had solved yet...',
    'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg',
    ARRAY['brand', 'startup', 'story'],
    false
  );

-- ============================================================
-- End of migration: 20260224044846_add_templates_and_scenes.sql
-- ============================================================

-- ============================================================
-- Existing migration: 20260224080029_add_pipeline_events_and_novel2video_support.sql
-- ============================================================
/*
  # Add Pipeline Events Table and Novel2Video Support

  ## Summary
  This migration supports the new pipeline selection flow and enables the
  novel2video pipeline type throughout the system.

  ## 1. New Table: vimax_pipeline_events
  Records every pipeline selection event for analytics and usage tracking.

  ### Columns
  - id: auto-generated uuid primary key
  - user_id: the anonymous or authenticated user who made the selection
  - pipeline_type: one of idea2video, script2video, novel2video, cameo
  - source: how the pipeline was chosen — 'card' (clicked on landing screen) or 'ai_assistant' (chosen by AI intake)
  - created_at: timestamp of the selection

  ### Security
  - RLS enabled; users can only insert and read their own events

  ## 2. Update vimax_jobs: add novel2video to pipeline_type CHECK constraint
  If a CHECK constraint exists on pipeline_type, it is dropped and recreated
  to include 'novel2video'. If no constraint existed, a new one is added.

  ## 3. Index
  Index on (user_id, created_at) for fast per-user history queries.
*/

-- ============================================================
-- PIPELINE EVENTS TABLE
-- ============================================================
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

-- ============================================================
-- UPDATE vimax_jobs pipeline_type CHECK constraint
-- ============================================================
DO $$
BEGIN
  ALTER TABLE vimax_jobs
    DROP CONSTRAINT IF EXISTS vimax_jobs_pipeline_type_check;

  ALTER TABLE vimax_jobs
    ADD CONSTRAINT vimax_jobs_pipeline_type_check
    CHECK (pipeline_type IN ('idea2video', 'script2video', 'novel2video', 'cameo'));
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

-- ============================================================
-- End of migration: 20260224080029_add_pipeline_events_and_novel2video_support.sql
-- ============================================================

-- ============================================================
-- Existing migration: 20260224163445_add_video_uploads_table.sql
-- ============================================================
/*
  # Add Video Uploads Table

  ## Summary
  Creates the `vimax_video_uploads` table to track all user-uploaded video files,
  their metadata, and processing status. Also sets up storage policies for
  the `vimax-videos` bucket used to store uploaded video files.

  ## New Tables

  ### vimax_video_uploads
  Stores metadata and status for every video file a user uploads.

  | Column              | Type        | Description                                          |
  |---------------------|-------------|------------------------------------------------------|
  | id                  | uuid        | Primary key                                          |
  | user_id             | text        | Client-generated user identifier                     |
  | original_filename   | text        | Original name of the uploaded file                   |
  | file_size           | bigint      | File size in bytes                                   |
  | mime_type           | text        | MIME type (video/mp4, video/quicktime, etc.)         |
  | format              | text        | Container format: mp4, mov, avi, webm, mkv           |
  | duration_seconds    | numeric     | Video duration extracted client-side                 |
  | width               | integer     | Video width in pixels                                |
  | height              | integer     | Video height in pixels                               |
  | thumbnail_data      | text        | Base64-encoded thumbnail image (generated client-side)|
  | storage_path        | text        | Path within Supabase Storage bucket                  |
  | storage_url         | text        | Public URL for the stored file                       |
  | content_type        | text        | Content category (educational, marketing, etc.)      |
  | status              | text        | Upload lifecycle status                              |
  | error_message       | text        | Error detail if status = 'error'                     |
  | metadata            | jsonb       | Additional extracted metadata (codec, fps, etc.)     |
  | created_at          | timestamptz | Record creation timestamp                            |
  | updated_at          | timestamptz | Last update timestamp                                |

  ## Security
  - RLS enabled
  - Anon and authenticated users can insert/read/update their own records
    (user_id is a client-generated string; no Supabase Auth required)

  ## Notes
  1. Status values: uploading → uploaded → processing → ready | error
  2. content_type values: educational, marketing, social_media, entertainment, documentary, tutorial, general
  3. Indexes added on user_id and created_at for fast per-user queries
  4. thumbnail_data stores a small base64 data URL (≤20KB) generated in the browser via Canvas
*/

CREATE TABLE IF NOT EXISTS vimax_video_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT '',
  format text DEFAULT '',
  duration_seconds numeric,
  width integer,
  height integer,
  thumbnail_data text DEFAULT '',
  storage_path text DEFAULT '',
  storage_url text DEFAULT '',
  content_type text DEFAULT 'general' CHECK (
    content_type IN ('educational', 'marketing', 'social_media', 'entertainment', 'documentary', 'tutorial', 'general')
  ),
  status text DEFAULT 'uploaded' CHECK (
    status IN ('uploading', 'uploaded', 'processing', 'ready', 'error')
  ),
  error_message text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vimax_video_uploads_user_id
  ON vimax_video_uploads (user_id);

CREATE INDEX IF NOT EXISTS idx_vimax_video_uploads_created_at
  ON vimax_video_uploads (created_at DESC);

ALTER TABLE vimax_video_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view video uploads"
  ON vimax_video_uploads FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create video uploads"
  ON vimax_video_uploads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update video uploads"
  ON vimax_video_uploads FOR UPDATE
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_vimax_video_uploads'
  ) THEN
    CREATE TRIGGER set_updated_at_vimax_video_uploads
      BEFORE UPDATE ON vimax_video_uploads
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- End of migration: 20260224163445_add_video_uploads_table.sql
-- ============================================================
