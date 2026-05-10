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

DROP POLICY IF EXISTS "Allow public read access on uploads" ON storage.objects;
CREATE POLICY "Allow public read access on uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
CREATE POLICY "Allow anonymous uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Allow anonymous delete on uploads" ON storage.objects;
CREATE POLICY "Allow anonymous delete on uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads');
