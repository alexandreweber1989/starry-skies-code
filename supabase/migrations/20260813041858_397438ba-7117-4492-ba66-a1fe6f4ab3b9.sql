
-- Garantir que a tabela de notícias exista com os campos corretos
CREATE TABLE IF NOT EXISTS public.news (
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

-- Habilitar RLS e Grants
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.news TO anon, authenticated;
GRANT ALL ON public.news TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública de notícias') THEN
        CREATE POLICY "Leitura pública de notícias" ON public.news FOR SELECT USING (is_published = true OR (auth.role() = 'authenticated' AND public.has_role(auth.uid(), 'admin_geral')));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins gerenciam notícias') THEN
        CREATE POLICY "Admins gerenciam notícias" ON public.news FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'));
    END IF;
END $$;
