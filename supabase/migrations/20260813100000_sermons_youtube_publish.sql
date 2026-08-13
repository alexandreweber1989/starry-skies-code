-- Pregações: link do YouTube, capa e publicação no feed de Notícias.

ALTER TABLE public.sermons
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS news_id uuid REFERENCES public.news(id) ON DELETE SET NULL;

-- Bucket PÚBLICO para as artes geradas (para aparecerem no feed com URL direta
-- e serem baixadas para as redes sociais).
INSERT INTO storage.buckets (id, name, public)
VALUES ('sermon-arts', 'sermon-arts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "sermon_arts_read_public" ON storage.objects;
DROP POLICY IF EXISTS "sermon_arts_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "sermon_arts_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "sermon_arts_delete_auth" ON storage.objects;

CREATE POLICY "sermon_arts_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'sermon-arts');
CREATE POLICY "sermon_arts_insert_auth" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sermon-arts');
CREATE POLICY "sermon_arts_update_auth" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'sermon-arts') WITH CHECK (bucket_id = 'sermon-arts');
CREATE POLICY "sermon_arts_delete_auth" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'sermon-arts');
