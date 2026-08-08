-- Hierarquia de Acesso: Membros só veem seus próprios grupos
-- Nota: A função has_role já deve existir conforme instruções do sistema.

-- 1. Tabelas de Integração (membros)
ALTER TABLE public.mesa_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Membros visualizam integrantes da própria mesa" ON public.mesa_members;
CREATE POLICY "Membros visualizam integrantes da própria mesa" ON public.mesa_members
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.mesa_members mm WHERE mm.mesa_id = mesa_members.mesa_id AND mm.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin_geral')
);

ALTER TABLE public.rede_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Membros visualizam integrantes da própria rede" ON public.rede_members;
CREATE POLICY "Membros visualizam integrantes da própria rede" ON public.rede_members
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.rede_members rm WHERE rm.rede_id = rede_members.rede_id AND rm.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin_geral')
);

-- 2. Tabelas Principais (grupos)
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Membros visualizam suas próprias mesas" ON public.mesas;
CREATE POLICY "Membros visualizam suas próprias mesas" ON public.mesas
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.mesa_members mm WHERE mm.mesa_id = mesas.id AND mm.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin_geral')
);

ALTER TABLE public.redes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Membros visualizam suas próprias redes" ON public.redes;
CREATE POLICY "Membros visualizam suas próprias redes" ON public.redes
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.rede_members rm WHERE rm.rede_id = redes.id AND rm.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin_geral')
);

-- 3. Ministérios (Hierarquia superior)
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Membros visualizam seus próprios ministérios" ON public.ministries;
CREATE POLICY "Membros visualizam seus próprios ministérios" ON public.ministries
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ministry_members mim WHERE mim.ministry_id = ministries.id AND mim.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin_geral')
);

-- Garantir acesso ao Data API
GRANT SELECT ON public.mesa_members TO authenticated;
GRANT SELECT ON public.rede_members TO authenticated;
GRANT SELECT ON public.mesas TO authenticated;
GRANT SELECT ON public.redes TO authenticated;
GRANT SELECT ON public.ministries TO authenticated;
