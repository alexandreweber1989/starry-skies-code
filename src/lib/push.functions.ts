import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const envioSchema = z.object({
  title: z.string().trim().min(2).max(80),
  message: z.string().trim().min(2).max(400),
  url: z.string().trim().max(300).optional(),
  type: z.enum(["emergency", "announcement", "event"]).default("announcement"),
  audience: z.enum(["todos", "mesa", "rede", "ministerio", "lideranca"]).default("todos"),
  audienceRef: z.string().uuid().optional(),
});

/** Envia a notificação para o público escolhido. Exclusivo do admin geral. */
export const enviarNotificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => envioSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });
    if (!isAdmin) throw new Error("Apenas a administração pode enviar notificações.");

    const { enviarPush, resolverPublico } = await import("./push.server");
    const userIds = await resolverPublico(data.audience, data.audienceRef);
    if (userIds.length === 0) return { enviados: 0, falhas: 0, semAparelho: 0, expiradas: 0, pessoas: 0 };

    const resultado = await enviarPush(
      userIds,
      {
        title: data.title,
        body: data.message,
        url: data.url || "/dashboard",
        type: data.type,
        tag: `${data.type}-${Date.now()}`,
      },
      { audience: data.audience, sentBy: context.userId },
    );
    return { ...resultado, pessoas: userIds.length };
  });

/** Envia uma notificação de teste para o próprio administrador. */
export const enviarNotificacaoTeste = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { enviarPush } = await import("./push.server");
    return await enviarPush(
      [context.userId],
      {
        title: "Funcionou! 🎉",
        body: "As notificações da Igreja Batista Atos estão ativas neste aparelho.",
        url: "/dashboard",
        type: "announcement",
        tag: "teste",
      },
      { audience: "teste", sentBy: context.userId },
    );
  });
