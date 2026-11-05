---
description: Invoca o auditor de segurança para RLS, auth, RBAC, secrets e vulnerabilidades.
agent: security-auditor
model: anthropic/claude-sonnet-4-6
---

# Security Auditor Command

```
/security <foco>
```

## Exemplos

```
/security "Auditoria completa de RLS policies"
/security "Verificar vazamento de credenciais no repo"
/security "Validar server functions auth checks"
/security "Revisar bucket kids-photos signed URLs"
/security "Checar enum app_role values em policies"
```