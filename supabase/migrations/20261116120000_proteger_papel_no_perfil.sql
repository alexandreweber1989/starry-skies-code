-- Impede que um membro se promova a pastor/líder editando o próprio perfil.
--
-- Contexto: a política "profiles_update_own" deixa cada pessoa atualizar a
-- própria linha inteira, e "profiles_insert_admin" deixa inserir a própria
-- linha. Como is_pastoral()/is_leadership() leem profiles.church_function, um
-- membro podia gravar church_function = 'pastor' pelo cliente e ganhar acesso a
-- notas pastorais e ao envio de avisos para a igreja toda.
--
-- Regra: só o admin geral (ou o próprio servidor, sem usuário logado — service
-- role, migrações, cadastro automático) altera papel, status ministerial,
-- situação de membresia e igreja. Para os demais, esses campos ficam como
-- estavam (UPDATE) ou com os valores padrão (INSERT). Os outros dados do
-- perfil (nome, telefone, endereço...) continuam editáveis pela pessoa.

create or replace function public.proteger_campos_do_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin_geral') then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.church_function := old.church_function;
    new.ministerial_status := old.ministerial_status;
    new.membership_status := old.membership_status;
    new.church_id := old.church_id;
  else
    new.church_function := 'membro';
    new.ministerial_status := 'membro';
    new.membership_status := 'ativo';
  end if;

  return new;
end;
$$;

-- Função de trigger: não deve ser chamável pela API.
revoke execute on function public.proteger_campos_do_perfil() from public, anon, authenticated;

drop trigger if exists proteger_campos_do_perfil on public.profiles;
create trigger proteger_campos_do_perfil
  before insert or update on public.profiles
  for each row execute function public.proteger_campos_do_perfil();
