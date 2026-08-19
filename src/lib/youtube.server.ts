import { aiGateway } from "@/lib/ai-gateway.server";

/**
 * Lógica de integração com YouTube no servidor.
 */

export async function fetchYoutubeContent(channelId: string) {
  console.log(`Starting AI extraction for YouTube channel: ${channelId}`);
  
  const prompt = `
    Analise o canal do YouTube: https://www.youtube.com/${channelId}
    Considere as seções: /streams (cultos) e /podcasts (estudos bíblicos).
    
    Retorne uma lista JSON de vídeos recentes da Igreja Batista Atos. O JSON deve ser um objeto com uma única chave "videos" contendo um array de objetos.
    Cada vídeo deve ter OBRIGATORIAMENTE: youtube_id, title, thumbnail_url, type ('service' ou 'podcast'), published_at (ISO), url.

    
    Exemplo de saída:
    {
      "videos": [
        {
          "youtube_id": "vid1",
          "title": "Culto de Domingo - Exemplo",
          "thumbnail_url": "https://images.unsplash.com/photo-1510563800743-aed236490d07?w=800&q=80",
          "type": "service",
          "published_at": "2026-08-16T19:00:00Z",
          "url": "https://www.youtube.com/watch?v=vid1"
        }
      ]
    }
  `;

  try {
    const response = await aiGateway.chat({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log("AI Gateway raw response received.");
    
    if (!content) {
      console.warn("AI Gateway returned empty content.");
      return [];
    }
    
    const parsed = JSON.parse(content);
    console.log("Successfully parsed AI JSON.");
    
    // Tenta encontrar a lista de vídeos em diferentes formatos possíveis
    const videoList = parsed.videos || parsed.results || (Array.isArray(parsed) ? parsed : []);
    console.log(`Extracted ${videoList.length} video entries.`);
    return videoList;
  } catch (error) {
    console.error("Erro ao buscar conteúdo do YouTube via AI:", error);
    return [];
  }
}