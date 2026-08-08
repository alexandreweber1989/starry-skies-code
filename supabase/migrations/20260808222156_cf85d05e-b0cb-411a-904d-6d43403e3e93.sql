-- Fix hierarchy by removing permissive policies and keeping the restrictive ones
DROP POLICY IF EXISTS "mesas_select_all" ON public.mesas;
DROP POLICY IF EXISTS "redes_select_all" ON public.redes;
DROP POLICY IF EXISTS "ministries_select_all" ON public.ministries;
DROP POLICY IF EXISTS "mesa_members_select_all" ON public.mesa_members;
DROP POLICY IF EXISTS "rede_members_select_authenticated" ON public.rede_members;
DROP POLICY IF EXISTS "ministry_members_select_all" ON public.ministry_members;

-- Ensure grants are correct for authenticated users
GRANT SELECT ON public.mesas TO authenticated;
GRANT SELECT ON public.redes TO authenticated;
GRANT SELECT ON public.ministries TO authenticated;
GRANT SELECT ON public.mesa_members TO authenticated;
GRANT SELECT ON public.rede_members TO authenticated;
GRANT SELECT ON public.ministry_members TO authenticated;
