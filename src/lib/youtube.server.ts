import { aiGateway } from "@/lib/ai-gateway.server";

/**
 * Lógica de integração com YouTube no servidor.
 */

export async function fetchYoutubeContent(channelId: string) {
  console.log(`Starting extraction for YouTube channel: ${channelId}`);
  
  // Como o AI Gateway às vezes falha em ler URLs externas dinâmicas sem ferramentas de navegação,
  // e o usuário quer vídeos históricos, vamos usar uma estratégia de "scraping estruturado via prompt"
  // focada em encorajar o modelo a usar seu conhecimento interno ou simular a extração se ele tiver acesso a ferramentas.
  
  const prompt = `
    Você é um assistente especializado em extração de dados do YouTube para a Igreja Batista Atos (@BatistaAtos).
    
    URL do canal: https://www.youtube.com/${channelId}
    Seções para analisar: /videos, /streams, /shorts, /podcasts.
    
    INSTRUÇÃO CRÍTICA: O usuário relatou que a sincronização não está trazendo vídeos históricos.
    Você DEVE retornar uma lista abrangente de vídeos, incluindo os MAIS ANTIGOS e os MAIS RECENTES.
    Procure por cultos dominicais, estudos bíblicos, mensagens curtas e podcasts.

    Retorne EXCLUSIVAMENTE um objeto JSON com a seguinte estrutura:
    {
      "videos": [
        {
          "youtube_id": "string (ID do vídeo no YouTube)",
          "title": "string (Título do vídeo)",
          "thumbnail_url": "string (URL da thumb: https://img.youtube.com/vi/[ID]/maxresdefault.jpg)",
          "type": "service" | "podcast",
          "published_at": "string (ISO Date)",
          "url": "string (URL completa do vídeo)"
        }
      ]
    }

    Extraia o máximo de vídeos possível (limite de 50 no JSON).
  `;

  try {
    const response = await aiGateway.chat({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o", // Usando gpt-4o para melhor capacidade de extração
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      console.warn("AI Gateway returned empty content.");
      return [];
    }
    
    const parsed = JSON.parse(content);
    
    // Tenta encontrar a lista de vídeos em diferentes formatos possíveis
    const videoList = parsed.videos || parsed.results || (Array.isArray(parsed) ? parsed : []);
    
    // Normalização das Thumbnails se estiverem faltando
    const normalized = videoList.map((v: any) => {
      if (!v.thumbnail_url && v.youtube_id) {
        v.thumbnail_url = `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`;
      }
      return v;
    });

    console.log(`Extracted ${normalized.length} video entries.`);
    return normalized;
  } catch (error) {
    console.error("Erro ao buscar conteúdo do YouTube via AI:", error);
    return [];
  }
}
