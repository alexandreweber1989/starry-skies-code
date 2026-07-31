CREATE OR REPLACE FUNCTION public.sync_family_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _gender text;
  _inverse public.family_relation;
BEGIN
  -- Guard: quando este trigger é disparado pela própria escrita espelhada
  -- (profundidade > 1), não espelha de novo. Sem isso, A->B espelha B->A,
  -- que espelha A->B, ... até "stack depth limit exceeded".
  IF pg_trigger_depth() > 1 THEN
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
  END IF;

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
$function$;