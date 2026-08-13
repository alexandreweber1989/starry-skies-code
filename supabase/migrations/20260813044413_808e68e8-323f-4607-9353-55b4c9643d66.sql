-- Migration para suporte a notificações de emergência no Kids

-- 1. Tabela de notificações de emergência
CREATE TABLE IF NOT EXISTS public.kids_emergency_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.kids_sessions(id) ON DELETE CASCADE,
    child_id uuid REFERENCES public.kids_children(id) ON DELETE CASCADE,
    guardian_id uuid REFERENCES public.kids_guardians(id) ON DELETE CASCADE,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'recebido', 'confirmado', 'cancelado')),
    severity text NOT NULL DEFAULT 'media' CHECK (severity IN ('baixa', 'media', 'alta')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    confirmed_at timestamptz,
    acknowledged_by_guardian_id uuid
);

-- 2. Permissões (Grants)
GRANT SELECT, INSERT, UPDATE ON public.kids_emergency_alerts TO authenticated;
GRANT ALL ON public.kids_emergency_alerts TO service_role;

-- 3. RLS
ALTER TABLE public.kids_emergency_alerts ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins e Líderes Kids podem gerenciar alertas') THEN
        CREATE POLICY "Admins e Líderes Kids podem gerenciar alertas"
        ON public.kids_emergency_alerts
        FOR ALL
        TO authenticated
        USING (
            public.has_role(auth.uid(), 'admin_geral') OR 
            public.has_role(auth.uid(), 'admin_kids')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Pais podem ver alertas de seus filhos') THEN
        CREATE POLICY "Pais podem ver alertas de seus filhos"
        ON public.kids_emergency_alerts
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.kids_guardians g
                WHERE g.child_id = kids_emergency_alerts.child_id
                AND g.profile_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Pais podem confirmar recebimento') THEN
        CREATE POLICY "Pais podem confirmar recebimento"
        ON public.kids_emergency_alerts
        FOR UPDATE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.kids_guardians g
                WHERE g.child_id = kids_emergency_alerts.child_id
                AND g.profile_id = auth.uid()
            )
        )
        WITH CHECK (
            status IN ('recebido', 'confirmado')
        );
    END IF;
END $$;
