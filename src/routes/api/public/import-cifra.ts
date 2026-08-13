import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/import-cifra")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const urlParams = new URL(request.url).searchParams;
        const targetUrl = urlParams.get("url");

        if (!targetUrl || !targetUrl.includes("cifraclub.com.br")) {
          return new Response(JSON.stringify({ error: "URL inválida do CifraClub" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const response = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          });

          if (!response.ok) throw new Error("Falha ao buscar página");
          const html = await response.text();

          // Extração ultra-simples via Regex para evitar dependências pesadas de DOM no Worker
          const title = html.match(/<h1 class="t1">([^<]+)<\/h1>/)?.[1] || "";
          const artist = html.match(/<h2 class="t3">([^<]+)<\/h2>/)?.[1] || "";
          const key = html.match(/id="cifra_tom"[^>]*>([^<]+)<\/a>/)?.[1] || "";
          
          // A cifra no CifraClub costuma estar dentro de uma tag <pre> ou identificada por classes
          // Tentamos pegar o conteúdo bruto para o parser existente lidar
          const chordsMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
          let rawContent = chordsMatch ? chordsMatch[1] : "";
          
          // Limpeza básica de tags HTML se houver
          rawContent = rawContent.replace(/<[^>]*>/g, "");

          return new Response(
            JSON.stringify({
              title: title.trim(),
              artist: artist.trim(),
              key: key.trim(),
              content: rawContent.trim(),
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          return new Response(JSON.stringify({ error: "Erro ao processar a cifra" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
