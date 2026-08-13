CREATE TYPE public.announcement_scope AS ENUM ('geral','igreja','ministerio','rede','mesa');
CREATE TYPE public.announcement_category AS ENUM ('aviso','comunicado','urgente','acao');

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category public.announcement_category NOT NULL DEFAULT 'aviso',
  scope public.announcement_scope NOT NULL DEFAULT 'geral',
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE CASCADE,
  rede_id uuid REFERENCES public.redes(id) ON DELETE CASCADE,
  mesa_id uuid REFERENCES public.mesas(id) ON DELETE CASCADE,
  is_pinned boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_published ON public.announcements (is_published, published_at DESC);
CREATE INDEX idx_announcements_scope ON public.announcements (scope);
CREATE INDEX idx_announcements_church ON public.announcements (church_id);
CREATE INDEX idx_announcements_ministry ON public.announcements (ministry_id);
CREATE INDEX idx_announcements_rede ON public.announcements (rede_id);
CREATE INDEX idx_announcements_mesa ON public.announcements (mesa_id);
CREATE INDEX idx_announcements_created_by ON public.announcements (created_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

CREATE INDEX idx_announcement_reads_user ON public.announcement_reads (user_id);

GRANT SELECT, INSERT, DELETE ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Quem pode gerenciar um aviso com determinado alcance
CREATE OR REPLACE FUNCTION public.can_manage_announcement(
  _user_id uuid,
  _scope public.announcement_scope,
  _ministry_id uuid,
  _mesa_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'admin_geral')
    OR (_scope = 'ministerio' AND _ministry_id IS NOT NULL
        AND public.has_ministry_role(_user_id, _ministry_id))
    OR (_scope = 'mesa' AND _mesa_id IS NOT NULL
        AND public.has_mesa_role(_user_id, _mesa_id));
$$;

-- Quem pode ver um aviso, conforme o alcance
CREATE OR REPLACE FUNCTION public.can_view_announcement(
  _user_id uuid,
  _scope public.announcement_scope,
  _church_id uuid,
  _ministry_id uuid,
  _rede_id uuid,
  _mesa_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE _scope
    WHEN 'geral' THEN true
    WHEN 'igreja' THEN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _user_id AND (_church_id IS NULL OR p.church_id = _church_id)
    )
    WHEN 'ministerio' THEN EXISTS (
      SELECT 1 FROM public.ministry_members m
      WHERE m.user_id = _user_id AND m.ministry_id = _ministry_id
    )
    WHEN 'rede' THEN EXISTS (
      SELECT 1 FROM public.rede_members r
      WHERE r.user_id = _user_id AND r.rede_id = _rede_id
    )
    WHEN 'mesa' THEN EXISTS (
      SELECT 1 FROM public.mesa_members mm
      WHERE mm.user_id = _user_id AND mm.mesa_id = _mesa_id
    )
    ELSE false
  END;
$$;

CREATE POLICY "Membros veem avisos publicados do seu alcance"
ON public.announcements FOR SELECT TO authenticated
USING (
  (
    is_published
    AND (published_at IS NULL OR published_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
    AND public.can_view_announcement(auth.uid(), scope, church_id, ministry_id, rede_id, mesa_id)
  )
  OR created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin_geral')
);

CREATE POLICY "Lideranca cria avisos do seu alcance"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.can_manage_announcement(auth.uid(), scope, ministry_id, mesa_id)
);

CREATE POLICY "Autor ou admin edita avisos"
ON public.announcements FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin_geral'))
WITH CHECK (
  public.can_manage_announcement(auth.uid(), scope, ministry_id, mesa_id)
  OR created_by = auth.uid()
);

CREATE POLICY "Autor ou admin apaga avisos"
ON public.announcements FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin_geral'));

CREATE TRIGGER announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Leitura propria ou do autor do aviso"
ON public.announcement_reads FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin_geral')
  OR EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = announcement_id AND a.created_by = auth.uid()
  )
);

CREATE POLICY "Cada um marca a propria leitura"
ON public.announcement_reads FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Cada um remove a propria leitura"
ON public.announcement_reads FOR DELETE TO authenticated
USING (user_id = auth.uid());