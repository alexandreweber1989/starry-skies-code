-- "Cuidado da Semana": registro pessoal do líder de mesa sobre com quem já conversou
-- na semana. Não é controle de presença nem ranking — é uma ferramenta de cuidado,
-- privada de cada líder, para fortalecer o vínculo com seus liderados.

CREATE TABLE public.leader_touchpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mesa_id UUID NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    channel TEXT NOT NULL DEFAULT 'presencial'
        CHECK (channel IN ('presencial', 'ligacao', 'whatsapp', 'mensagem', 'visita', 'oracao')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Um único "toque" por líder / membro / semana. Reabrir apenas atualiza canal e nota.
CREATE UNIQUE INDEX leader_touchpoints_unique_week
    ON public.leader_touchpoints (leader_id, member_id, week_start);

-- Consulta principal: os toques de um líder numa dada semana.
CREATE INDEX leader_touchpoints_leader_week
    ON public.leader_touchpoints (leader_id, week_start);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leader_touchpoints TO authenticated;
GRANT ALL ON public.leader_touchpoints TO service_role;

ALTER TABLE public.leader_touchpoints ENABLE ROW LEVEL SECURITY;

-- O líder gerencia apenas os próprios registros de cuidado.
CREATE POLICY "Leaders manage own touchpoints" ON public.leader_touchpoints
    FOR ALL TO authenticated
    USING (auth.uid() = leader_id)
    WITH CHECK (auth.uid() = leader_id);

-- A liderança acima (equipe pastoral e admin geral) pode acompanhar o cuidado,
-- sem editar os registros de outro líder.
CREATE POLICY "Leadership can view touchpoints" ON public.leader_touchpoints
    FOR SELECT TO authenticated
    USING (public.is_pastoral(auth.uid()));
