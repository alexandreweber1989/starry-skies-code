DO $$ 
BEGIN
    -- 1. Políticas de Storage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Líderes Kids podem ver documentos') THEN
        CREATE POLICY "Líderes Kids podem ver documentos"
        ON storage.objects FOR SELECT TO authenticated
        USING (bucket_id = 'kids-documents-v2' AND (public.has_role(auth.uid(), 'admin_geral') OR public.has_role(auth.uid(), 'admin_kids')));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Líderes Kids podem gerenciar documentos') THEN
        CREATE POLICY "Líderes Kids podem gerenciar documentos"
        ON storage.objects FOR ALL TO authenticated
        USING (bucket_id = 'kids-documents-v2' AND (public.has_role(auth.uid(), 'admin_geral') OR public.has_role(auth.uid(), 'admin_kids')));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Visitantes podem fazer upload de documentos') THEN
        CREATE POLICY "Visitantes podem fazer upload de documentos"
        ON storage.objects FOR INSERT TO anon
        WITH CHECK (bucket_id = 'kids-documents-v2');
    END IF;

    -- 2. Sistema de Notificações Push (Tokens)
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_push_tokens' AND schemaname = 'public') THEN
        CREATE TABLE public.user_push_tokens (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            token text NOT NULL,
            device_type text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            UNIQUE(user_id, token)
        );
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_tokens TO authenticated;
        GRANT ALL ON public.user_push_tokens TO service_role;
        ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários gerenciam seus próprios tokens' AND tablename = 'user_push_tokens') THEN
        CREATE POLICY "Usuários gerenciam seus próprios tokens"
        ON public.user_push_tokens
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    -- 3. Histórico de Notificações
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications_history' AND schemaname = 'public') THEN
        CREATE TABLE public.notifications_history (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            title text NOT NULL,
            body text NOT NULL,
            type text NOT NULL,
            status text DEFAULT 'pendente',
            metadata jsonb DEFAULT '{}'::jsonb,
            created_at timestamptz DEFAULT now()
        );
        GRANT SELECT, INSERT ON public.notifications_history TO authenticated;
        GRANT ALL ON public.notifications_history TO service_role;
        ALTER TABLE public.notifications_history ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários veem suas próprias notificações' AND tablename = 'notifications_history') THEN
        CREATE POLICY "Usuários veem suas próprias notificações"
        ON public.notifications_history
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    -- 4. Atualizar kids_visitor_requests para incluir document_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kids_visitor_requests' AND column_name='document_url') THEN
        ALTER TABLE public.kids_visitor_requests ADD COLUMN document_url text;
    END IF;
END $$;
