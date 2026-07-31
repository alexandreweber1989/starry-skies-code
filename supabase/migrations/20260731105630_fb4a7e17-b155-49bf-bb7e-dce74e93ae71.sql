CREATE TYPE public.family_relation AS ENUM ('conjuge','filho','pai','mae','irmao','avo','neto','outro');

CREATE TABLE public.family_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relative_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relation public.family_relation NOT NULL,
  note text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT family_links_distinct CHECK (person_id <> relative_id),
  CONSTRAINT family_links_unique UNIQUE (person_id, relative_id)
);

CREATE INDEX family_links_person_idx ON public.family_links(person_id);
CREATE INDEX family_links_relative_idx ON public.family_links(relative_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_links TO authenticated;
GRANT ALL ON public.family_links TO service_role;

ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem vinculos familiares"
  ON public.family_links FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin geral gerencia vinculos familiares"
  ON public.family_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_geral'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

CREATE TRIGGER family_links_updated_at
  BEFORE UPDATE ON public.family_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Relação inversa considerando o sexo de quem origina o vínculo.
CREATE OR REPLACE FUNCTION public.inverse_family_relation(_relation public.family_relation, _person_gender text)
RETURNS public.family_relation
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _relation
    WHEN 'conjuge' THEN 'conjuge'::public.family_relation
    WHEN 'irmao'   THEN 'irmao'::public.family_relation
    WHEN 'pai'     THEN 'filho'::public.family_relation
    WHEN 'mae'     THEN 'filho'::public.family_relation
    WHEN 'avo'     THEN 'neto'::public.family_relation
    WHEN 'neto'    THEN 'avo'::public.family_relation
    WHEN 'filho'   THEN CASE _person_gender
                          WHEN 'masculino' THEN 'pai'::public.family_relation
                          WHEN 'feminino'  THEN 'mae'::public.family_relation
                          ELSE 'outro'::public.family_relation
                        END
    ELSE 'outro'::public.family_relation
  END;
$$;

-- Mantém o vínculo espelhado no outro perfil automaticamente.
CREATE OR REPLACE FUNCTION public.sync_family_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _gender text;
  _inverse public.family_relation;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.family_links
      WHERE person_id = OLD.relative_id AND relative_id = OLD.person_id;
    RETURN OLD;
  END IF;

  SELECT gender INTO _gender FROM public.profiles WHERE id = NEW.person_id;
  _inverse := public.inverse_family_relation(NEW.relation, _gender);

  INSERT INTO public.family_links (person_id, relative_id, relation, note, created_by)
  VALUES (NEW.relative_id, NEW.person_id, _inverse, NEW.note, NEW.created_by)
  ON CONFLICT (person_id, relative_id)
  DO UPDATE SET relation = EXCLUDED.relation, note = EXCLUDED.note, updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER family_links_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.family_links
  FOR EACH ROW EXECUTE FUNCTION public.sync_family_link();