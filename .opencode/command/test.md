---
description: Invoca o engenheiro de testes para Vitest, RTL, Playwright, CI, coverage, mocks.
agent: test-engineer
model: anthropic/claude-sonnet-4-6
---

# Test Engineer Command

```
/test <foco>
```

## Exemplos

```
/test "Criar testes unitários para lib/membros.ts"
/test "Testes de componente para MemberCard e KidsCheckinBoard"
/test "Testes de hook para useAuth e useAffiliations"
/test "Testes de integração para server functions (members, kids)"
/test "Configurar Playwright E2E: login → dashboard → members"
/test "Setup MSW mocks para Supabase + Auth"
/test "GitHub Actions CI: test + lint + build"
```