-- 1) Limpeza total de políticas para evitar conflitos de recursão
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

-- 2) Garantir que as funções auxiliares sejam SECURITY DEFINER (não disparam RLS)
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

CREATE OR REPLACE FUNCTION public.is_rede_member(_rede_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rede_members rm
    WHERE rm.rede_id = _rede_id AND rm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_mesa_member(_mesa_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mesa_members mm
    WHERE mm.mesa_id = _mesa_id AND mm.user_id = _user_id
  );
$$;

-- 3) Recriar políticas de forma limpa e não recursiva

-- REDES
CREATE POLICY "redes_select" ON public.redes FOR SELECT TO authenticated
  USING (public.can_view_rede(id, auth.uid()));

CREATE POLICY "redes_admin_manage" ON public.redes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

-- MESAS
CREATE POLICY "mesas_select" ON public.mesas FOR SELECT TO authenticated
  USING (public.can_view_mesa(id, auth.uid()));

CREATE POLICY "mesas_admin_manage" ON public.mesas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

-- REDE_MEMBERS
CREATE POLICY "rede_members_select" ON public.rede_members FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_geral')
    OR user_id = auth.uid()
    OR public.is_rede_member(rede_id, auth.uid())
  );

CREATE POLICY "rede_members_admin_manage" ON public.rede_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

-- MESA_MEMBERS
CREATE POLICY "mesa_members_select" ON public.mesa_members FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_geral')
    OR user_id = auth.uid()
    OR public.is_mesa_member(mesa_id, auth.uid())
  );

CREATE POLICY "mesa_members_manage" ON public.mesa_members FOR ALL TO authenticated
  USING (public.has_mesa_role(auth.uid(), mesa_id))
  WITH CHECK (public.has_mesa_role(auth.uid(), mesa_id));

-- 4) Garantir permissões
GRANT ALL ON public.redes TO authenticated, service_role;
GRANT ALL ON public.mesas TO authenticated, service_role;
GRANT ALL ON public.rede_members TO authenticated, service_role;
GRANT ALL ON public.mesa_members TO authenticated, service_role;
