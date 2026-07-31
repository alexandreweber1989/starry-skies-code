-- Enum de função eclesiástica
CREATE TYPE public.church_function AS ENUM ('pastor','apascentador','lider','diacono','obreiro','membro');

-- IGREJAS
CREATE TABLE public.churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  city text,
  state text,
  address text,
  phone text,
  email text,
  lead_pastor text,
  is_headquarters boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.churches TO authenticated;
GRANT ALL ON public.churches TO service_role;

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "churches_select_authenticated" ON public.churches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "churches_admin_manage" ON public.churches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

CREATE TRIGGER churches_set_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MEMBROS DA REDE
CREATE TABLE public.rede_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id uuid NOT NULL REFERENCES public.redes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.church_function NOT NULL DEFAULT 'membro',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rede_id, user_id)
);

CREATE INDEX rede_members_rede_id_idx ON public.rede_members(rede_id);
CREATE INDEX rede_members_user_id_idx ON public.rede_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rede_members TO authenticated;
GRANT ALL ON public.rede_members TO service_role;

ALTER TABLE public.rede_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rede_members_select_authenticated" ON public.rede_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rede_members_admin_manage" ON public.rede_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

-- PAPEL NAS MESAS
ALTER TABLE public.mesa_members
  ADD COLUMN IF NOT EXISTS role public.church_function NOT NULL DEFAULT 'membro';

-- FICHA DO MEMBRO
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS church_function public.church_function NOT NULL DEFAULT 'membro';

CREATE INDEX IF NOT EXISTS profiles_church_id_idx ON public.profiles(church_id);

-- INSTRUMENTOS NA EQUIPE DE LOUVOR
ALTER TABLE public.worship_team_members
  ADD COLUMN IF NOT EXISTS instruments text[] NOT NULL DEFAULT '{}';
