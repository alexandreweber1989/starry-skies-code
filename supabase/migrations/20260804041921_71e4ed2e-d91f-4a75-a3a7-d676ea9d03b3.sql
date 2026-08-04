-- Adicionar photo_url aos responsáveis para conferência visual
ALTER TABLE public.kids_guardians ADD COLUMN photo_url TEXT;

-- Garantir que a coluna photo_url exista na tabela de crianças
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kids_children' AND column_name='photo_url') THEN
        ALTER TABLE public.kids_children ADD COLUMN photo_url TEXT;
    END IF;
END $$;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_children TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_guardians TO authenticated;
GRANT ALL ON public.kids_children TO service_role;
GRANT ALL ON public.kids_guardians TO service_role;
