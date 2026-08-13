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
        phone: leader.phone,
        message,
        childName: userName,
        type: 'checkin' // Reusing the type from the existing function for simulation
      });
    }));
    
    return { success: true, targetsNotified: targets.length };
  });
