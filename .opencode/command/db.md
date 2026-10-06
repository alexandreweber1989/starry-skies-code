---
description: Invoca o especialista em banco para migrations, schema, RLS functions, índices.
agent: database-specialist
model: anthropic/claude-sonnet-4-6
---

# Database Specialist Command

```
/db <foco>
```

## Exemplos

```
/db "Criar migration idempotente para nova tabela"
/db "Corrigir RLS recursiva em mesa_members"
/db "Adicionar índice em profiles.email"
/db "Criar função SECURITY DEFINER para nova policy"
/db "Regenerar types após migration"
```