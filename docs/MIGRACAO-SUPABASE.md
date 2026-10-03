# Migração do Supabase (Lovable → projeto próprio)

> **Objetivo:** tirar o banco de dados do projeto Supabase gerenciado pela Lovable
> (`zrdzocdadiucrhvwvxhq`) e colocá-lo num projeto Supabase **que você controla**,
> sem perder dados, contas de membros nem arquivos.

Leia a seção 0 inteira antes de começar. Os scripts estão em
[`scripts/migracao-supabase/`](../scripts/migracao-supabase/) e foram **ensaiados de ponta a
ponta** num Postgres local que imita o Supabase (ver seção 10).

---

## 0. Como funciona

A migração são **quatro cargas**, e **todas saem do banco de origem**:

| Carga           | O que é                                                                                    | Como vai                                        |
| :-------------- | :----------------------------------------------------------------------------------------- | :---------------------------------------------- |
| **1. Schema**   | tabelas, enums, functions, triggers, policies, grants                                      | `migrar.sh` (dump do schema `public` da origem) |
| **2. Dados**    | as linhas das tabelas (membros, mesas, eventos…)                                           | `migrar.sh`                                     |
| **3. Contas**   | `auth.users` + `auth.identities` (com os hashes de senha)                                  | `migrar.sh`                                     |
| **4. Arquivos** | 5 buckets: `kids-photos`, `kids-documents-v2`, `event-arts`, `store-assets`, `sermon-arts` | `copiar-storage.mjs`                            |

### Por que o schema NÃO sai das `supabase/migrations/` do repositório

Tentamos — e não funciona. Aplicando as 78 migrations em ordem num banco vazio, **6 falham**
e saem 64 tabelas em vez das 76 de produção:

- `20260730002237` faz seed de `worship_songs` apontando para um ministério
  (`7cc9c01b-…`) que **só existe nos dados de produção** → violação de chave estrangeira;
- `20260809032811` reinsere ministérios cujo `slug` já existe → violação de unicidade;
- `20260813000002` e `20260813000004` usam o valor de enum `admin`, que não existe em `app_role`;
- `20260813051415`, `20260813055400` e `20260819225214` recriam tabelas que já existem.

Além disso, só **1 dos 5 buckets** (`sermon-arts`) é criado por migration — os outros 4 foram
criados pelo painel. Conclusão: a **origem é a única fonte fiel** do que está no ar. O script
copia o schema dela.

### Quem faz o quê

As cargas só saem com uma **credencial legítima da origem** (senha do banco + chave
`service_role`), que só você consegue obter pelo painel. Por isso os scripts rodam **na sua
máquina**: as senhas ficam em variáveis de ambiente do seu terminal e nunca entram no
repositório nem neste chat.

---

## 1. Pré-requisitos

- [ ] Acesso ao painel do Supabase (`supabase.com/dashboard`) com a **sua** conta.
- [ ] Acesso ao projeto de **origem** (seção 2).
- [ ] **PostgreSQL client 17** (`psql` e `pg_dump`). O `pg_dump` precisa ser da **mesma versão
      ou mais nova** que o servidor — projetos Supabase atuais rodam Postgres 17.
      Mac: `brew install postgresql@17` · Windows: instalador oficial · Linux: pacote `postgresql-client-17`.
      O `./migrar.sh checar` confere isso para você.
- [ ] **Node 20+** e este repositório clonado com `npm install` (para o script do Storage).
- [ ] Um terminal **bash** (Mac/Linux; no Windows use WSL ou Git Bash).

---

## 2. Acesso ao banco de ORIGEM (Lovable)

1. **Pela Lovable:** projeto → configurações de **Cloud/Backend**. Se houver "abrir no
   Supabase", você cai direto no projeto `zrdzocdadiucrhvwvxhq`.
2. **Senha do banco:** no projeto de origem → **Settings → Database → Reset database password**.
   Isso dá uma senha nova sem precisar da antiga.
3. **Connection string:** mesma tela → **Connect → Session pooler** (porta 5432) ou
   _Direct connection_. Formato:
   ```
   postgresql://postgres.zrdzocdadiucrhvwvxhq:SENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres
   ```
   > Use **session** (5432), **não** _transaction_ (6543): o `pg_dump` não funciona no modo transaction.
4. **Chave `service_role` da origem:** **Settings → API** (para copiar os arquivos do Storage).
5. **Sem nenhum acesso?** Peça ao **suporte da Lovable** o export do backend ou a transferência
   do projeto Supabase para a sua organização. Não há atalho seguro.

---

## 3. Criar o projeto DESTINO

