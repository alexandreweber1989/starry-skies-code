#!/usr/bin/env bash
# Migração do banco Supabase: projeto Lovable (origem) → projeto próprio (destino).
# Guia completo: docs/MIGRACAO-SUPABASE.md
#
# As connection strings vêm SEMPRE de variáveis de ambiente — nunca as escreva
# neste arquivo nem em nenhum outro arquivo do repositório:
#
#   export ORIG_DB_URL='postgresql://postgres:SENHA@db.zrdzocdadiucrhvwvxhq.supabase.co:5432/postgres'
#   export DEST_DB_URL='postgresql://postgres:SENHA@db.DEST_REF.supabase.co:5432/postgres'
#
# Uso:
#   ./migrar.sh checar     # ferramentas, versões e se o destino está vazio
#   ./migrar.sh exportar   # gera ./migracao-saida/ a partir da ORIGEM (só leitura)
#   ./migrar.sh importar   # carrega ./migracao-saida/ no DESTINO (uma única transação)
#   ./migrar.sh conferir   # compara a contagem exata de linhas, tabela a tabela
#
# Por que o schema sai da origem (e não das supabase/migrations/ do repositório):
# o histórico de migrations NÃO se reconstrói num banco vazio — seeds dependem de
# linhas que só existem em produção (ex.: worship_songs → ministries 7cc9c01b…),
# há migrations que recriam tabelas já existentes e usam valores de enum que não
# existem mais. O dump da origem é a fonte fiel do schema que está no ar.

set -euo pipefail

SAIDA="${SAIDA:-./migracao-saida}"
PSQL_OPTS=(-X -q -v ON_ERROR_STOP=1)

die() { echo "ERRO: $*" >&2; exit 1; }
info() { echo "==> $*"; }

precisa_var() {
  [[ -n "${!1:-}" ]] || die "defina a variável $1 (veja o topo deste script)."
}

versao_servidor() { psql "$1" "${PSQL_OPTS[@]}" -Atc "show server_version_num" | cut -c1-2; }

checar() {
  precisa_var ORIG_DB_URL; precisa_var DEST_DB_URL
  command -v pg_dump >/dev/null || die "pg_dump não encontrado (instale o PostgreSQL client)."
  command -v psql >/dev/null || die "psql não encontrado."

  local local_v orig_v dest_v
  local_v=$(pg_dump --version | grep -oE '[0-9]+' | head -1)
  orig_v=$(versao_servidor "$ORIG_DB_URL") || die "não conectou na ORIGEM."
  dest_v=$(versao_servidor "$DEST_DB_URL") || die "não conectou no DESTINO."
  info "pg_dump local: $local_v | origem: Postgres $orig_v | destino: Postgres $dest_v"
  (( local_v >= orig_v )) || die "pg_dump $local_v é mais antigo que a origem ($orig_v). Instale o client $orig_v+."
  (( dest_v >= orig_v )) || die "o destino ($dest_v) não pode ser mais antigo que a origem ($orig_v)."

  destino_vazio
}

destino_vazio() {
  local tabelas
  tabelas=$(psql "$DEST_DB_URL" "${PSQL_OPTS[@]}" -Atc \
    "select count(*) from pg_tables where schemaname = 'public'") || die "não conectou no DESTINO."
  if [[ "$tabelas" != "0" ]]; then
    die "o destino já tem $tabelas tabela(s) em public. A importação exige um projeto NOVO e vazio."
  fi
  info "destino vazio — pronto para importar."
}

# Gera, a partir da origem, o que mora FORA do schema public mas é nosso:
# triggers em auth.users que chamam funções de public, e as policies do Storage.
sql_extras() {
  cat <<'SQL'
select pg_get_triggerdef(t.oid) || ';'
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
join pg_namespace pn on pn.oid = p.pronamespace
where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal and pn.nspname = 'public'
union all
select format('DROP POLICY IF EXISTS %I ON %I.%I;', policyname, schemaname, tablename)
  || E'\n'
  || format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
       policyname, schemaname, tablename, permissive, cmd,
       (select string_agg(quote_ident(r), ', ') from unnest(roles) r),
       coalesce(' USING (' || qual || ')', ''),
       coalesce(' WITH CHECK (' || with_check || ')', ''))
from pg_policies
where schemaname = 'storage';
SQL
}

# Contagem EXATA (pg_stat_user_tables.n_live_tup é estimativa e não serve para conferir).
contar() {
  local url="$1"
  psql "$url" "${PSQL_OPTS[@]}" -At <<'SQL'
select format('select %L || ''|'' || count(*) from %I.%I;', schemaname || '.' || tablename, schemaname, tablename)
from pg_tables
where schemaname = 'public'
   or (schemaname = 'auth' and tablename in ('users', 'identities'))
   or (schemaname = 'storage' and tablename = 'buckets')
order by 1
\gexec
SQL
}

