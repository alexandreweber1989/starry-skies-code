---
description: Invoca o revisor de arquitetura para clean code, patterns, code smells, server functions.
agent: architecture-reviewer
model: anthropic/claude-sonnet-4-6
---

# Architecture Reviewer Command

```
/arch <foco>
```

## Exemplos

```
/arch "Identificar code smells em membros.tsx"
/arch "Consolidar enums duplicados (membros.ts + igreja.ts)"
/arch "Validar pattern server functions (.functions + .server)"
/arch "Extrair hooks customizados de componentes grandes"
/arch "Config-driven navigation para app-shell"
```