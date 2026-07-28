# Sistema de Gestão — Igreja Batista Atos

Direção escolhida: **Editorial Arquitetônico** (Inter Tight + JetBrains Mono, paleta creme/terracota, grid rígido).

## Ministérios cobertos
Dança, Mídia, Louvor, Mulheres, Homens, Jovens, Adolescentes, Kids e Projeto Social **Atos de Amor**. Cada um com página própria, membros, escalas, eventos e conteúdo.

## Foco atual: entender profundamente os ministérios
Antes de codar, quero mapear o funcionamento real de cada ministério para que o sistema sirva de verdade. Para cada um preciso saber:

- **Líder(es)** responsáveis e vices.
- **Dia/horário** dos encontros, ensaios e reuniões.
- **Funções internas** (ex.: Louvor tem vocal/guitarra/bateria; Mídia tem câmera/projeção/transmissão; Kids tem professor/auxiliar/recepção).
- **Frequência das escalas** (semanal, quinzenal, mensal).
- **Materiais/recursos** que o ministério precisa gerenciar (repertório, cifras, coreografias, artes, lições, doações).
- **Regras específicas** (ex.: Kids exige check-in seguro; Atos de Amor controla estoque; Louvor tem setlist por culto).
- **Público-alvo** e critérios de participação (faixa etária, batismo, etc.).

Vou te pedir esses detalhes por ministério antes de começar a construir a Fase 1.

## Fase 1 — Fundação
- **Autenticação** (Lovable Cloud): login e-mail/senha, cadastro, recuperação.
- **Perfis** com nome, telefone, foto, ministério(s).
- **Papéis** em tabela separada: `admin`, `líder`, `membro`, `visitante`.
- **Dashboard principal** (layout escolhido): membros, ministérios, próximos eventos, escala do próximo domingo, atividades recentes.
- **CRUD de Ministérios**: criar, editar, arquivar, definir líder, dia/horário, funções.
- **CRUD de Membros**: cadastro completo (dados, batismo, aniversário, endereço), vínculo com ministérios.
- **Página dedicada por ministério**: membros, escalas, eventos, avisos, arquivos.

## Fase 2 — Operação dos ministérios
- **Escalas**: criar por culto/evento, atribuir por função, confirmar/recusar.
- **Eventos e calendário** (mês/semana, filtro por ministério).
- **Repertório do Louvor**: banco de músicas (tom, cifra, letra), setlist por culto.
- **Kids seguro**: check-in/check-out com código único, responsáveis, alergias.
- **Ensaios da Dança**: coreografias, vídeos de referência, presença.
- **Mídia**: banco de artes, avisos para telão, roteiro de transmissão.
- **Mural de avisos** por ministério + notificações.

## Fase 3 — Portal de notícias e comunicação (para os membros)
Um espaço central onde a igreja publica e os membros consultam:
- **Notícias** da igreja (posts com imagem, categorias, autor).
- **Eventos futuros** com destaque, inscrição e lembrete automático.
- **Lembretes importantes** fixados no topo (ex.: mudança de horário, campanha).
- **Avisos por ministério** (visíveis só para membros daquele ministério).
- **Aniversariantes da semana** e datas especiais.
- **Feed pessoal** do membro: minhas escalas, meus eventos, minhas notificações.
- **Push/e-mail** para lembretes críticos.

## Fase 4 — Pastoral e comunidade
- **Mesas** (pequenos grupos da igreja — nome usado na Igreja Atos): cadastro, membros, líder, dia/local, relatório semanal.
- **Visitantes e integração** (acolhimento).
- **Pedidos de oração** (privado/público).
- **Discipulado**: trilha por membro.

## Fase 5 — Atos de Amor (Projeto Social)
- **Famílias assistidas** e histórico de atendimentos.
- **Doações** (estoque de itens, cestas).
- **Voluntários** e escala das ações.
- Relatórios de impacto.

## Fase 6 — Financeiro
- **Dízimos e ofertas** (por membro, por culto).
- **Despesas** por categoria/ministério (orçamento).
- **Relatórios** mensais/anuais, exportação CSV/PDF.
- **Recibos** de contribuição.

## Fase 7 — Extras opcionais
- PWA instalável no celular.
- Notificações por WhatsApp.
- Página pública da igreja (horários, transmissão ao vivo).

## Stack
- TanStack Start + React + Tailwind v4, tokens da direção (Inter Tight/Inter/JetBrains Mono, creme #FAF9F6 + terracota #92400E).
- Lovable Cloud: Postgres, auth, storage, funções.
- Segurança: RLS em todas as tabelas + `user_roles` separada.

## Próximo passo
Antes de começar a construir, me responda por ministério (pode ser resumido, um por linha):

1. **Louvor** — quem lidera, quando ensaia, quais funções na escala?
2. **Mídia** — quem lidera, funções (câmera, projeção, transmissão, foto)?
3. **Dança** — líder, dia dos ensaios, faixa etária?
4. **Mulheres** — líder, encontros regulares?
5. **Homens** — líder, encontros regulares?
6. **Jovens** — líder, dia do culto/encontro, faixa etária?
7. **Adolescentes** — líder, encontros, faixa etária?
8. **Kids** — líder, faixas etárias das turmas, professores?
9. **Atos de Amor** — líder, tipo de ação (cestas, roupas, atendimentos), frequência?

Também confirme:
- Começamos pela **Fase 1** depois desse mapeamento?
- Cores/tipografia da direção estão aprovadas?
