ALTER TABLE public.worship_team_members
  ADD CONSTRAINT worship_team_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.worship_schedule_assignments
  ADD CONSTRAINT worship_schedule_assignments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_worship_team_members_user ON public.worship_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_worship_schedule_assignments_user ON public.worship_schedule_assignments(user_id);