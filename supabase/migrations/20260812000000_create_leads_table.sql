CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    profile TEXT NOT NULL,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    suggested_mesa TEXT,
    status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'em_atendimento', 'vinculado', 'arquivado'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
GRANT INSERT ON public.leads TO anon; -- Permitir cadastro de leads via landing page

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all leads" ON public.leads
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin_geral'));

CREATE POLICY "Anyone can insert leads" ON public.leads
    FOR INSERT TO anon
    WITH CHECK (true);
