-- VFX Generations Schema
-- AI VFX Studio video generations storage

CREATE TABLE IF NOT EXISTS public.vfx_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  prompt text NOT NULL,
  image_url text,
  effect_name text,
  aspect_ratio text DEFAULT '9:16',
  resolution text DEFAULT '480p',
  quality text DEFAULT 'medium',
  duration integer DEFAULT 5,
  status text DEFAULT 'completed',
  video_url text,
  provider text DEFAULT 'muapi',
  model text DEFAULT 'generate_wan_ai_effects',
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vfx_generations_user_id ON public.vfx_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_vfx_generations_status ON public.vfx_generations(status);
CREATE INDEX IF NOT EXISTS idx_vfx_generations_created_at ON public.vfx_generations(created_at DESC);

-- Table RLS policies
ALTER TABLE public.vfx_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their vfx generations"
ON public.vfx_generations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their vfx generations"
ON public.vfx_generations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their vfx generations"
ON public.vfx_generations FOR UPDATE
TO authenticated
USING (user_id = auth.uid());