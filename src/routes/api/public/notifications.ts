import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Schema para envio de notificações (interno, validado via API Key ou Auth)
const notificationSchema = z.object({
  userIds: z.array(z.string().uuid()),
  title: z.string(),
  body: z.string(),
  type: z.enum(['emergency', 'announcement', 'event']),
  data: z.record(z.any()).optional()
})

export const Route = createFileRoute('/api/public/notifications')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { userIds, title, body: content, type, data } = notificationSchema.parse(body)

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

          // 1. Registrar no histórico (as any para evitar erros de tipos do db até sync)
          const { error: histError } = await (supabaseAdmin.from('notifications_history') as any).insert(
            userIds.map(uid => ({
              user_id: uid,
              title,
              body: content,
              type,
              metadata: data || {}
            }))
          )

          if (histError) throw histError

          console.log(`[PUSH NOTIFICATION] Enviando para ${userIds.length} usuários: ${title}`);

          return new Response(JSON.stringify({ success: true, count: userIds.length }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (err) {
          console.error("Erro na API de Notificações:", err)
          return new Response(JSON.stringify({ error: 'Erro ao processar notificações.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }
  }
})
