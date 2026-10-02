---
name: auditoria-plataforma
description: O gatilho do TIME DE AGENTES da plataforma Igreja Batista Atos. Use quando o usuário mandar o time atuar — "time de agentes, atuem", "ativa o time", "roda os agentes", "auditoria da plataforma", "revisa/verifica a plataforma", ou pedir uma varredura minuciosa. Aciona os líderes peritos e seus especialistas em paralelo, verifica cada achado no código e consolida um relatório único priorizado. Aceita escopo opcional (um caminho, um módulo, ou "tudo").
---

# Time de agentes — procedimento

Quando o usuário manda o time atuar, VOCÊ (thread principal) é o maestro. Conduza
com profissionalismo e maestria: nada de relatório inchado, nada de achado não
verificado. O valor está na **priorização** e na **verificação**, não no volume.

## Arquitetura (como o time realmente funciona)

É de um nível: **você** ativa os agentes; eles não ativam uns aos outros.

- **Líderes peritos** (lentes de domínio + síntese): `auditor-seguranca`,
  `revisor-dados`, `designer-plataforma`, `guardiao-produto`, `explorador-plataforma`.
- **Especialistas** (o trabalho árduo, estreito e paralelo) — você ativa direto:
  - Segurança → `seg-rls-scanner`, `seg-pii-scanner`, `seg-endpoint-scanner`
  - Dados → `dados-erro-scanner`, `dados-migration-scanner`
  - Design → `design-tipografia-token-scanner`, `design-mobile-a11y-scanner`
- `guardiao-produto` e `explorador-plataforma` são peritos de julgamento — sem
  especialistas sob eles; ative-os direto quando o escopo pedir.

## Escopo

O argumento define o alvo. **Sem argumento**, audite o que mudou vs `main`
(`git diff --stat origin/main...HEAD`) — varrer tudo sem motivo gasta muito e
entrega pouco. Um caminho/módulo → só ele. `"tudo"` → varredura completa; avise
que vai demorar e custar mais.

## Procedimento

1. **Escopar.** Determine os caminhos reais. Decida quais domínios o escopo toca
   (não acione os sete especialistas por reflexo — só os que o escopo exige).
2. **Fan-out em paralelo.** Ative, num único lote, os especialistas dos domínios
   em jogo (e os peritos de julgamento quando couber). Passe a cada um o **escopo
   concreto** (caminhos), não "audite a plataforma". Cada um cava fundo no seu
   recorte e devolve o relatório dele.
3. **Síntese do líder.** Para cada domínio, assuma a lente do líder perito e
   junte os achados dos seus especialistas, removendo duplicatas.
4. **Verificação (o passo que não se pula).** Para cada achado que vai entrar no
   relatório final, **abra o arquivo e confirme**. Descarte o que não se sustenta.
   Lembre: a última definição de uma policy é a que vale; achado em migration não
   aplicada descreve o futuro, não o presente; achado que depende de coluna
   inexistente ainda não é bug. O que não confirmou entra como **suspeita** ou não
   entra. Nunca apresente conclusão de agente como se você tivesse verificado.
5. **Relatório único.** Ordene por gravidade real (quem é afetado, quão
   silenciosa é a falha). Para cada item: o que acontece (cenário concreto),
   `arquivo:linha`, a correção (SQL/trecho, idempotente quando for migration), e
   qual especialista levantou. Feche com o que foi examinado e o que ficou de
   fora. Se nada relevante apareceu, diga em uma linha — auditoria limpa é
   resultado legítimo.

## Aplicar correções

O time **relata e propõe**; você aplica pelo fluxo normal do `AGENTS.md`: branch +
PR, migration idempotente, nada de merge com check vermelho. Só aplique
automaticamente se o usuário já tiver dito "corrija"; caso contrário, confirme
quais ele quer. **Sempre** peça confirmação antes de: migration destrutiva,
mudança de auth/permissão, remoção de dados, ou algo que afete todos de uma vez.
