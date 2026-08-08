# Blueprint da Plataforma Igreja Batista Atos

Este documento fornece uma visão técnica e funcional completa da plataforma, servindo como um guia detalhado para replicação, manutenção e expansão do sistema.

---

## 1. Visão Geral
A plataforma é um sistema de gestão eclesiástica (ERP) moderno, focado na experiência do usuário e na segurança dos dados. Ela integra gestão de membros, ministérios, eventos, finanças (loja/cantina), louvor e um módulo especializado para crianças (Kids).

**Arquitetura:** Full-stack React 19 com TanStack Start (SSR/Edge Ready).
**Backend:** Lovable Cloud (Supabase) — PostgreSQL, Auth, Storage e RLS.
**Estilo:** Tailwind CSS v4 com design system baseado em tokens semânticos e modo escuro nativo.

---

## 2. Stack Tecnológica (Frontend & Build)
- **Framework:** TanStack Start v1 (React 19).
- **Roteamento:** TanStack Router (File-based routing).
- **Data Fetching:** TanStack Query v5.
- **Estilização:** Tailwind CSS v4 + Radix UI (Shadcn/ui).
- **Ícones:** Lucide React.
- **Formulários:** React Hook Form + Zod.
- **QR Code:** qrcode.react.
- **Build Tool:** Vite 8.
- **Runtime:** Edge Workers (Cloudflare/Nitro).

---

## 3. Estrutura de Pastas
```
src/
├── components/          # Componentes UI organizados por domínio
│   ├── admin/           # Gestão de estruturas (Mesas, Redes, Ministérios)
│   ├── agenda/          # Calendário e eventos
│   ├── kids/            # Módulo Kids (Check-in, Fotos, QR)
│   ├── loja/            # Livraria e Estoque
│   ├── louvor/          # Repertório e Escalas
│   ├── membros/         # Ficha, Wizard e Requests
│   └── ui/              # Componentes base (Shadcn)
├── hooks/               # Custom hooks (mobile, etc.)
├── integrations/        # Clientes Supabase e Lovable
├── lib/                 # Lógica de negócio, funções de servidor e utils
│   ├── auth-context.tsx # Gerenciamento de sessão e papéis (RBAC)
│   └── *.functions.ts   # RPCs (Server Functions)
├── routes/              # Definição de rotas (TanStack Router)
│   ├── _authenticated/  # Rotas protegidas por autenticação
│   ├── api/             # Endpoints HTTP (Webhooks/Public)
│   └── index.tsx        # Landing Page
└── styles.css           # Configuração global do Tailwind v4
```

---

## 4. Design System e Fontes
O sistema utiliza uma paleta monocromática elegante com foco em tipografia legível e animações de alta performance.

### Tipografia (Configurada em `src/styles.css`):
- **Sans/Mono:** `Plus Jakarta Sans` — Utilizada para toda a interface e dados, proporcionando um ar moderno e limpo.
- **Serif:** `Syne` — Utilizada para títulos e elementos de destaque, conferindo personalidade à marca.

### Cores (Tokens OKLCH):
- **Background:** `oklch(1 0 0)` (Branco) | **Dark:** `oklch(0.129 0.042 264.695)`
- **Primary:** `oklch(0.14 0 0)` (Preto/Cinza Profundo)
- **Accent:** Tokens semânticos que garantem acessibilidade em ambos os modos.

---

## 5. Modelo de Dados (PostgreSQL)
A plataforma utiliza o Supabase para gerenciar o banco de dados.

### Tabelas Principais:
- `profiles`: Dados detalhados dos membros (nome, contato, status ministerial, alergias).
- `user_roles`: Gerenciamento de permissões (`admin_geral`, `membro`, etc.).
- `kids_children` & `kids_guardians`: Gestão do módulo Kids com suporte a fotos.
- `kids_sessions`: Registros de check-in/out em tempo real.
- `ministerios`, `redes`, `mesas`: Estrutura organizacional da igreja.
- `worship_songs` & `worship_schedules`: Módulo de louvor.

### Segurança (RLS):
Toda tabela possui **Row Level Security** habilitado.
- **Políticas:** Membros veem apenas seus dados; Líderes veem seus liderados; Admins possuem acesso total via função `has_role()`.

---

## 6. Fluxos de Negócio Detalhados

### 6.1 Módulo Kids (Segurança Visual & QR)
1. **Cadastro:** Pais cadastram filhos e autorizam responsáveis (com foto via webcam/celular).
2. **Check-in:** Voluntário gera um QR Code único para a sessão.
3. **Notificação:** O sistema envia um link de WhatsApp (`wa.me`) para o pai confirmando a entrada.
4. **Retirada:** O responsável apresenta o QR Code ou a voluntária valida a foto no sistema. O checkout é registrado com timestamp.

### 6.2 Gestão de Membros
- **Wizard:** Cadastro guiado em passos (Dados Pessoais -> Endereço -> Eclesiástico).
- **Status Ministerial:** Diferenciação visual para Pastores, Líderes e Apascentadores.
- **Aprovação:** Novos cadastros caem em uma fila de moderação (`membership_requests`).

### 6.3 Louvor e Mídia
- **Modo Palco:** Interface otimizada para tablets/monitores no palco com letras e cifras.
- **Escalas:** Gestão de voluntários por data e função.

---

## 7. Integrações Externas
- **WhatsApp:** Utiliza links diretos (`wa.me`) com mensagens pré-configuradas, garantindo segurança contra banimentos por não utilizar automações não oficiais.
- **Supabase Storage:** Bucket `kids-photos` para armazenamento privado de imagens com URLs assinadas temporárias.

---

## 8. Como Replicar
1. **Ambiente:** Node.js + Bun/NPM.
2. **Repositório:** Clonar estrutura TanStack Start.
3. **Backend:** Criar projeto no Supabase, rodar as migrations da pasta `supabase/migrations/` (respeitando a ordem cronológica).
4. **Variáveis:** Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. **Storage:** Criar o bucket `kids-photos` e aplicar as políticas de RLS para `authenticated`.

Este documento serve como a base técnica para a Igreja Batista Atos, garantindo perenidade e facilidade de evolução tecnológica.
