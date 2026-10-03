# Migração do Supabase (Lovable → projeto próprio)

> **Objetivo:** tirar o banco de dados do projeto Supabase gerenciado pela Lovable
> (`zrdzocdadiucrhvwvxhq`) e colocá-lo num projeto Supabase **que você controla**,
> sem perder dados, contas de membros nem arquivos.

Este documento é o passo a passo esmiuçado. Leia a seção 0 inteira antes de começar.

---

## 0. Como funciona (e por que você precisa fazer alguns passos)

A "migração" na verdade são **quatro cargas diferentes**, que viajam por caminhos diferentes:

| Carga | O que é | De onde sai | Reconstruível do repositório? |
| :-- | :-- | :-- | :-- |
| **1. Schema** | 76 tabelas, 13 enums, 35 functions, 35 triggers, 238 policies, 1 bucket | das `supabase/migrations/` do repo | ✅ **Sim, 100%** |
| **2. Dados** | as linhas das tabelas (membros, mesas, eventos…) | só existem no banco de origem | ❌ precisa exportar |
| **3. Contas** | `auth.users` + senhas (hash) dos membros | só existem no banco de origem | ❌ precisa exportar |
| **4. Arquivos** | fotos do Kids, imagens de produtos | Storage (S3) da origem | ❌ precisa copiar |

**O que isto significa:** o schema eu reconstruo do repositório. As cargas 2–4 **só saem com
uma credencial legítima do projeto de origem** — e essa credencial só você consegue obter,
pelo painel. Por segurança, este container **não** procura chaves vazadas nem acessa o banco
direto; os comandos de exportação/importação abaixo são feitos **por você** (ou numa máquina
sua), onde as senhas nunca passam por aqui.

**Resultado final:** produção (`ibaatos.vercel.app`) passa a usar **o seu** projeto Supabase,
com você no controle total (SQL, backups, auth, storage).

---

## 1. Pré-requisitos e decisão do projeto destino

### 1.1 Você vai precisar de
- [ ] Acesso ao painel **Supabase** (o seu, `supabase.com/dashboard`).
- [ ] Acesso de **leitura ao banco de origem** (Lovable) — veja a seção 2.
- [ ] Um computador com **terminal** e as ferramentas `psql` e `pg_dump`
      (vêm com o PostgreSQL 15+; no Mac: `brew install postgresql@16`; no Windows: instalador oficial).
- [ ] (Opcional, recomendado) a **Supabase CLI**: `npm i -g supabase`.

### 1.2 Escolha o projeto destino
Duas opções — escolha uma:

- **Opção recomendada — projeto NOVO e limpo.** No Supabase, **New project**,
  nome por exemplo `iba-atos-producao`. Região: **South America (São Paulo)** se disponível
  (menor latência). Guarde a **senha do banco** que você definir.
- **Reaproveitar um existente** (ex.: `iba-atos-claude-new`). Só se ele estiver **vazio/de teste**.
  Reative-o (sai do estado *PAUSED*) e, em **Settings → Database**, confirme que não há dados
  importantes — a importação assume um banco limpo.

> Anote o **Reference ID** do destino (Settings → General). Vou chamá-lo de `DEST_REF`
> no restante do guia. O da origem é `zrdzocdadiucrhvwvxhq` (chamado `ORIG_REF`).

---

## 2. Conseguir acesso ao banco de ORIGEM (Lovable) — do jeito certo

O projeto `zrdzocdadiucrhvwvxhq` é um Supabase provisionado pela Lovable. Tente, em ordem:

1. **Pela Lovable:** abra o projeto na Lovable → configurações de **Cloud/Backend**. Versões
   recentes têm um botão para **abrir/gerenciar o Supabase** ou para **conectar seu próprio
   Supabase**. Se existir "abrir no Supabase", você cai direto no projeto de origem.
2. **Resetar a senha do banco da origem:** dentro do projeto de origem no Supabase →
   **Settings → Database → Reset database password**. Isso te dá uma senha nova **sem precisar
   da antiga**. Guarde-a — vou chamá-la de `ORIG_DB_PWD`.
3. **Pegar a connection string da origem:** mesma tela, em **Connection string → URI**
   (use a de **Session**/porta 5432 para dump). Formato:
   ```
   postgresql://postgres:ORIG_DB_PWD@db.zrdzocdadiucrhvwvxhq.supabase.co:5432/postgres
   ```
