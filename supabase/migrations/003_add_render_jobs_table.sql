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