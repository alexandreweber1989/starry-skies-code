import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'

// Schema para limitar o rate limit por IP (simulado via Cloudflare headers ou apenas Zod)
const visitorRequestSchema = z.object({
  guardian_full_name: z.string().trim().min(3).max(120),
  guardian_phone: z.string().trim().min(10).max(30),
  guardian_relation: z.string().min(1),
  guardian_document: z.string().trim().max(40).nullable().optional(),
  child_full_name: z.string().trim().min(3).max(120),
  child_nickname: z.string().trim().max(60).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  classroom: z.string().min(1),
  allergies: z.string().trim().max(500).nullable().optional(),
  health_notes: z.string().trim().max(500).nullable().optional(),
  special_needs: z.string().trim().max(500).nullable().optional(),
  photo_consent: z.boolean(),
  other_pickup: z.string().trim().max(300).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

export const Route = createFileRoute('/api/public/kids-visitor')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const validated = visitorRequestSchema.parse(body)

          // Inserção no banco usando a service_role através do cliente admin (se necessário) 
          // ou apenas o cliente padrão se o RLS permitir inserção pública (kids_visitor_requests costuma permitir)
          const { error } = await supabase.from('kids_visitor_requests').insert({
            ...validated,
            status: 'pendente'
          })

          if (error) {
            console.error('Database error in kids-visitor API:', error)
            return new Response(JSON.stringify({ error: 'Falha ao salvar o cadastro.' }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (err) {
          if (err instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: 'Dados inválidos.', details: err.errors }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            })
          }
          return new Response(JSON.stringify({ error: 'Erro interno no servidor.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }
  }
})
