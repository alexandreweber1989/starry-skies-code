-- Correção de recursão infinita na política RLS de rede_members
-- A recursão ocorre quando uma política para SELECT na tabela X tenta consultar a própria tabela X, 
-- disparando a mesma política repetidamente.

-- 1. Remover políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "Hierarquia Integrantes Rede" ON public.rede_members;
DROP POLICY IF EXISTS "Membros visualizam integrantes da própria rede" ON public.rede_members;
DROP POLICY IF EXISTS "rede_members_select_authenticated" ON public.rede_members;

-- 2. Criar novas políticas seguras
-- Permite que administradores vejam tudo (has_role usa SECURITY DEFINER, então é seguro)
CREATE POLICY "Admins podem ver todos os membros de rede"
ON public.rede_members
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin_geral'));

-- Permite que usuários vejam seu próprio vínculo com uma rede
CREATE POLICY "Usuários podem ver seus próprios vínculos de rede"
ON public.rede_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Permite que líderes/pastores vejam os membros das redes que eles lideram
CREATE POLICY "Líderes podem ver membros das redes que gerenciam"
ON public.rede_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.redes r
    WHERE r.id = public.rede_members.rede_id
    AND public.has_role(auth.uid(), 'admin_geral')
  )
);

-- Garantir acesso total ao service_role
GRANT ALL ON public.rede_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rede_members TO authenticated;

-- Repetir para mesa_members para evitar o mesmo erro futuro
DROP POLICY IF EXISTS "Hierarquia Integrantes Mesa" ON public.mesa_members;
DROP POLICY IF EXISTS "Membros visualizam integrantes da própria mesa" ON public.mesa_members;

CREATE POLICY "Admins podem ver todos os membros de mesa"
ON public.mesa_members
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin_geral'));

CREATE POLICY "Usuários podem ver seus próprios vínculos de mesa"
ON public.mesa_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());