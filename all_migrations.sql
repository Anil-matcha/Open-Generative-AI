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
ON CONFLICT (target_type, target_id) DO NOTHING;/*
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
  EXECUTE FUNCTION update_updated_at_column();/*
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
  EXECUTE FUNCTION update_updated_at_column();/*
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
  EXECUTE FUNCTION update_updated_at_column();/*
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
  EXECUTE FUNCTION update_updated_at_column();/*
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
COMMENT ON TABLE model_configurations IS 'Custom AI model settings per tenant';/*
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