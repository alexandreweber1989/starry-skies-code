<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

---

# Padrão de trabalho (obrigatório para QUALQUER agente, de QUALQUER modelo)

> Leia esta seção **antes** de implementar qualquer mudança. Ela vale para todos
> os agentes de IA e colaboradores humanos deste repositório.

## 1. Toda tarefa começa por uma Issue
Nenhuma mudança é feita sem uma Issue correspondente. Cada Issue deve ser
**categorizada** com exatamente uma das labels abaixo:

| Label | Quando usar |
|---|---|
| `Correção` | Corrigir um comportamento quebrado / bug / regressão. |
| `Melhoria` | Aprimorar algo que já existe (UX, performance, refactor, processo). |
| `Nova função` | Criar uma funcionalidade que ainda não existe. |

A Issue deve descrever: **contexto**, **objetivo** e **critérios de aceite**.

## 2. Toda entrega passa por Pull Request
- **Nunca** faça commit direto em `main`. Trabalhe em uma branch e abra um PR.
- Nomeie a branch por tipo: `correcao/...`, `melhoria/...` ou `feature/...`.
- Um PR = uma Issue (mantenha o escopo pequeno e revisável).
- `main` é a branch de produção: o Vercel publica automaticamente a partir dela,
  e ela sincroniza com o Lovable. Mantenha `main` sempre funcionando.

## 3. Todo Pull Request DEVE conter na descrição
1. **Issue relacionada** — referencie com `Closes #<número>` (ou `Refs #<número>`).
2. **O que mudou** — resumo claro das alterações.
3. **Como foi validado** — testes feitos, passos de verificação, preview do Vercel.
4. **Riscos, limitações e próximos passos** — o que ficou de fora, o que observar.

Use o modelo em `.github/pull_request_template.md` (preenchido automaticamente).

## 4. Antes de abrir o PR
- Rode o lint/build local quando possível (`npm run lint`, `npm run build`).
- Mudanças de banco entram como **migration** em `supabase/migrations/`
  (nunca altere migrations já publicadas — crie uma nova).
- Respeite o Design System (tokens em `styles.css`, tipografia Syne + corpo,
  componentes em `src/components/ui`).
- Respeite o RBAC/RLS: cada papel (Admin, Pastor, Apascentador, Líder, Membro)
  só acessa o que lhe compete.

## 5. Referências
- Especificação técnica e funcional: **`BLUEPRINT.md`**.
- Backlog e categorização das tarefas: **`BACKLOG.md`** e as Issues do GitHub.
