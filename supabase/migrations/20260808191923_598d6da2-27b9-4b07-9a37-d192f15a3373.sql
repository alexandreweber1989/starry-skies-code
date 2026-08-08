-- Refinamento da Hierarquia de Acesso no Banco de Dados (RLS)

-- 1. Redes: Membros só veem redes que participam (diretamente ou via mesas vinculadas)
ALTER TABLE public.redes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hierarquia Redes" ON public.redes;
CREATE POLICY "Hierarquia Redes" ON public.redes
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_geral') OR
  EXISTS (
    SELECT 1 FROM public.rede_members rm 
    WHERE rm.rede_id = redes.id AND rm.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.mesas m
    JOIN public.mesa_members mm ON mm.mesa_id = m.id
    WHERE m.rede_id = redes.id AND mm.user_id = auth.uid()
  )
);

-- 2. Mesas: Membros só veem mesas que participam
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hierarquia Mesas" ON public.mesas;
CREATE POLICY "Hierarquia Mesas" ON public.mesas
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_geral') OR
  EXISTS (
    SELECT 1 FROM public.mesa_members mm 
    WHERE mm.mesa_id = mesas.id AND mm.user_id = auth.uid()
  )
);

-- 3. Integrantes de Mesa: Visibilidade restrita aos membros da mesma mesa
ALTER TABLE public.mesa_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hierarquia Integrantes Mesa" ON public.mesa_members;
CREATE POLICY "Hierarquia Integrantes Mesa" ON public.mesa_members
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_geral') OR
  EXISTS (
    SELECT 1 FROM public.mesa_members mm_self 
    WHERE mm_self.mesa_id = mesa_members.mesa_id AND mm_self.user_id = auth.uid()
  )
);

-- 4. Integrantes de Rede: Visibilidade restrita aos membros da mesma rede
ALTER TABLE public.rede_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hierarquia Integrantes Rede" ON public.rede_members;
CREATE POLICY "Hierarquia Integrantes Rede" ON public.rede_members
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_geral') OR
  EXISTS (
    SELECT 1 FROM public.rede_members rm_self 
    WHERE rm_self.rede_id = rede_members.rede_id AND rm_self.user_id = auth.uid()
  )
);

-- 5. Ministérios: Visibilidade restrita aos servos do ministério
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hierarquia Ministérios" ON public.ministries;
CREATE POLICY "Hierarquia Ministérios" ON public.ministries
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_geral') OR
  EXISTS (
    SELECT 1 FROM public.ministry_members mim 
    WHERE mim.ministry_id = ministries.id AND mim.user_id = auth.uid()
  )
);

GRANT SELECT ON public.mesas TO authenticated;
GRANT SELECT ON public.redes TO authenticated;
GRANT SELECT ON public.mesa_members TO authenticated;
GRANT SELECT ON public.rede_members TO authenticated;
GRANT SELECT ON public.ministries TO authenticated;
