# Sistema de Gestão — Igreja Batista Atos

Você escolheu a direção **Editorial Arquitetônico** (Inter Tight + JetBrains Mono, paleta creme/terracota, grid rígido). Abaixo está tudo que proponho construir. Podemos ajustar antes de começar.

## Ministérios cobertos
Dança, Mídia, Louvor, Mulheres, Homens, Jovens, Adolescentes, Kids e Projeto Social **Atos de Amor**. Cada um com página própria, membros, escalas e eventos.

## Fase 1 — Fundação
- **Autenticação** (Lovable Cloud): login e-mail/senha, cadastro, recuperação.
- **Perfis** com nome, telefone, foto, ministério(s).
- **Papéis** em tabela separada: `admin`, `líder`, `membro`, `visitante`.
- **Dashboard principal** (layout escolhido): membros, ministérios, próximos eventos, escala do próximo domingo, atividades recentes.
- **CRUD de Ministérios**: criar, editar, arquivar, definir líder, dia/horário.
- **CRUD de Membros**: cadastro completo (dados, batismo, aniversário, endereço), vínculo com ministérios.
- **Página dedicada por ministério**: membros, escalas, eventos, avisos, arquivos.

## Fase 2 — Operação dos ministérios
- **Escalas**: criar por culto/evento, atribuir por função (vocal, câmera, professor Kids), confirmar/recusar.
- **Eventos e calendário** (mês/semana, filtro por ministério).
- **Repertório do Louvor**: banco de músicas (tom, cifra, letra), setlist por culto.
- **Kids seguro**: check-in/check-out com código único, responsáveis, alergias.
- **Ensaios da Dança**: coreografias, vídeos de referência, presença.
- **Mídia**: banco de artes, avisos para telão, roteiro de transmissão.
- **Mural de avisos** por ministério + notificações.

## Fase 3 — Pastoral e comunidade
- **Pequenos grupos/células** com relatório semanal.
- **Visitantes e integração** (acolhimento).
- **Pedidos de oração** (privado/público).
- **Aniversariantes** e datas importantes.
- **Discipulado**: trilha por membro.

## Fase 4 — Atos de Amor (Projeto Social)
- Cadastro de **famílias assistidas** e histórico.
- **Doações** (estoque de itens, cestas).
- **Voluntários** e escala das ações.
- Relatórios de impacto.

## Fase 5 — Financeiro
- **Dízimos e ofertas** (por membro, por culto).
- **Despesas** por categoria/ministério (orçamento).
- **Relatórios** mensais/anuais, exportação CSV/PDF.
- **Recibos** de contribuição.

## Fase 6 — Extras opcionais
- PWA instalável no celular.
- Notificações por e-mail (escalas, eventos).
- Integração WhatsApp.
- Página pública da igreja (horários, transmissão).

## Stack
- TanStack Start + React + Tailwind v4, tokens da direção (Inter Tight/Inter/JetBrains Mono, creme #FAF9F6 + terracota #92400E).
- Lovable Cloud: Postgres, auth, storage, funções.
- Segurança: RLS em todas as tabelas + `user_roles` separada.

## Sugestão de entrega
Começar pela **Fase 1 completa** (já dá para usar o sistema: login, ministérios, membros, dashboard). Evoluir por fase conforme prioridade.

## Antes de começar, me confirme
1. Inicio pela Fase 1 ou prefere reorganizar prioridades (ex.: Escalas ou Financeiro primeiro)?
2. Alguma fase para **remover** ou **adicionar** (EBD, missões, transmissão ao vivo)?
3. Cores/tipografia da direção estão aprovadas ou quer ajustar (ex.: azul da identidade da igreja)?
