-- Função para inscrever automaticamente membros em lembretes ao confirmar presença
CREATE OR REPLACE FUNCTION public.handle_event_rsvp_reminder()
RETURNS TRIGGER AS $$
DECLARE
  v_starts_at TIMESTAMPTZ;
  v_reminder_settings JSONB;
BEGIN
  -- Só processamos se o status for 'vou'
  IF NEW.status = 'vou' THEN
    -- Busca detalhes do evento
    SELECT starts_at, reminder_settings INTO v_starts_at, v_reminder_settings
    FROM public.events
    WHERE id = NEW.event_id;

    -- Se o lembrete estiver habilitado no evento
    IF v_reminder_settings->>'enabled' = 'true' THEN
      INSERT INTO public.event_reminders (event_id, user_id, remind_at, settings)
      VALUES (
        NEW.event_id,
        NEW.user_id,
        v_starts_at - (COALESCE((v_reminder_settings->>'lead_time')::INT, 30) * INTERVAL '1 minute'),
        v_reminder_settings
      )
      ON CONFLICT (event_id, user_id) 
      DO UPDATE SET 
        remind_at = EXCLUDED.remind_at,
        settings = EXCLUDED.settings,
        reminded_at = NULL; -- Reseta se mudar o RSVP
    END IF;
  ELSE
    -- Se mudar para 'talvez' ou 'nao_vou', remove o lembrete
    DELETE FROM public.event_reminders
    WHERE event_id = NEW.event_id AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para RSVP
DROP TRIGGER IF EXISTS on_event_rsvp_reminder ON public.event_rsvps;
CREATE TRIGGER on_event_rsvp_reminder
  AFTER INSERT OR UPDATE ON public.event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_rsvp_reminder();
