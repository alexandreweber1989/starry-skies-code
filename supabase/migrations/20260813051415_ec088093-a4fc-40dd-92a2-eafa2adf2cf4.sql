
CREATE TABLE public.cleaning_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  mesa_id UUID REFERENCES public.mesas(id) ON DELETE SET NULL,
  responsible_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.cleaning_schedules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.cleaning_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.cleaning_schedules(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.cleaning_tasks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('before', 'after')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_photos ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_photos TO authenticated;
GRANT ALL ON public.cleaning_schedules TO service_role;
GRANT ALL ON public.cleaning_tasks TO service_role;
GRANT ALL ON public.cleaning_photos TO service_role;

CREATE POLICY "Qualquer membro autenticado pode ver a escala" ON public.cleaning_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins e responsáveis podem gerenciar escalas" ON public.cleaning_schedules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin_geral') OR auth.uid() = responsible_id);
CREATE POLICY "Qualquer membro autenticado pode ver as tarefas" ON public.cleaning_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins e responsáveis podem gerenciar tarefas" ON public.cleaning_tasks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.cleaning_schedules s WHERE s.id = schedule_id AND (public.has_role(auth.uid(), 'admin_geral') OR auth.uid() = s.responsible_id)));
CREATE POLICY "Qualquer membro autenticado pode ver as fotos" ON public.cleaning_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins e responsáveis podem gerenciar fotos" ON public.cleaning_photos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.cleaning_schedules s WHERE s.id = schedule_id AND (public.has_role(auth.uid(), 'admin_geral') OR auth.uid() = s.responsible_id)));

-- Function to notify the mesa responsible on Thursday
CREATE OR REPLACE FUNCTION public.notify_cleaning_responsible()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_cleaning RECORD;
BEGIN
    FOR next_cleaning IN 
        SELECT s.id, s.date, s.mesa_id, m.name as mesa_name
        FROM public.cleaning_schedules s
        JOIN public.mesas m ON s.mesa_id = m.id
        WHERE s.date = CURRENT_DATE + INTERVAL '1 day' -- Tomorrow is Friday
          AND EXTRACT(DOW FROM CURRENT_DATE) = 4 -- Today is Thursday (4)
    LOOP
        INSERT INTO public.announcements (
            title,
            body,
            category,
            scope,
            mesa_id,
            is_published,
            published_at,
            created_by
        ) VALUES (
            'Lembrete: Faxina de Amanhã',
            'A ' || next_cleaning.mesa_name || ' é a responsável pela faxina da igreja amanhã. Não esqueçam de conferir o checklist!',
            'info',
            'mesa',
            next_cleaning.mesa_id,
            true,
            now(),
            '00000000-0000-0000-0000-000000000000' -- System user placeholder
        );
    END LOOP;
END;
$$;
