/*
  # Create core application tables

  1. New Tables
    - `generations`
      - `id` (uuid, primary key)
      - `type` (text) - 'image' or 'video'
      - `url` (text) - generated content URL
      - `prompt` (text) - the prompt used
      - `model` (text) - AI model used
      - `parameters` (jsonb) - full generation parameters
      - `studio` (text) - which studio was used
      - `template_id` (text) - template ID if from a template
      - `user_key` (text) - hashed API key for user separation
      - `created_at` (timestamptz)

    - `characters`
      - `id` (uuid, primary key)
      - `name` (text) - character name
      - `reference_image_url` (text) - reference face URL
      - `style_notes` (text) - style/description notes
      - `user_key` (text) - hashed API key
      - `created_at` (timestamptz)

    - `storyboards`
      - `id` (uuid, primary key)
      - `title` (text) - storyboard title
      - `frames` (jsonb) - array of frame objects
      - `user_key` (text) - hashed API key
      - `created_at` (timestamptz)

    - `featured_generations`
      - `id` (uuid, primary key)
      - `url` (text) - content URL
      - `prompt` (text) - the prompt used
      - `model` (text) - AI model used
      - `category` (text) - category for filtering
      - `featured_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Policies allow access based on user_key matching
    - Featured generations are readable by all authenticated users

  3. Indexes
    - user_key indexed on all user-facing tables for fast lookups
*/

CREATE TABLE IF NOT EXISTS generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'image',
  url text NOT NULL DEFAULT '',
  prompt text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  parameters jsonb DEFAULT '{}'::jsonb,
  studio text NOT NULL DEFAULT '',
  template_id text DEFAULT '',
  user_key text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generations" ON generations;
CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key');

DROP POLICY IF EXISTS "Users can insert own generations" ON generations;
CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT
  TO anon
  WITH CHECK (user_key != '');

DROP POLICY IF EXISTS "Users can delete own generations" ON generations;
CREATE POLICY "Users can delete own generations"
  ON generations FOR DELETE
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key');

CREATE INDEX IF NOT EXISTS idx_generations_user_key ON generations(user_key);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  reference_image_url text NOT NULL DEFAULT '',
  style_notes text NOT NULL DEFAULT '',
  user_key text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own characters" ON characters;
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key');

DROP POLICY IF EXISTS "Users can insert own characters" ON characters;
CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  TO anon
  WITH CHECK (user_key != '');

DROP POLICY IF EXISTS "Users can update own characters" ON characters;
CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key')
  WITH CHECK (user_key = current_setting('request.headers', true)::json->>'x-user-key');

DROP POLICY IF EXISTS "Users can delete own characters" ON characters;
CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key');

CREATE INDEX IF NOT EXISTS idx_characters_user_key ON characters(user_key);

CREATE TABLE IF NOT EXISTS storyboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  frames jsonb DEFAULT '[]'::jsonb,
  user_key text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE storyboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own storyboards" ON storyboards;
CREATE POLICY "Users can view own storyboards"
  ON storyboards FOR SELECT
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key');

DROP POLICY IF EXISTS "Users can insert own storyboards" ON storyboards;
CREATE POLICY "Users can insert own storyboards"
  ON storyboards FOR INSERT
  TO anon
  WITH CHECK (user_key != '');

DROP POLICY IF EXISTS "Users can update own storyboards" ON storyboards;
CREATE POLICY "Users can update own storyboards"
  ON storyboards FOR UPDATE
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key')
  WITH CHECK (user_key = current_setting('request.headers', true)::json->>'x-user-key');

DROP POLICY IF EXISTS "Users can delete own storyboards" ON storyboards;
CREATE POLICY "Users can delete own storyboards"
  ON storyboards FOR DELETE
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key');

CREATE INDEX IF NOT EXISTS idx_storyboards_user_key ON storyboards(user_key);

CREATE TABLE IF NOT EXISTS featured_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL DEFAULT '',
  prompt text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  featured_at timestamptz DEFAULT now()
);

ALTER TABLE featured_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view featured generations" ON featured_generations;
CREATE POLICY "Anyone can view featured generations"
  ON featured_generations FOR SELECT
  TO anon
  USING (url != '');