exportar() {
  precisa_var ORIG_DB_URL
  mkdir -p "$SAIDA"
  local dump=(pg_dump "$ORIG_DB_URL" --no-owner)

  info "1/5 schema public"
  # O projeto novo já nasce com o schema public: não recriar nem mexer no comentário dele.
  "${dump[@]}" --schema-only --schema=public \
    | sed -E 's/^CREATE SCHEMA public;/CREATE SCHEMA IF NOT EXISTS public;/; /^COMMENT ON SCHEMA public /d' \
    > "$SAIDA/01_schema_public.sql"

  info "2/5 triggers de auth.users + policies do Storage"
  # search_path vazio: as definições saem com nomes qualificados (public.handle_new_user()).
  psql "$ORIG_DB_URL" "${PSQL_OPTS[@]}" -At -c "set search_path = ''" -c "$(sql_extras)" \
    > "$SAIDA/02_auth_storage_extras.sql"

  info "3/5 contas (auth.users, auth.identities) e buckets do Storage"
  "${dump[@]}" --data-only --column-inserts --on-conflict-do-nothing \
    --table=auth.users --table=auth.identities --table=storage.buckets \
    > "$SAIDA/03_auth_storage_dados.sql"

  info "4/5 dados de public"
  "${dump[@]}" --data-only --schema=public > "$SAIDA/04_dados_public.sql"

  info "5/5 histórico de migrations (se existir)"
  if [[ $(psql "$ORIG_DB_URL" "${PSQL_OPTS[@]}" -Atc \
        "select count(*) from pg_namespace where nspname = 'supabase_migrations'") == "1" ]]; then
    "${dump[@]}" --schema=supabase_migrations > "$SAIDA/05_historico_migrations.sql"
  else
    echo "-- origem sem supabase_migrations" > "$SAIDA/05_historico_migrations.sql"
  fi

  contar "$ORIG_DB_URL" > "$SAIDA/contagens_origem.txt"
  info "exportado em $SAIDA/ ($(wc -l < "$SAIDA/contagens_origem.txt") tabelas contadas)."
  info "ATENÇÃO: esses arquivos têm dados pessoais e hashes de senha. Não comite; guarde em local seguro."
}

importar() {
  precisa_var DEST_DB_URL
  destino_vazio
  for f in 01_schema_public 02_auth_storage_extras 03_auth_storage_dados 04_dados_public 05_historico_migrations; do
    [[ -s "$SAIDA/$f.sql" ]] || die "falta $SAIDA/$f.sql — rode './migrar.sh exportar' antes."
  done

  info "importando tudo numa única transação (qualquer erro desfaz tudo)…"
  # session_replication_role = replica: durante a carga dos DADOS não disparam
  # triggers (ex.: handle_new_user criaria perfis em duplicidade) nem são checadas FKs.
  psql "$DEST_DB_URL" "${PSQL_OPTS[@]}" --single-transaction -o /dev/null \
    -f "$SAIDA/01_schema_public.sql" \
    -f "$SAIDA/02_auth_storage_extras.sql" \
    -c "SET session_replication_role = replica" \
    -f "$SAIDA/03_auth_storage_dados.sql" \
    -f "$SAIDA/04_dados_public.sql" \
    -f "$SAIDA/05_historico_migrations.sql" \
    -c "SET session_replication_role = origin"
  info "importação concluída. Agora rode './migrar.sh conferir'."
}

conferir() {
  precisa_var DEST_DB_URL
  [[ -s "$SAIDA/contagens_origem.txt" ]] || die "falta $SAIDA/contagens_origem.txt — rode o exportar."
  contar "$DEST_DB_URL" > "$SAIDA/contagens_destino.txt"
  if diff <(sort "$SAIDA/contagens_origem.txt") <(sort "$SAIDA/contagens_destino.txt") > "$SAIDA/diferencas.txt"; then
    info "OK — todas as $(wc -l < "$SAIDA/contagens_destino.txt") tabelas batem."
  else
    echo "DIFERENÇAS (< origem, > destino):"
    cat "$SAIDA/diferencas.txt"
    exit 1
  fi
}

case "${1:-}" in
  checar) checar ;;
  exportar) exportar ;;
  importar) importar ;;
  conferir) conferir ;;
  *) sed -n '2,17p' "$0"; exit 1 ;;
esac
