---
description: Invoca o orquestrador principal da plataforma Igreja Batista Atos para analisar, auditar e planejar melhorias.
agent: platform-orchestrator
model: anthropic/claude-sonnet-4-6
---

# Platform Orchestrator Command

Use este comando para iniciar uma análise completa ou direcionada da plataforma.

## Uso

```
/platform <tarefa>
```

## Exemplos

```
/platform "Auditoria completa de segurança"
/platform "Otimizar LCP da landing page"
/platform "Planejar importação CSV de membros"
/platform "Revisar acessibilidade do dashboard"
/platform "Criar testes para módulo Kids"
/platform "Refatorar arquitetura de server functions"
/platform "Analisar migrações pendentes no Supabase"
```

## O que o Orquestrador Faz

1. **Classifica** a demanda (Correção / Melhoria / Nova função)
2. **Delegá** ao(s) sub-agente(s) especializado(s):
   - `security-auditor` — RLS, auth, secrets, vulnerabilidades
   - `performance-optimizer` — Core Web Vitals, bundle, queries
   - `database-specialist` — Migrations, schema, RLS functions
   - `ui-ux-reviewer` — Acessibilidade, design system, mobile
   - `architecture-reviewer` — Clean code, patterns, code smells
   - `feature-planner` — Specs, user stories, breaking changes
   - `test-engineer` — Vitest, RTL, Playwright, CI, coverage
3. **Consolida** relatórios em plano de ação único
4. **Entrega**: Issues GitHub prontas + arquivos novos propostos + validação

## Regras Supremas (Aplicadas Automaticamente)

> **NUNCA modifique código fonte existente.**
> **NUNCA modifique animações em `styles.css`.**
> **NUNCA modifique o design system tipográfico:** `Syne` (títulos), `Plus Jakarta Sans` (corpo), `Fredoka` (Kids), pesos, fallbacks, `@font-face`.
> Apenas analise, documente e proponha via **novos arquivos**.