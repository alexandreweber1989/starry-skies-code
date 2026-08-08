# Blueprint Mestre da Plataforma Igreja Batista Atos (V2 - Extendido)

Este documento é a especificação técnica máxima para a replicação total da plataforma. Ele cobre desde a infraestrutura de dados até a lógica de componentes e roteamento.

---

## 1. Arquitetura do Sistema
A plataforma é uma aplicação **TanStack Start v1** (Full-Stack React 19) operando em um ambiente **Serverless/Edge**.

### 1.1 Tecnologias Core
- **Frontend:** React 19 (Hooks, Suspense, Concurrent Mode).
- **Roteamento:** TanStack Router (Tipagem estrita, carregamento paralelo).
- **Gerenciamento de Estado:** TanStack Query v5 (Cache global e sincronização).
- **Backend-as-a-Service:** Lovable Cloud (Baseado em Supabase/PostgreSQL).
- **Estilização:** Tailwind CSS v4 (Lightning CSS build, OKLCH colors).
- **Componentes:** Radix UI (Base para acessibilidade).
- **Validação:** Zod (Schema validation para API e formulários).

---

## 2. Estrutura de Pastas e Responsabilidades

### 2.1 `/src/components` (UI/UX)
- **`admin/`**: Diálogos e editores para a estrutura organizacional (Igrejas, Redes, Mesas).
- **`kids/`**: O sistema de segurança infantil. Inclui `checkin-board` para voluntários e `photo-input` para captura via webcam.
- **`membros/`**: O `member-wizard-dialog.tsx` é o componente mais complexo, lidando com formulários multi-passo.
- **`louvor/`**: `stage-mode.tsx` fornece uma interface de alto contraste para músicos.
- **`ui/`**: Componentes atômicos (Button, Input, Card) customizados com o design system da Igreja.

### 2.2 `/src/lib` (Lógica e Integração)
- **`auth-context.tsx`**: O coração do RBAC. Define quem é `admin_geral` ou `membro`.
- **`*.functions.ts`**: RPCs que executam no servidor (Node/Edge). Exemplos: `kids.functions.ts` para geração de QR Codes e `membership.functions.ts` para aprovação de cadastros.
- **`*.server.ts`**: Helpers que NUNCA são enviados ao cliente, protegendo a lógica de banco de dados.

### 2.3 `/src/routes` (Navegação)
- **`_authenticated/`**: Layout seguro que redireciona usuários não logados.
- **`api/public/`**: Endpoints para integração externa (Webhooks).

---

## 3. Design System (Identidade Visual)
Configurado em `src/styles.css`.

### 3.1 Tipografia
- **Títulos (Serif):** `Syne` - Transmite solidez e história.
- **Corpo (Sans):** `Plus Jakarta Sans` - Focada em legibilidade extrema.
- **Tokens:** `tracking-tight` para títulos e `tracking-[0.3em]` para metadados (estilo Apple/Minimalista).

### 3.2 Cores (Semântica OKLCH)
- **Background Principal:** `oklch(1 0 0)` no claro, `oklch(0.129 0.042 264.695)` no escuro.
- **Animações:** `animate-reveal` (subida com blur) e `pt-overlay` (transições de página com persianas dinâmicas).

---

## 4. Banco de Dados (Schema PostgreSQL)

### 4.1 Tipos Customizados (Enums)
- `app_role`: `['admin_geral', 'admin_ministerio', 'lider_mesa', 'membro']`
- `ministerial_status`: `['Membro', 'Líder', 'Apasc.', 'Pr.', 'Pra.']`

### 4.2 Tabelas Críticas
- **`profiles`**: `id (UUID)`, `full_name`, `birth_date`, `status_ministerial`, `church_id`, `alergias`, `restricoes_alimentares`.
- **`kids_children`**: `id`, `name`, `photo_url`, `parent_id`.
- **`kids_sessions`**: `id`, `child_id`, `checkin_at`, `checkout_at`, `status ('presente', 'retirado')`, `qr_code_id`.
- **`user_roles`**: Tabela de junção para permissões granulares.

### 4.3 Segurança (RLS - Row Level Security)
- **Regra 0:** Nenhuma tabela é pública sem política.
- **Função `has_role(_user_id, _role)`**: Função `SECURITY DEFINER` que checa permissões sem recursão.
- **Política de Membros:** `USING (auth.uid() = id)` permite que o membro veja apenas a si mesmo.
- **Política de Kids:** Somente usuários com a role `admin_geral` ou `admin_kids` podem ver a `photo_url` das crianças.

---

## 5. Módulos de Especialidade

### 5.1 Kids & QR Check-in
- **Fluxo:** Registro -> Foto do Responsável -> Check-in -> Geração de QR -> Notificação via `wa.me` -> Leitura do QR no Checkout.
- **Segurança:** URLs das fotos são assinadas (`signedUrls`) com expiração de 60 minutos para evitar vazamentos.

### 5.2 Gestão Ministerial
- **Mesa/Rede:** Cada grupo possui um ou dois líderes (geralmente um casal). O sistema vincula `profiles` a `redes` via tabelas de junção, permitindo que o líder veja o Whatsapp de seus liderados.

### 5.3 Livraria e Cantina
- **Financeiro:** Suporte a QR Code PIX dinâmico (componente `pix-dialog.tsx`).
- **Logística:** Fila de demanda em tempo real para pedidos da cantina.

---

## 6. Checklist de Replicação
1. **Configurar TanStack Start:** `npm create tanstack/start`.
2. **Importar CSS:** Copiar `src/styles.css` e instalar `tw-animate-css`.
3. **Database:** Rodar as migrations em ordem e criar os Buckets no Storage (`kids-photos`).
4. **Auth:** Configurar Google Auth e Magic Link no painel do Supabase.
5. **Types:** Executar `npx supabase gen types typescript` para sincronizar o frontend.

---

Este documento é a alma técnica da Igreja Batista Atos. Replicar este sistema exige atenção especial às políticas de RLS e à hierarquia de roles.
