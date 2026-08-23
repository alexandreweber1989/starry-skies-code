import { createFileRoute } from "@tanstack/react-router";

/** Entrega a chave PÚBLICA do VAPID para o navegador assinar o push.
 *  (A chave privada nunca sai do servidor.) */
export const Route = createFileRoute("/api/push/vapid-key")({
  server: {
    handlers: {
      GET: async () => {
        const publicKey = process.env["VAPID_PUBLIC_KEY"] ?? "";
        if (!publicKey) {
          return new Response(
            JSON.stringify({ error: "Notificações não configuradas (VAPID_PUBLIC_KEY ausente)." }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ publicKey }), {
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
