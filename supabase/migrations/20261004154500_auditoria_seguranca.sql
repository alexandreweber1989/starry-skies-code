-- Auditoria de segurança (out/2026)
-- Projeto: dcuncwvmoreagkqivqox (iba-atos-producao)
--
-- Correções no banco encontradas pelos advisors do Supabase + revisão manual de RLS.
-- As partes de REVOKE/ALTER/CREATE POLICY foram aplicadas direto no projeto; os DROP
-- ficam aqui para quem rodar a migration pelo CLI/SQL Editor (o backdoor e a tabela
-- legada já foram neutralizados por REVOKE caso o DROP não seja executado).

-- 1) search_path fixo em funções SECURITY DEFINER (evita sequestro de search_path)
alter function public.handle_event_rsvp_reminder() set search_path = public;
alter function public.handle_mesa_main_address() set search_path = public;

-- 2) Funções de TRIGGER não devem ser chamáveis via API (PostgREST/RPC).
--    O grant padrão do Postgres é para PUBLIC; revogamos de todos. Continuam
--    funcionando como gatilho (executam como dono da tabela, não via EXECUTE).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_family_link() from public, anon, authenticated;
revoke execute on function public.notify_cleaning_responsible() from public, anon, authenticated;
revoke execute on function public.handle_event_rsvp_reminder() from public, anon, authenticated;
revoke execute on function public.handle_mesa_main_address() from public, anon, authenticated;

-- 3) Backdoor de admin: função com e-mails hardcoded que concedia admin_geral.
--    Não estava ligada a nenhum trigger. Neutralizada por REVOKE e removida.
revoke execute on function public.elevate_specific_admin() from public, anon, authenticated;
drop function if exists public.elevate_specific_admin();

-- 4) push_config tinha RLS habilitado mas nenhuma política (acesso só via service_role).
--    Torna explícito: apenas admin geral gerencia.
drop policy if exists push_config_admin on public.push_config;
create policy push_config_admin on public.push_config
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin_geral'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin_geral'::public.app_role));

-- 5) Tabela legada de assistência social (0 linhas) tinha policy SELECT = true.
--    Remove acesso via API e descarta a tabela.
revoke all on table public.social_assistance_requests_legacy from anon, authenticated;
drop table if exists public.social_assistance_requests_legacy;

-- Observações (não aplicáveis via SQL):
--  * Ativar "Leaked Password Protection" em Authentication > Policies no painel.
--  * As funções preditivas (has_role, is_*, can_*, shares_group) permanecem
--    executáveis por authenticated DE PROPÓSITO: são usadas dentro das políticas RLS.
--  * register_public_visitor e kids_find_family_by_phone são públicas por design
--    (check-in de visitante / localizar família no Kids).
