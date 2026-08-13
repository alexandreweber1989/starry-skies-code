-- "Pregações": registro das mensagens de domingo para gerar artes, infográficos
-- e mapas mentais bonitos e compartilháveis. Área exclusiva da administração.

CREATE TABLE public.sermons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    theme TEXT,
    preacher TEXT,
    preached_on DATE,
    base_verse TEXT,
    summary TEXT,
    points JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{ "title": "...", "detail": "..." }]
    tags TEXT[] NOT NULL DEFAULT '{}',
    template TEXT NOT NULL DEFAULT 'mapa'
        CHECK (template IN ('mapa', 'infografico', 'arte')),
    dark BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sermons_preached_on_idx ON public.sermons (preached_on DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sermons TO authenticated;
GRANT ALL ON public.sermons TO service_role;

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- Exclusivo da administração geral: só o admin cria, edita e vê as pregações.
CREATE POLICY "Admins manage sermons" ON public.sermons
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin_geral'))
    WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

CREATE TRIGGER sermons_set_updated_at
    BEFORE UPDATE ON public.sermons
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
