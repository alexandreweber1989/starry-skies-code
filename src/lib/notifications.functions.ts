import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const sendUrgentNotification = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    type: z.enum(["prayer", "social"]),
    content: z.string(),
    userName: z.string(),
    mesaId: z.string().optional(),
    urgent: z.boolean().default(true)
  }).parse(data))
  .handler(async ({ data }) => {
    const { getLeaderContactsForMesa, getSocialAdmins } = await import("./notifications.server");
    const { sendWhatsAppNotification } = await import("./whatsapp.functions");
    
    const { type, content, userName, mesaId, urgent } = data;
    
    let targets: { full_name: string; phone: string | null }[] = [];
    
    if (type === 'prayer' && mesaId) {
      targets = await getLeaderContactsForMesa(mesaId);
    } else {
      targets = await getSocialAdmins();
    }

    const results = await Promise.all(targets.map(leader => {
      if (!leader.phone) return Promise.resolve(null);
      
      const message = `Olá ${leader.full_name}, um novo pedido URGENTE foi recebido!\n\nSolicitante: ${userName}\nTipo: ${type === 'prayer' ? 'Oração' : 'Assistência Social'}\n\nConteúdo: ${content}\n\nPor favor, acesse a plataforma para mais detalhes.`;
      
      return sendWhatsAppNotification({
        data: {
          phone: leader.phone,
          message,
          childName: userName,
          type: 'checkin'
        }
      });

    }));
    
    return { success: true, targetsNotified: targets.length };
  });

export const notifyAllMembers = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    title: z.string(),
    message: z.string(),
    type: z.enum(['emergency', 'announcement', 'event']).default('announcement')
  }).parse(data))
  .handler(async ({ data }) => {
    const { getAllMemberProfiles } = await import("./notifications.server");
    const profiles = await getAllMemberProfiles();
    const userIds = profiles.map(p => p.id);

    if (userIds.length === 0) return { success: true, count: 0 };

    // Dispara via API de Notificações Interna (que já lida com o histórico)
    const baseUrl = process.env.VITE_SUPABASE_URL?.replace('.supabase.co', '.lovable.app');
    // Em ambiente Lovable/TanStack, chamamos a rota diretamente ou via fetch interno
    // Como estamos no servidor, podemos importar o handler da rota ou fazer um fetch.
    // Para manter desacoplado, faremos um fetch para o endpoint local.
    
    try {
      const response = await fetch('http://localhost:8080/api/public/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds,
          title: data.title,
          body: data.message,
          type: data.type
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao disparar notificações via API');
      }

      const result = await response.json();
      return { success: true, count: userIds.length, apiResult: result };
    } catch (error) {
      console.error('Erro ao notificar membros:', error);
      throw new Error('Falha ao processar notificações globais');
    }
  });
