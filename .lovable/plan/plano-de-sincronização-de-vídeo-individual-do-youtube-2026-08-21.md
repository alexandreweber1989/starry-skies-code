# Plano de Sincronização de Vídeo Individual do YouTube

Implementação da funcionalidade para sincronizar um vídeo específico do YouTube via link direto na Central de Mídia, permitindo que qualquer membro visualize o conteúdo organizado por data.

## Alterações

### Backend (Server Functions & API)

- **Nova Rota API**: Criar `src/routes/api/public/youtube-metadata.ts` para extrair metadados detalhados de um vídeo (incluindo data de publicação) via oEmbed ou scraping leve.
- **Função de Servidor**: Em `src/lib/youtube.functions.ts`, adicionar `syncSingleYoutubeVideo` que:
  - Valida o link do YouTube.
  - Chama a nova API de metadados.
  - Verifica se o vídeo é um culto ou podcast (via título ou manual).
  - Insere/Atualiza na tabela `youtube_videos`.

### Frontend (Interface)

- **Central de Mídia (`src/routes/_authenticated/midia.tsx`)**:
  - Adicionar um novo botão "Adicionar Vídeo por Link" ao lado do botão de sincronização global.
  - Criar um diálogo (modal) com um campo de entrada para o link do YouTube.
  - Mostrar feedback visual (loading/sucesso/erro) durante a sincronização do link.
  - Garantir que a lista de vídeos seja atualizada automaticamente após a inserção.

## Detalhes Técnicos

- **Extração de Data**: O oEmbed do YouTube às vezes omite a data exata. Utilizaremos o assistente de automação (IA) em `src/lib/youtube.server.ts` se necessário para inferir a data real ou formatar os dados extraídos, garantindo que `published_at` seja persistido corretamente para ordenação.
- **Segurança**: Apenas administradores (`admin_geral`) poderão adicionar vídeos para garantir a curadoria do conteúdo da igreja.

## Verificação

- Inserir links de diferentes formatos (watch?v=, youtu.be, shorts).
- Confirmar se a data de publicação é extraída corretamente.
- Verificar se o vídeo aparece na lista e se redireciona corretamente para o player do YouTube.
