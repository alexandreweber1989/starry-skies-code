ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_kids';

CREATE OR REPLACE FUNCTION public.is_kids_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('admin_geral','admin_kids')
  );
$$;

CREATE TABLE public.kids_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  nickname text,
  birth_date date,
  gender text,
  classroom text NOT NULL DEFAULT 'nao_definida',
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  allergies text,
  health_notes text,
  special_needs text,
  photo_url text,
  photo_consent boolean NOT NULL DEFAULT false,
  can_leave_alone boolean NOT NULL DEFAULT false,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kids_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.kids_children(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  relation text NOT NULL DEFAULT 'responsavel',
  is_primary boolean NOT NULL DEFAULT false,
  can_pickup boolean NOT NULL DEFAULT true,
  document text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kids_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  title text NOT NULL,
  session_date date NOT NULL,
  start_time time,
  room text,
  notes text,
  status text NOT NULL DEFAULT 'aberta',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kids_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.kids_sessions(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.kids_children(id) ON DELETE CASCADE,
  security_code text NOT NULL,
  status text NOT NULL DEFAULT 'presente',
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_in_by uuid,
  dropped_by_name text,
  checked_out_at timestamptz,
  checked_out_by uuid,
  picked_up_by_name text,
  day_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, child_id)
);

CREATE INDEX idx_kids_guardians_child ON public.kids_guardians(child_id);
CREATE INDEX idx_kids_guardians_profile ON public.kids_guardians(profile_id);
CREATE INDEX idx_kids_checkins_session ON public.kids_checkins(session_id);
CREATE INDEX idx_kids_checkins_child ON public.kids_checkins(child_id);
CREATE INDEX idx_kids_sessions_date ON public.kids_sessions(session_date DESC);

CREATE OR REPLACE FUNCTION public.is_guardian_of(_user_id uuid, _child_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kids_guardians
    WHERE child_id = _child_id AND profile_id = _user_id
  );
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_children TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_guardians TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_checkins TO authenticated;
GRANT ALL ON public.kids_children TO service_role;
GRANT ALL ON public.kids_guardians TO service_role;
GRANT ALL ON public.kids_sessions TO service_role;
GRANT ALL ON public.kids_checkins TO service_role;

ALTER TABLE public.kids_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kids_children_read" ON public.kids_children FOR SELECT TO authenticated
  USING (public.is_kids_admin(auth.uid()) OR public.is_guardian_of(auth.uid(), id));
CREATE POLICY "kids_children_manage" ON public.kids_children FOR ALL TO authenticated
  USING (public.is_kids_admin(auth.uid())) WITH CHECK (public.is_kids_admin(auth.uid()));

CREATE POLICY "kids_guardians_read" ON public.kids_guardians FOR SELECT TO authenticated
  USING (public.is_kids_admin(auth.uid()) OR profile_id = auth.uid());
CREATE POLICY "kids_guardians_manage" ON public.kids_guardians FOR ALL TO authenticated
  USING (public.is_kids_admin(auth.uid())) WITH CHECK (public.is_kids_admin(auth.uid()));

CREATE POLICY "kids_sessions_read" ON public.kids_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "kids_sessions_manage" ON public.kids_sessions FOR ALL TO authenticated
  USING (public.is_kids_admin(auth.uid())) WITH CHECK (public.is_kids_admin(auth.uid()));

CREATE POLICY "kids_checkins_read" ON public.kids_checkins FOR SELECT TO authenticated
  USING (public.is_kids_admin(auth.uid()) OR public.is_guardian_of(auth.uid(), child_id));
CREATE POLICY "kids_checkins_manage" ON public.kids_checkins FOR ALL TO authenticated
  USING (public.is_kids_admin(auth.uid())) WITH CHECK (public.is_kids_admin(auth.uid()));

CREATE TRIGGER set_kids_children_updated_at BEFORE UPDATE ON public.kids_children FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_kids_guardians_updated_at BEFORE UPDATE ON public.kids_guardians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_kids_sessions_updated_at BEFORE UPDATE ON public.kids_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_kids_checkins_updated_at BEFORE UPDATE ON public.kids_checkins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();