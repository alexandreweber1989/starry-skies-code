CREATE TABLE public.worship_musicians (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id uuid NOT NULL DEFAULT '7cc9c01b-b760-4dc7-985e-2e6e8505384b'::uuid REFERENCES public.ministries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  functions text[] NOT NULL DEFAULT '{}',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ministry_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_musicians TO authenticated;
GRANT ALL ON public.worship_musicians TO service_role;

ALTER TABLE public.worship_musicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "worship_musicians_select" ON public.worship_musicians
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "worship_musicians_manage" ON public.worship_musicians
  FOR ALL TO authenticated
  USING (public.has_ministry_role(auth.uid(), ministry_id))
  WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));

CREATE TRIGGER worship_musicians_updated_at
  BEFORE UPDATE ON public.worship_musicians
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX worship_musicians_user_idx ON public.worship_musicians (user_id);