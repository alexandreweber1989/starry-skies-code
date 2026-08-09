-- Adição de colunas visuais aos ministérios
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS color TEXT;

-- Criação da tabela de escalas do Kids
CREATE TABLE IF NOT EXISTS public.kids_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.kids_sessions(id) ON DELETE CASCADE,
    church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de voluntários escalados no Kids
CREATE TABLE IF NOT EXISTS public.kids_schedule_volunteers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid REFERENCES public.kids_schedules(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- Ex: 'Líder de Turma', 'Auxiliar', 'Recepção'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(schedule_id, user_id)
);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_schedules TO authenticated;
GRANT ALL ON public.kids_schedules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_schedule_volunteers TO authenticated;
GRANT ALL ON public.kids_schedule_volunteers TO service_role;

-- RLS
ALTER TABLE public.kids_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_schedule_volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage kids schedules" ON public.kids_schedules
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin_geral') OR public.has_role(auth.uid(), 'admin_kids'));

CREATE POLICY "Public schedules are visible to all authenticated" ON public.kids_schedules
    FOR SELECT TO authenticated USING (status = 'published' OR status = 'completed');

CREATE POLICY "Volunteers can see and update their status" ON public.kids_schedule_volunteers
    FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_geral') OR public.has_role(auth.uid(), 'admin_kids'));
