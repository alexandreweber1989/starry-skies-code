import { createFileRoute } from "@tanstack/react-router";

/** Entrega a chave PÚBLICA do VAPID para o navegador assinar o push.
 *  Vem do ambiente ou, na falta dele, da configuração guardada no banco.
 *  (A chave privada nunca sai do servidor.) */
export const Route = createFileRoute("/api/push/vapid-key")({
  server: {
    handlers: {
      GET: async () => {
        const { obterVapid } = await import("@/lib/push.server");
        const chaves = await obterVapid().catch(() => null);

        if (!chaves?.publicKey) {
          return new Response(
            JSON.stringify({
              error:
                "As notificações ainda não foram ativadas pela igreja. Um administrador pode ativá-las em Meu perfil.",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ publicKey: chaves.publicKey }), {
          // Curto: se a igreja gerar novas chaves, o app percebe rápido.
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
        });
      },
    },
  },
});
