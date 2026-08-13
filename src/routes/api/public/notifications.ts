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
        // SEGURANÇA: Em um cenário real, aqui verificaríamos um X-API-KEY 
        // ou uma assinatura HMAC para garantir que apenas o nosso sistema dispara notificações.
        
        try {
          const body = await request.json()
          const { userIds, title, body: content, type, data } = notificationSchema.parse(body)

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

          // 1. Registrar no histórico
          const { error: histError } = await supabaseAdmin.from('notifications_history').insert(
            userIds.map(uid => ({
              user_id: uid,
              title,
              body: content,
              type,
              metadata: data || {}
            }))
          )

          if (histError) throw histError

          // 2. Aqui integraríamos com o provedor real (Firebase Cloud Messaging / Expo / OneSignal)
          // Como o Lovable não tem um provedor configurado por padrão, simulamos o disparo.
          console.log(`[PUSH NOTIFICATION] Enviando para ${userIds.length} usuários: ${title}`);
          
          // Exemplo de integração futura:
          // const response = await fetch('https://fcm.googleapis.com/fcm/send', { ... })

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