1. No Supabase: **New project** → nome `iba-atos-producao` → região **South America (São Paulo)**.
   Guarde a senha do banco.
2. **Não crie nada nele** — nem tabela, nem bucket, nem `supabase db push`. O script exige um
   projeto **novo e vazio** (e recusa se o schema `public` tiver qualquer tabela).
3. Anote o **Reference ID** (Settings → General): é o `DEST_REF`.
4. Pegue a connection string (session, 5432) e a `service_role` do destino, como na seção 2.

---

## 4. PASSO A — Schema, dados e contas (`migrar.sh`)

Congele a origem antes: avise a liderança, e **não edite nada na Lovable** durante a migração —
o que for gravado na origem depois do `exportar` fica para trás.

```bash
cd scripts/migracao-supabase

# as senhas ficam SÓ no seu terminal (o espaço no início evita ir para o histórico do bash)
 export ORIG_DB_URL='postgresql://postgres.zrdzocdadiucrhvwvxhq:SENHA_ORIGEM@...:5432/postgres'
 export DEST_DB_URL='postgresql://postgres.DEST_REF:SENHA_DESTINO@...:5432/postgres'

./migrar.sh checar      # versões, conexão e destino vazio
./migrar.sh exportar    # lê a origem → ./migracao-saida/
./migrar.sh importar    # grava no destino, numa ÚNICA transação
./migrar.sh conferir    # contagem EXATA de linhas, tabela a tabela
```

O que cada etapa faz:

| Arquivo gerado                | Conteúdo                                                                                                              |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `01_schema_public.sql`        | schema `public` completo da origem (tabelas, enums, functions, triggers, policies, grants)                            |
| `02_auth_storage_extras.sql`  | triggers em `auth.users` (`handle_new_user`, `elevate_specific_admin`) e policies do Storage — moram fora de `public` |
| `03_auth_storage_dados.sql`   | **só** `auth.users`, `auth.identities` e `storage.buckets` (com `public`/limites de cada bucket)                      |
| `04_dados_public.sql`         | todas as linhas de `public` (as sequences vêm junto)                                                                  |
| `05_historico_migrations.sql` | histórico `supabase_migrations`, se existir na origem                                                                 |
| `contagens_origem.txt`        | contagem exata de cada tabela, para o `conferir`                                                                      |

Decisões que evitam os erros clássicos:

- **Carga com `session_replication_role = replica`:** não disparam triggers nem checagem de FK
  durante a carga. Sem isso, o `handle_new_user` criaria perfis em duplicidade ao inserir cada
  `auth.users`. (`pg_dump --disable-triggers` **não serve** no Supabase: exige superusuário.)
- **Só `auth.users` + `auth.identities`:** o schema `auth` inteiro traria `schema_migrations`,
  sessões, tokens e logs, que colidem com o projeto novo. Consequência: **todos precisarão
  entrar de novo** (as sessões não migram) — mas com a **mesma senha**.
- **Uma transação só:** qualquer erro desfaz tudo; o destino volta a ficar vazio e você pode
  rodar de novo.

> ⚠️ `migracao-saida/` contém **dados pessoais e hashes de senha**. Está no `.gitignore`; guarde
> numa pasta segura (é o seu backup completo) e apague das máquinas temporárias.

---

## 5. PASSO B — Arquivos do Storage (`copiar-storage.mjs`)

```bash
# na raiz do repositório (precisa do npm install)
 export ORIG_SUPABASE_URL='https://zrdzocdadiucrhvwvxhq.supabase.co'
 export ORIG_SERVICE_ROLE_KEY='...'
 export DEST_SUPABASE_URL='https://DEST_REF.supabase.co'
 export DEST_SERVICE_ROLE_KEY='...'

node scripts/migracao-supabase/copiar-storage.mjs
```

Percorre todos os buckets da origem (inclusive subpastas), baixa cada arquivo e envia ao
destino com o mesmo caminho e tipo. Cria o bucket no destino se faltar. Pode ser rodado de
novo sem risco (regrava). Termina com `Copiados: N. Falhas: 0.` — se houver falhas, lista
cada arquivo.

---

## 6. PASSO C — Religar a aplicação ao novo banco

> Daqui em diante a produção muda. **Anote os valores atuais antes de trocar** (rollback, seção 8).

### 6.1 Variáveis na Vercel

Projeto **`ibaatos`** → **Settings → Environment Variables** (Production e Preview):

| Variável                                                     | Valor                           |
| :----------------------------------------------------------- | :------------------------------ |
| `SUPABASE_URL` e `VITE_SUPABASE_URL`                         | `https://DEST_REF.supabase.co`  |
| `SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PUBLISHABLE_KEY` | anon/publishable key do destino |
| `SUPABASE_SERVICE_ROLE_KEY`                                  | service_role do destino         |

