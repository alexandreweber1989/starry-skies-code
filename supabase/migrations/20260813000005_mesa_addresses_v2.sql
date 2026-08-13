-- Garantir que a tabela mesa_addresses existe e tem RLS correto
CREATE TABLE IF NOT EXISTS public.mesa_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesa_id UUID REFERENCES public.mesas(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL DEFAULT 'Principal',
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    complement TEXT,
    full_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.mesa_addresses ENABLE ROW LEVEL SECURITY;

-- Grants explícitos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesa_addresses TO authenticated;
GRANT ALL ON public.mesa_addresses TO service_role;

-- Limpar políticas antigas se houver
DROP POLICY IF EXISTS "Qualquer membro autenticado pode ver endereços" ON public.mesa_addresses;
DROP POLICY IF EXISTS "Admins e líderes podem gerenciar endereços" ON public.mesa_addresses;

-- Políticas
CREATE POLICY "Qualquer membro autenticado pode ver endereços"
    ON public.mesa_addresses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins e líderes podem gerenciar endereços"
    ON public.mesa_addresses FOR ALL
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        EXISTS (
            SELECT 1 FROM public.mesa_members 
            WHERE mesa_id = mesa_addresses.mesa_id 
            AND user_id = auth.uid() 
            AND role IN ('lider', 'apascentador', 'pastor')
        )
    );

-- Adicionar coluna mesa_address_id em events se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='mesa_address_id') THEN
        ALTER TABLE public.events ADD COLUMN mesa_address_id UUID REFERENCES public.mesa_addresses(id) ON DELETE SET NULL;
    END IF;
END $$;
