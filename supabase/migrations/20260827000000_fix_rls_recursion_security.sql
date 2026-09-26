-- ============================================================================
-- RLS Policies Fix — Use SECURITY DEFINER functions to avoid infinite recursion
-- ============================================================================
-- PROBLEMA: Políticas com EXISTS correlacionado causam "infinite recursion detected in policy"
-- quando tabelas se referenciam mutuamente (redes ↔ mesas ↔ mesa_members).
-- SOLUÇÃO: Delegar checagem para funções SECURITY DEFINER (já existentes no banco):
--   can_view_mesa(mesa_id), can_view_rede(rede_id), has_role(user_id, role), has_ministry_role(user_id, ministry_id)
-- Estas funções não reavaliam RLS internamente, quebrando o ciclo.
-- ============================================================================

-- 1. Garantir RLS habilitado
ALTER TABLE public.mesa_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rede_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para mesa_members — usar can_view_mesa() em vez de EXISTS
DROP POLICY IF EXISTS "Members can view their own mesa members" ON public.mesa_members;
CREATE POLICY "Members can view their own mesa members" ON public.mesa_members
FOR SELECT TO authenticated
USING (
  public.can_view_mesa(mesa_id)
  OR public.has_role(auth.uid(), 'admin_geral')
);

-- 3. Políticas para rede_members — usar can_view_rede() em vez de EXISTS
DROP POLICY IF EXISTS "Members can view their own rede members" ON public.rede_members;
CREATE POLICY "Members can view their own rede members" ON public.rede_members
FOR SELECT TO authenticated
USING (
  public.can_view_rede(rede_id)
  OR public.has_role(auth.uid(), 'admin_geral')
);

-- 4. Políticas para ministry_members — usar has_ministry_role()
DROP POLICY IF EXISTS "Members can view their own ministry members" ON public.ministry_members;
CREATE POLICY "Members can view their own ministry members" ON public.ministry_members
FOR SELECT TO authenticated
USING (
  public.has_ministry_role(auth.uid(), ministry_id)
  OR public.has_role(auth.uid(), 'admin_geral')
  OR public.has_role(auth.uid(), 'admin_ministerio')
);

-- 5. Grants necessários
GRANT SELECT ON public.mesa_members TO authenticated;
GRANT SELECT ON public.rede_members TO authenticated;
GRANT SELECT ON public.ministry_members TO authenticated;

-- ============================================================================
-- NOTA: As funções SECURITY DEFINER abaixo já devem existir no banco (criadas em migrações anteriores).
-- Se não existirem, criar com migração separada. Exemplos de assinatura esperada:
--
-- CREATE OR REPLACE FUNCTION public.can_view_mesa(p_mesa_id uuid)
-- RETURNS boolean
-- LANGUAGE sql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM public.mesa_members
--     WHERE mesa_id = p_mesa_id AND user_id = auth.uid()
--   ) OR public.has_role(auth.uid(), 'admin_geral');
-- $$;
--
-- CREATE OR REPLACE FUNCTION public.can_view_rede(p_rede_id uuid)
-- RETURNS boolean
-- LANGUAGE sql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM public.rede_members
--     WHERE rede_id = p_rede_id AND user_id = auth.uid()
--   ) OR public.has_role(auth.uid(), 'admin_geral');
-- $$;
--
-- CREATE OR REPLACE FUNCTION public.has_ministry_role(p_user_id uuid, p_ministry_id uuid)
-- RETURNS boolean
-- LANGUAGE sql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM public.ministry_members
--     WHERE ministry_id = p_ministry_id AND user_id = p_user_id
--   );
-- $$;
-- ============================================================================