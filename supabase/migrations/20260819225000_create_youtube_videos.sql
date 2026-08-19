CREATE TABLE public.youtube_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    youtube_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    thumbnail_url TEXT,
    type TEXT NOT NULL CHECK (type IN ('service', 'podcast')),
    url TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.youtube_videos TO authenticated;
GRANT ALL ON public.youtube_videos TO service_role;

ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view youtube videos"
ON public.youtube_videos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage youtube videos"
ON public.youtube_videos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin_geral'));
