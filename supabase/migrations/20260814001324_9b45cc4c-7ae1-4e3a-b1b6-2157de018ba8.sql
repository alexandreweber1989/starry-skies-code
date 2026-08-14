-- Update church_function enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'church_function' AND e.enumlabel = 'lider_mesa') THEN
        ALTER TYPE church_function ADD VALUE 'lider_mesa' AFTER 'membro';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'church_function' AND e.enumlabel = 'lider_rede') THEN
        ALTER TYPE church_function ADD VALUE 'lider_rede' AFTER 'lider_mesa';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'church_function' AND e.enumlabel = 'lider_ministerio') THEN
        ALTER TYPE church_function ADD VALUE 'lider_ministerio' AFTER 'lider_rede';
    END IF;
END
$$;

-- Fix mesa_members relationship to profiles
ALTER TABLE public.mesa_members
DROP CONSTRAINT IF EXISTS mesa_members_user_id_fkey;

ALTER TABLE public.mesa_members
ADD CONSTRAINT mesa_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also fix rede_members just in case (already points to profiles, but let's be sure)
ALTER TABLE public.rede_members
DROP CONSTRAINT IF EXISTS rede_members_user_id_fkey;

ALTER TABLE public.rede_members
ADD CONSTRAINT rede_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