As variáveis `VITE_*` entram no **build** — depois de trocar, faça **Redeploy**. Repita no
`ibaatos-antigo` se ele ainda for usado.

### 6.2 Código (PR do Claude, quando você passar o `DEST_REF`)

O ref da origem está fixo como fallback em `src/integrations/supabase/client.ts`,
`client.server.ts`, `auth-middleware.ts`, em `supabase/config.toml` e no `.env` versionado.
O PR troca tudo para o destino e só deve ser mergeado **depois** do Passo A conferido.

### 6.3 Google OAuth e URLs de autenticação no destino

- Google Cloud → URIs de redirecionamento → `https://DEST_REF.supabase.co/auth/v1/callback`
- Supabase destino → **Authentication → Providers → Google** → Client ID/Secret
- Supabase destino → **Authentication → URL Configuration** → Site URL `https://ibaatos.vercel.app`
  e Redirect URLs (incluindo previews da Vercel, se usados)
- Supabase destino → **Authentication → Emails/SMTP**: se a origem tinha SMTP próprio, refaça.

### 6.4 Lovable

Depois da virada, o que a Lovable criar de banco (migrations, tabelas) **continua indo para o
projeto antigo**. Se a Lovable permitir conectar um Supabase próprio, conecte o destino; senão,
mudanças de banco passam a entrar **só** por migration em PR (aplicada no destino com a CLI).

---

## 7. PASSO D — Verificação e virada

- [ ] `./migrar.sh conferir` → `OK — todas as N tabelas batem.`
- [ ] Login por **e-mail/senha** de um membro existente (mesma senha de antes).
- [ ] Login por **Google** (após 6.3).
- [ ] Telas que leem dados (membros, mesas, agenda) mostram o conteúdo.
- [ ] Imagens do Storage aparecem (foto do Kids, produto da loja, arte de evento).
- [ ] Criar um usuário de teste → o perfil dele é criado (trigger `handle_new_user` ativo).
- [ ] Criar/editar um registro de teste e confirmar que grava.

Monitore por alguns dias antes de pausar a origem.

---

## 8. Segurança e rollback

- **Rollback:** volte as variáveis da Vercel para os valores antigos e faça redeploy. Tudo o que
  for gravado no destino nesse meio-tempo fica só lá — por isso faça a virada num horário calmo.
- **Nunca** comite senhas, `service_role` ou a pasta `migracao-saida/`.
- Use **sempre** um projeto destino novo: o script recusa destino com tabelas em `public`.

---

## 9. Checklist final

- [ ] Acesso à origem obtido (senha do banco + `service_role`)
- [ ] Projeto destino criado, vazio, `DEST_REF` anotado
- [ ] `checar` → `exportar` → `importar` → `conferir` OK
- [ ] `copiar-storage.mjs` com `Falhas: 0`
- [ ] Variáveis da Vercel trocadas + redeploy (valores antigos guardados)
- [ ] PR dos fallbacks/`config.toml`/`.env` mergeado
- [ ] Google OAuth, URLs de auth e SMTP refeitos no destino
- [ ] Testes manuais da seção 7 OK
- [ ] Decisão sobre a Lovable (6.4)

---

## 10. Como os scripts foram validados

Ensaio local, Postgres 16, com uma imitação mínima do Supabase (roles `anon`/`authenticated`/
`service_role`, schemas `auth` e `storage`):

- Origem montada a partir das migrations + 25 contas com senha (bcrypt), identidades,
  5 buckets, sessão e `auth.schema_migrations` fictícios.
- `exportar` → `importar` → `conferir`: **67 tabelas batem**; policies (171), functions (63),
  triggers (35), tabelas com RLS (64), enums (13), grants e a flag `public` dos 5 buckets
  **idênticos** entre origem e destino.
- A senha original de um membro confere no destino; sessões e `auth.schema_migrations`
  **não** foram copiadas (como esperado); o trigger `handle_new_user` cria o perfil de um
  usuário novo depois da carga; e o `importar` recusa um destino que já tem tabelas.
- `copiar-storage.mjs` contra uma API de Storage simulada: 4 arquivos (com subpastas)
  copiados com conteúdo e tipo corretos, bucket ausente criado com a mesma flag `public`.

**Não ensaiado** (só dá para provar no Supabase de verdade): permissões exatas do usuário
`postgres` gerenciado e a API real do Storage. Se algo falhar ali, a transação é desfeita e o
erro aparece na tela — traga a mensagem que eu ajusto.