4. **Se você não tiver nenhum acesso:** fale com o **suporte da Lovable** pedindo o
   *export* do backend ou a transferência de propriedade do projeto Supabase. Sem um desses,
   as cargas 2–4 não têm como sair — não há atalho seguro.

> A mesma tela do **destino** te dá a connection string dele (`DEST_DB_PWD`, `DEST_REF`).

---

## 3. PASSO A — Montar o schema no destino

Você tem duas formas. A **CLI é a mais limpa**; o SQL Editor é a mais simples.

### A.1 (recomendado) Supabase CLI aplica as migrations do repo
```bash
# na raiz do repositório clonado
supabase login
supabase link --project-ref DEST_REF          # pede a senha do banco destino
supabase db push                               # aplica supabase/migrations/ em ordem
```

### A.2 (alternativa) SQL Editor
- Gere/pegue o arquivo único `supabase/schema_consolidado.sql` (ou copie as migrations em
  ordem) e cole no **SQL Editor** do projeto destino → **Run**.
- Rode **uma vez só**, num banco vazio.

> Ao final, o destino tem todas as tabelas, enums, functions, triggers, policies e o bucket,
> mas **sem dados** ainda.

---

## 4. PASSO B — Migrar DADOS + CONTAS dos membros

A ideia: exportar **só os dados** (sem recriar schema, que já existe) dos schemas `public` e
`auth`, e carregar no destino com os gatilhos desligados (para não disparar efeitos colaterais
nem travar em ordem de chave estrangeira).

### B.1 Exportar os dados da origem
```bash
pg_dump \
  --data-only \
  --schema=public \
  --schema=auth \
  --no-owner --no-privileges \
  --disable-triggers \
  --column-inserts \
  "postgresql://postgres:ORIG_DB_PWD@db.zrdzocdadiucrhvwvxhq.supabase.co:5432/postgres" \
  > dados_origem.sql
```
- `--data-only`: não recria tabelas (o schema já foi no Passo A).
- `--schema=auth`: leva as **contas dos membros** (`auth.users`, `auth.identities`) **com os
  hashes de senha**, então os logins por e-mail/senha continuam funcionando.
- `--disable-triggers`: evita que triggers rodem durante a carga.
- `--column-inserts`: mais lento, porém mais robusto e legível (bom para depurar).

### B.2 Carregar no destino
```bash
psql \
  "postgresql://postgres:DEST_DB_PWD@db.DEST_REF.supabase.co:5432/postgres" \
  -v ON_ERROR_STOP=1 \
  -f dados_origem.sql
```
Se aparecerem erros de ordem/chave estrangeira apesar do `--disable-triggers`, rode o arquivo
dentro de uma sessão com replicação em modo réplica (ignora FKs durante a carga):
```sql
-- no topo do psql, antes do \i
SET session_replication_role = replica;
-- ...carregar...
SET session_replication_role = origin;
```

### B.3 Reancorar as sequências (IDs automáticos)
Depois da carga, os contadores de ID podem estar atrás. No **SQL Editor** do destino:
```sql
-- gera e executa os SELECT setval(...) para todas as sequences de 'public'
SELECT 'SELECT setval(' || quote_literal(seq) || ', COALESCE((SELECT MAX(' ||
       quote_ident(col) || ') FROM ' || quote_ident(tab) || '), 1));'
FROM (
  SELECT s.relname AS seq, t.relname AS tab, a.attname AS col
  FROM pg_class s
  JOIN pg_depend d ON d.objid = s.oid
  JOIN pg_class t ON t.oid = d.refobjid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
  WHERE s.relkind = 'S'
) x;
```
Copie a saída e rode-a (é um lote de `setval`).

---

## 5. PASSO C — Migrar os ARQUIVOS do Storage (fotos/imagens)

O `pg_dump` levou só os **metadados** de `storage.objects`, **não** os arquivos em si.
Para copiar os arquivos:

### C.1 (recomendado) Supabase CLI
```bash
# baixa tudo da origem para uma pasta local
supabase storage cp --recursive \
  --project-ref zrdzocdadiucrhvwvxhq \
  ss://<nome-do-bucket> ./storage_backup

# envia para o destino
supabase storage cp --recursive \
  --project-ref DEST_REF \
  ./storage_backup ss://<nome-do-bucket>
```
> O nome do bucket está nas migrations (há 1 bucket). Confira em **Storage** no painel.

