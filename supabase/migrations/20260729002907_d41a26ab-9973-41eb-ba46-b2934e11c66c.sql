
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin_geral', 'admin_ministerio', 'lider_mesa', 'membro');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  birth_date DATE,
  address TEXT,
  bio TEXT,
  is_baptized BOOLEAN DEFAULT false,
  member_since DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  ministry_id UUID,
  mesa_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, ministry_id, mesa_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função has_role (SECURITY DEFINER, sem RLS recursivo)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_ministry_role(_user_id UUID, _ministry_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND ((role = 'admin_geral') OR (role = 'admin_ministerio' AND ministry_id = _ministry_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.has_mesa_role(_user_id UUID, _mesa_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND ((role = 'admin_geral') OR (role = 'lider_mesa' AND mesa_id = _mesa_id))
  );
$$;

-- Ninguém ainda: função para o primeiro usuário reivindicar admin_geral
CREATE OR REPLACE FUNCTION public.claim_first_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin_geral') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin_geral')
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  RETURN false;
END; $$;

-- Trigger: cria profile automaticamente ao criar user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Também cadastra como 'membro' por padrão
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'membro') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger updated_at genérico
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Políticas profiles
CREATE POLICY "profiles_select_all_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin_geral')) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin_geral') OR auth.uid() = id);
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'));

-- Políticas user_roles
CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_geral'));
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral')) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

-- ============ MINISTRIES ============
CREATE TABLE public.ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  meeting_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ministries TO authenticated;
GRANT ALL ON public.ministries TO service_role;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER ministries_updated_at BEFORE UPDATE ON public.ministries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "ministries_select_all" ON public.ministries FOR SELECT TO authenticated USING (true);
CREATE POLICY "ministries_insert_admin" ON public.ministries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));
CREATE POLICY "ministries_update_admin_or_ministry_admin" ON public.ministries FOR UPDATE TO authenticated
  USING (public.has_ministry_role(auth.uid(), id))
  WITH CHECK (public.has_ministry_role(auth.uid(), id));
CREATE POLICY "ministries_delete_admin" ON public.ministries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'));

-- ============ MINISTRY_MEMBERS ============
CREATE TABLE public.ministry_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ministry_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ministry_members TO authenticated;
GRANT ALL ON public.ministry_members TO service_role;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ministry_members_select_all" ON public.ministry_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "ministry_members_manage" ON public.ministry_members FOR ALL TO authenticated
  USING (public.has_ministry_role(auth.uid(), ministry_id))
  WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));

-- ============ REDES ============
CREATE TABLE public.redes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.redes TO authenticated;
GRANT ALL ON public.redes TO service_role;
ALTER TABLE public.redes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER redes_updated_at BEFORE UPDATE ON public.redes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "redes_select_all" ON public.redes FOR SELECT TO authenticated USING (true);
CREATE POLICY "redes_admin_all" ON public.redes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

-- ============ MESAS ============
CREATE TABLE public.mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id UUID REFERENCES public.redes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  meeting_day TEXT,
  meeting_time TEXT,
  meeting_location TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesas TO authenticated;
GRANT ALL ON public.mesas TO service_role;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER mesas_updated_at BEFORE UPDATE ON public.mesas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "mesas_select_all" ON public.mesas FOR SELECT TO authenticated USING (true);
CREATE POLICY "mesas_insert_admin" ON public.mesas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));
CREATE POLICY "mesas_update" ON public.mesas FOR UPDATE TO authenticated
  USING (public.has_mesa_role(auth.uid(), id))
  WITH CHECK (public.has_mesa_role(auth.uid(), id));
CREATE POLICY "mesas_delete_admin" ON public.mesas FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'));

-- ============ MESA_MEMBERS ============
CREATE TABLE public.mesa_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id UUID NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mesa_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesa_members TO authenticated;
GRANT ALL ON public.mesa_members TO service_role;
ALTER TABLE public.mesa_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mesa_members_select_all" ON public.mesa_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "mesa_members_manage" ON public.mesa_members FOR ALL TO authenticated
  USING (public.has_mesa_role(auth.uid(), mesa_id))
  WITH CHECK (public.has_mesa_role(auth.uid(), mesa_id));

-- ============ SEED — 9 ministérios + 4 redes + 3 mesas ============
INSERT INTO public.ministries (slug, name, description, icon, color, meeting_info) VALUES
  ('louvor', 'Louvor', 'Ministério de música e adoração — vocais e instrumentos.', 'Music', '#B45309', 'Ensaios definidos pelo ministro escalado'),
  ('midia', 'Mídia', 'Câmera, projeção, transmissão, foto, edição e artes.', 'Camera', '#0F766E', 'Domingos e eventos especiais'),
  ('danca', 'Dança', 'Coreografia e adoração através da dança.', 'Sparkles', '#9333EA', 'Ensaios semanais + apresentações'),
  ('kids', 'Kids', 'Ministério infantil com check-in/out seguro.', 'Baby', '#EA580C', 'Durante os cultos de domingo'),
  ('jovens', 'Jovens', 'Ministério dos jovens da igreja.', 'Users', '#2563EB', 'Encontros semanais'),
  ('adolescentes', 'Adolescentes', 'Ministério dos adolescentes (7-15 anos).', 'Users2', '#DB2777', 'Encontros semanais'),
  ('mulheres', 'Mulheres — Rede Sabaoth', 'Rede de mulheres da igreja, organizada em Mesas.', 'Heart', '#BE185D', 'Encontros por Mesa e da Rede'),
  ('homens', 'Homens — Rede Zadoque', 'Rede de homens da igreja, organizada em Mesas.', 'Shield', '#1E40AF', 'Encontros por Mesa e da Rede'),
  ('atos-de-amor', 'Atos de Amor', 'Projeto social: arrecadação e distribuição de cestas às famílias necessitadas.', 'HandHeart', '#059669', 'Campanha mensal fechada na ceia (1º domingo)');

INSERT INTO public.redes (slug, name, description, target_audience, color) VALUES
  ('sabaoth', 'Rede Sabaoth', 'Rede das mulheres da Igreja Batista Atos.', 'Mulheres', '#BE185D'),
  ('zadoque', 'Rede Zadoque', 'Rede dos homens da Igreja Batista Atos.', 'Homens', '#1E40AF'),
  ('rede-jovens', 'Rede de Jovens', 'Rede dos jovens da igreja.', 'Jovens (16+ anos)', '#2563EB'),
  ('rede-adolescentes', 'Rede de Adolescentes', 'Rede dos adolescentes.', 'Adolescentes (7-15 anos)', '#DB2777');

-- 3 mesas de exemplo
INSERT INTO public.mesas (rede_id, name, description, meeting_day, meeting_time, meeting_location) VALUES
  ((SELECT id FROM public.redes WHERE slug = 'sabaoth'), 'Mesa Sabaoth 1', 'Primeira Mesa da Rede Sabaoth.', 'Quarta-feira', '20:00', 'A definir'),
  ((SELECT id FROM public.redes WHERE slug = 'zadoque'), 'Mesa Zadoque 1', 'Primeira Mesa da Rede Zadoque.', 'Terça-feira', '20:00', 'A definir'),
  ((SELECT id FROM public.redes WHERE slug = 'zadoque'), 'Mesa Zadoque 2', 'Segunda Mesa da Rede Zadoque.', 'Quinta-feira', '20:00', 'A definir');
