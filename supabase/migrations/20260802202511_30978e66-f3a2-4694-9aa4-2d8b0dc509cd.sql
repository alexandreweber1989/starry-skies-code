-- 1. Criar enum para status/títulos ministeriais
CREATE TYPE public.ministerial_status AS ENUM ('membro', 'lider', 'apasc', 'pra', 'pr');

-- 2. Adicionar coluna na tabela profiles
ALTER TABLE public.profiles ADD COLUMN ministerial_status public.ministerial_status DEFAULT 'membro';

-- 3. Atualizar alguns membros fictícios para papéis de liderança
DO $$
DECLARE
    profile_record RECORD;
    counter INT := 0;
BEGIN
    FOR profile_record IN (SELECT id FROM public.profiles WHERE email != 'alew123@gmail.com' LIMIT 20) LOOP
        counter := counter + 1;
        IF counter <= 2 THEN
            UPDATE public.profiles SET ministerial_status = 'pr' WHERE id = profile_record.id;
        ELSIF counter <= 4 THEN
            UPDATE public.profiles SET ministerial_status = 'pra' WHERE id = profile_record.id;
        ELSIF counter <= 8 THEN
            UPDATE public.profiles SET ministerial_status = 'apasc' WHERE id = profile_record.id;
        ELSIF counter <= 15 THEN
            UPDATE public.profiles SET ministerial_status = 'lider' WHERE id = profile_record.id;
        END IF;
    END LOOP;
END $$;

-- 4. Garantir que as tabelas de suporte a RBAC continuem funcionando
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
