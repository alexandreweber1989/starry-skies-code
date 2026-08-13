
-- Tabelas para o módulo de Louvor (Seção 3.1)

-- 1. Músicas (Repertório)
CREATE TABLE public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT,
    original_key TEXT,
    bpm INTEGER,
    duration_seconds INTEGER,
    lyrics TEXT,
    youtube_url TEXT,
    spotify_url TEXT,
    chords_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Setlists (Listas de músicas para cultos)
CREATE TABLE public.setlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    worship_schedule_id UUID REFERENCES public.worship_schedules(id) ON DELETE SET NULL,
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Músicas do Setlist (Relação muitos-para-muitos com ordem)
CREATE TABLE public.setlist_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    key_override TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(setlist_id, song_id),
    UNIQUE(setlist_id, position)
);

-- 4. Notícias (Seção 3.4)
CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    published_at TIMESTAMPTZ DEFAULT now(),
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    author_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.songs TO authenticated;
GRANT ALL ON public.songs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.setlists TO authenticated;
GRANT ALL ON public.setlists TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.setlist_songs TO authenticated;
GRANT ALL ON public.setlist_songs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
GRANT SELECT ON public.news TO anon;

-- Policies

-- Songs: Todos membros autenticados podem ver, apenas admins podem editar
CREATE POLICY "Qualquer membro vê músicas" ON public.songs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins editam músicas" ON public.songs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin_geral') OR public.has_role(auth.uid(), 'admin_ministerio'));

-- Setlists: Todos membros podem ver publicados, admins editam
CREATE POLICY "Qualquer membro vê setlists publicados" ON public.setlists FOR SELECT TO authenticated USING (status = 'published' OR public.has_role(auth.uid(), 'admin_geral') OR public.has_role(auth.uid(), 'admin_ministerio'));
CREATE POLICY "Admins gerenciam setlists" ON public.setlists FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin_geral') OR public.has_role(auth.uid(), 'admin_ministerio'));

-- Setlist Songs: Segue a política da setlist pai
CREATE POLICY "Qualquer membro vê músicas do setlist" ON public.setlist_songs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gerenciam músicas do setlist" ON public.setlist_songs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.setlists s WHERE s.id = setlist_id AND (public.has_role(auth.uid(), 'admin_geral') OR public.has_role(auth.uid(), 'admin_ministerio'))));

-- News: Público lê publicados, admins editam
CREATE POLICY "Leitura pública de notícias" ON public.news FOR SELECT USING (is_published = true OR (auth.role() = 'authenticated' AND public.has_role(auth.uid(), 'admin_geral')));
CREATE POLICY "Admins gerenciam notícias" ON public.news FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'));
