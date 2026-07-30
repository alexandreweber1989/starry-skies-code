-- =========================================================
-- MINISTÉRIO DE LOUVOR
-- =========================================================
CREATE TYPE public.worship_schedule_type AS ENUM ('culto', 'ensaio', 'evento');
CREATE TYPE public.worship_schedule_status AS ENUM ('rascunho', 'publicada', 'concluida');
CREATE TYPE public.worship_assignment_status AS ENUM ('pendente', 'confirmado', 'recusado');

-- ---------- Repertório ----------
CREATE TABLE public.worship_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID NOT NULL DEFAULT '7cc9c01b-b760-4dc7-985e-2e6e8505384b' REFERENCES public.ministries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  song_key TEXT,
  bpm INTEGER,
  tempo TEXT CHECK (tempo IN ('lenta','media','rapida')),
  theme TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  lyrics TEXT,
  chords TEXT,
  youtube_url TEXT,
  sheet_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_worship_songs_ministry ON public.worship_songs(ministry_id);
CREATE INDEX idx_worship_songs_title ON public.worship_songs(title);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_songs TO authenticated;
GRANT ALL ON public.worship_songs TO service_role;
ALTER TABLE public.worship_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worship_songs_select" ON public.worship_songs FOR SELECT TO authenticated USING (true);
CREATE POLICY "worship_songs_manage" ON public.worship_songs FOR ALL TO authenticated
  USING (public.has_ministry_role(auth.uid(), ministry_id))
  WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));

-- ---------- Equipes ----------
CREATE TABLE public.worship_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID NOT NULL DEFAULT '7cc9c01b-b760-4dc7-985e-2e6e8505384b' REFERENCES public.ministries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  minister_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_worship_teams_ministry ON public.worship_teams(ministry_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_teams TO authenticated;
GRANT ALL ON public.worship_teams TO service_role;
ALTER TABLE public.worship_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worship_teams_select" ON public.worship_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "worship_teams_manage" ON public.worship_teams FOR ALL TO authenticated
  USING (public.has_ministry_role(auth.uid(), ministry_id))
  WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));

-- ---------- Integrantes das equipes ----------
CREATE TABLE public.worship_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.worship_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  is_titular BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id, function_name)
);
CREATE INDEX idx_worship_team_members_team ON public.worship_team_members(team_id);
CREATE INDEX idx_worship_team_members_user ON public.worship_team_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_team_members TO authenticated;
GRANT ALL ON public.worship_team_members TO service_role;
ALTER TABLE public.worship_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worship_team_members_select" ON public.worship_team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "worship_team_members_manage" ON public.worship_team_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worship_teams t WHERE t.id = team_id AND public.has_ministry_role(auth.uid(), t.ministry_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.worship_teams t WHERE t.id = team_id AND public.has_ministry_role(auth.uid(), t.ministry_id)));

-- ---------- Escalas / ensaios ----------
CREATE TABLE public.worship_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID NOT NULL DEFAULT '7cc9c01b-b760-4dc7-985e-2e6e8505384b' REFERENCES public.ministries(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.worship_teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  schedule_type public.worship_schedule_type NOT NULL DEFAULT 'culto',
  event_date DATE NOT NULL,
  start_time TIME,
  location TEXT,
  notes TEXT,
  status public.worship_schedule_status NOT NULL DEFAULT 'rascunho',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_worship_schedules_ministry ON public.worship_schedules(ministry_id);
CREATE INDEX idx_worship_schedules_date ON public.worship_schedules(event_date DESC);
CREATE INDEX idx_worship_schedules_team ON public.worship_schedules(team_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_schedules TO authenticated;
GRANT ALL ON public.worship_schedules TO service_role;
ALTER TABLE public.worship_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worship_schedules_select_published" ON public.worship_schedules FOR SELECT TO authenticated
  USING (status <> 'rascunho' OR public.has_ministry_role(auth.uid(), ministry_id));
CREATE POLICY "worship_schedules_manage" ON public.worship_schedules FOR ALL TO authenticated
  USING (public.has_ministry_role(auth.uid(), ministry_id))
  WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));

