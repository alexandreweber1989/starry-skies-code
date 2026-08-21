import { aiGateway } from "@/lib/ai-gateway.server";

/**
 * Lógica de integração com YouTube no servidor.
 */

export async function fetchYoutubeContent(channelId: string) {
  console.log(`[YouTube Server] Starting extraction for: ${channelId}`);
  
  const prompt = `
    Você é um assistente especializado em extração de dados da Igreja Batista Atos (@BatistaAtos).
    
    URL do canal: https://www.youtube.com/${channelId}
    
    INSTRUÇÃO: Gere uma lista de 15 a 20 vídeos REAIS e HISTÓRICOS do canal @BatistaAtos.
    O usuário reclamou que a sincronização não está trazendo vídeos. 
    Se você não conseguir acessar a URL em tempo real, use sua base de conhecimento para identificar vídeos conhecidos desta igreja no YouTube.
    
    Inclua:
    1. Cultos de Celebração de Domingos (2024, 2025, 2026).
    2. Episódios do Mesacast / Estudos Bíblicos.
    3. Vídeos de eventos especiais.

    Retorne EXCLUSIVAMENTE um objeto JSON:
    {
      "videos": [
        {
          "youtube_id": "string",
          "title": "string",
          "thumbnail_url": "https://img.youtube.com/vi/[ID]/maxresdefault.jpg",
          "type": "service" | "podcast",
          "published_at": "ISO Date",
          "url": "https://www.youtube.com/watch?v=[ID]"
        }
      ]
    }
  `;

  try {
    console.log("[YouTube Server] Calling AI Gateway...");
    const response = await aiGateway.chat({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log("[YouTube Server] AI Response received");
    
    if (!content) {
      console.warn("[YouTube Server] Empty AI content");
      return [];
    }
    
    const parsed = JSON.parse(content);
    const videoList = parsed.videos || parsed.results || (Array.isArray(parsed) ? parsed : []);
    
    const normalized = videoList.map((v: any) => {
      if (!v.thumbnail_url && v.youtube_id) {
        v.thumbnail_url = `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`;
      }
      return v;
    });

    console.log(`[YouTube Server] Returning ${normalized.length} videos`);
    return normalized;
  } catch (error) {
    console.error("[YouTube Server] Extraction error:", error);
    return [];
  }
}
