# Notificações no celular (Web Push)

Sistema **gratuito**: usa o push do próprio navegador (Google/Mozilla/Apple),
autenticado por chaves VAPID da igreja. Não há serviço pago nem custo por
mensagem enviada.

## Configuração (uma única vez)

Defina três variáveis de ambiente no projeto (Lovable/Vercel → Settings →
Environment Variables) e faça um novo deploy:

| Variável | Valor |
| --- | --- |
| `VAPID_PUBLIC_KEY` | a chave pública gerada |
| `VAPID_PRIVATE_KEY` | a chave privada gerada (secreta) |
| `VAPID_SUBJECT` | `mailto:contato@igrejabatistaatos.com.br` |

Para gerar um novo par de chaves, se necessário:

```bash
npx web-push generate-vapid-keys
```

> A chave privada nunca é exposta ao navegador — o app lê apenas a pública,
> pela rota `/api/push/vapid-key`.

## Como o membro ativa

1. Abre **Meu perfil** e toca em **Ativar** no cartão de notificações.
2. Aceita a permissão do navegador.

**iPhone:** a Apple só entrega push para apps instalados. O membro precisa tocar
em *Compartilhar → Adicionar à Tela de Início* e abrir o app por ali. O próprio
cartão exibe essa instrução automaticamente quando detecta iPhone.

## Como a igreja envia

Botão **Notificar** no topo do painel (somente admin geral):

- escolhe o público: toda a igreja, liderança, uma rede, uma mesa ou um ministério;
- escreve título e mensagem (há modelos rápidos);
- vê a **prévia** de como aparece no celular antes de enviar.

Cada envio fica registrado em `notifications_history`, inclusive para quem ainda
não ativou as notificações (com status `sem_aparelho`).

## Manutenção

Assinaturas expiradas (app desinstalado, navegador limpo) retornam 404/410 e são
**removidas automaticamente** a cada envio — a base se mantém limpa sozinha.
