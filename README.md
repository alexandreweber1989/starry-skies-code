# Plataforma Igreja Batista Atos

Plataforma de comunidade e gestão pastoral da **Igreja Batista Atos, Ponta Grossa/PR**.
React 19 + TanStack Start/Router + Tailwind CSS 4 + Supabase.

O código já possui módulos de membros, redes, mesas, ministérios, agenda, avisos,
notícias, cuidado pastoral, Kids, louvor, livraria e cantina. A existência de uma
tela **não garante** que seu banco, permissões e integrações estejam configurados.

> **Situação da validação:** instalação, TypeScript, 18 testes unitários e builds
> local/Vercel aprovados. Há pendências de segurança, lint e hidratação da home.
> **Não liberar para produção apenas com base no build.** Consulte o
> [relatório e checklist de implantação](docs/VALIDACAO-INICIAL.md).

## Executar uma prévia sem acessar o Supabase real

Ambiente validado: Node.js 22.22.3 e npm 10.9.8. Use Node 22.12+ compatível com Vite 8.

```sh
npm ci
npm run dev:isolated -- --port 3000
```

Abra `http://localhost:3000`. A prévia traz um aviso visível e substitui as
configurações do Supabase por um domínio reservado `.invalid`. **Login, envio de
cadastros e dados internos ficam indisponíveis.** Não é um backend demonstrativo
nem um modo offline completo: fontes, imagens e outros serviços públicos ainda
podem precisar de internet. A interface de produção não recebe o aviso.

Em um preview Arena, use a URL HTTPS da porta 3000 fornecida pela plataforma. Se
necessário, permita o domínio do proxy no Vite usando a variável de ambiente
`__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.e2b.app`.

## Desenvolvimento conectado (apenas homologação)

1. Leia os bloqueios no [guia de validação](docs/VALIDACAO-INICIAL.md).
2. Copie `.env.example` para `.env.local`, que já é ignorado pelo Git.
3. Configure as variáveis com os dados de **um Supabase de homologação**.
4. Não configure chave administrativa até resolver e revisar a Issue #51 / PR #52.
5. Execute `npm run dev -- --host 0.0.0.0 --port 3000`.

O `.env` herdado ainda é versionado e há fallbacks no código. **Não use `npm run
dev` sem revisar a configuração**, pois a ausência de uma variável não assegura
isolamento. A higienização completa está acompanhada na Issue #5 / PR #63.

## Validação

```sh
npm run typecheck    # TypeScript, sem gerar arquivos
npm test             # Testes unitários com banco/rede simulados
npm run build        # Cliente + servidor; não publica
npm run lint         # Ainda falha por pendências da base
npm run check        # Typecheck + testes + build (não inclui lint)
```

Com a prévia rodando, em outro terminal:

```sh
npm run test:smoke -- http://localhost:3000
```

O smoke faz somente GET em cinco páginas públicas e uma rota inexistente. Não
valida hidratação, login, RLS ou gravações reais. Os testes unitários não carregam
os plugins de deploy do Vite, simulam o Supabase e bloqueiam `fetch` não simulado.

Para compilar o mesmo alvo configurado para a Vercel, em shell POSIX:

```sh
NITRO_PRESET=vercel npm run build
```

## Referências e entrega

- [AGENTS.md](AGENTS.md): fluxo obrigatório de Issue + Pull Request e revisão.
- [Knowledge do projeto](docs/KNOWLEDGE-PROJETO.md): domínio e decisões pastorais.
- [Blueprint](BLUEPRINT.md) e [backlog](BACKLOG.md): escopo e expansão.
- [Validação inicial e implantação](docs/VALIDACAO-INICIAL.md): resultados e pendências.
- [Notificações](docs/NOTIFICACOES.md) e [migração Supabase](docs/MIGRACAO-SUPABASE.md).
- [Editor Lovable](https://lovable.dev/projects/6d1db2ee-a5ae-4cba-ae0c-cded8da0180f).
- Endereço da aplicação informado pelo projeto: https://starry-skies-code.lovable.app.

`main` é produção e sincroniza com Vercel/Lovable. Agentes trabalham por PR;
não faça merge com checks vermelhos. Alterações de autenticação, permissões,
dados ou custos exigem confirmação humana. Esta etapa de validação não publica
nem aplica migrations.
