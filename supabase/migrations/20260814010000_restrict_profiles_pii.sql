-- S3 — Protege os dados pessoais dos membros.
--
-- Antes: profiles_select_all_authenticated USING (true) — QUALQUER conta
-- autenticada lia e-mail, telefone, endereço e data de nascimento de TODA a
-- igreja. Agora a leitura respeita a hierarquia:
--   • o próprio usuário vê o seu perfil completo;
--   • liderança/admin (is_leadership) vê todos — não quebra diretório, seletores,
--     escalas e painéis, que são telas de liderança;
--   • demais membros veem apenas quem compartilha com eles uma mesa, rede,
--     ministério ou equipe de louvor (co-visibilidade).
--
-- A checagem é feita por função SECURITY DEFINER, que executa com privilégios do
-- dono e NÃO reavalia o RLS por dentro (sem recursão).

CREATE OR REPLACE FUNCTION public.shares_group(_target uuid, _viewer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.mesa_members a
      JOIN public.mesa_members b ON b.mesa_id = a.mesa_id
      WHERE a.user_id = _viewer AND b.user_id = _target
    )
    OR EXISTS (
      SELECT 1 FROM public.rede_members a
      JOIN public.rede_members b ON b.rede_id = a.rede_id
      WHERE a.user_id = _viewer AND b.user_id = _target
    )
    OR EXISTS (
      SELECT 1 FROM public.ministry_members a
      JOIN public.ministry_members b ON b.ministry_id = a.ministry_id
      WHERE a.user_id = _viewer AND b.user_id = _target
    )
    OR EXISTS (
      SELECT 1 FROM public.worship_team_members a
      JOIN public.worship_team_members b ON b.team_id = a.team_id
      WHERE a.user_id = _viewer AND b.user_id = _target
    );
$$;

GRANT EXECUTE ON FUNCTION public.shares_group(uuid, uuid) TO authenticated;

-- Substitui a política aberta pela política com hierarquia.
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;

CREATE POLICY "profiles_select_scoped" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_leadership(auth.uid())
    OR public.shares_group(id, auth.uid())
  );
