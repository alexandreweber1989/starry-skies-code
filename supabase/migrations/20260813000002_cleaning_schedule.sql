-- Criar tabela de escalas de faxina
CREATE TABLE IF NOT EXISTS public.cleaning_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  mesa_id UUID REFERENCES public.mesas(id) ON DELETE SET NULL,
  responsible_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de tarefas de faxina (checklist)
CREATE TABLE IF NOT EXISTS public.cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.cleaning_schedules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_tasks ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_tasks TO authenticated;
GRANT ALL ON public.cleaning_schedules TO service_role;
GRANT ALL ON public.cleaning_tasks TO service_role;

-- Policies para cleaning_schedules
CREATE POLICY "Qualquer membro autenticado pode ver a escala"
ON public.cleaning_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins e responsáveis podem gerenciar escalas"
ON public.cleaning_schedules FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'admin_geral') OR
  auth.uid() = responsible_id
);

-- Policies para cleaning_tasks
CREATE POLICY "Qualquer membro autenticado pode ver as tarefas"
ON public.cleaning_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins e responsáveis podem gerenciar tarefas"
ON public.cleaning_tasks FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cleaning_schedules s 
    WHERE s.id = schedule_id AND (
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'admin_geral') OR
      auth.uid() = s.responsible_id
    )
  )
);

-- Inserir algumas tarefas padrão se a tabela estiver vazia (via trigger ou manual depois)
COMMENT ON TABLE public.cleaning_schedules IS 'Escala de faxina semanal das mesas.';
