import { googleGateway } from "@/lib/google-gateway.server";

/**
 * Lógica de integração com YouTube no servidor utilizando a API oficial.
 */

export async function fetchYoutubeContent(channelHandle: string) {
  console.log(`[YouTube Server] Fetching real data for: ${channelHandle}`);
  
  try {
    // 1. Obter Channel ID a partir do handle
    const searchRes = await googleGateway.youtube("search", {
      q: channelHandle,
      type: "channel",
      part: "id",
      maxResults: "1"
    });

    const channelId = searchRes.items?.[0]?.id?.channelId;
    if (!channelId) throw new Error("Canal não encontrado.");

    // 2. Buscar vídeos recentes
    const videosRes = await googleGateway.youtube("search", {
      channelId,
      part: "snippet",
      order: "date",
      type: "video",
      maxResults: "25"
    });

    const videos = (videosRes.items || []).map((item: any) => ({
      youtube_id: item.id.videoId,
      title: item.snippet.title,
      thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      // Classificação heurística baseada no título para manter compatibilidade
      type: (item.snippet.title.toLowerCase().includes("estudo") || item.snippet.title.toLowerCase().includes("podcast")) 
        ? 'podcast' : 'service',
      published_at: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    return videos;
  } catch (error) {
    console.error("[YouTube Server] Error fetching via Google API:", error);
    return [];
  }
}
