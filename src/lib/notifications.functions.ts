import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendUrgentNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({
        type: z.enum(["prayer", "social"]),
        content: z.string().trim().min(1).max(2000),
        // Mantido por compatibilidade com o formulário, mas IGNORADO: o nome
        // vem do perfil de quem está logado, nunca do que o navegador envia.
        userName: z.string().optional(),
        mesaId: z.string().uuid().optional().nullable(),
        urgent: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { getLeaderContactsForMesa, getSocialAdmins, enviarWhatsAppSimulado } = await import(
      "./notifications.server"
    );

    // Nome real de quem pede (perfil do usuário logado).
    const { data: perfil } = await context.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();
    const solicitante = (perfil?.full_name ?? "").trim() || "Membro";

    // Só avisa os líderes de uma mesa da qual a pessoa realmente participa;
    // sem isso, qualquer membro poderia disparar mensagens para qualquer líder.
    let mesaId: string | null = null;
    if (data.type === "prayer" && data.mesaId) {
      const { data: vinculo } = await context.supabase
        .from("mesa_members")
        .select("id")
        .eq("mesa_id", data.mesaId)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (vinculo) mesaId = data.mesaId;
    }

    const targets = mesaId ? await getLeaderContactsForMesa(mesaId) : await getSocialAdmins();
    const tipo = data.type === "prayer" ? "Oração" : "Assistência Social";

    await Promise.all(
      targets.map((leader) => {
        if (!leader.phone) return null;
        const message = `Olá ${leader.full_name}, um novo pedido URGENTE foi recebido!\n\nSolicitante: ${solicitante}\nTipo: ${tipo}\n\nConteúdo: ${data.content}\n\nPor favor, acesse a plataforma para mais detalhes.`;
        return enviarWhatsAppSimulado(leader.phone, message);
      }),
    );

    return { success: true, targetsNotified: targets.length };
  });

export const notifyAllMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    title: z.string(),
    message: z.string(),
    type: z.enum(['emergency', 'announcement', 'event']).default('announcement')
  }).parse(data))
  .handler(async ({ data, context }) => {
    // Antes esta função chamava http://localhost:8080 — o que nunca funcionaria
    // em produção. Agora entrega de fato, pelo mesmo caminho do painel de envio.
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });
    if (!isAdmin) throw new Error("Apenas a administração pode notificar todos os membros.");

    const { enviarPush, resolverPublico } = await import("./push.server");
    const userIds = await resolverPublico("todos");
    if (userIds.length === 0) return { success: true, count: 0 };

    const resultado = await enviarPush(
      userIds,
      { title: data.title, body: data.message, url: "/dashboard", type: data.type },
      { audience: "todos", sentBy: context.userId },
    );
    return { success: true, count: userIds.length, ...resultado };
  });
