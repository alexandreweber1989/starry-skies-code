import { createFileRoute } from "@tanstack/react-router";
import { aiGateway } from "@/lib/ai-gateway.server";

/**
 * Rota para extrair metadados detalhados de um vídeo do YouTube.
 * Tenta o oEmbed primeiro e usa a automação de IA para obter detalhes como data e tipo se necessário.
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
          // 1. Tentar o oEmbed para dados básicos (Título e Thumbnail)
          const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(target)}&format=json`;
          const oembedRes = await fetch(oembedUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          
          let baseData: any = {};
          if (oembedRes.ok) {
            baseData = await oembedRes.json();
          }

          // 2. Usar a Automação de IA para obter a data e classificar o vídeo
          // O oEmbed NÃO fornece a data de publicação original.
          const prompt = `
            Você é um assistente especializado na Igreja Batista Atos (@BatistaAtos).
            Analise o link do YouTube: ${target}
            Título do vídeo (se disponível): ${baseData.title || "Desconhecido"}
            
            INSTRUÇÃO: 
            1. Identifique a data de publicação exata do vídeo (published_at).
            2. Classifique o vídeo como 'service' (Culto de domingo, celebração, oração) ou 'podcast' (Mesacast, EBD, estudo bíblico).
            3. Se não tiver certeza da data, estime com base em vídeos similares do canal ou use a data atual como fallback.
            
            Retorne EXCLUSIVAMENTE um JSON:
            {
              "title": "string",
              "youtube_id": "string",
              "type": "service" | "podcast",
              "published_at": "ISO Date String",
              "thumbnail_url": "string"
            }
          `;

          const aiResponse = await aiGateway.chat({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
          });

          const aiContent = aiResponse.choices[0].message.content;
          if (!aiContent) throw new Error("Falha na automação de metadados.");

          const finalData = JSON.parse(aiContent);

          // Garantir que temos o ID do vídeo
          if (!finalData.youtube_id) {
            const m = target.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
            finalData.youtube_id = m ? m[1] : null;
          }

          // Garantir thumbnail
          if (!finalData.thumbnail_url && finalData.youtube_id) {
            finalData.thumbnail_url = `https://img.youtube.com/vi/${finalData.youtube_id}/maxresdefault.jpg`;
          }

          return new Response(JSON.stringify(finalData), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("[YouTube Metadata] Error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Falha ao processar metadados do vídeo." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
