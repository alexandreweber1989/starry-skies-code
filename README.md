# Igreja Batista Atos — Plataforma (IB Atos)

Plataforma interna da **Igreja Batista Atos**: painel administrativo e app para
membros (agenda, avisos com notificação push, cuidado pastoral, kids com
check-in, mesas, redes, ministérios, visitantes, cantina, livraria e mais).
É um **PWA** — instala no celular e envia notificações.

> **Novo aqui (humano ou IA)?** Comece por **[`AGENTS.md`](AGENTS.md)** — ele traz
> as regras obrigatórias de trabalho (Issues, Pull Requests, fluxo de deploy,
> design system, RBAC/RLS). Este README cobre **como rodar e publicar**.

---

## Sumário
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Começando (local)](#começando-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Infraestrutura (fonte da verdade)](#infraestrutura-fonte-da-verdade)
- [Banco de dados & migrations](#banco-de-dados--migrations)
- [Fluxo de trabalho e deploy](#fluxo-de-trabalho-e-deploy)
- [Convenções](#convenções)
- [Solução de problemas](#solução-de-problemas)
- [Documentação complementar](#documentação-complementar)

---

## Stack
- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19 + Vite,
  SSR via Nitro) com **rotas por arquivo** em `src/routes/`.
- **UI:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) + framer-motion +
  lucide-react. Tipografia **Syne / Plus Jakarta Sans / Fredoka** (nenhuma outra).
- **Dados no cliente:** TanStack Query.
- **Backend:** [Supabase](https://supabase.com) (Postgres + Auth + PostgREST +
  RLS + Storage). Lógica sensível roda em **server functions** (`createServerFn`).
- **Notificações:** Web Push (VAPID) — sem serviço de terceiros.
- **Deploy:** Vercel (preset Nitro `vercel`).

## Pré-requisitos
- **Node.js 20+** (recomendado **22**, fixado em [`.nvmrc`](.nvmrc)).
  Com [nvm](https://github.com/nvm-sh/nvm): `nvm use`.
- **npm** (o repositório usa `package-lock.json`).
- Uma conta/credenciais do projeto **Supabase** da plataforma (veja
  [Variáveis de ambiente](#variáveis-de-ambiente)).

## Começando (local)
```sh
# 1. Clonar
git clone https://github.com/alexandreweber1989/starry-skies-code.git
cd starry-skies-code

# 2. Versão do Node (opcional, se usa nvm)
nvm use

# 3. Dependências
npm install

# 4. Variáveis de ambiente
cp .env.example .env     # depois preencha os valores reais (veja abaixo)

# 5. Rodar em desenvolvimento
npm run dev              # http://localhost:3000
```

## Variáveis de ambiente
Todas as variáveis estão documentadas em **[`.env.example`](.env.example)** — copie
para `.env` e preencha. Resumo do essencial:

| Variável | Obrigatória | Para quê |
|---|---|---|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | ✅ | Endereço do projeto Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Chave pública (anon). Não é segredo. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (servidor) | Segredo. Push, painel de adoção e demais server functions. |
| `VAPID_*` | ⛔ opcional | Chaves de push; derivadas automaticamente se ausentes. |
| `GOOGLE_API_KEY` | ⛔ opcional | Integrações de mapa/geocodificação. |

> **Importante:**
> - O `.env` **não é versionado** (está no `.gitignore`). Nunca comite segredos.
> - Variáveis `VITE_*` são **embutidas no build** — alterá-las exige novo deploy.
> - As chaves vêm do painel do Supabase → **Settings → API**.

## Scripts
| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (HMR) em `http://localhost:3000`. |
| `npm run build` | Build de produção (cliente + SSR + Nitro). |
| `npm run preview` | Serve localmente o build de produção. |
| `npm run lint` | ESLint em todo o projeto. |
| `npm run format` | Prettier (escreve as correções). |

> **Build de produção (Vercel):** `NITRO_PRESET=vercel npm run build`.

## Estrutura do projeto
```
src/
  routes/                 # Rotas por arquivo (TanStack Router)
    _authenticated/       # Área logada (dashboard, agenda, avisos, kids, ...)
    *.tsx                 # Rotas públicas (index, auth, instalar, ...)
  components/             # Componentes de UI (ui/ = shadcn; painel/, home/, ...)
  lib/                    # Regras e dados
    *.functions.ts        # Server functions (createServerFn + middleware)
    *.server.ts           # Código exclusivo de servidor (ex.: push.server.ts)
  integrations/supabase/  # Clientes Supabase (cliente e admin) e tipos
public/                   # Estáticos, manifest PWA, service worker (sw.js), ícones
supabase/migrations/      # Migrations SQL (fonte da verdade do schema)
docs/                     # Conhecimento do projeto (veja abaixo)
```

## Infraestrutura (fonte da verdade)
A plataforma trabalha **sempre** com este par (não confundir com projetos antigos):

| Serviço | Projeto | Observação |
|---|---|---|
| **Supabase** | `dcuncwvmoreagkqivqox` | Banco, Auth, Storage e RLS. |
| **Vercel** | `ibaatos-antigo` | Publica em `https://ibaatos.vercel.app`. |
| **GitHub** | `alexandreweber1989/starry-skies-code` | Código; `main` = produção. |

## Banco de dados & migrations
- Toda mudança de schema entra como **migration** em `supabase/migrations/`
  (arquivo novo, nomeado por timestamp). **Nunca** edite uma migration já
  publicada — crie outra.
- O acesso é governado por **RLS**. Operações que precisam cruzar vários
  usuários rodam em **server functions** com `service_role` e checagem de papel
  (ex.: `has_role`), nunca no cliente.

## Fluxo de trabalho e deploy
1. Crie uma **branch** a partir de `main` (`correcao/...`, `melhoria/...`,
   `feature/...`) — nunca comite direto em `main`.
2. Abra um **Pull Request**. O Vercel gera um **preview** exclusivo do PR.
3. **Check verde →** merge. **Vermelho →** corrija antes de mesclar.
4. Ao entrar em `main`, o Vercel publica em produção.

Mudanças de **autenticação/permissões, migrations destrutivas, remoção de dados
ou qualquer coisa que afete todos os membros** exigem confirmação humana antes do
merge. Detalhes completos em [`AGENTS.md`](AGENTS.md).

## Solução de problemas
- **"Missing SUPABASE_URL / SERVICE_ROLE_KEY":** o `.env` está incompleto — copie
  de `.env.example` e preencha; em produção, confira as Environment Variables do
  projeto Vercel `ibaatos-antigo`.
- **Notificações não chegam:** confirme `SUPABASE_SERVICE_ROLE_KEY` no servidor e
  ative as notificações da igreja uma vez em **Meu perfil** (admin).
- **Mudei uma `VITE_*` e nada mudou:** elas são embutidas no build — refaça o
  deploy (ou reinicie `npm run dev`).
- **iOS não mostra push:** no iPhone o app precisa estar **instalado na tela de
  início** (Safari → Compartilhar → Adicionar à Tela de Início).

## Documentação complementar
- **[`AGENTS.md`](AGENTS.md)** — regras de trabalho, time de agentes, design system, RBAC/RLS.
- **[`BLUEPRINT.md`](BLUEPRINT.md)** — especificação técnica e funcional.
- **[`BACKLOG.md`](BACKLOG.md)** — backlog e categorização das tarefas.
- **`docs/`** — conhecimento do projeto:
  `KNOWLEDGE-PROJETO.md`, `KNOWLEDGE-WORKSPACE.md`, `NOTIFICACOES.md`,
  `MIGRACAO-SUPABASE.md`.
