-- Create tables for Media and Social Action modules
CREATE TABLE IF NOT EXISTS public.media_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category text NOT NULL CHECK (category IN ('culto', 'evento', 'template', 'identidade')),
    file_url text NOT NULL,
    thumbnail_url text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.media_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id uuid REFERENCES auth.users(id) NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    deadline timestamptz,
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_producao', 'concluido', 'cancelado')),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_assistance_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    goal_type text NOT NULL CHECK (goal_type IN ('alimento', 'vestuario', 'financeiro', 'outro')),
    goal_target numeric,
    goal_current numeric DEFAULT 0,
    status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'finalizada')),
    created_at timestamptz DEFAULT now()
);

-- Grants
GRANT SELECT ON public.media_assets TO authenticated;
GRANT SELECT, INSERT ON public.media_requests TO authenticated;
GRANT SELECT ON public.social_assistance_campaigns TO authenticated;

GRANT ALL ON public.media_assets TO service_role;
GRANT ALL ON public.media_requests TO service_role;
GRANT ALL ON public.social_assistance_campaigns TO service_role;

-- RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_assistance_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer autenticado vê mídias" ON public.media_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gerenciam mídias" ON public.media_assets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin_geral'));

CREATE POLICY "Membros veem seus pedidos de mídia" ON public.media_requests FOR SELECT TO authenticated USING (requester_id = auth.uid() OR has_role(auth.uid(), 'admin_geral'));
CREATE POLICY "Membros criam pedidos de mídia" ON public.media_requests FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Qualquer autenticado vê campanhas" ON public.social_assistance_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gerenciam campanhas" ON public.social_assistance_campaigns FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin_geral'));
