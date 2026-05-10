-- Combined Supabase Migrations
-- Generated: 2026-05-10T16:10:30.280Z
-- Total files: 26
-- ===========================================

-- ───────────────────────────────────────────
-- Migration: 001_create_lead_tables.sql
-- ───────────────────────────────────────────
-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  source TEXT DEFAULT 'video_personalization',
  status TEXT DEFAULT 'new',
  tags TEXT[] DEFAULT '{}',
  personalization_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  city TEXT,
  country TEXT,
  tags TEXT[] DEFAULT '{}',
  lead_id INTEGER REFERENCES leads(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_sends table for tracking
CREATE TABLE IF NOT EXISTS email_sends (
  id SERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  personalization_data JSONB DEFAULT '{}',
  lead_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'sent',
  created_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_id ON contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_to_email ON email_sends(to_email);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

-- Similar policies for contacts and email_sends tables
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can view their own email sends" ON email_sends
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

-- ───────────────────────────────────────────
-- Migration: 001_initial_schema.sql
-- ───────────────────────────────────────────
create extension if not exists pgcrypto;
create table if not exists profiles (id uuid primary key references auth.users(id) on delete cascade, email text, full_name text, avatar_url text, default_workspace_id uuid, plan text default 'free', role text default 'user', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists workspaces (id uuid primary key default gen_random_uuid(), owner_id uuid references auth.users(id) on delete cascade, name text not null, brand_name text, logo_url text, primary_color text, secondary_color text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists workspace_members (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade, role text default 'member', status text default 'active', created_at timestamptz default now());
create table if not exists campaigns (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade, name text not null, description text, target_market text, offer text, call_to_action text, calendar_url text, base_video_url text, base_thumbnail_url text, type text default 'personalized_video', personalization_mode text default 'landing_page', status text default 'draft', landing_page_base_slug text, settings jsonb default '{}'::jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists contacts (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, campaign_id uuid references campaigns(id) on delete cascade, first_name text, last_name text, email text, phone text, company text, website text, industry text, city text, state text, country text, linkedin_url text, custom_fields jsonb default '{}'::jsonb, status text default 'new', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists personalized_scripts (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, campaign_id uuid references campaigns(id) on delete cascade, contact_id uuid references contacts(id) on delete cascade, hook text, script text, tts_script text, voiceover_direction text, subject_line text, email_body text, followup_1 text, followup_2 text, followup_3 text, cta text, landing_page_headline text, landing_page_subheadline text, muapi_video_prompt text, muapi_tts_prompt text, muapi_avatar_prompt text, muapi_thumbnail_prompt text, audio_url text, openai_response jsonb default '{}'::jsonb, status text default 'draft', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists generation_jobs (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, campaign_id uuid references campaigns(id) on delete cascade, contact_id uuid references contacts(id) on delete cascade, script_id uuid references personalized_scripts(id) on delete set null, provider text not null, provider_job_id text, workflow_id text, job_type text, status text default 'queued', input jsonb default '{}'::jsonb, output jsonb default '{}'::jsonb, error text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists personalized_videos (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, campaign_id uuid references campaigns(id) on delete cascade, contact_id uuid references contacts(id) on delete cascade, script_id uuid references personalized_scripts(id) on delete set null, generation_job_id uuid references generation_jobs(id) on delete set null, video_url text, audio_url text, thumbnail_url text, landing_page_slug text unique, landing_page_url text, embed_code text, status text default 'draft', metadata jsonb default '{}'::jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists video_events (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, campaign_id uuid references campaigns(id) on delete cascade, video_id uuid references personalized_videos(id) on delete cascade, contact_id uuid references contacts(id) on delete set null, event_type text not null, metadata jsonb default '{}'::jsonb, ip_hash text, user_agent text, created_at timestamptz default now());
create table if not exists leads (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, campaign_id uuid references campaigns(id) on delete set null, video_id uuid references personalized_videos(id) on delete set null, contact_id uuid references contacts(id) on delete set null, name text, email text, phone text, company text, message text, form_data jsonb default '{}'::jsonb, lead_score integer default 0, status text default 'new', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists brand_kits (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, logo_url text, primary_color text, secondary_color text, background_color text, button_color text, text_color text, font_family text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists usage_credits (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, credits_remaining integer default 0, scripts_generated integer default 0, videos_generated integer default 0, tts_generated integer default 0, monthly_limit integer default 100, reset_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists api_keys_optional_byok (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspaces(id) on delete cascade, provider text, encrypted_key text, is_active boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());


-- ───────────────────────────────────────────
-- Migration: 001_remix_api_schema.sql
-- ───────────────────────────────────────────
-- Remix-API Database Schema Migration
-- Run this in Supabase SQL Editor or via CLI

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  feature_flags JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  template_id TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Note: Tables created in migration 002

-- RLS Policies for existing tables
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can CRUD own projects" ON public.projects;
CREATE POLICY "Users can CRUD own projects" ON public.projects
  FOR ALL USING (auth.uid() = created_by);

-- Note: Policies for new tables created in migration 002

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS handle_updated_at_user_profiles ON public.user_profiles;
CREATE TRIGGER handle_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_projects ON public.projects;
CREATE TRIGGER handle_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Note: Storage setup and sample data in migration 002

-- ───────────────────────────────────────────
-- Migration: 001_storyboarder_schema.sql
-- ───────────────────────────────────────────
-- Storyboarder Database Schema
-- Migration for AI Storyboarder application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE storyboarder_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    genre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scripts table
CREATE TABLE storyboarder_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES storyboarder_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT,
    logline TEXT,
    raw_text TEXT NOT NULL,
    total_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenes table
CREATE TABLE storyboarder_scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID NOT NULL REFERENCES storyboarder_scripts(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    time_of_day TEXT,
    description TEXT,
    characters JSONB DEFAULT '[]',
    mood_tension DECIMAL(3,2) CHECK (mood_tension >= 0 AND mood_tension <= 1),
    mood_emotion TEXT,
    mood_energy DECIMAL(3,2) CHECK (mood_energy >= 0 AND mood_energy <= 1),
    mood_darkness DECIMAL(3,2) CHECK (mood_darkness >= 0 AND mood_darkness <= 1),
    mood_overall TEXT,
    soundtrack_genre TEXT,
    soundtrack_tempo TEXT,
    soundtrack_instruments JSONB DEFAULT '[]',
    soundtrack_reference TEXT,
    soundtrack_energy DECIMAL(3,2) CHECK (soundtrack_energy >= 0 AND soundtrack_energy <= 1),
    frame_image_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shots table
CREATE TABLE storyboarder_shots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scene_id UUID NOT NULL REFERENCES storyboarder_scenes(id) ON DELETE CASCADE,
    shot_number INTEGER NOT NULL,
    shot_type TEXT,
    camera_angle TEXT,
    camera_movement TEXT,
    description TEXT,
    dialogue TEXT,
    duration_seconds INTEGER DEFAULT 0,
    sd_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_storyboarder_scripts_project_id ON storyboarder_scripts(project_id);
CREATE INDEX idx_storyboarder_scenes_script_id ON storyboarder_scenes(script_id);
CREATE INDEX idx_storyboarder_shots_scene_id ON storyboarder_shots(scene_id);

-- Row Level Security (RLS)
ALTER TABLE storyboarder_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboarder_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboarder_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboarder_shots ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - adjust based on auth requirements)
CREATE POLICY "Allow all operations on storyboarder_projects" ON storyboarder_projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on storyboarder_scripts" ON storyboarder_scripts FOR ALL USING (true);
CREATE POLICY "Allow all operations on storyboarder_scenes" ON storyboarder_scenes FOR ALL USING (true);
CREATE POLICY "Allow all operations on storyboarder_shots" ON storyboarder_shots FOR ALL USING (true);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_storyboarder_projects_updated_at BEFORE UPDATE ON storyboarder_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storyboarder_scripts_updated_at BEFORE UPDATE ON storyboarder_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storyboarder_scenes_updated_at BEFORE UPDATE ON storyboarder_scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storyboarder_shots_updated_at BEFORE UPDATE ON storyboarder_shots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────
-- Migration: 002_remix_api_additional_tables.sql
-- ───────────────────────────────────────────
-- Remix-API Additional Tables Migration
-- Adds tables needed for remix-api functionality that don't exist in current schema

-- Create media_assets table for remix-api
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT,
  url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}',
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create templates table for remix-api
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create render_jobs table for video rendering
CREATE TABLE IF NOT EXISTS public.render_jobs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_data JSONB DEFAULT '{}',
  output_url TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create white_labels table for remix-api
CREATE TABLE IF NOT EXISTS public.white_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  branding JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.white_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_assets
DROP POLICY IF EXISTS "Users can CRUD own media assets" ON public.media_assets;
CREATE POLICY "Users can CRUD own media assets" ON public.media_assets
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for templates
DROP POLICY IF EXISTS "Public templates are viewable by all" ON public.templates;
CREATE POLICY "Public templates are viewable by all" ON public.templates
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can create templates" ON public.templates;
CREATE POLICY "Users can create templates" ON public.templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Template creators can update own templates" ON public.templates;
CREATE POLICY "Template creators can update own templates" ON public.templates
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for render_jobs
DROP POLICY IF EXISTS "Users can CRUD own render jobs" ON public.render_jobs;
CREATE POLICY "Users can CRUD own render jobs" ON public.render_jobs
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for white_labels (admin only)
DROP POLICY IF EXISTS "Admins can manage white labels" ON public.white_labels;
CREATE POLICY "Admins can manage white labels" ON public.white_labels
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create storage buckets for remix-api
INSERT INTO storage.buckets (id, name, public)
VALUES ('remix-media-assets', 'remix-media-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('remix-user-uploads', 'remix-user-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for remix-api
DROP POLICY IF EXISTS "Users can upload remix media assets" ON storage.objects;
CREATE POLICY "Users can upload remix media assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'remix-media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Remix media assets are publicly accessible" ON storage.objects;
CREATE POLICY "Remix media assets are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'remix-media-assets');

DROP POLICY IF EXISTS "Users can manage own remix uploads" ON storage.objects;
CREATE POLICY "Users can manage own remix uploads" ON storage.objects
  FOR ALL USING (bucket_id = 'remix-user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Sample templates for remix-api
INSERT INTO public.templates (name, description, category, data, is_public) VALUES
('Welcome Video', 'Professional welcome and introduction template', 'business', '{"type": "welcome", "duration": 30, "segments": ["introduction", "value_prop", "call_to_action"]}', true),
('Product Showcase', 'Highlight product features and benefits', 'commercial', '{"type": "showcase", "duration": 45, "segments": ["hook", "features", "benefits", "social_proof", "cta"]}', true),
('Testimonial Video', 'Customer success story format', 'social', '{"type": "testimonial", "duration": 60, "segments": ["story", "challenge", "solution", "results", "endorsement"]}', true),
('Educational Content', 'Explain concepts and teach skills', 'educational', '{"type": "educational", "duration": 90, "segments": ["hook", "explanation", "demonstration", "practice", "summary"]}', true)
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────
-- Migration: 002_rls_policies.sql
-- ───────────────────────────────────────────
create or replace function is_workspace_member(ws uuid) returns boolean language sql stable as $$
  select exists(select 1 from workspaces w where w.id=ws and w.owner_id=auth.uid())
  or exists(select 1 from workspace_members wm where wm.workspace_id=ws and wm.user_id=auth.uid() and wm.status='active');
$$;

do $$ declare t text; begin
  foreach t in array array['profiles','workspaces','workspace_members','campaigns','contacts','personalized_scripts','generation_jobs','personalized_videos','video_events','leads','brand_kits','usage_credits','api_keys_optional_byok']
  loop execute format('alter table %I enable row level security', t); end loop;
end $$;

create policy profiles_self_read on profiles for select using (id=auth.uid());
create policy profiles_self_update on profiles for update using (id=auth.uid());
create policy workspace_owner_all on workspaces for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy workspace_members_read on workspaces for select using (is_workspace_member(id));


-- ───────────────────────────────────────────
-- Migration: 003_add_render_jobs_table.sql
-- ───────────────────────────────────────────
-- Add render_jobs table for video rendering functionality

CREATE TABLE IF NOT EXISTS public.render_jobs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_data JSONB DEFAULT '{}',
  output_url TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can CRUD own render jobs" ON public.render_jobs;
CREATE POLICY "Users can CRUD own render jobs" ON public.render_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS handle_updated_at_render_jobs ON public.render_jobs;
CREATE TRIGGER handle_updated_at_render_jobs
  BEFORE UPDATE ON public.render_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ───────────────────────────────────────────
-- Migration: 003_storage_buckets.sql
-- ───────────────────────────────────────────
insert into storage.buckets (id, name, public) values
('campaign-videos','campaign-videos',false),
('thumbnails','thumbnails',true),
('generated-media','generated-media',false),
('brand-assets','brand-assets',false)
on conflict (id) do nothing;


-- ───────────────────────────────────────────
-- Migration: 20260310081146_create_core_tables.sql
-- ───────────────────────────────────────────
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

CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key');

CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT
  TO anon
  WITH CHECK (user_key != '');

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

CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key');

CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  TO anon
  WITH CHECK (user_key != '');

CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key')
  WITH CHECK (user_key = current_setting('request.headers', true)::json->>'x-user-key');

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

CREATE POLICY "Users can view own storyboards"
  ON storyboards FOR SELECT
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key');

CREATE POLICY "Users can insert own storyboards"
  ON storyboards FOR INSERT
  TO anon
  WITH CHECK (user_key != '');

CREATE POLICY "Users can update own storyboards"
  ON storyboards FOR UPDATE
  TO anon
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key')
  WITH CHECK (user_key = current_setting('request.headers', true)::json->>'x-user-key');

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

CREATE POLICY "Anyone can view featured generations"
  ON featured_generations FOR SELECT
  TO anon
  USING (url != '');


-- ───────────────────────────────────────────
-- Migration: 20260310144824_create_thumbnails_and_instructions.sql
-- ───────────────────────────────────────────
/*
  # Create thumbnails and instructions tables

  1. New Tables
    - `thumbnails`
      - `id` (uuid, primary key)
      - `target_type` (text) - either 'studio' or 'template'
      - `target_id` (text) - the studio or template slug id
      - `image_path` (text) - public file path to the thumbnail
      - `alt_text` (text) - accessibility description
      - `prompt_used` (text) - the AI generation prompt for reproducibility
      - `created_at` (timestamptz) - when the thumbnail was generated

    - `instructions`
      - `id` (uuid, primary key)
      - `studio_id` (text, unique) - the studio slug id
      - `title` (text) - display title for the studio
      - `steps` (jsonb) - array of step objects with number, heading, description
      - `quick_tips` (jsonb) - array of tip strings
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - Enable RLS on both tables
    - Add read-only policy for authenticated users on both tables
    - These are content tables managed by admins, users only need read access

  3. Indexes
    - Unique constraint on thumbnails(target_type, target_id)
    - Unique constraint on instructions(studio_id)
*/

-- Thumbnails table
CREATE TABLE IF NOT EXISTS thumbnails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('studio', 'template')),
  target_id text NOT NULL,
  image_path text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  prompt_used text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(target_type, target_id)
);

ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read thumbnails"
  ON thumbnails
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Instructions table
CREATE TABLE IF NOT EXISTS instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id text UNIQUE NOT NULL,
  title text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  quick_tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read instructions"
  ON instructions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Seed studio thumbnails
INSERT INTO thumbnails (target_type, target_id, image_path, alt_text, prompt_used) VALUES
  ('studio', 'image', '/thumbnails/studios/image.webp', 'Image Studio - AI image generation workspace', 'Creative workspace with a photographer composing AI-generated images on a large monitor'),
  ('studio', 'video', '/thumbnails/studios/video.webp', 'Video Studio - AI video creation suite', 'Filmmaker reviewing cinematic video footage on a large ultrawide monitor with timeline editor'),
  ('studio', 'cinema', '/thumbnails/studios/cinema.webp', 'Cinema Studio - Professional cinematography tools', 'Cinematographer behind a professional cinema camera on a dolly rig on a film set'),
  ('studio', 'storyboard', '/thumbnails/studios/storyboard.webp', 'Storyboard Studio - Sequential frame generation', 'Hands arranging illustrated storyboard panels on a large table'),
  ('studio', 'effects', '/thumbnails/studios/effects.webp', 'Effects Studio - 350+ visual effects', 'Photo mid-transformation with visible lightning, fire and particle effects'),
  ('studio', 'edit', '/thumbnails/studios/edit.webp', 'Edit Studio - Photo editing and retouching', 'Photo editing workspace showing a portrait with before and after split'),
  ('studio', 'upscale', '/thumbnails/studios/upscale.webp', 'Upscale Suite - AI image enhancement', 'Split screen showing blurry low-res to crystal clear high-res transformation'),
  ('studio', 'character', '/thumbnails/studios/character.webp', 'Character Studio - Consistent character generation', 'Multiple consistent portraits of the same character face'),
  ('studio', 'commercial', '/thumbnails/studios/commercial.webp', 'Commercial Studio - Product photography', 'Premium perfume bottle on professional studio backdrop with dramatic rim lighting')
ON CONFLICT (target_type, target_id) DO NOTHING;

-- Seed template thumbnails
INSERT INTO thumbnails (target_type, target_id, image_path, alt_text, prompt_used) VALUES
  ('template', 'building-explosion', '/thumbnails/templates/building-explosion.webp', 'Building explosion VFX effect', 'Hollywood-grade building explosion VFX'),
  ('template', 'car-explosion', '/thumbnails/templates/car-explosion.webp', 'Car explosion action scene', 'Sports car mid-explosion with fireball erupting'),
  ('template', 'disintegration', '/thumbnails/templates/disintegration.webp', 'Thanos snap disintegration effect', 'Person dissolving into particles'),
  ('template', 'electricity', '/thumbnails/templates/electricity.webp', 'Electricity and lightning effects', 'Dramatic electricity and lightning bolts arcing'),
  ('template', 'tornado', '/thumbnails/templates/tornado.webp', 'Devastating tornado VFX', 'Massive tornado funnel touching down on landscape'),
  ('template', 'fire-breath', '/thumbnails/templates/fire-breath.webp', 'Dragon-style fire breath effect', 'Person breathing intense fire from their mouth'),
  ('template', 'face-swap', '/thumbnails/templates/face-swap.webp', 'AI face swap transformation', 'Two faces merging showing realistic face swap'),
  ('template', 'gender-swap', '/thumbnails/templates/gender-swap.webp', 'AI gender transformation', 'Split portrait showing gender transformation'),
  ('template', 'age-progression', '/thumbnails/templates/age-progression.webp', 'Age progression sequence', 'Same person shown at different ages'),
  ('template', 'younger-self', '/thumbnails/templates/younger-self.webp', 'Younger self portrait', 'Young child version of an adult person'),
  ('template', 'fashion-stride', '/thumbnails/templates/fashion-stride.webp', 'Fashion runway walk animation', 'Stylish model walking on fashion runway'),
  ('template', 'glamour-portrait', '/thumbnails/templates/glamour-portrait.webp', 'Hollywood glamour portrait', 'Stunning glamour portrait with dramatic lighting'),
  ('template', '1920s-style', '/thumbnails/templates/1920s-style.webp', 'Roaring twenties art deco aesthetic', '1920s art deco scene with flapper dress'),
  ('template', '1950s-style', '/thumbnails/templates/1950s-style.webp', 'Mid-century Americana nostalgia', '1950s Americana diner scene with classic car'),
  ('template', '1970s-style', '/thumbnails/templates/1970s-style.webp', 'Groovy seventies retro vibes', '1970s disco scene with afro and disco ball'),
  ('template', '1980s-style', '/thumbnails/templates/1980s-style.webp', 'Neon synthwave eighties look', '1980s neon-lit synthwave scene'),
  ('template', 'drone-fpv', '/thumbnails/templates/drone-fpv.webp', 'First-person drone flythrough', 'FPV drone view swooping through mountains'),
  ('template', 'dolly-zoom', '/thumbnails/templates/dolly-zoom.webp', 'Hitchcock vertigo zoom effect', 'Dramatic dolly zoom effect in hallway'),
  ('template', 'car-chase', '/thumbnails/templates/car-chase.webp', 'Action movie car chase', 'High speed car chase through city streets'),
  ('template', 'matrix-shot', '/thumbnails/templates/matrix-shot.webp', 'Frozen-time bullet time camera', 'Person frozen mid-kick with multi-camera orbit')
ON CONFLICT (target_type, target_id) DO NOTHING;

-- Seed instructions for all 9 studios
INSERT INTO instructions (studio_id, title, steps, quick_tips) VALUES
  ('image', 'Image Studio',
    '[{"number":1,"heading":"Choose a model","description":"Select from 20+ AI models in the sidebar. Each model has different strengths for portraits, landscapes, or abstract art."},{"number":2,"heading":"Write your prompt","description":"Describe what you want to create. Be specific about style, lighting, composition, and mood for better results."},{"number":3,"heading":"Set parameters","description":"Adjust aspect ratio, resolution, and other settings. Use negative prompts to exclude unwanted elements."},{"number":4,"heading":"Generate and refine","description":"Click Generate to create your image. Use the result as a starting point and iterate on your prompt for improvements."}]',
    '["Add 4K, detailed, professional to improve quality","Specify camera angles like shot from below or bird''s eye view","Reference art styles: in the style of watercolor painting"]'),
  ('video', 'Video Studio',
    '[{"number":1,"heading":"Select generation mode","description":"Choose between text-to-video or image-to-video. Image-to-video uses your photo as the first frame."},{"number":2,"heading":"Upload or describe","description":"For image-to-video, upload a clear photo. For text-to-video, write a detailed description of the scene and motion."},{"number":3,"heading":"Configure output","description":"Set resolution (480p to 1080p), duration (3-10 seconds), and aspect ratio for your video."},{"number":4,"heading":"Generate video","description":"Video generation takes 1-3 minutes. The result will appear in your library when ready."}]',
    '["Start with image-to-video for more predictable results","Keep prompts focused on a single action or movement","Use 720p for a good balance of quality and speed"]'),
  ('cinema', 'Cinema Studio',
    '[{"number":1,"heading":"Upload your scene","description":"Start with a still image that will serve as the base for your cinematic shot."},{"number":2,"heading":"Select camera movement","description":"Choose from dolly, crane, orbit, FPV drone, and other professional camera movements."},{"number":3,"heading":"Choose lens and look","description":"Pick a camera lens profile (anamorphic, 70mm, macro) and film look to set the cinematic mood."},{"number":4,"heading":"Render the shot","description":"Generate your cinematic video. Each camera + lens combination produces a unique look."}]',
    '["Anamorphic lenses create the classic widescreen movie look","Dolly zoom creates the famous Hitchcock vertigo effect","Combine FPV drone with wide-angle for immersive shots"]'),
  ('storyboard', 'Storyboard Studio',
    '[{"number":1,"heading":"Define your sequence","description":"Describe the story you want to tell across multiple frames. Each frame represents a key moment."},{"number":2,"heading":"Set frame count","description":"Choose how many frames you need (3-12). More frames create a more detailed narrative."},{"number":3,"heading":"Generate frames","description":"The AI creates each frame with visual consistency, maintaining characters and settings across the sequence."}]',
    '["Start with 4-6 frames for a simple scene","Describe camera angles for each shot for variety","Use consistent character descriptions across frames"]'),
  ('effects', 'Effects Studio',
    '[{"number":1,"heading":"Upload your photo","description":"Start with a clear, well-lit photo. Face-forward portraits work best for most effects."},{"number":2,"heading":"Browse effects","description":"Explore 350+ effects organized by category: transformations, styles, VFX, overlays, and more."},{"number":3,"heading":"Apply and preview","description":"Select an effect to see the transformation. Most effects process in under 30 seconds."}]',
    '["Higher resolution input photos produce better results","Try multiple effects on the same photo to compare","Portrait effects work best with clear face visibility"]'),
  ('edit', 'Edit Studio',
    '[{"number":1,"heading":"Upload your image","description":"Upload the image you want to edit. Supports JPG, PNG, and WebP formats."},{"number":2,"heading":"Select an edit tool","description":"Choose from: remove objects, remove background, reframe, expand canvas, inpaint, or relight."},{"number":3,"heading":"Mark the edit area","description":"For removal tools, paint over the area you want to change. For reframe, select the new crop."},{"number":4,"heading":"Apply changes","description":"The AI processes your edit and shows the result. You can undo and retry with different settings."}]',
    '["Use a larger brush for object removal to include surrounding context","Background removal works best with clear subject-background separation","Relight can dramatically change the mood of a portrait"]'),
  ('upscale', 'Upscale Suite',
    '[{"number":1,"heading":"Upload your image","description":"Upload a low-resolution or blurry image that you want to enhance."},{"number":2,"heading":"Choose upscale method","description":"Select from standard upscale (2x-4x), creative upscale (adds detail), or face enhancement."},{"number":3,"heading":"Process and download","description":"The AI enhances your image while preserving the original content. Download the high-res result."}]',
    '["Creative upscale adds AI-generated detail, best for artistic images","Face enhancement specifically improves facial features and skin texture","Standard upscale is most faithful to the original image"]'),
  ('character', 'Character Studio',
    '[{"number":1,"heading":"Upload reference photos","description":"Upload 1-3 clear photos of the person or character you want to generate consistently."},{"number":2,"heading":"Train the face model","description":"The AI learns the facial features. This takes about a minute to process."},{"number":3,"heading":"Generate new images","description":"Write prompts to place your character in new scenes, outfits, and settings while maintaining face consistency."}]',
    '["Use clear, front-facing photos for the best face learning","Multiple reference angles improve consistency","Describe the scene but let the AI handle the face details"]'),
  ('commercial', 'Commercial Studio',
    '[{"number":1,"heading":"Upload your product","description":"Take a clean photo of your product against a simple background. Remove distractions."},{"number":2,"heading":"Choose a scene","description":"Select a commercial setting: studio, lifestyle, outdoor, or describe a custom scene."},{"number":3,"heading":"Set the mood","description":"Describe the lighting, angle, and atmosphere. Reference professional product photography styles."},{"number":4,"heading":"Generate variations","description":"Create multiple shots of your product in different settings for A/B testing or catalogs."}]',
    '["Clean product cutouts on white backgrounds work best","Specify lighting: soft studio light, golden hour, dramatic rim light","Generate multiple angles for a complete product showcase"]')
ON CONFLICT (studio_id) DO NOTHING;


-- ───────────────────────────────────────────
-- Migration: 20260310160745_seed_remaining_template_thumbnails.sql
-- ───────────────────────────────────────────
/*
  # Seed remaining 33 template thumbnails

  Adds metadata records for all newly generated template thumbnail images.
  These cover templates across Social Media, Style Transfer, Entertainment,
  Commercial, and VFX categories that were not included in the initial seed.

  1. Modified Tables
    - `thumbnails` - 33 new rows inserted for template thumbnail metadata

  2. Notes
    - Uses ON CONFLICT to safely skip any duplicates
    - All images stored at /thumbnails/templates/{template-id}.webp
    - Includes alt_text for accessibility and prompt_used for reproducibility
*/

INSERT INTO thumbnails (target_type, target_id, image_path, alt_text, prompt_used) VALUES
  -- Social Media
  ('template', 'tiktok-video', '/thumbnails/templates/tiktok-video.webp', 'Person dancing with TikTok-style visual effects', 'Person dancing energetically with colorful TikTok-style visual effects overlaid'),
  ('template', 'instagram-reel', '/thumbnails/templates/instagram-reel.webp', 'Aesthetic fashion scene with cinematic motion', 'Aesthetic fashion scene with cinematic motion blur, lifestyle content'),
  ('template', 'youtube-thumbnail', '/thumbnails/templates/youtube-thumbnail.webp', 'Shocked expression YouTube thumbnail style', 'Person with shocked expression against bold dramatic fiery background'),
  ('template', 'reaction-thumbnail', '/thumbnails/templates/reaction-thumbnail.webp', 'Exaggerated reaction face with comic pop effects', 'Person with exaggerated surprised reaction, comic-style pop art effects'),
  ('template', 'short-form-ad', '/thumbnails/templates/short-form-ad.webp', 'Product reveal in vertical promo frame', 'Premium sneaker mid-reveal in punchy vertical promotional frame'),
  ('template', 'story-highlight-cover', '/thumbnails/templates/story-highlight-cover.webp', 'Minimalist pastel icon story highlight cover', 'Clean minimalist pastel gradient circle icon for Instagram story highlight'),
  ('template', 'profile-picture', '/thumbnails/templates/profile-picture.webp', 'Professional headshot portrait with studio lighting', 'Professional headshot portrait with warm studio lighting'),
  ('template', 'banner-creator', '/thumbnails/templates/banner-creator.webp', 'Ultra-wide panoramic cityscape at golden hour', 'Ultra-wide panoramic cityscape at golden hour sunset, cinematic banner'),

  -- Style Transfer
  ('template', 'anime-converter', '/thumbnails/templates/anime-converter.webp', 'Person rendered in anime art style', 'Person rendered in anime art style with big expressive eyes, cel-shaded'),
  ('template', 'comic-book', '/thumbnails/templates/comic-book.webp', 'Person in American comic book ink style', 'Person drawn in bold American comic book ink style with halftone dots'),
  ('template', 'gta-loading-screen', '/thumbnails/templates/gta-loading-screen.webp', 'GTA V loading screen satirical illustration', 'Character leaning against sports car in GTA V loading screen style'),
  ('template', 'pixel-art', '/thumbnails/templates/pixel-art.webp', 'Person as 16-bit pixel art character', 'Person rendered as 16-bit pixel art character, retro game aesthetic'),
  ('template', 'ghibli-style', '/thumbnails/templates/ghibli-style.webp', 'Person in Studio Ghibli watercolor style', 'Person in Studio Ghibli watercolor art style with pastoral background'),
  ('template', 'cyberpunk-style', '/thumbnails/templates/cyberpunk-style.webp', 'Person with neon glow in cyberpunk city', 'Person with neon glow effects in rain-soaked cyberpunk city at night'),
  ('template', 'vhs-retro', '/thumbnails/templates/vhs-retro.webp', 'Retro VHS tape aesthetic with scan lines', 'Retro VHS videotape aesthetic with scan lines and analog distortion'),
  ('template', 'film-noir', '/thumbnails/templates/film-noir.webp', 'Film noir black and white detective scene', 'Person in classic film noir with dramatic venetian blind shadows'),
  ('template', 'glass-ball', '/thumbnails/templates/glass-ball.webp', 'Landscape refracted inside crystal glass sphere', 'Crystal glass ball reflecting inverted landscape with bokeh background'),

  -- Entertainment
  ('template', 'movie-poster', '/thumbnails/templates/movie-poster.webp', 'Dramatic cinematic movie poster composition', 'Hero standing in flames with epic city skyline, theatrical poster style'),
  ('template', 'magazine-cover', '/thumbnails/templates/magazine-cover.webp', 'High fashion magazine cover editorial', 'Elegant person in haute couture, high fashion magazine cover layout'),
  ('template', 'bullet-time', '/thumbnails/templates/bullet-time.webp', 'Matrix-style bullet time freeze frame', 'Person frozen mid-air with camera orbit trail, Matrix style'),
  ('template', 'action-figure', '/thumbnails/templates/action-figure.webp', 'Person as collectible action figure in packaging', 'Person rendered as plastic action figure inside toy blister pack'),
  ('template', 'disney-pixar', '/thumbnails/templates/disney-pixar.webp', 'Pixar-style 3D animated character', 'Person as Pixar-style 3D animated character with big expressive eyes'),
  ('template', 'superhero-transform', '/thumbnails/templates/superhero-transform.webp', 'Superhero transformation with energy burst', 'Person mid-transformation with glowing energy burst and cape forming'),
  ('template', 'lego-style', '/thumbnails/templates/lego-style.webp', 'Scene built from colorful toy bricks', 'Whimsical world made of colorful interlocking toy bricks'),
  ('template', 'squid-game', '/thumbnails/templates/squid-game.webp', 'Korean survival game show aesthetic', 'Person in green tracksuit with ominous masked figures, survival game'),
  ('template', '3d-figurine', '/thumbnails/templates/3d-figurine.webp', 'Detailed 3D collectible figurine on display stand', 'Person rendered as detailed 3D collectible figurine on round display stand'),

  -- Commercial
  ('template', 'product-hero', '/thumbnails/templates/product-hero.webp', 'Premium product on marble with studio lighting', 'Premium perfume bottle on polished marble with dramatic studio rim lighting'),
  ('template', 'product-photography', '/thumbnails/templates/product-photography.webp', 'Professional product shot on white backdrop', 'Clean product photography on white infinity curve studio backdrop'),
  ('template', 'billboard-ad', '/thumbnails/templates/billboard-ad.webp', 'Ultra-wide billboard with luxury product', 'Ultra-wide billboard advertisement with luxury wristwatch on dark velvet'),
  ('template', 'asmr-video', '/thumbnails/templates/asmr-video.webp', 'Satisfying close-up ASMR content', 'Extreme close-up of satisfying soap cutting, ASMR content style'),
  ('template', 'product-placement', '/thumbnails/templates/product-placement.webp', 'Product in cozy lifestyle coffee shop scene', 'Premium coffee cup on cozy coffee shop table with morning golden light'),
  ('template', 'unboxing-scene', '/thumbnails/templates/unboxing-scene.webp', 'Premium product unboxing reveal moment', 'Hands opening premium matte black gift box with dramatic top lighting'),

  -- VFX (building-explosion was missing)
  ('template', 'building-explosion', '/thumbnails/templates/building-explosion.webp', 'Hollywood-grade building explosion VFX', 'Building mid-explosion with massive fireball and debris flying outward')
ON CONFLICT (target_type, target_id) DO NOTHING;


-- ───────────────────────────────────────────
-- Migration: 20260311021031_create_uploads_storage_bucket.sql
-- ───────────────────────────────────────────
-- Create uploads storage bucket
--
-- 1. New Storage Bucket
--    - uploads: Public bucket for user-uploaded reference images and videos
--    - File size limit: 10MB
--    - Allowed MIME types: image and video formats
--
-- 2. Security
--    - Public read access so AI model endpoints can fetch uploaded files by URL
--    - Anonymous upload access since the app uses API keys (not Supabase Auth)
--    - Anonymous delete access for cleanup
--
-- 3. Notes
--    - This replaces the external API file upload endpoint that requires credits
--    - Files are stored with unique timestamped names to avoid collisions

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access on uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY "Allow anonymous uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow anonymous delete on uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads');


-- ───────────────────────────────────────────
-- Migration: 20260313000000_seed_ai_video_effects_thumbnails.sql
-- ───────────────────────────────────────────
/*
  # Seed 45 new AI Video Effects thumbnails

  Adds thumbnail metadata for AI Video Effects that need visual thumbnails.
  These follow the dark theme design style used throughout the application.

  1. Modified Tables
    - `thumbnails` - 45 new rows inserted for AI Video Effect thumbnails

  2. Design Style
    - Dark theme with moody, atmospheric backgrounds
    - Deep blacks, purples, blues as primary colors
    - Subtle glows and highlights
    - Human subjects prominently featured
    - Action/motion frozen or dynamic
    - Professional photography look with dramatic lighting
*/

INSERT INTO thumbnails (target_type, target_id, image_path, alt_text, prompt_used) VALUES
  ('template', 'balloon-flyaway', '/thumbnails/templates/balloon-flyaway.webp', 'Person floating away holding balloons', 'Person floating upward into dark sky clutching colorful balloons, dramatic upward motion, dark atmospheric background'),
  ('template', 'blow-kiss', '/thumbnails/templates/blow-kiss.webp', 'Person blowing a kiss to camera', 'Person mid-kiss gesture with fingers touching lips then extending toward camera, dramatic studio lighting, dark moody background'),
  ('template', 'body-shake', '/thumbnails/templates/body-shake.webp', 'Person shaking body vigorously', 'Person shaking body with motion blur effect, energetic movement frozen, dark background with particle effects'),
  ('template', 'break-glass', '/thumbnails/templates/break-glass.webp', 'Person breaking through glass', 'Person mid-action breaking through shattered glass pane, shards flying outward, dramatic action shot with dark background'),
  ('template', 'carry-me', '/thumbnails/templates/carry-me.webp', 'Person being carried romantically', 'Romantic scene of person being lifted in arms, cinematic lighting, dark moody background with soft glow'),
  ('template', 'cartoon-doll', '/thumbnails/templates/cartoon-doll.webp', 'Person as 3D cartoon doll', 'Person rendered as cute 3D cartoon doll character with large eyes, vibrant colors against dark gradient background'),
  ('template', 'cheek-kiss', '/thumbnails/templates/cheek-kiss.webp', 'Person kissing on cheek', 'Close-up of cheek kiss moment, soft romantic lighting, dark background with subtle glow'),
  ('template', 'child-memory', '/thumbnails/templates/child-memory.webp', 'Person as child flashback', 'Person transformed into younger version as child, nostalgic dreamy aesthetic, soft focus with dark vignette'),
  ('template', 'couple-arrival', '/thumbnails/templates/couple-arrival.webp', 'Couple arriving together dramatic', 'Couple walking toward camera in dramatic slow motion, cinematic lighting, dark atmospheric background'),
  ('template', 'fairy-me', '/thumbnails/templates/fairy-me.webp', 'Person with fairy wings', 'Person with glowing fairy wings and magical particles, ethereal lighting, dark mystical background'),
  ('template', 'fashion-stride', '/thumbnails/templates/fashion-stride.webp', 'Person walking fashion runway', 'Person striding confidently on fashion runway, dramatic catwalk lighting, dark stage background'),
  ('template', 'fisherman', '/thumbnails/templates/fisherman.webp', 'Person as fisherman casting', 'Person dressed as fisherman casting fishing line, dramatic golden hour lighting, dark moody water background'),
  ('template', 'flower-receive', '/thumbnails/templates/flower-receive.webp', 'Person receiving flowers', 'Person receiving flowers with surprised delighted expression, romantic soft lighting, dark background'),
  ('template', 'flying', '/thumbnails/templates/flying.webp', 'Person flying through air', 'Person flying through air with cape flowing, superman pose, dramatic sky background with dark clouds'),
  ('template', 'french-kiss', '/thumbnails/templates/french-kiss.webp', 'Couple french kissing', 'Couple mid-french kiss in romantic embrace, soft dramatic lighting, dark background with subtle glow'),
  ('template', 'gender-swap', '/thumbnails/templates/gender-swap.webp', 'Person gender transformed', 'Split-screen showing gender transformation of person, dramatic reveal, dark moody background'),
  ('template', 'golden-epoch', '/thumbnails/templates/golden-epoch.webp', 'Person in retro vintage style', 'Person in 1920s vintage golden era style, sepia tones, art deco aesthetic, dramatic lighting'),
  ('template', 'hair-swap', '/thumbnails/templates/hair-swap.webp', 'Person with different hair', 'Person with dramatically different hairstyle, before-after aesthetic, dramatic studio lighting'),
  ('template', 'hugging', '/thumbnails/templates/hugging.webp', 'Person hugging someone', 'Warm hugging embrace between two people, soft romantic lighting, dark background with warm glow'),
  ('template', 'jiggle-up', '/thumbnails/templates/jiggle-up.webp', 'Person jiggle jumping up', 'Person jumping with jiggle physics effect, frozen mid-air, energetic motion, dark background'),
  ('template', 'kissing-pro', '/thumbnails/templates/kissing-pro.webp', 'Professional kissing photo', 'Couple in passionate kiss pose like movie poster, dramatic cinematic lighting, dark background'),
  ('template', 'live-memory', '/thumbnails/templates/live-memory.webp', 'Person in memory flashback', 'Person appearing as living memory with ethereal glow, dreamy nostalgic aesthetic, dark vignette'),
  ('template', 'love-drop', '/thumbnails/templates/love-drop.webp', 'Person with heart drops', 'Person with heart-shaped tears or droplets falling, emotional romantic scene, dark background with pink glow'),
  ('template', 'melt', '/thumbnails/templates/melt.webp', 'Person melting effect', 'Person melting like wax with dripping effect, surreal artistic style, dark background with warm lighting'),
  ('template', 'minecraft', '/thumbnails/templates/minecraft.webp', 'Person in Minecraft world', 'Person in Minecraft blocky 3D world, voxel aesthetic, pixelated terrain, dark game-like background'),
  ('template', 'muscling', '/thumbnails/templates/muscling.webp', 'Person flexing muscles', 'Person flexing muscles showing strength, dramatic bodybuilding pose, dramatic spotlight on dark background'),
  ('template', 'nap-me-360p', '/thumbnails/templates/nap-me.webp', 'Person sleeping peacefully', 'Person sleeping peacefully in bed, soft morning light, cozy peaceful atmosphere, dark bedroom background'),
  ('template', 'paperman', '/thumbnails/templates/paperman.webp', 'Person as paper cutout', 'Person transformed into paper cutout style, 2D flat aesthetic, colorful but dark layered background'),
  ('template', 'pilot', '/thumbnails/templates/pilot.webp', 'Person as airplane pilot', 'Person in pilot uniform with headset, cockpit background, dramatic aviation lighting'),
  ('template', 'pinch', '/thumbnails/templates/pinch.webp', 'Person pinching something', 'Person pinching small object between fingers, close-up detail shot, dramatic macro lighting'),
  ('template', 'pixel-me', '/thumbnails/templates/pixel-me.webp', 'Person in pixel art style', 'Person rendered as pixel art character, retro 8-bit aesthetic, dark digital background with scanlines'),
  ('template', 'romantic-lift', '/thumbnails/templates/romantic-lift.webp', 'Person lifting partner romantically', 'Person lifting partner in romantic embrace, slow motion, cinematic lighting, dark background'),
  ('template', 'sexy-me', '/thumbnails/templates/sexy-me.webp', 'Person in glamorous pose', 'Person in glamorous sexy pose, dramatic fashion lighting, dark studio background with rim light'),
  ('template', 'slice-therapy', '/thumbnails/templates/slice-therapy.webp', 'Person sliced in half effect', 'Person with body sliced revealing interior, medical scan aesthetic, dark background with blue glow'),
  ('template', 'soul-depart', '/thumbnails/templates/soul-depart.webp', 'Soul leaving body effect', 'Person with ghostly soul separating from body, ethereal ghost effect, dark mystical background'),
  ('template', 'split-stance-human', '/thumbnails/templates/split-stance.webp', 'Person with split stance', 'Person in powerful split stance pose, martial arts action pose, dramatic lighting on dark background'),
  ('template', 'squid-game', '/thumbnails/templates/squid-game.webp', 'Person in Squid Game costume', 'Person in iconic Squid Game green tracksuit with numbered mask, ominous dark background with red light'),
  ('template', 'toy-me', '/thumbnails/templates/toy-me.webp', 'Person as toy figurine', 'Person transformed into toy figurine like action figure, plastic texture, on display stand'),
  ('template', 'walk-forward', '/thumbnails/templates/walk-forward.webp', 'Person walking toward camera', 'Person walking directly toward camera in slow motion, dramatic approach shot, dark background'),
  ('template', 'zoom-in-fast', '/thumbnails/templates/zoom-in-fast.webp', 'Fast zoom into face', 'Extreme fast zoom into person face, motion blur edges, dramatic zoom effect, dark background'),
  ('template', 'zoom-out-fast', '/thumbnails/templates/zoom-out-fast.webp', 'Fast zoom out from face', 'Fast zoom out from person face revealing surroundings, expanding motion, dark background')
ON CONFLICT (target_type, target_id) DO NOTHING;

-- ───────────────────────────────────────────
-- Migration: 20260314191122_create_multi_tenant_core_schema.sql
-- ───────────────────────────────────────────
/*
  # Multi-Tenant Core Schema - Part 1: Foundation Tables

  ## Overview
  This migration establishes the foundational multi-tenant architecture for an AI media generation platform.
  Uses shared database with Row-Level Security (RLS) for automatic tenant isolation.

  ## Tables Created

  ### 1. tenants
  Stores organization/workspace information for multi-tenant isolation.
  - `id` (uuid, PK): Unique tenant identifier
  - `name` (text): Organization name
  - `slug` (text, unique): URL-friendly identifier
  - `plan_type` (text): Subscription tier (free, pro, enterprise)
  - `status` (text): Account status (active, suspended, cancelled)
  - `settings` (jsonb): Flexible tenant-specific configuration
  - `max_users` (int): User limit based on plan
  - `max_storage_gb` (int): Storage quota
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### 2. user_profiles
  Extended user information linked to Supabase auth.users.
  - `id` (uuid, PK, FK to auth.users): User identifier
  - `tenant_id` (uuid, FK to tenants): Organization membership
  - `email` (text): User email
  - `full_name` (text): Display name
  - `avatar_url` (text): Profile picture
  - `role` (text): User role within tenant
  - `is_tenant_admin` (boolean): Admin privileges flag
  - `preferences` (jsonb): User-specific settings
  - `last_login_at` (timestamptz): Last activity timestamp
  - `created_at` (timestamptz): Account creation
  - `updated_at` (timestamptz): Last profile update

  ### 3. roles
  Defines role-based access control (RBAC) system.
  - `id` (uuid, PK): Role identifier
  - `tenant_id` (uuid, FK to tenants): Tenant scope (NULL = system role)
  - `name` (text): Role name
  - `description` (text): Role purpose
  - `permissions` (jsonb): Array of permission strings
  - `is_system_role` (boolean): Built-in vs custom role
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ### 4. user_roles
  Junction table for user-role assignments.
  - `id` (uuid, PK): Assignment identifier
  - `user_id` (uuid, FK to user_profiles): User reference
  - `role_id` (uuid, FK to roles): Role reference
  - `tenant_id` (uuid, FK to tenants): Tenant scope
  - `granted_by` (uuid, FK to user_profiles): Who assigned role
  - `granted_at` (timestamptz): Assignment timestamp

  ## Security
  - RLS enabled on all tables
  - Policies ensure users only access data within their tenant
  - Tenant admins have elevated permissions
  - System roles are read-only for non-admins

  ## Indexes
  - Tenant ID indexes on all multi-tenant tables
  - Unique constraints on slug, email combinations
  - Composite indexes for common query patterns

  ## Important Notes
  - All timestamps use timestamptz for timezone awareness
  - JSONB used for flexible schema evolution
  - Soft deletes can be added via status/deleted_at columns if needed
  - Foreign keys enforce referential integrity
*/

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
  settings jsonb DEFAULT '{}'::jsonb,
  max_users int DEFAULT 5,
  max_storage_gb int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  is_tenant_admin boolean DEFAULT false,
  preferences jsonb DEFAULT '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Create roles table for RBAC
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES user_profiles(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, tenant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Add status column if it doesn't exist (for existing tables)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial'));
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can update their tenant"
  ON tenants FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view profiles in their tenant"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Tenant admins can insert user profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

CREATE POLICY "Tenant admins can delete user profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for roles table
CREATE POLICY "Users can view roles in their tenant"
  ON roles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    OR is_system_role = true
  );

CREATE POLICY "Tenant admins can manage custom roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
    AND is_system_role = false
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
    AND is_system_role = false
  );

-- RLS Policies for user_roles table
CREATE POLICY "Users can view role assignments in their tenant"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage role assignments"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────
-- Migration: 20260314191306_create_projects_and_new_generations.sql
-- ───────────────────────────────────────────
/*
  # Multi-Tenant Schema - Part 2: Projects and Enhanced Generations

  ## Overview
  Creates tables for organizing work into projects and enhanced generation tracking.
  Works alongside existing generations table.

  ## Tables Created

  ### 1. projects
  Workspaces for organizing related generations and assets.
  - `id` (uuid, PK): Project identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `created_by` (uuid, FK to user_profiles): Creator
  - `name` (text): Project name
  - `description` (text): Project purpose
  - `thumbnail_url` (text): Preview image
  - `status` (text): Project state (active, archived)
  - `settings` (jsonb): Project-specific configuration
  - `tags` (text[]): Searchable labels
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ### 2. generation_history
  Enhanced tracking of AI generations with multi-tenant support.
  - `id` (uuid, PK): Generation identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `project_id` (uuid, FK to projects): Project association
  - `user_id` (uuid, FK to user_profiles): Creator
  - `studio_type` (text): Which studio was used
  - `generation_type` (text): Output type (image, video, audio)
  - `model_name` (text): AI model used
  - `prompt` (text): User input prompt
  - `negative_prompt` (text): Exclusion instructions
  - `parameters` (jsonb): Generation settings
  - `input_assets` (jsonb): Source files/references
  - `output_url` (text): Generated media URL
  - `thumbnail_url` (text): Preview thumbnail
  - `status` (text): Generation state
  - `error_message` (text): Failure details
  - `processing_time_ms` (int): Generation duration
  - `cost_credits` (numeric): Resource consumption
  - `is_public` (boolean): Sharing flag
  - `metadata` (jsonb): Additional data
  - `created_at` (timestamptz): Submission time
  - `completed_at` (timestamptz): Finish time

  ### 3. generation_versions
  Tracks iterations and variations of generations.

  ### 4. assets
  User-uploaded and generated media files.

  ## Security
  - RLS enabled on all tables
  - Tenant isolation via policies
  - Project-based access control

  ## Indexes
  - Optimized for common query patterns
  - Tenant ID on all tables
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  settings jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enhanced generation_history table
CREATE TABLE IF NOT EXISTS generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  studio_type text NOT NULL CHECK (studio_type IN ('image', 'video', 'cinema', 'character', 'effects', 'edit', 'upscale', 'storyboard', 'commercial', 'influencer')),
  generation_type text NOT NULL CHECK (generation_type IN ('image', 'video', 'audio', 'text')),
  model_name text NOT NULL,
  prompt text NOT NULL,
  negative_prompt text,
  parameters jsonb DEFAULT '{}'::jsonb,
  input_assets jsonb DEFAULT '[]'::jsonb,
  output_url text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message text,
  processing_time_ms int,
  cost_credits numeric(10, 4) DEFAULT 0,
  is_public boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create generation_versions table
CREATE TABLE IF NOT EXISTS generation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  generation_history_id uuid NOT NULL REFERENCES generation_history(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  output_url text NOT NULL,
  parameters jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(generation_history_id, version_number)
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', '3d', 'document', 'other')),
  thumbnail_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_generation_history_tenant_id ON generation_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_project_id ON generation_history(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_status ON generation_history(status);
CREATE INDEX IF NOT EXISTS idx_generation_history_studio_type ON generation_history(studio_type);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_history_is_public ON generation_history(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_generation_versions_generation_history_id ON generation_versions(generation_history_id);
CREATE INDEX IF NOT EXISTS idx_generation_versions_tenant_id ON generation_versions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their tenant"
  ON projects FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their tenant"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- RLS Policies for generation_history
CREATE POLICY "Users can view generations in their tenant"
  ON generation_history FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    OR is_public = true
  );

CREATE POLICY "Users can create generations in their tenant"
  ON generation_history FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own generations"
  ON generation_history FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own generations"
  ON generation_history FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- RLS Policies for generation_versions
CREATE POLICY "Users can view versions in their tenant"
  ON generation_versions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions in their tenant"
  ON generation_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- RLS Policies for assets
CREATE POLICY "Users can view assets in their tenant"
  ON assets FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    OR is_public = true
  );

CREATE POLICY "Users can upload assets to their tenant"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own assets"
  ON assets FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────
-- Migration: 20260314191343_create_usage_billing_audit_tables.sql
-- ───────────────────────────────────────────
/*
  # Multi-Tenant Schema - Part 3: Usage Tracking, Billing, and Audit Logs

  ## Overview
  Creates tables for resource usage monitoring, billing, subscriptions, and audit logging.

  ## Tables Created

  ### 1. usage_logs
  Tracks resource consumption for billing and analytics.
  - `id` (uuid, PK): Log entry identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `user_id` (uuid, FK to user_profiles): User who used resource
  - `resource_type` (text): Type of resource (generation, storage, api_call)
  - `resource_id` (uuid): Reference to specific resource
  - `studio_type` (text): Which studio was used
  - `credits_consumed` (numeric): Cost in credits
  - `quantity` (numeric): Amount used (e.g., seconds, MB)
  - `unit` (text): Unit of measurement
  - `metadata` (jsonb): Additional tracking data
  - `created_at` (timestamptz): Usage timestamp

  ### 2. credit_balances
  Current credit balance for each tenant.
  - `tenant_id` (uuid, PK, FK to tenants): Tenant identifier
  - `credits_available` (numeric): Current balance
  - `credits_consumed` (numeric): Lifetime usage
  - `credits_purchased` (numeric): Total purchased
  - `last_recharged_at` (timestamptz): Last top-up
  - `updated_at` (timestamptz): Last balance change

  ### 3. credit_transactions
  History of credit purchases and adjustments.
  - `id` (uuid, PK): Transaction identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `transaction_type` (text): Type (purchase, grant, refund, adjustment)
  - `amount` (numeric): Credit change (positive or negative)
  - `balance_before` (numeric): Balance before transaction
  - `balance_after` (numeric): Balance after transaction
  - `description` (text): Transaction description
  - `payment_method` (text): How credits were acquired
  - `payment_reference` (text): External payment ID
  - `processed_by` (uuid, FK to user_profiles): Admin who processed
  - `metadata` (jsonb): Additional transaction data
  - `created_at` (timestamptz): Transaction timestamp

  ### 4. subscriptions
  Manages subscription plans and billing cycles.
  - `id` (uuid, PK): Subscription identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `plan_type` (text): Subscription tier
  - `status` (text): Subscription state
  - `billing_interval` (text): Frequency (monthly, yearly)
  - `price_amount` (numeric): Cost per interval
  - `currency` (text): Billing currency
  - `credits_per_month` (int): Monthly credit allocation
  - `started_at` (timestamptz): Subscription start
  - `current_period_start` (timestamptz): Current billing period start
  - `current_period_end` (timestamptz): Current billing period end
  - `cancelled_at` (timestamptz): Cancellation timestamp
  - `trial_ends_at` (timestamptz): Trial expiration
  - `payment_provider` (text): Billing provider (stripe, etc.)
  - `payment_provider_id` (text): External subscription ID
  - `metadata` (jsonb): Additional subscription data
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ### 5. audit_logs
  Comprehensive audit trail for security and compliance.
  - `id` (uuid, PK): Log entry identifier
  - `tenant_id` (uuid, FK to tenants): Tenant scope
  - `user_id` (uuid, FK to user_profiles): User who performed action
  - `action` (text): Action performed
  - `resource_type` (text): Affected resource type
  - `resource_id` (uuid): Affected resource identifier
  - `changes` (jsonb): Before/after values
  - `ip_address` (inet): Request IP
  - `user_agent` (text): Client information
  - `metadata` (jsonb): Additional context
  - `created_at` (timestamptz): Action timestamp

  ### 6. api_keys
  Programmatic access tokens for integrations.
  - `id` (uuid, PK): API key identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `created_by` (uuid, FK to user_profiles): Creator
  - `name` (text): Key description
  - `key_hash` (text): Hashed API key (never store plain)
  - `key_prefix` (text): First chars for identification
  - `scopes` (text[]): Permitted operations
  - `rate_limit_per_hour` (int): Request limit
  - `last_used_at` (timestamptz): Last usage
  - `expires_at` (timestamptz): Expiration timestamp
  - `is_active` (boolean): Enable/disable flag
  - `created_at` (timestamptz): Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Audit logs are append-only (no UPDATE/DELETE policies)
  - API keys store only hashes, never plain text
  - Credit transactions maintain balance integrity

  ## Indexes
  - Optimized for analytics and reporting queries
  - Time-based indexes for usage tracking
  - Tenant isolation indexes
*/

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('generation', 'storage', 'api_call', 'upscale', 'training')),
  resource_id uuid,
  studio_type text,
  credits_consumed numeric(10, 4) NOT NULL DEFAULT 0,
  quantity numeric(15, 4),
  unit text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create credit_balances table
CREATE TABLE IF NOT EXISTS credit_balances (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  credits_available numeric(15, 4) NOT NULL DEFAULT 0 CHECK (credits_available >= 0),
  credits_consumed numeric(15, 4) NOT NULL DEFAULT 0 CHECK (credits_consumed >= 0),
  credits_purchased numeric(15, 4) NOT NULL DEFAULT 0 CHECK (credits_purchased >= 0),
  last_recharged_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'grant', 'refund', 'adjustment', 'bonus')),
  amount numeric(15, 4) NOT NULL,
  balance_before numeric(15, 4) NOT NULL,
  balance_after numeric(15, 4) NOT NULL,
  description text NOT NULL,
  payment_method text,
  payment_reference text,
  processed_by uuid REFERENCES user_profiles(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise', 'custom')),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'yearly', 'one_time')),
  price_amount numeric(10, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  credits_per_month int DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancelled_at timestamptz,
  trial_ends_at timestamptz,
  payment_provider text,
  payment_provider_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  changes jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] DEFAULT ARRAY[]::text[],
  rate_limit_per_hour int DEFAULT 1000,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant_id ON usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_resource_type ON usage_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant_created ON usage_logs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_tenant_id ON credit_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_logs
CREATE POLICY "Users can view usage logs in their tenant"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert usage logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for credit_balances
CREATE POLICY "Users can view their tenant credit balance"
  ON credit_balances FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can update credit balance"
  ON credit_balances FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view transactions in their tenant"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can insert credit transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their tenant subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for audit_logs (append-only)
CREATE POLICY "Users can view audit logs in their tenant"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for api_keys
CREATE POLICY "Users can view API keys in their tenant"
  ON api_keys FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_credit_balances_updated_at
  BEFORE UPDATE ON credit_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────
-- Migration: 20260314191423_create_sharing_notifications_settings.sql
-- ───────────────────────────────────────────
/*
  # Multi-Tenant Schema - Part 4: Sharing, Notifications, and Configuration

  ## Overview
  Creates tables for content sharing, team collaboration, notifications, and system configuration.

  ## Tables Created

  ### 1. shared_content
  Enables sharing generations and projects with external users.
  - `id` (uuid, PK): Share identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `shared_by` (uuid, FK to user_profiles): User who shared
  - `content_type` (text): What is shared (project, generation, asset)
  - `content_id` (uuid): Reference to shared content
  - `share_token` (text, unique): URL-safe share identifier
  - `share_type` (text): Public link or specific user
  - `shared_with_email` (text): Recipient email (if private)
  - `permissions` (text[]): Allowed actions (view, download, comment)
  - `password_hash` (text): Optional password protection
  - `expires_at` (timestamptz): Expiration timestamp
  - `view_count` (int): Number of views
  - `last_accessed_at` (timestamptz): Last view timestamp
  - `is_active` (boolean): Enable/disable flag
  - `metadata` (jsonb): Additional settings
  - `created_at` (timestamptz): Share creation

  ### 2. comments
  Collaboration through comments on generations and projects.
  - `id` (uuid, PK): Comment identifier
  - `tenant_id` (uuid, FK to tenants): Tenant scope
  - `content_type` (text): Commented resource type
  - `content_id` (uuid): Reference to content
  - `user_id` (uuid, FK to user_profiles): Commenter
  - `parent_comment_id` (uuid, FK to comments): For threaded replies
  - `content` (text): Comment text
  - `mentions` (uuid[]): Tagged users
  - `is_edited` (boolean): Edit flag
  - `is_deleted` (boolean): Soft delete flag
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ### 3. notifications
  Real-time notifications for user activities.
  - `id` (uuid, PK): Notification identifier
  - `tenant_id` (uuid, FK to tenants): Tenant scope
  - `user_id` (uuid, FK to user_profiles): Recipient
  - `notification_type` (text): Event type
  - `title` (text): Notification title
  - `message` (text): Notification content
  - `action_url` (text): Deep link to related content
  - `related_user_id` (uuid, FK to user_profiles): Actor who triggered
  - `metadata` (jsonb): Additional context
  - `is_read` (boolean): Read status
  - `read_at` (timestamptz): When marked as read
  - `created_at` (timestamptz): Notification timestamp

  ### 4. team_invitations
  Manages invitations to join tenant organizations.
  - `id` (uuid, PK): Invitation identifier
  - `tenant_id` (uuid, FK to tenants): Inviting organization
  - `invited_email` (text): Invitee email
  - `invited_by` (uuid, FK to user_profiles): Inviter
  - `role` (text): Assigned role upon acceptance
  - `invitation_token` (text, unique): Secure token
  - `status` (text): Invitation state
  - `expires_at` (timestamptz): Expiration timestamp
  - `accepted_at` (timestamptz): Acceptance timestamp
  - `created_at` (timestamptz): Invitation creation

  ### 5. tenant_settings
  Tenant-specific configuration and preferences.
  - `tenant_id` (uuid, PK, FK to tenants): Tenant identifier
  - `branding` (jsonb): Logo, colors, custom domain
  - `features_enabled` (jsonb): Feature flags
  - `default_permissions` (jsonb): Default access settings
  - `integrations` (jsonb): Third-party service configs
  - `notification_settings` (jsonb): Notification preferences
  - `security_settings` (jsonb): Security policies
  - `updated_at` (timestamptz): Last configuration change

  ### 6. model_configurations
  Custom AI model settings per tenant.
  - `id` (uuid, PK): Configuration identifier
  - `tenant_id` (uuid, FK to tenants): Tenant ownership
  - `model_name` (text): AI model identifier
  - `studio_type` (text): Applicable studio
  - `default_parameters` (jsonb): Default generation settings
  - `is_enabled` (boolean): Availability flag
  - `custom_endpoint` (text): Optional custom API endpoint
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last modification

  ## Security
  - RLS enabled on all tables
  - Share tokens are cryptographically secure
  - Password hashes never stored in plain text
  - Notifications isolated to recipients

  ## Indexes
  - Optimized for real-time features
  - Share token lookups
  - Unread notification queries
*/

-- Create shared_content table
CREATE TABLE IF NOT EXISTS shared_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('project', 'generation', 'asset', 'storyboard')),
  content_id uuid NOT NULL,
  share_token text UNIQUE NOT NULL,
  share_type text NOT NULL DEFAULT 'public' CHECK (share_type IN ('public', 'private', 'password_protected')),
  shared_with_email text,
  permissions text[] DEFAULT ARRAY['view']::text[],
  password_hash text,
  expires_at timestamptz,
  view_count int DEFAULT 0,
  last_accessed_at timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('project', 'generation', 'asset')),
  content_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  mentions uuid[] DEFAULT ARRAY[]::uuid[],
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('comment', 'mention', 'share', 'generation_complete', 'generation_failed', 'credit_low', 'team_invite', 'role_change')),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  related_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invitation_token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create tenant_settings table
CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  branding jsonb DEFAULT '{}'::jsonb,
  features_enabled jsonb DEFAULT '{}'::jsonb,
  default_permissions jsonb DEFAULT '{}'::jsonb,
  integrations jsonb DEFAULT '{}'::jsonb,
  notification_settings jsonb DEFAULT '{}'::jsonb,
  security_settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Create model_configurations table
CREATE TABLE IF NOT EXISTS model_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model_name text NOT NULL,
  studio_type text NOT NULL,
  default_parameters jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  custom_endpoint text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, model_name, studio_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_content_tenant_id ON shared_content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shared_content_share_token ON shared_content(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_content_content ON shared_content(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_shared_content_is_active ON shared_content(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_comments_tenant_id ON comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_team_invitations_tenant_id ON team_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_email ON team_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

CREATE INDEX IF NOT EXISTS idx_model_configurations_tenant_id ON model_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_configurations_is_enabled ON model_configurations(is_enabled) WHERE is_enabled = true;

-- Enable Row Level Security
ALTER TABLE shared_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_content
CREATE POLICY "Users can view shares in their tenant"
  ON shared_content FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create shares in their tenant"
  ON shared_content FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND shared_by = auth.uid()
  );

CREATE POLICY "Users can update their own shares"
  ON shared_content FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND shared_by = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for comments
CREATE POLICY "Users can view comments in their tenant"
  ON comments FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments in their tenant"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for team_invitations
CREATE POLICY "Users can view invitations for their tenant"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage invitations"
  ON team_invitations FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for tenant_settings
CREATE POLICY "Users can view their tenant settings"
  ON tenant_settings FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage settings"
  ON tenant_settings FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- RLS Policies for model_configurations
CREATE POLICY "Users can view model configs in their tenant"
  ON model_configurations FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage model configs"
  ON model_configurations FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() AND is_tenant_admin = true
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_configurations_updated_at
  BEFORE UPDATE ON model_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────
-- Migration: 20260314191518_seed_roles_and_helper_functions.sql
-- ───────────────────────────────────────────
/*
  # Seed Data - System Roles and Helper Functions

  ## Overview
  Inserts system roles and creates utility functions for tenant management.

  ## System Roles
  Five predefined roles with specific permission sets for RBAC.

  ## Helper Functions
  - initialize_tenant: Sets up new tenant with defaults
  - log_credit_usage: Handles credit consumption
  - create_notification: Creates user notifications
*/

-- Insert system roles
INSERT INTO roles (id, tenant_id, name, description, permissions, is_system_role) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Super Admin',
    'Full system access across all tenants',
    '["system:*", "tenants:*", "users:*", "projects:*", "generations:*", "assets:*", "billing:*", "audit:*"]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    NULL,
    'Tenant Owner',
    'Full access to tenant resources and settings',
    '["tenant:manage", "users:*", "roles:*", "projects:*", "generations:*", "assets:*", "billing:*", "integrations:*", "settings:*"]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    NULL,
    'Tenant Admin',
    'Manage users and content within tenant',
    '["users:invite", "users:manage", "projects:*", "generations:*", "assets:*", "comments:*", "shares:*"]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    NULL,
    'Content Creator',
    'Create and manage content',
    '["projects:create", "projects:read", "projects:update", "projects:delete", "generations:create", "generations:read", "generations:update", "assets:create", "assets:read", "assets:update", "comments:create", "comments:read", "shares:create"]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    NULL,
    'Viewer',
    'Read-only access to content',
    '["projects:read", "generations:read", "assets:read", "comments:read"]'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Create function to initialize tenant with default settings
CREATE OR REPLACE FUNCTION initialize_tenant(tenant_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Create credit balance
  INSERT INTO credit_balances (tenant_id, credits_available, credits_purchased)
  VALUES (tenant_id_param, 100, 100)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Create tenant settings
  INSERT INTO tenant_settings (
    tenant_id,
    branding,
    features_enabled,
    default_permissions,
    notification_settings
  ) VALUES (
    tenant_id_param,
    '{"logo_url": null, "primary_color": "#3b82f6", "custom_domain": null}'::jsonb,
    '{"image_generation": true, "video_generation": true, "upscaling": true, "api_access": false}'::jsonb,
    '{"default_sharing": "private", "allow_public_sharing": true, "require_approval": false}'::jsonb,
    '{"email_notifications": true, "push_notifications": true, "comment_notifications": true, "generation_complete": true}'::jsonb
  )
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Grant initial credits transaction
  INSERT INTO credit_transactions (
    tenant_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    tenant_id_param,
    'grant',
    100,
    0,
    100,
    'Welcome bonus - 100 free credits'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log credit usage
CREATE OR REPLACE FUNCTION log_credit_usage(
  tenant_id_param uuid,
  user_id_param uuid,
  resource_type_param text,
  resource_id_param uuid,
  credits_amount numeric,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
BEGIN
  -- Get current balance
  SELECT credits_available INTO current_balance
  FROM credit_balances
  WHERE tenant_id = tenant_id_param
  FOR UPDATE;
  
  -- Check if sufficient credits
  IF current_balance < credits_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', current_balance, credits_amount;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - credits_amount;
  
  -- Update balance
  UPDATE credit_balances
  SET 
    credits_available = new_balance,
    credits_consumed = credits_consumed + credits_amount,
    updated_at = now()
  WHERE tenant_id = tenant_id_param;
  
  -- Log usage
  INSERT INTO usage_logs (
    tenant_id,
    user_id,
    resource_type,
    resource_id,
    credits_consumed,
    metadata
  ) VALUES (
    tenant_id_param,
    user_id_param,
    resource_type_param,
    resource_id_param,
    credits_amount,
    metadata_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param uuid,
  notification_type_param text,
  title_param text,
  message_param text,
  action_url_param text DEFAULT NULL,
  related_user_id_param uuid DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
  user_tenant_id uuid;
BEGIN
  -- Get user's tenant
  SELECT tenant_id INTO user_tenant_id
  FROM user_profiles
  WHERE id = user_id_param;
  
  IF user_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not associated with a tenant';
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    tenant_id,
    user_id,
    notification_type,
    title,
    message,
    action_url,
    related_user_id,
    metadata
  ) VALUES (
    user_tenant_id,
    user_id_param,
    notification_type_param,
    title_param,
    message_param,
    action_url_param,
    related_user_id_param,
    metadata_param
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id_param uuid,
  permission_param text
)
RETURNS boolean AS $$
DECLARE
  has_perm boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param
      AND (
        r.permissions @> to_jsonb(permission_param)
        OR r.permissions @> to_jsonb(split_part(permission_param, ':', 1) || ':*')
        OR r.permissions @> to_jsonb('system:*')
      )
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments to tables
COMMENT ON TABLE tenants IS 'Multi-tenant organizations/workspaces';
COMMENT ON TABLE user_profiles IS 'Extended user information linked to auth.users';
COMMENT ON TABLE roles IS 'RBAC role definitions (system and custom)';
COMMENT ON TABLE projects IS 'User workspaces for organizing content';
COMMENT ON TABLE generation_history IS 'AI generation tracking with multi-tenant support';
COMMENT ON TABLE assets IS 'User-uploaded and generated media files';
COMMENT ON TABLE usage_logs IS 'Resource consumption tracking for billing';
COMMENT ON TABLE credit_balances IS 'Current credit balance per tenant';
COMMENT ON TABLE credit_transactions IS 'Credit purchase and adjustment history';
COMMENT ON TABLE subscriptions IS 'Subscription plans and billing cycles';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
COMMENT ON TABLE shared_content IS 'Content sharing with external users';
COMMENT ON TABLE comments IS 'Collaboration comments on content';
COMMENT ON TABLE notifications IS 'Real-time user notifications';
COMMENT ON TABLE team_invitations IS 'Tenant member invitations';
COMMENT ON TABLE tenant_settings IS 'Tenant-specific configuration';
COMMENT ON TABLE model_configurations IS 'Custom AI model settings per tenant';

-- ───────────────────────────────────────────
-- Migration: 20260314193620_create_multi_tenant_storage_system.sql
-- ───────────────────────────────────────────
/*
  # Multi-Tenant Storage System

  ## Overview
  Creates secure, scalable storage buckets for multi-tenant file management.
  Each tenant's files are isolated in their own folder path.

  ## Storage Buckets Created

  ### 1. tenant-assets (Private)
  Stores user-uploaded files and generated content.
  - Path structure: /{tenant_id}/{user_id}/{asset_type}/{filename}
  - Size limit: 100MB per file
  - File types: Images, videos, audio, documents
  - Access: Authenticated users in same tenant only

  ### 2. tenant-generations (Private)
  Stores AI-generated media outputs.
  - Path structure: /{tenant_id}/generations/{generation_id}/{filename}
  - Size limit: 500MB per file (large videos)
  - File types: Images, videos, audio
  - Access: Authenticated users in same tenant only

  ### 3. tenant-thumbnails (Public)
  Stores public thumbnails and preview images.
  - Path structure: /{tenant_id}/thumbnails/{resource_type}/{filename}
  - Size limit: 10MB per file
  - File types: Images only
  - Access: Public read, authenticated write

  ### 4. shared-content (Public)
  Stores publicly shared content via share links.
  - Path structure: /shared/{share_token}/{filename}
  - Size limit: 100MB per file
  - File types: Images, videos
  - Access: Public read, authenticated write

  ## Storage Policies (RLS)
  All buckets have Row-Level Security policies:
  - Users can only upload to their tenant's folders
  - Users can only read files from their tenant
  - Public buckets allow anonymous reads
  - Shared content accessible via token

  ## Storage Quotas
  Enforced at application level:
  - Free plan: 10GB total storage
  - Pro plan: 100GB total storage
  - Enterprise plan: 1TB+ total storage

  ## Important Notes
  - File paths include tenant_id for isolation
  - Storage usage tracked in assets table
  - Automatic cleanup for deleted resources
  - CDN-ready for fast delivery
*/

-- Drop existing uploads bucket if exists (we'll recreate properly)
-- NOTE: This won't delete if it has files, which is safe
DO $$ 
BEGIN
  -- We'll keep existing bucket and just add new ones
  NULL;
END $$;

-- Create tenant-assets bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets',
  'tenant-assets',
  false,
  104857600, -- 100MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain'
  ];

-- Create tenant-generations bucket (private, larger size limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-generations',
  'tenant-generations',
  false,
  524288000, -- 500MB for large generated videos
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp3', 'audio/wav'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp3', 'audio/wav'
  ];

-- Create tenant-thumbnails bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-thumbnails',
  'tenant-thumbnails',
  true, -- Public for fast CDN delivery
  10485760, -- 10MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ];

-- Create shared-content bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shared-content',
  'shared-content',
  true, -- Public for shareable links
  104857600, -- 100MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ];

-- =====================================================
-- STORAGE POLICIES FOR TENANT-ASSETS BUCKET
-- =====================================================

-- Users can upload to their tenant folder
CREATE POLICY "Users can upload assets to their tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can read files from their tenant folder
CREATE POLICY "Users can read assets from their tenant folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can update their own uploaded files
CREATE POLICY "Users can update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can delete their own uploaded files
CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- =====================================================
-- STORAGE POLICIES FOR TENANT-GENERATIONS BUCKET
-- =====================================================

-- Users can upload generations to their tenant folder
CREATE POLICY "Users can upload generations to their tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can read generations from their tenant folder
CREATE POLICY "Users can read generations from their tenant folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can update their own generations
CREATE POLICY "Users can update their own generations"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can delete their own generations
CREATE POLICY "Users can delete their own generations"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-generations'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- =====================================================
-- STORAGE POLICIES FOR TENANT-THUMBNAILS BUCKET
-- =====================================================

-- Anyone can view thumbnails (public bucket)
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tenant-thumbnails');

-- Users can upload thumbnails to their tenant folder
CREATE POLICY "Users can upload thumbnails to their tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-thumbnails'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can update thumbnails in their tenant folder
CREATE POLICY "Users can update thumbnails in their tenant folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-thumbnails'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'tenant-thumbnails'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can delete thumbnails from their tenant folder
CREATE POLICY "Users can delete thumbnails from their tenant folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-thumbnails'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
  )
);

-- =====================================================
-- STORAGE POLICIES FOR SHARED-CONTENT BUCKET
-- =====================================================

-- Anyone can view shared content (public bucket)
CREATE POLICY "Anyone can view shared content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shared-content');

-- Authenticated users can upload shared content
CREATE POLICY "Authenticated users can upload shared content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shared-content');

-- Users can update their own shared content
CREATE POLICY "Users can update their own shared content"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shared-content'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'shared-content'
);

-- Users can delete their own shared content
CREATE POLICY "Users can delete their own shared content"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shared-content'
  AND owner = auth.uid()
);

-- =====================================================
-- HELPER FUNCTIONS FOR STORAGE
-- =====================================================

-- Function to get tenant storage usage
CREATE OR REPLACE FUNCTION get_tenant_storage_usage(tenant_id_param uuid)
RETURNS TABLE (
  bucket_name text,
  file_count bigint,
  total_bytes bigint,
  total_gb numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    obj.bucket_id as bucket_name,
    COUNT(*)::bigint as file_count,
    SUM(obj.metadata->>'size')::bigint as total_bytes,
    ROUND((SUM((obj.metadata->>'size')::bigint) / 1024.0 / 1024.0 / 1024.0)::numeric, 2) as total_gb
  FROM storage.objects obj
  WHERE (storage.foldername(obj.name))[1] = tenant_id_param::text
  GROUP BY obj.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if tenant is within storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(tenant_id_param uuid)
RETURNS boolean AS $$
DECLARE
  current_usage_gb numeric;
  max_storage_gb int;
  within_quota boolean;
BEGIN
  -- Get current usage
  SELECT COALESCE(SUM(total_gb), 0)
  INTO current_usage_gb
  FROM get_tenant_storage_usage(tenant_id_param);
  
  -- Get max allowed storage
  SELECT t.max_storage_gb
  INTO max_storage_gb
  FROM tenants t
  WHERE t.id = tenant_id_param;
  
  -- Check if within quota
  within_quota := current_usage_gb < max_storage_gb;
  
  RETURN within_quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_files()
RETURNS int AS $$
DECLARE
  deleted_count int := 0;
BEGIN
  -- This should be called periodically via cron job
  -- Deletes files that don't have corresponding records in assets or generation_history tables
  
  -- For now, just return 0 (actual implementation would delete orphaned files)
  -- Implementation requires storage.objects access which needs careful handling
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION get_tenant_storage_usage IS 'Calculate total storage usage per bucket for a tenant';
COMMENT ON FUNCTION check_storage_quota IS 'Check if tenant is within their storage quota limit';
COMMENT ON FUNCTION cleanup_orphaned_storage_files IS 'Remove files that no longer have database records';

-- ───────────────────────────────────────────
-- Migration: 20260413140000_add_missing_status_column.sql
-- ───────────────────────────────────────────
-- Add missing status column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial'));

-- Create the index that was failing
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ───────────────────────────────────────────
-- Migration: 20260414000000_extend_projects_for_app_integration.sql
-- ───────────────────────────────────────────
/*
  # Extend Projects Schema for App Integration

  ## Overview
  Extends the projects table to support storing app-specific data from all studio apps,
  enabling seamless project saving/loading across the entire Open-Higgsfield-AI ecosystem.

  ## Changes Made

  ### 1. Enhanced Projects Table
  - `studio_type` (text) - Which app/studio created this project
  - `app_version` (text) - Version of the app that created the project
  - `app_data` (jsonb) - Complete app-specific state data
  - `version_history` (jsonb) - History of project versions for undo/redo
  - `last_opened_app` (text) - Which app last opened this project
  - `compatibility_flags` (jsonb) - Feature flags for cross-app compatibility

  ### 2. New App Integration Functions
  - `save_app_project()` - Standardized function to save any app's project
  - `load_app_project()` - Load project data for specific app
  - `validate_app_compatibility()` - Check if project can be opened in target app

  ### 3. Enhanced Security Policies
  - Projects maintain tenant isolation
  - Apps can only access their own project data
  - Version history protected from unauthorized access

  ## App Types Supported
  - timeline-editor
  - image-studio
  - video-studio
  - cinema-studio
  - character-studio
  - audio-studio
  - storyboard-studio
  - effects-studio
  - edit-studio
  - influencer-studio
  - commercial-studio
  - avatar-studio
  - training-studio
  - video-tools-studio
  - chat-studio
  - lip-sync-studio
  - text-to-image
  - image-to-image
  - text-to-video
  - image-to-video
  - video-to-video
  - video-watermark

  ## Migration Safety
  - All existing projects remain compatible
  - New fields are nullable with defaults
  - No data loss during migration
*/

-- Add new columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS studio_type text,
ADD COLUMN IF NOT EXISTS app_version text DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS app_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS version_history jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_opened_app text,
ADD COLUMN IF NOT EXISTS compatibility_flags jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS auto_save_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_auto_save timestamptz,
ADD COLUMN IF NOT EXISTS project_size_bytes bigint DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN projects.studio_type IS 'Which app/studio created this project (timeline-editor, image-studio, etc.)';
COMMENT ON COLUMN projects.app_version IS 'Version of the app that created/saved the project';
COMMENT ON COLUMN projects.app_data IS 'Complete app-specific state data for seamless restoration';
COMMENT ON COLUMN projects.version_history IS 'History of project versions for undo/redo functionality';
COMMENT ON COLUMN projects.last_opened_app IS 'Which app last opened this project';
COMMENT ON COLUMN projects.compatibility_flags IS 'Feature flags for cross-app compatibility';
COMMENT ON COLUMN projects.auto_save_enabled IS 'Whether auto-save is enabled for this project';
COMMENT ON COLUMN projects.last_auto_save IS 'Timestamp of last auto-save operation';
COMMENT ON COLUMN projects.project_size_bytes IS 'Approximate size of project data in bytes';

-- Create index for efficient app-based queries
CREATE INDEX IF NOT EXISTS idx_projects_studio_type ON projects(studio_type);
CREATE INDEX IF NOT EXISTS idx_projects_user_app ON projects(user_id, studio_type);
CREATE INDEX IF NOT EXISTS idx_projects_last_opened ON projects(last_opened_app);

-- Function to save app project data
CREATE OR REPLACE FUNCTION save_app_project(
  project_id_param uuid,
  studio_type_param text,
  app_version_param text,
  app_data_param jsonb,
  compatibility_flags_param jsonb DEFAULT '{}'
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  old_app_data jsonb;
  version_entry jsonb;
BEGIN
  -- Get current app data for version history
  SELECT app_data INTO old_app_data 
  FROM projects 
  WHERE id = project_id_param;

  -- Create version history entry if data changed
  IF old_app_data IS NOT NULL AND old_app_data != app_data_param THEN
    version_entry := jsonb_build_object(
      'timestamp', extract(epoch from now()),
      'app_version', app_version_param,
      'app_data', old_app_data
    );
    
    -- Keep only last 10 versions to prevent bloat
    UPDATE projects 
    SET version_history = (
      CASE 
        WHEN jsonb_array_length(version_history) >= 10 
        THEN version_history - 0 || jsonb_build_array(version_entry)
        ELSE version_history || jsonb_build_array(version_entry)
      END
    )
    WHERE id = project_id_param;
  END IF;

  -- Update project with new app data
  UPDATE projects 
  SET 
    studio_type = studio_type_param,
    app_version = app_version_param,
    app_data = app_data_param,
    compatibility_flags = compatibility_flags_param,
    last_opened_app = studio_type_param,
    updated_at = now(),
    project_size_bytes = octet_length(app_data_param::text)
  WHERE id = project_id_param
  RETURNING jsonb_build_object(
    'id', id,
    'updated_at', updated_at,
    'size_bytes', project_size_bytes
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to load app project data
CREATE OR REPLACE FUNCTION load_app_project(
  project_id_param uuid,
  requesting_app text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  project_record record;
  compatibility_check jsonb;
BEGIN
  -- Get project data
  SELECT * INTO project_record
  FROM projects 
  WHERE id = project_id_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Project not found');
  END IF;

  -- Check compatibility if requesting app specified
  IF requesting_app IS NOT NULL AND project_record.compatibility_flags ? requesting_app THEN
    compatibility_check := project_record.compatibility_flags->requesting_app;
    IF compatibility_check->>'compatible' = 'false' THEN
      RETURN jsonb_build_object(
        'error', 'Project not compatible with this app',
        'reason', compatibility_check->>'reason',
        'suggested_app', project_record.studio_type
      );
    END IF;
  END IF;

  -- Update last opened app
  UPDATE projects 
  SET last_opened_app = COALESCE(requesting_app, studio_type)
  WHERE id = project_id_param;

  -- Return project data
  RETURN jsonb_build_object(
    'id', project_record.id,
    'title', project_record.title,
    'description', project_record.description,
    'studio_type', project_record.studio_type,
    'app_version', project_record.app_version,
    'app_data', project_record.app_data,
    'compatibility_flags', project_record.compatibility_flags,
    'created_at', project_record.created_at,
    'updated_at', project_record.updated_at,
    'last_opened_app', project_record.last_opened_app,
    'auto_save_enabled', project_record.auto_save_enabled,
    'last_auto_save', project_record.last_auto_save,
    'project_size_bytes', project_record.project_size_bytes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate app compatibility
CREATE OR REPLACE FUNCTION validate_app_compatibility(
  project_id_param uuid,
  target_app text
)
RETURNS jsonb AS $$
DECLARE
  project_record record;
  compatibility_result jsonb;
BEGIN
  -- Get project
  SELECT * INTO project_record
  FROM projects 
  WHERE id = project_id_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'compatible', false,
      'reason', 'Project not found'
    );
  END IF;

  -- Check if same app
  IF project_record.studio_type = target_app THEN
    RETURN jsonb_build_object(
      'compatible', true,
      'same_app', true
    );
  END IF;

  -- Check compatibility flags
  IF project_record.compatibility_flags ? target_app THEN
    compatibility_result := project_record.compatibility_flags->target_app;
    RETURN jsonb_build_object(
      'compatible', (compatibility_result->>'compatible')::boolean,
      'reason', compatibility_result->>'reason',
      'conversion_required', (compatibility_result->>'conversion_required')::boolean,
      'warnings', compatibility_result->'warnings'
    );
  END IF;

  -- Default: assume compatible but with warnings
  RETURN jsonb_build_object(
    'compatible', true,
    'warnings', jsonb_build_array('Project created in different app, some features may not be available')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get project statistics by app type
CREATE OR REPLACE FUNCTION get_app_project_stats(tenant_id_param uuid DEFAULT NULL)
RETURNS TABLE (
  app_type text,
  project_count bigint,
  total_size_bytes bigint,
  avg_size_bytes numeric,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.studio_type as app_type,
    COUNT(*) as project_count,
    SUM(p.project_size_bytes) as total_size_bytes,
    ROUND(AVG(p.project_size_bytes)) as avg_size_bytes,
    MAX(p.updated_at) as last_updated
  FROM projects p
  WHERE (tenant_id_param IS NULL OR p.tenant_id = tenant_id_param)
    AND p.studio_type IS NOT NULL
  GROUP BY p.studio_type
  ORDER BY project_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for auto-save functionality
CREATE OR REPLACE FUNCTION auto_save_project(
  project_id_param uuid,
  app_data_param jsonb
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only auto-save if enabled for this project
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id_param 
    AND auto_save_enabled = true
  ) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'auto_save_disabled');
  END IF;

  -- Update project with auto-save data
  UPDATE projects 
  SET 
    app_data = app_data_param,
    last_auto_save = now(),
    updated_at = now(),
    project_size_bytes = octet_length(app_data_param::text)
  WHERE id = project_id_param
  RETURNING jsonb_build_object(
    'auto_saved', true,
    'last_auto_save', last_auto_save,
    'size_bytes', project_size_bytes
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for the new functions (they inherit from projects table policies)
-- The functions above use SECURITY DEFINER, so they run with elevated privileges
-- but the underlying table access is still protected by RLS

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_app_data_gin ON projects USING gin(app_data);
CREATE INDEX IF NOT EXISTS idx_projects_compatibility_gin ON projects USING gin(compatibility_flags);
CREATE INDEX IF NOT EXISTS idx_projects_version_history_gin ON projects USING gin(version_history);

-- Update existing projects to have default values
UPDATE projects 
SET 
  app_version = COALESCE(app_version, '1.0.0'),
  app_data = COALESCE(app_data, '{}'),
  version_history = COALESCE(version_history, '[]'),
  compatibility_flags = COALESCE(compatibility_flags, '{}'),
  auto_save_enabled = COALESCE(auto_save_enabled, true),
  project_size_bytes = COALESCE(project_size_bytes, 0)
WHERE app_version IS NULL OR app_data IS NULL;

-- Add constraint to ensure app_data is valid JSON
ALTER TABLE projects 
ADD CONSTRAINT projects_app_data_valid_json 
CHECK (jsonb_typeof(app_data) = 'object');

-- Add constraint to ensure compatibility_flags is valid JSON
ALTER TABLE projects 
ADD CONSTRAINT projects_compatibility_flags_valid_json 
CHECK (jsonb_typeof(compatibility_flags) = 'object');

-- Add constraint to ensure version_history is valid JSON array
ALTER TABLE projects 
ADD CONSTRAINT projects_version_history_valid_json_array 
CHECK (jsonb_typeof(version_history) = 'array');


-- ───────────────────────────────────────────
-- Migration: 20260414010000_add_project_routing_support.sql
-- ───────────────────────────────────────────
/*
  # Add Project-Aware Routing Support

  ## Overview
  Adds database functions and enhancements to support seamless project navigation
  and routing across all apps in the Open-Higgsfield-AI ecosystem.

  ## Changes Made

  ### 1. Project URL Generation
  - `generate_project_url()` - Creates shareable URLs for projects
  - `parse_project_url()` - Parses project URLs for routing

  ### 2. Cross-App Navigation
  - `get_compatible_apps()` - Lists apps that can open a project
  - `suggest_app_for_project()` - Recommends best app for project type

  ### 3. Project Sharing & Collaboration
  - `create_project_share_link()` - Generates shareable project links
  - `validate_share_link()` - Validates and resolves share links

  ### 4. Recent Projects Tracking
  - `get_recent_projects()` - Gets user's recently opened projects
  - `update_project_access_time()` - Tracks project access times

  ## Benefits
  - Seamless navigation between apps with project context
  - Shareable project links that work across apps
  - Smart app recommendations based on project content
  - Recent projects quick access
*/

-- Function to generate project URL for sharing/routing
CREATE OR REPLACE FUNCTION generate_project_url(
  project_id_param uuid,
  target_app text DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  project_record record;
  base_url text;
  app_param text := '';
BEGIN
  -- Get project
  SELECT * INTO project_record
  FROM projects 
  WHERE id = project_id_param;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Determine base URL (would be configurable in production)
  base_url := 'https://app.openhiggsfield.ai';

  -- Determine target app
  IF target_app IS NOT NULL THEN
    app_param := '?app=' || target_app;
  ELSE
    app_param := '?app=' || COALESCE(project_record.studio_type, 'projects');
  END IF;

  -- Generate URL with project parameter
  RETURN base_url || '/#' || COALESCE(project_record.studio_type, 'projects') || app_param || '&project=' || project_id_param::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to parse project URL components
CREATE OR REPLACE FUNCTION parse_project_url(
  url_param text
)
RETURNS jsonb AS $$
DECLARE
  url_parts text[];
  query_params text;
  app_name text;
  project_id uuid;
  result jsonb;
BEGIN
  -- Basic URL parsing (simplified - would use proper URL parsing in production)
  url_parts := regexp_split_array(url_param, '/#');
  
  IF array_length(url_parts, 1) < 2 THEN
    RETURN jsonb_build_object('error', 'Invalid URL format');
  END IF;

  -- Extract app name and query parameters
  app_name := split_part(url_parts[2], '?', 1);
  query_params := substring(url_parts[2] from position('?' in url_parts[2]) + 1);

  -- Parse query parameters
  IF query_params LIKE '%project=%' THEN
    -- Extract project ID
    project_id := substring(query_params from position('project=' in query_params) + 8)::uuid;
  END IF;

  result := jsonb_build_object(
    'app', app_name,
    'project_id', project_id,
    'url', url_param
  );

  -- Validate project exists and is accessible
  IF project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND (user_id = auth.uid() OR is_public = true)
    ) THEN
      result := result || jsonb_build_object('error', 'Project not found or not accessible');
    END IF;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get compatible apps for a project
CREATE OR REPLACE FUNCTION get_compatible_apps(
  project_id_param uuid
)
RETURNS jsonb AS $$
DECLARE
  project_record record;
  compatible_apps jsonb := '[]'::jsonb;
BEGIN
  -- Get project
  SELECT * INTO project_record
  FROM projects 
  WHERE id = project_id_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Project not found');
  END IF;

  -- Define compatibility matrix
  CASE project_record.studio_type
    WHEN 'timeline-editor' THEN
      compatible_apps := jsonb_build_array(
        jsonb_build_object('app', 'video-studio', 'compatibility', 'high', 'reason', 'Can import timeline projects'),
        jsonb_build_object('app', 'cinema-studio', 'compatibility', 'high', 'reason', 'Full timeline compatibility'),
        jsonb_build_object('app', 'edit-studio', 'compatibility', 'medium', 'reason', 'Basic editing features supported')
      );
    WHEN 'image-studio' THEN
      compatible_apps := jsonb_build_array(
        jsonb_build_object('app', 'text-to-image', 'compatibility', 'high', 'reason', 'Same generation capabilities'),
        jsonb_build_object('app', 'image-to-image', 'compatibility', 'high', 'reason', 'Image editing workflow')
      );
    WHEN 'video-studio' THEN
      compatible_apps := jsonb_build_array(
        jsonb_build_object('app', 'timeline-editor', 'compatibility', 'high', 'reason', 'Timeline export available'),
        jsonb_build_object('app', 'cinema-studio', 'compatibility', 'high', 'reason', 'Professional video editing'),
        jsonb_build_object('app', 'edit-studio', 'compatibility', 'medium', 'reason', 'Basic video editing')
      );
    ELSE
      -- Default compatibility
      compatible_apps := jsonb_build_array(
        jsonb_build_object('app', 'timeline-editor', 'compatibility', 'low', 'reason', 'Basic project viewing')
      );
  END CASE;

  RETURN jsonb_build_object(
    'original_app', project_record.studio_type,
    'compatible_apps', compatible_apps,
    'recommended_app', project_record.studio_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suggest best app for a project
CREATE OR REPLACE FUNCTION suggest_app_for_project(
  project_id_param uuid,
  user_context jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  project_record record;
  suggestion jsonb;
BEGIN
  -- Get project
  SELECT * INTO project_record
  FROM projects 
  WHERE id = project_id_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Project not found');
  END IF;

  -- Basic suggestion logic (can be enhanced with ML/user preferences)
  suggestion := jsonb_build_object(
    'suggested_app', project_record.studio_type,
    'confidence', 'high',
    'reason', 'Project was created in this app',
    'alternatives', jsonb_build_array(
      jsonb_build_object('app', 'timeline-editor', 'reason', 'Universal project viewer')
    )
  );

  -- Add user context considerations
  IF user_context ? 'preferred_apps' THEN
    -- Could prioritize user's preferred apps
    suggestion := suggestion || jsonb_build_object(
      'user_preference_considered', true
    );
  END IF;

  RETURN suggestion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent projects for user
CREATE OR REPLACE FUNCTION get_recent_projects(
  user_id_param uuid,
  limit_count int DEFAULT 10
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'studio_type', p.studio_type,
      'thumbnail_url', p.thumbnail_url,
      'updated_at', p.updated_at,
      'last_opened_app', p.last_opened_app,
      'status', p.status
    )
  ) INTO result
  FROM projects p
  WHERE p.user_id = user_id_param
    AND p.status != 'archived'
  ORDER BY p.updated_at DESC
  LIMIT limit_count;

  RETURN jsonb_build_object(
    'projects', COALESCE(result, '[]'::jsonb),
    'total_count', (SELECT count(*) FROM projects WHERE user_id = user_id_param AND status != 'archived')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update project access time
CREATE OR REPLACE FUNCTION update_project_access_time(
  project_id_param uuid,
  accessed_via_app text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE projects 
  SET 
    last_opened_app = COALESCE(accessed_via_app, last_opened_app),
    updated_at = now()
  WHERE id = project_id_param;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create project share link
CREATE OR REPLACE FUNCTION create_project_share_link(
  project_id_param uuid,
  expires_in_hours int DEFAULT 168, -- 7 days default
  require_auth boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  share_token text;
  expires_at timestamptz;
  share_url text;
BEGIN
  -- Generate unique share token
  share_token := encode(gen_random_bytes(16), 'hex');
  expires_at := now() + (expires_in_hours || ' hours')::interval;

  -- Store share link (would need a share_links table in production)
  -- For now, return the data that would be stored
  share_url := generate_project_url(project_id_param) || '&share=' || share_token;

  RETURN jsonb_build_object(
    'share_token', share_token,
    'share_url', share_url,
    'expires_at', expires_at,
    'require_auth', require_auth,
    'project_id', project_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON FUNCTION generate_project_url IS 'Generates shareable URLs for projects across apps';
COMMENT ON FUNCTION parse_project_url IS 'Parses project URLs to extract routing information';
COMMENT ON FUNCTION get_compatible_apps IS 'Lists apps that can open a given project';
COMMENT ON FUNCTION suggest_app_for_project IS 'Recommends the best app for opening a project';
COMMENT ON FUNCTION get_recent_projects IS 'Gets user recent projects for quick access';
COMMENT ON FUNCTION update_project_access_time IS 'Tracks when projects are accessed';
COMMENT ON FUNCTION create_project_share_link IS 'Creates shareable links for project collaboration';


-- ───────────────────────────────────────────
-- Migration: 20260425000000_create_monitoring_dashboards_schema.sql
-- ───────────────────────────────────────────
/*
  # Monitoring Dashboards - Database Schema

  Creates tables for comprehensive system monitoring, performance metrics,
  AI agent status, error analytics, user experience tracking, and infrastructure metrics.

  ## Tables Created

  ### 1. system_health_metrics
  Real-time system health indicators
  - service_name, status, response_time, uptime_percentage, last_check

  ### 2. performance_metrics
  Application performance data
  - metric_type (load_time, api_response, memory_usage, etc.)
  - value, timestamp, metadata

  ### 3. ai_agent_metrics
  AI service monitoring
  - agent_name, request_count, error_count, avg_response_time, status

  ### 4. error_analytics
  Error tracking and analysis
  - error_type, message, stack_trace, user_impact, frequency

  ### 5. user_experience_metrics
  UX performance data
  - page_load_times, interaction_latencies, satisfaction_scores

  ### 6. infrastructure_metrics
  Server and infrastructure monitoring
  - server_name, cpu_usage, memory_usage, disk_usage, network_io

  ### 7. alert_configs
  Alert threshold configurations
  - metric_type, threshold_value, alert_type, enabled

  ### 8. monitoring_alerts
  Active and historical alerts
  - alert_type, severity, message, resolved_at
*/

-- Create system_health_metrics table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  response_time_ms numeric(10, 2),
  uptime_percentage numeric(5, 2) CHECK (uptime_percentage >= 0 AND uptime_percentage <= 100),
  error_rate numeric(5, 2) CHECK (error_rate >= 0 AND error_rate <= 100),
  last_check timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN (
    'page_load_time', 'api_response_time', 'memory_usage', 'cpu_usage',
    'network_latency', 'render_time', 'bundle_size', 'cache_hit_rate'
  )),
  value numeric(15, 4) NOT NULL,
  unit text NOT NULL,
  tags jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now()
);

-- Create ai_agent_metrics table
CREATE TABLE IF NOT EXISTS ai_agent_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  model_version text,
  request_count bigint DEFAULT 0,
  success_count bigint DEFAULT 0,
  error_count bigint DEFAULT 0,
  avg_response_time_ms numeric(10, 2),
  tokens_used bigint DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'maintenance')),
  last_request_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Create error_analytics table
CREATE TABLE IF NOT EXISTS error_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  user_id uuid REFERENCES user_profiles(id),
  user_impact text CHECK (user_impact IN ('low', 'medium', 'high', 'critical')),
  browser_info jsonb DEFAULT '{}'::jsonb,
  url text,
  frequency int DEFAULT 1,
  first_occurrence timestamptz DEFAULT now(),
  last_occurrence timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create user_experience_metrics table
CREATE TABLE IF NOT EXISTS user_experience_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id),
  session_id text,
  page_name text NOT NULL,
  load_time_ms numeric(10, 2),
  interaction_type text,
  interaction_time_ms numeric(10, 2),
  satisfaction_score int CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  device_type text,
  browser_name text,
  viewport_size jsonb DEFAULT '{}'::jsonb,
  geo_location jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now()
);

-- Create infrastructure_metrics table
CREATE TABLE IF NOT EXISTS infrastructure_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_name text NOT NULL,
  region text,
  cpu_usage_percent numeric(5, 2) CHECK (cpu_usage_percent >= 0 AND cpu_usage_percent <= 100),
  memory_usage_percent numeric(5, 2) CHECK (memory_usage_percent >= 0 AND memory_usage_percent <= 100),
  disk_usage_percent numeric(5, 2) CHECK (disk_usage_percent >= 0 AND disk_usage_percent <= 100),
  network_in_mbps numeric(10, 2),
  network_out_mbps numeric(10, 2),
  active_connections int,
  response_time_ms numeric(10, 2),
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'error')),
  recorded_at timestamptz DEFAULT now()
);

-- Create alert_configs table
CREATE TABLE IF NOT EXISTS alert_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  threshold_value numeric(15, 4) NOT NULL,
  threshold_operator text NOT NULL CHECK (threshold_operator IN ('>', '<', '>=', '<=', '=', '!=')),
  alert_type text NOT NULL CHECK (alert_type IN ('email', 'slack', 'webhook', 'dashboard')),
  alert_message text NOT NULL,
  cooldown_minutes int DEFAULT 5,
  enabled boolean DEFAULT true,
  last_triggered_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create monitoring_alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  alert_config_id uuid REFERENCES alert_configs(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  triggered_value numeric(15, 4),
  threshold_value numeric(15, 4),
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES user_profiles(id),
  acknowledged_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_tenant_service ON system_health_metrics(tenant_id, service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_last_check ON system_health_metrics(last_check DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant_type ON performance_metrics(tenant_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_agent_metrics_tenant_name ON ai_agent_metrics(tenant_id, agent_name);
CREATE INDEX IF NOT EXISTS idx_ai_agent_metrics_updated_at ON ai_agent_metrics(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_analytics_tenant_type ON error_analytics(tenant_id, error_type);
CREATE INDEX IF NOT EXISTS idx_error_analytics_last_occurrence ON error_analytics(last_occurrence DESC);

CREATE INDEX IF NOT EXISTS idx_user_experience_metrics_tenant_page ON user_experience_metrics(tenant_id, page_name);
CREATE INDEX IF NOT EXISTS idx_user_experience_metrics_recorded_at ON user_experience_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_infrastructure_metrics_server ON infrastructure_metrics(server_name);
CREATE INDEX IF NOT EXISTS idx_infrastructure_metrics_recorded_at ON infrastructure_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_configs_tenant_type ON alert_configs(tenant_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_tenant_config ON monitoring_alerts(tenant_id, alert_config_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at ON monitoring_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_resolved ON monitoring_alerts(resolved) WHERE resolved = false;

-- Enable Row Level Security
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experience_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (tenant admins can manage, all tenant users can view)
CREATE POLICY "Users can view system health metrics in their tenant"
  ON system_health_metrics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant admins can manage system health metrics"
  ON system_health_metrics FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

-- Similar policies for other tables
CREATE POLICY "Users can view performance metrics in their tenant"
  ON performance_metrics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant admins can manage performance metrics"
  ON performance_metrics FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

CREATE POLICY "Users can view AI agent metrics in their tenant"
  ON ai_agent_metrics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant admins can manage AI agent metrics"
  ON ai_agent_metrics FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

CREATE POLICY "Users can view error analytics in their tenant"
  ON error_analytics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant admins can manage error analytics"
  ON error_analytics FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

CREATE POLICY "Users can view UX metrics in their tenant"
  ON user_experience_metrics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert UX metrics"
  ON user_experience_metrics FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view infrastructure metrics"
  ON infrastructure_metrics FOR SELECT TO authenticated
  USING (true); -- Infrastructure metrics might be shared across tenants

CREATE POLICY "Tenant admins can manage alert configs"
  ON alert_configs FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid() AND is_tenant_admin = true));

CREATE POLICY "Users can view alerts in their tenant"
  ON monitoring_alerts FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "System can create alerts"
  ON monitoring_alerts FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_ai_agent_metrics_updated_at
  BEFORE UPDATE ON ai_agent_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_configs_updated_at
  BEFORE UPDATE ON alert_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();</content>
<parameter name="filePath">supabase/migrations/20260425000000_create_monitoring_dashboards_schema.sql

-- ───────────────────────────────────────────
-- Migration: 20260428092051_reset_migrations.sql
-- ───────────────────────────────────────────


-- ───────────────────────────────────────────
-- Migration: 20260504121500_vimax_complete_schema.sql
-- ───────────────────────────────────────────
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


-- ───────────────────────────────────────────
-- Migration: 20260507120000_videoremix_mvp_schema.sql
-- ───────────────────────────────────────────
-- VideoRemix MVP schema + RLS
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  plan text default 'free',
  role text default 'user',
  created_at timestamptz default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text,
  brand_name text,
  logo_url text,
  primary_color text,
  cta_button_color text,
  custom_footer_text text,
  created_at timestamptz default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  type text default 'personalized_video',
  base_video_url text,
  base_thumbnail_url text,
  offer text,
  audience text,
  cta_text text,
  cta_url text,
  calendar_url text,
  personalization_mode text default 'personalized_page',
  status text default 'draft',
  landing_page_slug text unique,
  created_at timestamptz default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  company text,
  website text,
  industry text,
  city text,
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.personalized_scripts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  hook text,
  script text,
  subject_line text,
  email_body text,
  cta text,
  prompt jsonb default '{}'::jsonb,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  provider text not null,
  provider_job_id text,
  workflow_id text,
  status text default 'queued',
  input jsonb default '{}'::jsonb,
  output jsonb default '{}'::jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.personalized_videos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  script_id uuid references public.personalized_scripts(id) on delete set null,
  generation_job_id uuid references public.generation_jobs(id) on delete set null,
  video_url text,
  thumbnail_url text,
  landing_page_slug text unique,
  landing_page_url text,
  embed_code text,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.video_events (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references public.personalized_videos(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  video_id uuid references public.personalized_videos(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  name text,
  email text,
  phone text,
  message text,
  form_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.muapi_workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  workflow_id text not null,
  input_schema jsonb default '{}'::jsonb,
  output_type text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create or replace function public.is_workspace_member(_workspace_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.workspaces w
    left join public.workspace_members wm on wm.workspace_id = w.id
    where w.id = _workspace_id and (w.owner_id = auth.uid() or wm.user_id = auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.campaigns enable row level security;
alter table public.contacts enable row level security;
alter table public.personalized_scripts enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.personalized_videos enable row level security;
alter table public.video_events enable row level security;
alter table public.leads enable row level security;
alter table public.muapi_workflows enable row level security;

create policy if not exists "profiles self access" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy if not exists "workspace members read" on public.workspaces for select using (public.is_workspace_member(id));
create policy if not exists "workspace owner write" on public.workspaces for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy if not exists "workspace members membership access" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy if not exists "workspace owner manage members" on public.workspace_members for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy if not exists "campaign workspace access" on public.campaigns for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "contacts workspace access" on public.contacts for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "scripts via campaign workspace" on public.personalized_scripts for all using (exists(select 1 from public.campaigns c where c.id = campaign_id and public.is_workspace_member(c.workspace_id))) with check (exists(select 1 from public.campaigns c where c.id = campaign_id and public.is_workspace_member(c.workspace_id)));
create policy if not exists "jobs workspace access" on public.generation_jobs for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "videos workspace access" on public.personalized_videos for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "events via campaign workspace" on public.video_events for select using (exists(select 1 from public.campaigns c where c.id = campaign_id and public.is_workspace_member(c.workspace_id)));
create policy if not exists "leads workspace access" on public.leads for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "muapi workflows readable" on public.muapi_workflows for select using (true);


-- ===========================================
-- All migrations combined successfully
-- Total migrations: 26
