-- Adiciona suporte a lembretes personalizados nos eventos
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS reminder_settings JSONB DEFAULT '{"enabled": false, "lead_time": 30, "type": "push"}'::jsonb;

-- Tabela para rastrear inscrições de lembretes por usuário
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  reminded_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{"type": "push"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_reminders TO authenticated;
GRANT ALL ON public.event_reminders TO service_role;

-- Policies
CREATE POLICY "Usuários podem gerenciar seus próprios lembretes"
ON public.event_reminders
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE public.event_reminders IS 'Lembretes agendados para eventos da igreja.';
