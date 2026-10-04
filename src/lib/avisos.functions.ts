import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  scope: z.enum(["geral", "igreja", "ministerio", "rede", "mesa"]),
  targetId: z.string().optional().nullable(),
  category: z.enum(["aviso", "comunicado", "urgente", "acao"]).default("aviso"),
});

/** Alcance do aviso -> público do push. */
const AUDIENCE: Record<string, string> = {
  geral: "todos",
  igreja: "igreja",
  ministerio: "ministerio",
  rede: "rede",
  mesa: "mesa",
};

/**
 * Dispara a notificação push de um aviso para o público do seu alcance.
 * Exige autenticação; o envio em si usa a service_role (resolve e entrega para
 * todos os destinatários). Falha de push nunca deve derrubar a criação do aviso,
 * então o chamador trata o erro como não-fatal.
 */
export const notificarAviso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    // Apenas liderança/admin pode disparar notificação em massa.
    const { data: permitido } = await context.supabase.rpc("is_leadership", {
      _user_id: context.userId,
    });
    if (!permitido) throw new Error("Apenas a liderança pode notificar os membros.");

    const audience = AUDIENCE[data.scope];
    const refId = data.scope === "geral" ? null : data.targetId ?? null;
    if (data.scope !== "geral" && !refId) return { count: 0 };

    const { resolverPublico, enviarPush } = await import("./push.server");
    const userIds = await resolverPublico(audience, refId);
    if (userIds.length === 0) return { count: 0 };

    const resultado = await enviarPush(
      userIds,
      {
        title: data.title,
        body: data.body.length > 180 ? `${data.body.slice(0, 177)}...` : data.body,
        url: "/avisos",
        type: data.category === "urgente" ? "emergency" : "announcement",
      },
      { audience, sentBy: context.userId },
    );
    return { count: userIds.length, ...resultado };
  });