-- ---------- Escalados ----------
CREATE TABLE public.worship_schedule_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.worship_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  status public.worship_assignment_status NOT NULL DEFAULT 'pendente',
  response_note TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, user_id, function_name)
);
CREATE INDEX idx_worship_assignments_schedule ON public.worship_schedule_assignments(schedule_id);
CREATE INDEX idx_worship_assignments_user ON public.worship_schedule_assignments(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_schedule_assignments TO authenticated;
GRANT ALL ON public.worship_schedule_assignments TO service_role;
ALTER TABLE public.worship_schedule_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worship_assignments_select" ON public.worship_schedule_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "worship_assignments_manage" ON public.worship_schedule_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worship_schedules s WHERE s.id = schedule_id AND public.has_ministry_role(auth.uid(), s.ministry_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.worship_schedules s WHERE s.id = schedule_id AND public.has_ministry_role(auth.uid(), s.ministry_id)));
CREATE POLICY "worship_assignments_respond_own" ON public.worship_schedule_assignments FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------- Repertório da escala ----------
CREATE TABLE public.worship_setlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.worship_schedules(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.worship_songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  song_key TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, song_id)
);
CREATE INDEX idx_worship_setlist_schedule ON public.worship_setlist_items(schedule_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_setlist_items TO authenticated;
GRANT ALL ON public.worship_setlist_items TO service_role;
ALTER TABLE public.worship_setlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worship_setlist_select" ON public.worship_setlist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "worship_setlist_manage" ON public.worship_setlist_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worship_schedules s WHERE s.id = schedule_id AND public.has_ministry_role(auth.uid(), s.ministry_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.worship_schedules s WHERE s.id = schedule_id AND public.has_ministry_role(auth.uid(), s.ministry_id)));

-- ---------- Triggers updated_at ----------
CREATE TRIGGER trg_worship_songs_updated BEFORE UPDATE ON public.worship_songs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_worship_teams_updated BEFORE UPDATE ON public.worship_teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_worship_schedules_updated BEFORE UPDATE ON public.worship_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_worship_assignments_updated BEFORE UPDATE ON public.worship_schedule_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Seed ----------
INSERT INTO public.worship_songs (title, artist, song_key, bpm, tempo, theme, tags, youtube_url) VALUES
  ('Bondade de Deus', 'Isaias Saad', 'G', 72, 'lenta', 'Adoração', ARRAY['adoracao','gratidao'], 'https://www.youtube.com/watch?v=n0R1uAWBTHc'),
  ('Deus é Deus', 'Delino Marçal', 'C', 76, 'lenta', 'Fé', ARRAY['adoracao'], NULL),
  ('Ainda que a Figueira', 'Nívea Soares', 'D', 80, 'media', 'Confiança', ARRAY['adoracao','confianca'], NULL),
  ('Teu Santo Nome', 'Gabriela Rocha', 'A', 68, 'lenta', 'Adoração', ARRAY['adoracao'], NULL),
  ('Ousado Amor', 'Isaias Saad', 'B', 70, 'lenta', 'Amor de Deus', ARRAY['adoracao'], NULL),
  ('Tua Graça Me Basta', 'Toque no Altar', 'E', 74, 'lenta', 'Graça', ARRAY['adoracao'], NULL),
  ('Vem Esperança', 'Fernandinho', 'D', 128, 'rapida', 'Celebração', ARRAY['celebracao'], NULL),
  ('Faz Chover', 'Fernandinho', 'G', 132, 'rapida', 'Avivamento', ARRAY['celebracao','avivamento'], NULL),
  ('Deus do Impossível', 'Vocal Livre', 'C', 120, 'media', 'Fé', ARRAY['celebracao'], NULL),
  ('Santo Espírito', 'Laura Souguellis', 'A', 66, 'lenta', 'Espírito Santo', ARRAY['adoracao','espirito-santo'], NULL);

INSERT INTO public.worship_teams (name, description) VALUES
  ('Equipe Manhã', 'Equipe responsável pelos cultos de domingo pela manhã.'),
  ('Equipe Noite', 'Equipe responsável pelos cultos de domingo à noite e cultos de meio de semana.');

INSERT INTO public.worship_schedules (team_id, title, schedule_type, event_date, start_time, location, status, notes)
SELECT t.id, 'Culto de Celebração — Domingo', 'culto', (CURRENT_DATE + 7), '19:00', 'Templo', 'publicada', 'Chegar 1h antes para passagem de som.'
FROM public.worship_teams t WHERE t.name = 'Equipe Noite';

INSERT INTO public.worship_schedules (team_id, title, schedule_type, event_date, start_time, location, status, notes)
SELECT t.id, 'Ensaio geral', 'ensaio', (CURRENT_DATE + 4), '20:00', 'Templo', 'publicada', 'Ensaio do repertório do domingo.'
FROM public.worship_teams t WHERE t.name = 'Equipe Noite';

INSERT INTO public.worship_setlist_items (schedule_id, song_id, position, song_key)
SELECT s.id, g.id, g.pos, g.song_key
FROM public.worship_schedules s
CROSS JOIN LATERAL (
  SELECT w.id, w.song_key, row_number() OVER (ORDER BY w.title) AS pos
  FROM public.worship_songs w
  WHERE w.title IN ('Faz Chover','Vem Esperança','Bondade de Deus','Santo Espírito')
) g
WHERE s.title = 'Culto de Celebração — Domingo';