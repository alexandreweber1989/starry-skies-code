CREATE TYPE public.event_scope AS ENUM ('igreja','ministerio','rede','mesa');
CREATE TYPE public.event_status AS ENUM ('rascunho','publicado','cancelado','concluido');
CREATE TYPE public.event_kind AS ENUM ('culto','ensaio','reuniao','evento','acao_social','treinamento');
CREATE TYPE public.rsvp_status AS ENUM ('vou','nao_vou','talvez');

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  kind public.event_kind NOT NULL DEFAULT 'evento',
  scope public.event_scope NOT NULL DEFAULT 'igreja',
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE CASCADE,
  rede_id uuid REFERENCES public.redes(id) ON DELETE CASCADE,
  mesa_id uuid REFERENCES public.mesas(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  image_url text,
  requires_rsvp boolean NOT NULL DEFAULT false,
  capacity integer,
  is_featured boolean NOT NULL DEFAULT false,
  status public.event_status NOT NULL DEFAULT 'publicado',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_starts_at_idx ON public.events (starts_at);
CREATE INDEX events_ministry_idx ON public.events (ministry_id);
CREATE INDEX events_rede_idx ON public.events (rede_id);
CREATE INDEX events_mesa_idx ON public.events (mesa_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_published" ON public.events FOR SELECT TO authenticated
USING (
  status <> 'rascunho'
  OR public.has_role(auth.uid(),'admin_geral')
  OR (ministry_id IS NOT NULL AND public.has_ministry_role(auth.uid(), ministry_id))
  OR (mesa_id IS NOT NULL AND public.has_mesa_role(auth.uid(), mesa_id))
  OR created_by = auth.uid()
);

CREATE POLICY "events_insert_admins" ON public.events FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin_geral')
  OR (ministry_id IS NOT NULL AND public.has_ministry_role(auth.uid(), ministry_id))
  OR (mesa_id IS NOT NULL AND public.has_mesa_role(auth.uid(), mesa_id))
);

CREATE POLICY "events_update_admins" ON public.events FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin_geral')
  OR (ministry_id IS NOT NULL AND public.has_ministry_role(auth.uid(), ministry_id))
  OR (mesa_id IS NOT NULL AND public.has_mesa_role(auth.uid(), mesa_id))
)
WITH CHECK (
  public.has_role(auth.uid(),'admin_geral')
  OR (ministry_id IS NOT NULL AND public.has_ministry_role(auth.uid(), ministry_id))
  OR (mesa_id IS NOT NULL AND public.has_mesa_role(auth.uid(), mesa_id))
);

CREATE POLICY "events_delete_admins" ON public.events FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(),'admin_geral')
  OR (ministry_id IS NOT NULL AND public.has_ministry_role(auth.uid(), ministry_id))
  OR (mesa_id IS NOT NULL AND public.has_mesa_role(auth.uid(), mesa_id))
);

CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.rsvp_status NOT NULL DEFAULT 'vou',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX event_rsvps_event_idx ON public.event_rsvps (event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rsvp_select" ON public.event_rsvps FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(),'admin_geral')
  OR EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_id
    AND ((e.ministry_id IS NOT NULL AND public.has_ministry_role(auth.uid(), e.ministry_id))
      OR (e.mesa_id IS NOT NULL AND public.has_mesa_role(auth.uid(), e.mesa_id))
      OR e.created_by = auth.uid())
  )
);

CREATE POLICY "rsvp_insert_own" ON public.event_rsvps FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "rsvp_update_own" ON public.event_rsvps FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "rsvp_delete_own" ON public.event_rsvps FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin_geral'));

CREATE TRIGGER event_rsvps_set_updated_at BEFORE UPDATE ON public.event_rsvps
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.events (title, description, kind, scope, ministry_id, rede_id, mesa_id, starts_at, ends_at, location, requires_rsvp, is_featured, status)
VALUES
 ('Culto de Celebração', 'Culto dominical com toda a igreja. Chegue 15 minutos antes.', 'culto', 'igreja', NULL, NULL, NULL, (date_trunc('week', now()) + interval '6 day' + interval '19 hour'), (date_trunc('week', now()) + interval '6 day' + interval '21 hour'), 'Templo Sede', false, true, 'publicado'),
 ('Ensaio Geral do Louvor', 'Ensaio da equipe escalada para o domingo.', 'ensaio', 'ministerio', (SELECT id FROM public.ministries WHERE slug = 'louvor'), NULL, NULL, (date_trunc('week', now()) + interval '4 day' + interval '20 hour'), (date_trunc('week', now()) + interval '4 day' + interval '22 hour'), 'Templo Sede', true, false, 'publicado'),
 ('Café das Mulheres — Rede Sabaoth', 'Manhã de comunhão com todas as mulheres da rede.', 'evento', 'rede', NULL, (SELECT id FROM public.redes WHERE slug LIKE '%sabaoth%' LIMIT 1), NULL, (now() + interval '12 day'), (now() + interval '12 day' + interval '3 hour'), 'Salão Social', true, true, 'publicado'),
 ('Encontro dos Homens — Rede Zadoque', 'Noite de comunhão, palavra e churrasco.', 'evento', 'rede', NULL, (SELECT id FROM public.redes WHERE slug LIKE '%zadoque%' LIMIT 1), NULL, (now() + interval '18 day'), (now() + interval '18 day' + interval '4 hour'), 'Área Externa', true, false, 'publicado'),
 ('Montagem das Cestas — Atos de Amor', 'Reunião do projeto social para montar as cestas do mês.', 'acao_social', 'ministerio', (SELECT id FROM public.ministries WHERE slug LIKE '%atos%' LIMIT 1), NULL, NULL, (now() + interval '25 day'), (now() + interval '25 day' + interval '3 hour'), 'Depósito da Igreja', true, false, 'publicado'),
 ('Treinamento do Ministério Kids', 'Capacitação de professores e regras de check-in seguro.', 'treinamento', 'ministerio', (SELECT id FROM public.ministries WHERE slug LIKE '%kids%' LIMIT 1), NULL, NULL, (now() + interval '9 day'), (now() + interval '9 day' + interval '2 hour'), 'Sala Kids', true, false, 'publicado');