### C.2 (alternativa) rclone / script via API
Se preferir, dá para usar `rclone` com o remote S3 de cada projeto, ou um script curto que
lista e recopia via API de Storage. A CLI acima é o caminho mais simples.

---

## 6. PASSO D — Religar a aplicação ao novo banco

### 6.1 Variáveis na Vercel (produção)
No projeto **`ibaatos`** na Vercel → **Settings → Environment Variables**, aponte para o destino:

| Variável | Valor |
| :-- | :-- |
| `SUPABASE_URL` | `https://DEST_REF.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | *anon/publishable key do destino* (Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | *service_role key do destino* (Settings → API) |

> Faça o mesmo no projeto `ibaatos-antigo` se ele também for usado.

### 6.2 Código (eu faço num PR quando você me passar o `DEST_REF`)
Hoje o código tem o ref **da origem** chumbado como fallback em alguns arquivos
(`src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`) e em
`supabase/config.toml`. Quando a migração estiver pronta, troco esses fallbacks para o destino
e ajusto o `config.toml`, num PR próprio.

### 6.3 Google OAuth no projeto DESTINO
Refaça a configuração do login Google **apontando para o destino** (o callback muda de ref):
- Google Cloud → URIs de redirecionamento autorizados → `https://DEST_REF.supabase.co/auth/v1/callback`
- Supabase destino → Authentication → Providers → Google → Client ID/Secret
- Supabase destino → Authentication → URL Configuration → Site URL e Redirect URLs
  (ver `docs/` ou peça que eu gere o guia já com o `DEST_REF`).

---

## 7. PASSO E — Verificação e virada

### 7.1 Conferir que os dados bateram
Rode **na origem e no destino** e compare linha a linha:
```sql
SELECT relname AS tabela, n_live_tup AS linhas
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
```
As contagens têm que ser iguais (ou explicáveis).

### 7.2 Testes manuais
- [ ] Login por **e-mail/senha** de um membro existente.
- [ ] Login por **Google** (após seção 6.3).
- [ ] Abrir uma tela que lê dados (membros, mesas) e ver o conteúdo.
- [ ] Abrir algo que mostra **imagem** do Storage (Kids/produtos).
- [ ] Criar/editar um registro de teste e confirmar que grava.

### 7.3 Virada (cutover)
Só depois de tudo verde: a produção já está apontando para o destino (seção 6). Monitore por
alguns dias antes de desativar/pausar a origem.

---

## 8. Segurança e rollback

- **Rollback é simples:** se algo der errado, basta reverter as variáveis da Vercel para os
  valores antigos (origem) e redeployar. Por isso **anote os valores atuais antes de trocar**.
- **Nunca** comite chaves (`service_role`, senhas de banco) no repositório. Elas vivem só na
  Vercel e nos seus painéis.
- Faça a migração com a origem **em leitura** (sem alterações simultâneas) para os números baterem.
- Guarde `dados_origem.sql` e `storage_backup/` num lugar seguro — é o seu backup completo.

---

## 9. Checklist final

- [ ] Projeto destino criado e `DEST_REF` anotado
- [ ] Acesso ao banco de origem obtido (seção 2)
- [ ] Schema aplicado no destino (Passo A)
- [ ] Dados + contas carregados (Passo B) e sequences reancoradas
- [ ] Arquivos do Storage copiados (Passo C)
- [ ] Variáveis da Vercel apontando para o destino (Passo D)
- [ ] Fallbacks do código + `config.toml` atualizados (PR)
- [ ] Google OAuth reconfigurado no destino
- [ ] Contagens conferidas e testes manuais ok (Passo E)
- [ ] Valores antigos guardados para rollback

---

### O que eu (Claude) faço por você
- Reconstruo/forneço o schema a partir do repositório.
- Gero os comandos **já preenchidos** com o seu `DEST_REF` quando você me passar.
- Faço o PR trocando os fallbacks de código e o `config.toml` para o destino.
- Gero o guia do Google OAuth já com o ref novo.
- Confiro contagens e te ajudo a depurar erros da carga.

### O que só você pode fazer
- Obter a credencial legítima da origem (painel/Lovable/suporte).
- Rodar os `pg_dump`/`psql`/`storage cp` na sua máquina (as senhas ficam com você).
- Definir as variáveis de ambiente na Vercel e as senhas nos painéis.
