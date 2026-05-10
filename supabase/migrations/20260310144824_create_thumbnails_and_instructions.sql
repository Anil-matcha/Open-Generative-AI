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

DROP POLICY IF EXISTS "Authenticated users can read thumbnails" ON thumbnails;
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

DROP POLICY IF EXISTS "Authenticated users can read instructions" ON instructions;
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
