# Guia para agentes de IA (Claude Code, Cursor, etc.)

Este arquivo existe para que qualquer IDE ou agente de IA encontre, logo de
cara, as diretrizes deste repositório.

👉 **Leia [`AGENTS.md`](AGENTS.md) antes de qualquer mudança.** Ele é a fonte das
regras obrigatórias (Issues, Pull Requests, fluxo de deploy, design system,
RBAC/RLS, time de agentes) e vale para agentes de **qualquer** modelo.

Para rodar e publicar o projeto, veja **[`README.md`](README.md)**
(pré-requisitos, `.env`, scripts, estrutura, deploy).

## Essencial em uma tela
- **Nunca** comite segredos nem o texto do pedido do usuário dentro de arquivos
  (ver AGENTS.md §0). Segredos vão para `.env` (não versionado) / Vercel.
- **Nunca** comite direto em `main`: trabalhe em branch e abra PR; `main` é
  produção (Vercel publica a partir dela).
- **Infra fixa da plataforma:** Supabase `dcuncwvmoreagkqivqox` + Vercel
  `ibaatos-antigo` (`ibaatos.vercel.app`). Não usar projetos antigos.
- **Validação antes do PR:** `npm run build` e, quando possível, `npm run lint`.
- **Banco:** mudanças de schema só via nova migration em `supabase/migrations/`.
- **Design system:** tipografia Syne / Plus Jakarta Sans / Fredoka; paleta
  monocromática; componentes em `src/components/ui`.
