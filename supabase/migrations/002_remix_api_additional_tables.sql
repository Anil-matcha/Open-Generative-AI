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