import { createFileRoute } from "@tanstack/react-router";
import { googleGateway } from "@/lib/google-gateway.server";

/**
 * Rota para extrair metadados detalhados de um vídeo do YouTube via Google API.
 */
export const Route = createFileRoute("/api/public/youtube-metadata")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get("url") ?? "";
        const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(target);
        
        if (!target || !isYouTube) {
          return new Response(JSON.stringify({ error: "Informe um link do YouTube válido." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const videoId = target.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/)?.[1];
          if (!videoId) throw new Error("ID do vídeo não identificado.");

          // Usar YouTube Data API para dados precisos
          const data = await googleGateway.youtube("videos", {
            id: videoId,
            part: "snippet"
          });

          const item = data.items?.[0];
          if (!item) throw new Error("Vídeo não encontrado no YouTube.");

          const finalData = {
            title: item.snippet.title,
            youtube_id: videoId,
            type: (item.snippet.title.toLowerCase().includes("estudo") || item.snippet.title.toLowerCase().includes("podcast")) 
              ? 'podcast' : 'service',
            published_at: item.snippet.publishedAt,
            thumbnail_url: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url
          };

          return new Response(JSON.stringify(finalData), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("[YouTube Metadata] API Error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Falha ao processar metadados." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
