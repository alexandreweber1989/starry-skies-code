-- Papel pastoral: admin geral, pastor ou apascentador
CREATE OR REPLACE FUNCTION public.is_pastoral(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin_geral')
     OR EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE p.id = _user_id AND p.church_function IN ('pastor','apascentador')
     );
$$;

-- Liderança (pastoral + líderes de mesa)
CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_pastoral(_user_id)
     OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'lider_mesa')
     OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.church_function = 'lider');
$$;

-- ============ Histórico pastoral ============
CREATE TABLE public.pastoral_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'visita' CHECK (kind IN ('visita','aconselhamento','oracao','ligacao','outro')),
  happened_on date NOT NULL DEFAULT current_date,
  content text NOT NULL,
  visibility text NOT NULL DEFAULT 'pastoral' CHECK (visibility IN ('pastoral','autor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pastoral_notes_person_idx ON public.pastoral_notes(person_id, happened_on DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pastoral_notes TO authenticated;
GRANT ALL ON public.pastoral_notes TO service_role;
ALTER TABLE public.pastoral_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipe pastoral le anotacoes" ON public.pastoral_notes
  FOR SELECT TO authenticated
  USING (public.is_pastoral(auth.uid()) AND (visibility = 'pastoral' OR author_id = auth.uid()));

CREATE POLICY "Equipe pastoral cria anotacoes" ON public.pastoral_notes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_pastoral(auth.uid()) AND author_id = auth.uid());

CREATE POLICY "Autor edita anotacao" ON public.pastoral_notes
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "Autor ou admin remove anotacao" ON public.pastoral_notes
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin_geral'));

CREATE TRIGGER pastoral_notes_updated_at BEFORE UPDATE ON public.pastoral_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Trilha de integração ============
CREATE TABLE public.onboarding_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_steps TO authenticated;
GRANT ALL ON public.onboarding_steps TO service_role;
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros leem etapas" ON public.onboarding_steps
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia etapas" ON public.onboarding_steps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

CREATE TRIGGER onboarding_steps_updated_at BEFORE UPDATE ON public.onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.member_onboarding_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.onboarding_steps(id) ON DELETE CASCADE,
  completed_at timestamptz,
  completed_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, step_id)
);
CREATE INDEX member_onboarding_person_idx ON public.member_onboarding_steps(person_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_onboarding_steps TO authenticated;
GRANT ALL ON public.member_onboarding_steps TO service_role;
ALTER TABLE public.member_onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membro ve sua trilha e lideranca ve todas" ON public.member_onboarding_steps
  FOR SELECT TO authenticated
  USING (person_id = auth.uid() OR public.is_leadership(auth.uid()));
CREATE POLICY "Lideranca registra trilha" ON public.member_onboarding_steps
  FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY "Lideranca atualiza trilha" ON public.member_onboarding_steps
  FOR UPDATE TO authenticated
  USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY "Lideranca remove trilha" ON public.member_onboarding_steps
  FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()));

CREATE TRIGGER member_onboarding_steps_updated_at BEFORE UPDATE ON public.member_onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.onboarding_steps (title, description, position) VALUES
  ('Boas-vindas', 'Contato inicial de boas-vindas e apresentação da igreja.', 1),
  ('Visita ou ligação', 'Primeira visita pastoral ou ligação de acolhimento.', 2),
  ('Curso de novos membros', 'Participação no curso de integração e doutrina.', 3),
  ('Definição da mesa', 'Encaminhamento para uma mesa próxima da casa do membro.', 4),
  ('Batismo', 'Conversa sobre batismo e agendamento, quando aplicável.', 5),
  ('Ministério', 'Descoberta de dons e inserção em um ministério.', 6);