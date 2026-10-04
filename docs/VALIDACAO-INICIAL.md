# Validação inicial e implantação — Igreja Batista Atos

**Data:** 04/10/2026 · **Issue:** [#80](https://github.com/alexandreweber1989/starry-skies-code/issues/80)

## Resumo para a liderança

A plataforma já está implementada em grande parte e pode ser explorada numa
prévia visual. **Ainda não está homologada para uso com os dados dos membros.**
Esta etapa corrigiu a instalação reproduzível, acrescentou comandos de validação,
ampliou testes e preparou uma prévia sem acesso ao Supabase da igreja.

Não houve acesso autenticado, cadastro de pessoas, troca de senhas, aplicação de
SQL, alteração de permissões ou publicação em produção. Não foi feita uma
auditoria completa de segurança nem conferência do banco remoto.

## O que foi executado

| Verificação                             | Resultado                                          | Limite da evidência                                                                          |
| --------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm ci`                                | Aprovado após sincronizar o lockfile               | O lock referenciava `@lovable.dev/vite-tanstack-config` 2.13.1, mas o projeto exigia 2.23.1  |
| `npm run typecheck`                     | Aprovado                                           | Tipos não validam o schema efetivamente instalado no Supabase                                |
| `npm test`                              | 18 testes aprovados (antes eram 2)                 | 6 de persistência Kids com mock e 12 de CEP com `fetch` simulado                             |
| `npm run build`                         | Aprovado                                           | Cliente, SSR e alvo padrão do Nitro; não é deploy                                            |
| `NITRO_PRESET=vercel npm run build`     | Aprovado                                           | Gera artefatos Vercel localmente; não comprova variáveis ou funcionamento do servidor remoto |
| `npm run test:smoke`                    | 6 verificações aprovadas                           | HTML de `/`, `/auth`, `/boas-vindas`, `/kids/visitante`, `/config-vercel` e HTTP 404         |
| Navegador Chromium, 1440×1000 e 390×844 | Navegação pública e interações básicas verificadas | Sem envio de formulários nem autenticação; achados abaixo                                    |
| `npm run lint`                          | Reprovado na base                                  | A execução inicial reportou 27.352 erros e 23 avisos, incluindo ferramentas de terceiros     |

A checagem separada de `src/` reportou 5.673 erros e 23 avisos antes da formatação
dos arquivos desta entrega: predominam formatação (5.400) e `any` (254), mas há
**17 violações das regras de Hooks** em `membros.tsx` e `faxina.tsx`. Não foi
aplicado `--fix` global para evitar misturar milhares de mudanças a esta entrega.

### Navegador: o que de fato foi testado

- Páginas públicas acima e uma rota inexistente, com movimento normal e reduzido.
- Ausência de overflow horizontal nas larguras 390 e 1440 nas páginas verificadas.
- Abas “Entrar” / “Solicitar” da tela de acesso.
- Botão “Diga um oi para nós” abrindo o formulário de boas-vindas.
- Acesso anônimo a `/dashboard` redirecionando para `/auth`.
- Presença do aviso de prévia isolada. Nenhuma requisição ao Supabase real foi
  observada nesses percursos.

Com `prefers-reduced-motion: reduce`, a home apresentou **hydration mismatch**
na seção `Pilares` e erro do Framer Motion (`Target ref is defined but not
hydrated`). O código escolhe estruturas diferentes durante SSR e no primeiro
render do navegador. É uma pendência real, relacionada à revisão de movimento
na [Issue #17](https://github.com/alexandreweber1989/starry-skies-code/issues/17).

Algumas fontes, imagens e consultas públicas externas tiveram falhas de rede no
ambiente de testes. A checagem não equivale à aprovação visual completa, auditoria
de acessibilidade, teste em aparelhos reais ou teste ponta a ponta da gestão.

## Bloqueios antes de conectar dados reais

### 1. Segurança de contas — prioridade crítica

`src/lib/auth-admin.functions.ts` ainda contém `updateUserPassword` sem middleware
de autenticação/autorização. A função usa operações administrativas para criar
contas ou trocar senhas. **Confirmado no código; não executado contra o backend.**
A explorabilidade remota depende das credenciais e configuração do ambiente,
que não foram verificadas.

- Revisar a [Issue #51](https://github.com/alexandreweber1989/starry-skies-code/issues/51)
  e o [PR #52](https://github.com/alexandreweber1989/starry-skies-code/pull/52), já existentes.
- Não disponibilizar uma chave administrativa a essa versão antes da correção.
- A Issue #51 relata exposição histórica de chave privilegiada: confirmar no
  painel do Supabase e revogar/rotacionar credenciais comprometidas. Remover o
  segredo do código não revoga cópias antigas.
- Exigir confirmação humana antes do merge da alteração de autenticação.

### 2. Configuração do Supabase

O cliente administrativo aceita fallback para uma chave pública, o que não
concede os privilégios administrativos esperados. Os clientes também possuem
fallback de projeto no código. Portanto, “sem variável” não significa “sem
conexão”. O `.env` herdado continua versionado.

Acompanhar [Issue #5](https://github.com/alexandreweber1989/starry-skies-code/issues/5)
e [PR #63](https://github.com/alexandreweber1989/starry-skies-code/pull/63).
Esse PR não foi aplicado ou homologado nesta entrega. Revisar a solução completa,
incluindo middleware, antes de utilizá-la; o título do PR não comprova cobertura.

### 3. Estabilidade e integrações incompletas

- Corrigir as violações de Hooks e reproduzir os fluxos de membros e faxina com
  contas de teste. Build verde não detecta esses problemas de execução.
- Corrigir e testar a hidratação da home com movimento reduzido.
- `/api/public/live-status` retorna um estado fixo, não consulta a transmissão.
- `/api/public/sms-whatsapp` registra uma mensagem no log e retorna sucesso,
  mas não faz um envio real. Não anunciar WhatsApp como integração operacional.
- Banco, RLS, Storage, OAuth, recuperação de senha, push, compras, escalas e
  processos Kids ainda precisam de homologação com dados fictícios.

## Como continuar com segurança

### Etapa A — explorar sem credenciais

```sh
npm ci
npm run dev:isolated -- --port 3000
```

O script substitui configurações do Supabase, inclusive variáveis herdadas,
por valores sem acesso e pelo domínio reservado `preview.supabase.invalid`.
O aviso só aparece em desenvolvimento. O login e os cadastros **não funcionarão**:
isso é intencional. Não preencha dados reais. Fontes, imagens e serviços externos
não estão isolados por esse script; ele não é uma barreira geral de rede.

### Etapa B — homologação conectada (após correção de segurança)

1. Separe um projeto Supabase de homologação e não copie dados pessoais reais.
2. Revise o histórico de migrations em `supabase/migrations/` e o estado do banco.
   Não execute todos os SQLs indiscriminadamente nem altere migrations publicadas.
3. Copie `.env.example` para `.env.local` e configure:

   | Variável                        | Uso                                                                  |
   | ------------------------------- | -------------------------------------------------------------------- |
   | `VITE_SUPABASE_URL`             | URL pública do projeto de homologação no navegador                   |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública/publishable do mesmo projeto                           |
   | `SUPABASE_URL`                  | Mesmo projeto, no servidor                                           |
   | `SUPABASE_PUBLISHABLE_KEY`      | Chave pública usada pelo middleware autenticado                      |
   | `SUPABASE_SERVICE_ROLE_KEY`     | Credencial privilegiada, somente servidor, após revisão de segurança |

   Nunca use prefixo `VITE_` para segredo. Nunca salve credenciais em arquivos
   versionados, Issues ou chat. Este guia não altera o `.env` existente.

4. No Supabase → Authentication → URL Configuration, confira a URL do site e
   autorize os retornos exatos do ambiente, inclusive `/auth/callback` para OAuth
   e o retorno de recuperação de senha. Configure o provedor Google se utilizado.
5. Execute `npm run dev -- --host 0.0.0.0 --port 3000` e teste contas fictícias por
   papel. Não contorne RLS nem transforme todos os usuários em administradores.
6. Valide dados após cada gravação, mensagens de erro e os acessos negados:
   - acesso, solicitação/aprovação e recuperação de senha;
   - membro: próprios dados e grupos permitidos;
   - liderança: apenas o escopo de mesa/rede/ministério autorizado;
   - administração: funções delegadas, não acesso irrestrito por conveniência;
   - Kids: responsáveis, check-in e retirada segura com dados fictícios;
   - agenda, avisos, cuidado pastoral, louvor, livraria e cantina.

### Etapa C — publicação controlada

- [ ] Correção crítica revisada e aprovada por pessoa responsável.
- [ ] Credenciais expostas revogadas/rotacionadas quando aplicável.
- [ ] Migrations revisadas e aplicadas somente no ambiente correto, com backup.
- [ ] Testes de autenticação e permissões por papel aprovados em homologação.
- [ ] Pendências de Hooks/hidratação corrigidas e lint tratado em escopo próprio.
- [ ] Variáveis configuradas na **Vercel**, em Preview e Production conforme o
      ambiente. Variáveis do Lovable não são automaticamente variáveis da Vercel.
- [ ] `vercel.json` respeitado: `NITRO_PRESET=vercel npm run build`.
- [ ] PR com checks verdes e preview remoto efetivamente testado.
- [ ] Autorização humana para mudanças de autenticação/permissões ou impacto geral.

Nenhuma dessas etapas autoriza merge com build vermelho. Esta validação inicial
não inclui publicação nem merge em `main`.
