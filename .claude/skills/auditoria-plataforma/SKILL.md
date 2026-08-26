---
name: auditoria-plataforma
description: Roda uma auditoria da plataforma da Igreja Batista Atos com o time de agentes (segurança/RLS, dados, design, produto) e consolida os achados num relatório único, verificado, ordenado por severidade. Use quando pedirem para auditar, revisar, "ver o que dá para melhorar" na plataforma, ou antes de uma entrega grande. Aceita um escopo opcional — um caminho, um módulo ou "tudo".
---

# Auditoria da plataforma

Consolida a leitura de vários especialistas num relatório só. O valor está na
**verificação** e na **priorização**, não no volume de achados.

## Escopo

O argumento define o alvo. Sem argumento, audite o que mudou em relação à `main`
(`git diff --stat origin/main...HEAD`) — auditar 80 tabelas sem motivo gasta
muito e entrega pouco.

- Um caminho ou módulo (`src/routes/_authenticated/kids`, "louvor") → só ele.
- `tudo` → varredura completa; avise que vai demorar.

## Quem chamar

Escolha pelo escopo, **não chame os quatro por reflexo**:

| Agente | Chame quando o escopo toca |
|---|---|
| `auditor-seguranca` | migrations, policies, `profiles`/papéis, `src/routes/api/public/` |
| `revisor-dados` | qualquer escrita no banco, migrations novas, server functions |
| `designer-plataforma` | telas, componentes, animação, tipografia |
| `guardiao-produto` | proposta de módulo, métrica ou automação nova |

Dispare em paralelo, num único bloco. Cada um lê o próprio pedaço e devolve o
relatório dele — nenhum deles edita arquivo.

Passe a cada agente o **escopo concreto** (caminhos), não "audite a plataforma".

## Verificar antes de reportar

Este é o passo que não se pula. Relatório de agente é hipótese, não fato.

Para cada achado que você vai incluir, **abra o arquivo e confirme**. Descarte,
sem dó, o que não se sustentar. Em particular:

- Policy citada de migration antiga pode ter sido substituída por outra mais
  nova — vale a **última** definição.
- Achado em migration ainda **não aplicada** no Supabase descreve o futuro, não o
  presente; diga isso.
- Achado que depende de coluna ou função que não existe ainda não é bug real.

Achado que você não conseguiu confirmar entra marcado como **suspeita**, ou não
entra. Nunca apresente conclusão de agente como se você tivesse verificado.

## Relatório

Ordene por severidade real (quem é afetado, quão silenciosa é a falha), não por
agente. Para cada item:

- **O que acontece** — o cenário concreto, não a categoria. "Qualquer membro
  autenticado lê o telefone de toda a igreja", não "exposição de dados".
- **Onde** — `arquivo:linha`.
- **Correção** — o trecho ou o SQL, idempotente quando for migration.
- **Origem** — qual agente levantou, e se você confirmou.

Feche com o que foi examinado e o que **ficou de fora** — um escopo declarado
vale mais que um relatório que finge ter olhado tudo.

Se nada relevante apareceu, diga isso em uma linha. Auditoria limpa é resultado
legítimo; encher o relatório para parecer útil destrói a confiança nele.

## Depois

Você relata; a correção é decisão do usuário. Não saia corrigindo os achados sem
confirmar quais ele quer — exceto quando ele já tiver pedido "audite e corrija".

Correções entram pelo fluxo do `AGENTS.md`: branch + PR, migration idempotente
em `supabase/migrations/`, e nada de merge com check vermelho.
