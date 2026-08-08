-- Primeiro, garantimos que as políticas de RLS existam para restringir o acesso no banco de dados.
-- Mas como o frontend faz queries diretas e o usuário quer uma experiência filtrada,
-- vamos ajustar as queries no frontend para respeitar a hierarquia.

-- No entanto, vamos garantir que o banco tenha RLS habilitado e políticas básicas.
ALTER TABLE public.mesa_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rede_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;

-- Políticas para mesa_members (exemplo: membros só veem sua própria mesa)
DROP POLICY IF EXISTS "Members can view their own mesa members" ON public.mesa_members;
CREATE POLICY "Members can view their own mesa members" ON public.mesa_members
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mesa_members mm 
    WHERE mm.mesa_id = mesa_members.mesa_id 
    AND mm.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin_geral')
);

-- Políticas para rede_members
DROP POLICY IF EXISTS "Members can view their own rede members" ON public.rede_members;
CREATE POLICY "Members can view their own rede members" ON public.rede_members
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rede_members rm 
    WHERE rm.rede_id = rede_members.rede_id 
    AND rm.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin_geral')
);

-- Políticas para ministry_members
DROP POLICY IF EXISTS "Members can view their own ministry members" ON public.ministry_members;
CREATE POLICY "Members can view their own ministry members" ON public.ministry_members
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ministry_members mim 
    WHERE mim.ministry_id = ministry_members.ministry_id 
    AND mim.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin_geral')
);

GRANT SELECT ON public.mesa_members TO authenticated;
GRANT SELECT ON public.rede_members TO authenticated;
GRANT SELECT ON public.ministry_members TO authenticated;
