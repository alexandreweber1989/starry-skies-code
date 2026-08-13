-- Correção definitiva da recursão infinita no RLS de "redes".
--
-- Causa: a política de SELECT de `redes` consultava `mesas`, cuja política
-- consultava `mesa_members`, cujas políticas voltavam a consultar `redes` —
-- um ciclo infinito ("infinite recursion detected in policy for relation redes").
--
-- Solução: mover as checagens de visibilidade para funções SECURITY DEFINER,
-- que executam com privilégios do dono e NÃO reavaliam o RLS das tabelas que
-- consultam — quebrando o ciclo. Em seguida, recriar um conjunto de políticas
-- limpo e não-recursivo para redes, mesas e seus integrantes.

-- 1) Funções auxiliares (SECURITY DEFINER = não disparam RLS por dentro).
CREATE OR REPLACE FUNCTION public.is_mesa_member(_mesa_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mesa_members mm
    WHERE mm.mesa_id = _mesa_id AND mm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_rede_member(_rede_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rede_members rm
    WHERE rm.rede_id = _rede_id AND rm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_rede(_rede_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin_geral')
      OR EXISTS (
        SELECT 1 FROM public.rede_members rm
        WHERE rm.rede_id = _rede_id AND rm.user_id = _user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.mesas m
        JOIN public.mesa_members mm ON mm.mesa_id = m.id
        WHERE m.rede_id = _rede_id AND mm.user_id = _user_id
      );
$$;

CREATE OR REPLACE FUNCTION public.can_view_mesa(_mesa_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin_geral')
      OR EXISTS (
        SELECT 1 FROM public.mesa_members mm
        WHERE mm.mesa_id = _mesa_id AND mm.user_id = _user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.mesas m
        JOIN public.rede_members rm ON rm.rede_id = m.rede_id
        WHERE m.id = _mesa_id AND rm.user_id = _user_id
      );
$$;

GRANT EXECUTE ON FUNCTION public.is_mesa_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_rede_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_rede(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_mesa(uuid, uuid) TO authenticated;

-- 2) Remove TODAS as políticas atuais dessas quatro tabelas (elimina qualquer
--    política recursiva remanescente, mesmo as criadas fora deste repositório).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('redes', 'mesas', 'rede_members', 'mesa_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE public.redes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rede_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_members ENABLE ROW LEVEL SECURITY;

-- 3) Conjunto limpo e não-recursivo.

-- Redes
CREATE POLICY "redes_select" ON public.redes
  FOR SELECT TO authenticated
  USING (public.can_view_rede(id, auth.uid()));
CREATE POLICY "redes_admin_manage" ON public.redes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

-- Mesas
CREATE POLICY "mesas_select" ON public.mesas
  FOR SELECT TO authenticated
  USING (public.can_view_mesa(id, auth.uid()));
CREATE POLICY "mesas_admin_manage" ON public.mesas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

-- Integrantes de rede
CREATE POLICY "rede_members_select" ON public.rede_members
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_geral')
    OR user_id = auth.uid()
    OR public.is_rede_member(rede_id, auth.uid())
  );
CREATE POLICY "rede_members_admin_manage" ON public.rede_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

-- Integrantes de mesa (o líder da mesa gerencia os seus, via has_mesa_role)
CREATE POLICY "mesa_members_select" ON public.mesa_members
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_geral')
    OR user_id = auth.uid()
    OR public.is_mesa_member(mesa_id, auth.uid())
  );
CREATE POLICY "mesa_members_manage" ON public.mesa_members
  FOR ALL TO authenticated
  USING (public.has_mesa_role(auth.uid(), mesa_id))
  WITH CHECK (public.has_mesa_role(auth.uid(), mesa_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.redes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rede_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesa_members TO authenticated;
