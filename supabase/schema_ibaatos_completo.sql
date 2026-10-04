--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: announcement_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.announcement_category AS ENUM (
    'aviso',
    'comunicado',
    'urgente',
    'acao'
);


--
-- Name: announcement_scope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.announcement_scope AS ENUM (
    'geral',
    'igreja',
    'ministerio',
    'rede',
    'mesa'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin_geral',
    'admin_ministerio',
    'lider_mesa',
    'membro',
    'admin_livraria',
    'admin_cantina',
    'admin_kids'
);


--
-- Name: church_function; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.church_function AS ENUM (
    'pastor',
    'apascentador',
    'lider',
    'diacono',
    'obreiro',
    'membro',
    'lider_mesa',
    'lider_rede',
    'lider_ministerio'
);


--
-- Name: event_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_kind AS ENUM (
    'culto',
    'ensaio',
    'reuniao',
    'evento',
    'acao_social',
    'treinamento'
);


--
-- Name: event_scope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_scope AS ENUM (
    'igreja',
    'ministerio',
    'rede',
    'mesa'
);


--
-- Name: event_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_status AS ENUM (
    'rascunho',
    'publicado',
    'cancelado',
    'concluido'
);


--
-- Name: family_relation; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.family_relation AS ENUM (
    'conjuge',
    'filho',
    'pai',
    'mae',
    'irmao',
    'avo',
    'neto',
    'outro'
);


--
-- Name: ministerial_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ministerial_status AS ENUM (
    'membro',
    'lider',
    'apasc',
    'pra',
    'pr'
);


--
-- Name: rsvp_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rsvp_status AS ENUM (
    'vou',
    'nao_vou',
    'talvez'
);


--
-- Name: worship_assignment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.worship_assignment_status AS ENUM (
    'pendente',
    'confirmado',
    'recusado'
);


--
-- Name: worship_schedule_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.worship_schedule_status AS ENUM (
    'rascunho',
    'publicada',
    'concluida'
);


--
-- Name: worship_schedule_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.worship_schedule_type AS ENUM (
    'culto',
    'ensaio',
    'evento'
);


--
-- Name: can_manage_announcement(uuid, public.announcement_scope, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_announcement(_user_id uuid, _scope public.announcement_scope, _ministry_id uuid, _mesa_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    public.has_role(_user_id, 'admin_geral')
    OR (_scope = 'ministerio' AND _ministry_id IS NOT NULL
        AND public.has_ministry_role(_user_id, _ministry_id))
    OR (_scope = 'mesa' AND _mesa_id IS NOT NULL
        AND public.has_mesa_role(_user_id, _mesa_id));
$$;


--
-- Name: can_view_announcement(uuid, public.announcement_scope, uuid, uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_announcement(_user_id uuid, _scope public.announcement_scope, _church_id uuid, _ministry_id uuid, _rede_id uuid, _mesa_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: can_view_mesa(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_mesa(_mesa_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'admin_geral')
      OR EXISTS (
        SELECT 1 FROM public.mesa_members mm
        WHERE mm.mesa_id = _mesa_id AND mm.user_id = _user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.mesas m
        JOIN public.rede_members rm ON rm.rede_id = m.rede_id
        WHERE m.id = _mesa_id AND rm.user_id = _user_id
      );
$$;


--
-- Name: can_view_rede(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_rede(_rede_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'admin_geral')
      OR EXISTS (
        SELECT 1 FROM public.rede_members rm
        WHERE rm.rede_id = _rede_id AND rm.user_id = _user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.mesas m
        JOIN public.mesa_members mm ON mm.mesa_id = m.id
        WHERE m.rede_id = _rede_id AND mm.user_id = _user_id
      );
$$;


--
-- Name: claim_first_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.claim_first_admin(_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin_geral') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin_geral')
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  RETURN false;
END; $$;


--
-- Name: elevate_specific_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.elevate_specific_admin() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Verifica se o e-mail é um dos e-mails privilegiados
  IF NEW.email IN ('alew123@gmail.com', 'alew15_7@hotmail.com') THEN
    -- Remove papel membro padrão se existir
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'membro';
    
    -- Insere o papel de administrador geral
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin_geral')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: gen_pickup_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gen_pickup_code(_prefix text) RETURNS text
    LANGUAGE sql
    SET search_path TO 'public'
    AS $$
  SELECT _prefix || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 5));
$$;


--
-- Name: handle_event_rsvp_reminder(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_event_rsvp_reminder() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_starts_at TIMESTAMPTZ;
  v_reminder_settings JSONB;
BEGIN
  -- Só processamos se o status for 'vou'
  IF NEW.status = 'vou' THEN
    -- Busca detalhes do evento
    SELECT starts_at, reminder_settings INTO v_starts_at, v_reminder_settings
    FROM public.events
    WHERE id = NEW.event_id;

    -- Se o lembrete estiver habilitado no evento
    IF v_reminder_settings->>'enabled' = 'true' THEN
      INSERT INTO public.event_reminders (event_id, user_id, remind_at, settings)
      VALUES (
        NEW.event_id,
        NEW.user_id,
        v_starts_at - (COALESCE((v_reminder_settings->>'lead_time')::INT, 30) * INTERVAL '1 minute'),
        v_reminder_settings
      )
      ON CONFLICT (event_id, user_id) 
      DO UPDATE SET 
        remind_at = EXCLUDED.remind_at,
        settings = EXCLUDED.settings,
        reminded_at = NULL; -- Reseta se mudar o RSVP
    END IF;
  ELSE
    -- Se mudar para 'talvez' ou 'nao_vou', remove o lembrete
    DELETE FROM public.event_reminders
    WHERE event_id = NEW.event_id AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: handle_mesa_main_address(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_mesa_main_address() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.is_main = true THEN
    UPDATE public.mesa_addresses
    SET is_main = false
    WHERE mesa_id = NEW.mesa_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Também cadastra como 'membro' por padrão
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'membro') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;


--
-- Name: has_mesa_role(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_mesa_role(_user_id uuid, _mesa_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND ((role = 'admin_geral') OR (role = 'lider_mesa' AND mesa_id = _mesa_id))
  );
$$;


--
-- Name: has_ministry_role(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_ministry_role(_user_id uuid, _ministry_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND ((role = 'admin_geral') OR (role = 'admin_ministerio' AND ministry_id = _ministry_id))
  );
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;


--
-- Name: inverse_family_relation(public.family_relation, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inverse_family_relation(_relation public.family_relation, _person_gender text) RETURNS public.family_relation
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
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


--
-- Name: is_cantina_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_cantina_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin_geral','admin_cantina'));
$$;


--
-- Name: is_guardian_of(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_guardian_of(_user_id uuid, _child_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kids_guardians
    WHERE child_id = _child_id AND profile_id = _user_id
  );
$$;


--
-- Name: is_kids_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_kids_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('admin_geral','admin_kids')
  );
$$;


--
-- Name: is_leadership(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_leadership(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.is_pastoral(_user_id)
     OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'lider_mesa')
     OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.church_function = 'lider');
$$;


--
-- Name: is_livraria_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_livraria_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin_geral','admin_livraria'));
$$;


--
-- Name: is_mesa_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_mesa_member(_mesa_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mesa_members mm
    WHERE mm.mesa_id = _mesa_id AND mm.user_id = _user_id
  );
$$;


--
-- Name: is_pastoral(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_pastoral(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'admin_geral')
     OR EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE p.id = _user_id AND p.church_function IN ('pastor','apascentador')
     );
$$;


--
-- Name: is_rede_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_rede_member(_rede_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rede_members rm
    WHERE rm.rede_id = _rede_id AND rm.user_id = _user_id
  );
$$;


--
-- Name: kids_find_family_by_phone(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kids_find_family_by_phone(_phone text) RETURNS TABLE(child_id uuid, first_name text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT c.id, split_part(c.full_name, ' ', 1)
  FROM public.kids_guardians g
  JOIN public.kids_children c ON c.id = g.child_id
  WHERE c.is_active
    AND length(regexp_replace(coalesce(_phone,''), '\D', '', 'g')) >= 10
    AND regexp_replace(coalesce(g.phone,''), '\D', '', 'g')
        = regexp_replace(_phone, '\D', '', 'g')
  ORDER BY c.full_name
  LIMIT 10;
$$;


--
-- Name: notify_cleaning_responsible(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_cleaning_responsible() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    next_cleaning RECORD;
BEGIN
    FOR next_cleaning IN 
        SELECT s.id, s.date, s.mesa_id, m.name as mesa_name
        FROM public.cleaning_schedules s
        JOIN public.mesas m ON s.mesa_id = m.id
        WHERE s.date = CURRENT_DATE + INTERVAL '1 day' -- Tomorrow is Friday
          AND EXTRACT(DOW FROM CURRENT_DATE) = 4 -- Today is Thursday (4)
    LOOP
        INSERT INTO public.announcements (
            title,
            body,
            category,
            scope,
            mesa_id,
            is_published,
            published_at,
            created_by
        ) VALUES (
            'Lembrete: Faxina de Amanhã',
            'A ' || next_cleaning.mesa_name || ' é a responsável pela faxina da igreja amanhã. Não esqueçam de conferir o checklist!',
            'info',
            'mesa',
            next_cleaning.mesa_id,
            true,
            now(),
            '00000000-0000-0000-0000-000000000000' -- System user placeholder
        );
    END LOOP;
END;
$$;


--
-- Name: register_public_visitor(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.register_public_visitor(_full_name text, _whatsapp text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _result JSON;
BEGIN
  INSERT INTO public.visitor_checkins (full_name, whatsapp, status)
  VALUES (_full_name, _whatsapp, 'novo')
  RETURNING row_to_json(visitor_checkins.*) INTO _result;
  
  RETURN _result;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


--
-- Name: shares_group(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.shares_group(_target uuid, _viewer uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.mesa_members a
      JOIN public.mesa_members b ON b.mesa_id = a.mesa_id
      WHERE a.user_id = _viewer AND b.user_id = _target
    )
    OR EXISTS (
      SELECT 1 FROM public.rede_members a
      JOIN public.rede_members b ON b.rede_id = a.rede_id
      WHERE a.user_id = _viewer AND b.user_id = _target
    )
    OR EXISTS (
      SELECT 1 FROM public.ministry_members a
      JOIN public.ministry_members b ON b.ministry_id = a.ministry_id
      WHERE a.user_id = _viewer AND b.user_id = _target
    )
    OR EXISTS (
      SELECT 1 FROM public.worship_team_members a
      JOIN public.worship_team_members b ON b.team_id = a.team_id
      WHERE a.user_id = _viewer AND b.user_id = _target
    );
$$;


--
-- Name: sync_family_link(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_family_link() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcement_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcement_reads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    announcement_id uuid NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    read_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    category public.announcement_category DEFAULT 'aviso'::public.announcement_category NOT NULL,
    scope public.announcement_scope DEFAULT 'geral'::public.announcement_scope NOT NULL,
    church_id uuid,
    ministry_id uuid,
    rede_id uuid,
    mesa_id uuid,
    is_pinned boolean DEFAULT false NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: canteen_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canteen_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text DEFAULT 'outros'::text NOT NULL,
    price_cents integer DEFAULT 0 NOT NULL,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT canteen_items_price_cents_check CHECK ((price_cents >= 0))
);


--
-- Name: canteen_menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canteen_menu_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    menu_id uuid NOT NULL,
    item_id uuid NOT NULL,
    price_cents integer DEFAULT 0 NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT canteen_menu_items_price_cents_check CHECK ((price_cents >= 0))
);


--
-- Name: canteen_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canteen_menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    service_date date NOT NULL,
    notes text,
    art_url text,
    status text DEFAULT 'aberto'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT canteen_menus_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'aberto'::text, 'encerrado'::text])))
);


--
-- Name: canteen_reservation_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canteen_reservation_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reservation_id uuid NOT NULL,
    item_id uuid,
    item_name text NOT NULL,
    unit_price_cents integer DEFAULT 0 NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT canteen_reservation_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT canteen_reservation_items_unit_price_cents_check CHECK ((unit_price_cents >= 0))
);


--
-- Name: canteen_reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canteen_reservations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    menu_id uuid NOT NULL,
    user_id uuid NOT NULL,
    pickup_code text DEFAULT public.gen_pickup_code('CAN'::text) NOT NULL,
    status text DEFAULT 'reservado'::text NOT NULL,
    total_cents integer DEFAULT 0 NOT NULL,
    notes text,
    picked_up_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT canteen_reservations_status_check CHECK ((status = ANY (ARRAY['reservado'::text, 'retirado'::text, 'cancelado'::text]))),
    CONSTRAINT canteen_reservations_total_cents_check CHECK ((total_cents >= 0))
);


--
-- Name: churches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.churches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    short_name text,
    city text,
    state text,
    address text,
    phone text,
    email text,
    lead_pastor text,
    is_headquarters boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    zip_code text,
    street_number text,
    neighborhood text,
    pix_key text,
    pix_name text,
    pix_city text
);


--
-- Name: cleaning_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cleaning_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid,
    task_id uuid,
    url text NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT cleaning_photos_type_check CHECK ((type = ANY (ARRAY['before'::text, 'after'::text])))
);


--
-- Name: cleaning_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cleaning_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    mesa_id uuid,
    responsible_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cleaning_schedules_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: cleaning_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cleaning_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid,
    title text NOT NULL,
    description text,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    completed_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    remind_at timestamp with time zone NOT NULL,
    reminded_at timestamp with time zone,
    settings jsonb DEFAULT '{"type": "push"}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_rsvps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status public.rsvp_status DEFAULT 'vou'::public.rsvp_status NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    kind public.event_kind DEFAULT 'evento'::public.event_kind NOT NULL,
    scope public.event_scope DEFAULT 'igreja'::public.event_scope NOT NULL,
    ministry_id uuid,
    rede_id uuid,
    mesa_id uuid,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    location text,
    image_url text,
    requires_rsvp boolean DEFAULT false NOT NULL,
    capacity integer,
    is_featured boolean DEFAULT false NOT NULL,
    status public.event_status DEFAULT 'publicado'::public.event_status NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reminder_settings jsonb DEFAULT '{"type": "push", "enabled": false, "lead_time": 30}'::jsonb,
    mesa_address_id uuid
);


--
-- Name: family_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.family_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    relative_id uuid NOT NULL,
    relation public.family_relation NOT NULL,
    note text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT family_links_distinct CHECK ((person_id <> relative_id))
);


--
-- Name: kids_checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kids_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    child_id uuid NOT NULL,
    security_code text NOT NULL,
    status text DEFAULT 'presente'::text NOT NULL,
    checked_in_at timestamp with time zone DEFAULT now() NOT NULL,
    checked_in_by uuid,
    dropped_by_name text,
    checked_out_at timestamp with time zone,
    checked_out_by uuid,
    picked_up_by_name text,
    day_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kids_children; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kids_children (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    nickname text,
    birth_date date,
    gender text,
    classroom text DEFAULT 'nao_definida'::text NOT NULL,
    church_id uuid,
    allergies text,
    health_notes text,
    special_needs text,
    photo_url text,
    photo_consent boolean DEFAULT false NOT NULL,
    can_leave_alone boolean DEFAULT false NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kids_emergency_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kids_emergency_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    child_id uuid,
    guardian_id uuid,
    message text NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    severity text DEFAULT 'media'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone,
    acknowledged_by_guardian_id uuid,
    CONSTRAINT kids_emergency_alerts_severity_check CHECK ((severity = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text]))),
    CONSTRAINT kids_emergency_alerts_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'recebido'::text, 'confirmado'::text, 'cancelado'::text])))
);


--
-- Name: kids_guardians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kids_guardians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    child_id uuid NOT NULL,
    profile_id uuid,
    full_name text NOT NULL,
    phone text,
    relation text DEFAULT 'responsavel'::text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    can_pickup boolean DEFAULT true NOT NULL,
    document text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    photo_url text
);


--
-- Name: kids_schedule_volunteers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kids_schedule_volunteers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid,
    user_id uuid,
    role text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kids_schedule_volunteers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'declined'::text])))
);


--
-- Name: kids_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kids_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    church_id uuid,
    title text NOT NULL,
    description text,
    event_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kids_schedules_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'completed'::text])))
);


--
-- Name: kids_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kids_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    church_id uuid,
    title text NOT NULL,
    session_date date NOT NULL,
    start_time time without time zone,
    room text,
    notes text,
    status text DEFAULT 'aberta'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kids_visitor_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kids_visitor_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    church_id uuid,
    child_id uuid,
    child_full_name text NOT NULL,
    child_nickname text,
    birth_date date,
    gender text,
    classroom text DEFAULT 'nao_definida'::text NOT NULL,
    allergies text,
    health_notes text,
    special_needs text,
    photo_consent boolean DEFAULT false NOT NULL,
    guardian_full_name text NOT NULL,
    guardian_phone text NOT NULL,
    guardian_relation text DEFAULT 'responsavel'::text NOT NULL,
    guardian_document text,
    other_pickup text,
    notes text,
    status text DEFAULT 'pendente'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    document_url text,
    CONSTRAINT kids_visitor_requests_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'recusado'::text])))
);


--
-- Name: leader_touchpoints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leader_touchpoints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    leader_id uuid NOT NULL,
    member_id uuid NOT NULL,
    mesa_id uuid NOT NULL,
    week_start date NOT NULL,
    channel text DEFAULT 'presencial'::text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT leader_touchpoints_channel_check CHECK ((channel = ANY (ARRAY['presencial'::text, 'ligacao'::text, 'whatsapp'::text, 'mensagem'::text, 'visita'::text, 'oracao'::text])))
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    phone text NOT NULL,
    profile text NOT NULL,
    neighborhood text,
    city text,
    state text,
    suggested_mesa text,
    status text DEFAULT 'novo'::text,
    CONSTRAINT leads_status_check CHECK ((status = ANY (ARRAY['novo'::text, 'em_atendimento'::text, 'vinculado'::text, 'arquivado'::text])))
);


--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    file_url text NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT media_assets_category_check CHECK ((category = ANY (ARRAY['culto'::text, 'evento'::text, 'template'::text, 'identidade'::text])))
);


--
-- Name: media_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    deadline timestamp with time zone,
    status text DEFAULT 'pendente'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT media_requests_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'em_producao'::text, 'concluido'::text, 'cancelado'::text])))
);


--
-- Name: member_onboarding_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_onboarding_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    step_id uuid NOT NULL,
    completed_at timestamp with time zone,
    completed_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: membership_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membership_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    notes text,
    requester_name text,
    requested_by uuid,
    status text DEFAULT 'pendente'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    profile_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT membership_requests_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'recusado'::text])))
);


--
-- Name: mesa_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mesa_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mesa_id uuid NOT NULL,
    label text DEFAULT 'Principal'::text NOT NULL,
    street text NOT NULL,
    number text NOT NULL,
    neighborhood text,
    city text,
    state text,
    postal_code text,
    complement text,
    full_address text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_main boolean DEFAULT false
);


--
-- Name: mesa_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mesa_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mesa_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    role public.church_function DEFAULT 'membro'::public.church_function NOT NULL
);


--
-- Name: mesas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mesas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rede_id uuid,
    name text NOT NULL,
    description text,
    meeting_day text,
    meeting_time text,
    meeting_location text,
    photo_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    church_id uuid
);


--
-- Name: ministries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ministries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    meeting_info text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    church_id uuid
);


--
-- Name: ministry_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ministry_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ministry_id uuid NOT NULL,
    user_id uuid NOT NULL,
    function_name text,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    image_url text,
    category text,
    published_at timestamp with time zone DEFAULT now(),
    is_published boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    author_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pendente'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    url text,
    audience text,
    sent_by uuid
);


--
-- Name: onboarding_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    "position" integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    product_name text NOT NULL,
    unit_price_cents integer DEFAULT 0 NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_unit_price_cents_check CHECK ((unit_price_cents >= 0))
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pickup_code text DEFAULT public.gen_pickup_code('LIV'::text) NOT NULL,
    status text DEFAULT 'aguardando_pagamento'::text NOT NULL,
    total_cents integer DEFAULT 0 NOT NULL,
    payment_proof_url text,
    notes text,
    confirmed_by uuid,
    confirmed_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['aguardando_pagamento'::text, 'pago'::text, 'entregue'::text, 'cancelado'::text]))),
    CONSTRAINT orders_total_cents_check CHECK ((total_cents >= 0))
);


--
-- Name: pastoral_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pastoral_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    author_id uuid NOT NULL,
    kind text DEFAULT 'visita'::text NOT NULL,
    happened_on date DEFAULT CURRENT_DATE NOT NULL,
    content text NOT NULL,
    visibility text DEFAULT 'pastoral'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pastoral_notes_kind_check CHECK ((kind = ANY (ARRAY['visita'::text, 'aconselhamento'::text, 'oracao'::text, 'ligacao'::text, 'outro'::text]))),
    CONSTRAINT pastoral_notes_visibility_check CHECK ((visibility = ANY (ARRAY['pastoral'::text, 'autor'::text])))
);


--
-- Name: prayer_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prayer_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mesa_id uuid NOT NULL,
    category text NOT NULL,
    content text NOT NULL,
    is_private boolean DEFAULT true,
    status text DEFAULT 'pending'::text NOT NULL,
    response text,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT prayer_requests_category_check CHECK ((category = ANY (ARRAY['prayer'::text, 'counseling'::text]))),
    CONSTRAINT prayer_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'replied'::text])))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text DEFAULT 'outros'::text NOT NULL,
    price_cents integer DEFAULT 0 NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    track_stock boolean DEFAULT true NOT NULL,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_price_cents_check CHECK ((price_cents >= 0)),
    CONSTRAINT products_stock_check CHECK ((stock >= 0))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text,
    phone text,
    avatar_url text,
    birth_date date,
    address text,
    bio text,
    is_baptized boolean DEFAULT false,
    member_since date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gender text,
    marital_status text,
    spouse_name text,
    wedding_date date,
    father_name text,
    mother_name text,
    profession text,
    education text,
    cpf text,
    rg text,
    zip_code text,
    street text,
    street_number text,
    complement text,
    neighborhood text,
    city text,
    state text,
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relation text,
    conversion_date date,
    baptism_date date,
    baptism_church text,
    membership_type text,
    previous_church text,
    membership_status text DEFAULT 'ativo'::text NOT NULL,
    membership_end_date date,
    courses text[] DEFAULT '{}'::text[] NOT NULL,
    gifts text,
    availability text,
    allergies text,
    health_notes text,
    blood_type text,
    has_children boolean DEFAULT false NOT NULL,
    children_count integer DEFAULT 0 NOT NULL,
    notes text,
    church_id uuid,
    church_function public.church_function DEFAULT 'membro'::public.church_function NOT NULL,
    ministerial_status public.ministerial_status DEFAULT 'membro'::public.ministerial_status,
    CONSTRAINT profiles_gender_check CHECK ((gender = ANY (ARRAY['masculino'::text, 'feminino'::text]))),
    CONSTRAINT profiles_marital_status_check CHECK ((marital_status = ANY (ARRAY['solteiro'::text, 'casado'::text, 'viuvo'::text, 'divorciado'::text, 'uniao_estavel'::text]))),
    CONSTRAINT profiles_membership_status_check CHECK ((membership_status = ANY (ARRAY['ativo'::text, 'inativo'::text, 'transferido'::text, 'disciplina'::text, 'falecido'::text, 'visitante'::text]))),
    CONSTRAINT profiles_membership_type_check CHECK ((membership_type = ANY (ARRAY['batismo'::text, 'transferencia'::text, 'aclamacao'::text, 'reconciliacao'::text])))
);


--
-- Name: push_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_config (
    id boolean DEFAULT true NOT NULL,
    public_key text NOT NULL,
    private_key text NOT NULL,
    subject text DEFAULT 'mailto:contato@igrejabatistaatos.com.br'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT push_config_id_check CHECK (id)
);


--
-- Name: rede_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rede_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rede_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.church_function DEFAULT 'membro'::public.church_function NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: redes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    target_audience text,
    color text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    church_id uuid
);


--
-- Name: sermons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sermons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    church_id uuid,
    title text NOT NULL,
    theme text,
    preacher text,
    preached_on date,
    base_verse text,
    summary text,
    points jsonb DEFAULT '[]'::jsonb NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    template text DEFAULT 'mapa'::text NOT NULL,
    dark boolean DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    youtube_url text,
    cover_image_url text,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    news_id uuid,
    CONSTRAINT sermons_template_check CHECK ((template = ANY (ARRAY['mapa'::text, 'infografico'::text, 'arte'::text])))
);


--
-- Name: setlist_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setlist_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setlist_id uuid NOT NULL,
    song_id uuid NOT NULL,
    "position" integer NOT NULL,
    key_override text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: setlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    event_date date NOT NULL,
    worship_schedule_id uuid,
    ministry_id uuid,
    notes text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT setlists_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: social_assistance_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_assistance_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    goal_type text NOT NULL,
    goal_target numeric,
    goal_current numeric DEFAULT 0,
    status text DEFAULT 'ativa'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    total_families_reached integer DEFAULT 0,
    CONSTRAINT social_assistance_campaigns_goal_type_check CHECK ((goal_type = ANY (ARRAY['alimento'::text, 'vestuario'::text, 'financeiro'::text, 'outro'::text]))),
    CONSTRAINT social_assistance_campaigns_status_check CHECK ((status = ANY (ARRAY['ativa'::text, 'finalizada'::text])))
);


--
-- Name: social_assistance_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_assistance_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    needs_food boolean DEFAULT false,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT social_assistance_requests_status_check1 CHECK ((status = ANY (ARRAY['pending'::text, 'in_review'::text, 'completed'::text])))
);


--
-- Name: social_assistance_requests_legacy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_assistance_requests_legacy (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_name text NOT NULL,
    requester_phone text,
    family_members_count integer DEFAULT 1,
    needs_description text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    handled_by uuid,
    notes text,
    CONSTRAINT social_assistance_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'fulfilled'::text, 'rejected'::text])))
);


--
-- Name: songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    artist text,
    original_key text,
    bpm integer,
    duration_seconds integer,
    lyrics text,
    youtube_url text,
    spotify_url text,
    chords_url text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_push_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_push_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    token text NOT NULL,
    device_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    endpoint text,
    p256dh text,
    auth text,
    user_agent text,
    last_used_at timestamp with time zone
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    ministry_id uuid,
    mesa_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: visitor_checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitor_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    whatsapp text NOT NULL,
    status text DEFAULT 'novo'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    CONSTRAINT visitor_checkins_status_check CHECK ((status = ANY (ARRAY['novo'::text, 'contatado'::text, 'integrado'::text])))
);


--
-- Name: worship_musicians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worship_musicians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ministry_id uuid DEFAULT '7cc9c01b-b760-4dc7-985e-2e6e8505384b'::uuid NOT NULL,
    user_id uuid NOT NULL,
    functions text[] DEFAULT '{}'::text[] NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: worship_schedule_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worship_schedule_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid NOT NULL,
    user_id uuid NOT NULL,
    function_name text NOT NULL,
    status public.worship_assignment_status DEFAULT 'pendente'::public.worship_assignment_status NOT NULL,
    response_note text,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: worship_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worship_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ministry_id uuid DEFAULT '7cc9c01b-b760-4dc7-985e-2e6e8505384b'::uuid NOT NULL,
    team_id uuid,
    title text NOT NULL,
    schedule_type public.worship_schedule_type DEFAULT 'culto'::public.worship_schedule_type NOT NULL,
    event_date date NOT NULL,
    start_time time without time zone,
    location text,
    notes text,
    status public.worship_schedule_status DEFAULT 'rascunho'::public.worship_schedule_status NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: worship_setlist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worship_setlist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid NOT NULL,
    song_id uuid NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    song_key text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: worship_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worship_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ministry_id uuid DEFAULT '7cc9c01b-b760-4dc7-985e-2e6e8505384b'::uuid NOT NULL,
    title text NOT NULL,
    artist text,
    song_key text,
    bpm integer,
    tempo text,
    theme text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    lyrics text,
    chords text,
    youtube_url text,
    sheet_url text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT worship_songs_tempo_check CHECK ((tempo = ANY (ARRAY['lenta'::text, 'media'::text, 'rapida'::text])))
);


--
-- Name: worship_team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worship_team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    function_name text NOT NULL,
    is_titular boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    instruments text[] DEFAULT '{}'::text[] NOT NULL
);


--
-- Name: worship_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worship_teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ministry_id uuid DEFAULT '7cc9c01b-b760-4dc7-985e-2e6e8505384b'::uuid NOT NULL,
    name text NOT NULL,
    description text,
    minister_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: youtube_videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.youtube_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    youtube_id text NOT NULL,
    title text NOT NULL,
    thumbnail_url text,
    type text NOT NULL,
    url text NOT NULL,
    published_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT youtube_videos_type_check CHECK ((type = ANY (ARRAY['service'::text, 'podcast'::text])))
);


--
-- Name: announcement_reads announcement_reads_announcement_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_user_id_key UNIQUE (announcement_id, user_id);


--
-- Name: announcement_reads announcement_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: canteen_items canteen_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_items
    ADD CONSTRAINT canteen_items_pkey PRIMARY KEY (id);


--
-- Name: canteen_menu_items canteen_menu_items_menu_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_menu_items
    ADD CONSTRAINT canteen_menu_items_menu_id_item_id_key UNIQUE (menu_id, item_id);


--
-- Name: canteen_menu_items canteen_menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_menu_items
    ADD CONSTRAINT canteen_menu_items_pkey PRIMARY KEY (id);


--
-- Name: canteen_menus canteen_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_menus
    ADD CONSTRAINT canteen_menus_pkey PRIMARY KEY (id);


--
-- Name: canteen_reservation_items canteen_reservation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_reservation_items
    ADD CONSTRAINT canteen_reservation_items_pkey PRIMARY KEY (id);


--
-- Name: canteen_reservations canteen_reservations_pickup_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_reservations
    ADD CONSTRAINT canteen_reservations_pickup_code_key UNIQUE (pickup_code);


--
-- Name: canteen_reservations canteen_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_reservations
    ADD CONSTRAINT canteen_reservations_pkey PRIMARY KEY (id);


--
-- Name: churches churches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.churches
    ADD CONSTRAINT churches_pkey PRIMARY KEY (id);


--
-- Name: cleaning_photos cleaning_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_photos
    ADD CONSTRAINT cleaning_photos_pkey PRIMARY KEY (id);


--
-- Name: cleaning_schedules cleaning_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_schedules
    ADD CONSTRAINT cleaning_schedules_pkey PRIMARY KEY (id);


--
-- Name: cleaning_tasks cleaning_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_tasks
    ADD CONSTRAINT cleaning_tasks_pkey PRIMARY KEY (id);


--
-- Name: event_reminders event_reminders_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_reminders
    ADD CONSTRAINT event_reminders_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_reminders event_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_reminders
    ADD CONSTRAINT event_reminders_pkey PRIMARY KEY (id);


--
-- Name: event_rsvps event_rsvps_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_rsvps event_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: family_links family_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_links
    ADD CONSTRAINT family_links_pkey PRIMARY KEY (id);


--
-- Name: family_links family_links_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_links
    ADD CONSTRAINT family_links_unique UNIQUE (person_id, relative_id);


--
-- Name: kids_checkins kids_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_checkins
    ADD CONSTRAINT kids_checkins_pkey PRIMARY KEY (id);


--
-- Name: kids_checkins kids_checkins_session_id_child_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_checkins
    ADD CONSTRAINT kids_checkins_session_id_child_id_key UNIQUE (session_id, child_id);


--
-- Name: kids_children kids_children_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_children
    ADD CONSTRAINT kids_children_pkey PRIMARY KEY (id);


--
-- Name: kids_emergency_alerts kids_emergency_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_emergency_alerts
    ADD CONSTRAINT kids_emergency_alerts_pkey PRIMARY KEY (id);


--
-- Name: kids_guardians kids_guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_guardians
    ADD CONSTRAINT kids_guardians_pkey PRIMARY KEY (id);


--
-- Name: kids_schedule_volunteers kids_schedule_volunteers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_schedule_volunteers
    ADD CONSTRAINT kids_schedule_volunteers_pkey PRIMARY KEY (id);


--
-- Name: kids_schedule_volunteers kids_schedule_volunteers_schedule_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_schedule_volunteers
    ADD CONSTRAINT kids_schedule_volunteers_schedule_id_user_id_key UNIQUE (schedule_id, user_id);


--
-- Name: kids_schedules kids_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_schedules
    ADD CONSTRAINT kids_schedules_pkey PRIMARY KEY (id);


--
-- Name: kids_sessions kids_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_sessions
    ADD CONSTRAINT kids_sessions_pkey PRIMARY KEY (id);


--
-- Name: kids_visitor_requests kids_visitor_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_visitor_requests
    ADD CONSTRAINT kids_visitor_requests_pkey PRIMARY KEY (id);


--
-- Name: leader_touchpoints leader_touchpoints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leader_touchpoints
    ADD CONSTRAINT leader_touchpoints_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: media_requests media_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_requests
    ADD CONSTRAINT media_requests_pkey PRIMARY KEY (id);


--
-- Name: member_onboarding_steps member_onboarding_steps_person_id_step_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_onboarding_steps
    ADD CONSTRAINT member_onboarding_steps_person_id_step_id_key UNIQUE (person_id, step_id);


--
-- Name: member_onboarding_steps member_onboarding_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_onboarding_steps
    ADD CONSTRAINT member_onboarding_steps_pkey PRIMARY KEY (id);


--
-- Name: membership_requests membership_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_requests
    ADD CONSTRAINT membership_requests_pkey PRIMARY KEY (id);


--
-- Name: mesa_addresses mesa_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesa_addresses
    ADD CONSTRAINT mesa_addresses_pkey PRIMARY KEY (id);


--
-- Name: mesa_members mesa_members_mesa_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesa_members
    ADD CONSTRAINT mesa_members_mesa_id_user_id_key UNIQUE (mesa_id, user_id);


--
-- Name: mesa_members mesa_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesa_members
    ADD CONSTRAINT mesa_members_pkey PRIMARY KEY (id);


--
-- Name: mesas mesas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT mesas_pkey PRIMARY KEY (id);


--
-- Name: ministries ministries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ministries
    ADD CONSTRAINT ministries_pkey PRIMARY KEY (id);


--
-- Name: ministries ministries_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ministries
    ADD CONSTRAINT ministries_slug_key UNIQUE (slug);


--
-- Name: ministry_members ministry_members_ministry_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ministry_members
    ADD CONSTRAINT ministry_members_ministry_id_user_id_key UNIQUE (ministry_id, user_id);


--
-- Name: ministry_members ministry_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ministry_members
    ADD CONSTRAINT ministry_members_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: news news_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_slug_key UNIQUE (slug);


--
-- Name: notifications_history notifications_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_history
    ADD CONSTRAINT notifications_history_pkey PRIMARY KEY (id);


--
-- Name: onboarding_steps onboarding_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_steps
    ADD CONSTRAINT onboarding_steps_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pickup_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pickup_code_key UNIQUE (pickup_code);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: pastoral_notes pastoral_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pastoral_notes
    ADD CONSTRAINT pastoral_notes_pkey PRIMARY KEY (id);


--
-- Name: prayer_requests prayer_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_requests
    ADD CONSTRAINT prayer_requests_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: push_config push_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_config
    ADD CONSTRAINT push_config_pkey PRIMARY KEY (id);


--
-- Name: rede_members rede_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rede_members
    ADD CONSTRAINT rede_members_pkey PRIMARY KEY (id);


--
-- Name: rede_members rede_members_rede_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rede_members
    ADD CONSTRAINT rede_members_rede_id_user_id_key UNIQUE (rede_id, user_id);


--
-- Name: redes redes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redes
    ADD CONSTRAINT redes_pkey PRIMARY KEY (id);


--
-- Name: redes redes_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redes
    ADD CONSTRAINT redes_slug_key UNIQUE (slug);


--
-- Name: sermons sermons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sermons
    ADD CONSTRAINT sermons_pkey PRIMARY KEY (id);


--
-- Name: setlist_songs setlist_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlist_songs
    ADD CONSTRAINT setlist_songs_pkey PRIMARY KEY (id);


--
-- Name: setlist_songs setlist_songs_setlist_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlist_songs
    ADD CONSTRAINT setlist_songs_setlist_id_position_key UNIQUE (setlist_id, "position");


--
-- Name: setlist_songs setlist_songs_setlist_id_song_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlist_songs
    ADD CONSTRAINT setlist_songs_setlist_id_song_id_key UNIQUE (setlist_id, song_id);


--
-- Name: setlists setlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_pkey PRIMARY KEY (id);


--
-- Name: social_assistance_campaigns social_assistance_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_assistance_campaigns
    ADD CONSTRAINT social_assistance_campaigns_pkey PRIMARY KEY (id);


--
-- Name: social_assistance_requests_legacy social_assistance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_assistance_requests_legacy
    ADD CONSTRAINT social_assistance_requests_pkey PRIMARY KEY (id);


--
-- Name: social_assistance_requests social_assistance_requests_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_assistance_requests
    ADD CONSTRAINT social_assistance_requests_pkey1 PRIMARY KEY (id);


--
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (id);


--
-- Name: user_push_tokens user_push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_push_tokens
    ADD CONSTRAINT user_push_tokens_pkey PRIMARY KEY (id);


--
-- Name: user_push_tokens user_push_tokens_user_id_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_push_tokens
    ADD CONSTRAINT user_push_tokens_user_id_token_key UNIQUE (user_id, token);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_ministry_id_mesa_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_ministry_id_mesa_id_key UNIQUE (user_id, role, ministry_id, mesa_id);


--
-- Name: visitor_checkins visitor_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_checkins
    ADD CONSTRAINT visitor_checkins_pkey PRIMARY KEY (id);


--
-- Name: worship_musicians worship_musicians_ministry_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_musicians
    ADD CONSTRAINT worship_musicians_ministry_id_user_id_key UNIQUE (ministry_id, user_id);


--
-- Name: worship_musicians worship_musicians_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_musicians
    ADD CONSTRAINT worship_musicians_pkey PRIMARY KEY (id);


--
-- Name: worship_schedule_assignments worship_schedule_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_schedule_assignments
    ADD CONSTRAINT worship_schedule_assignments_pkey PRIMARY KEY (id);


--
-- Name: worship_schedule_assignments worship_schedule_assignments_schedule_id_user_id_function_n_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_schedule_assignments
    ADD CONSTRAINT worship_schedule_assignments_schedule_id_user_id_function_n_key UNIQUE (schedule_id, user_id, function_name);


--
-- Name: worship_schedules worship_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_schedules
    ADD CONSTRAINT worship_schedules_pkey PRIMARY KEY (id);


--
-- Name: worship_setlist_items worship_setlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_setlist_items
    ADD CONSTRAINT worship_setlist_items_pkey PRIMARY KEY (id);


--
-- Name: worship_setlist_items worship_setlist_items_schedule_id_song_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_setlist_items
    ADD CONSTRAINT worship_setlist_items_schedule_id_song_id_key UNIQUE (schedule_id, song_id);


--
-- Name: worship_songs worship_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_songs
    ADD CONSTRAINT worship_songs_pkey PRIMARY KEY (id);


--
-- Name: worship_team_members worship_team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_team_members
    ADD CONSTRAINT worship_team_members_pkey PRIMARY KEY (id);


--
-- Name: worship_team_members worship_team_members_team_id_user_id_function_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_team_members
    ADD CONSTRAINT worship_team_members_team_id_user_id_function_name_key UNIQUE (team_id, user_id, function_name);


--
-- Name: worship_teams worship_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_teams
    ADD CONSTRAINT worship_teams_pkey PRIMARY KEY (id);


--
-- Name: youtube_videos youtube_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtube_videos
    ADD CONSTRAINT youtube_videos_pkey PRIMARY KEY (id);


--
-- Name: youtube_videos youtube_videos_youtube_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtube_videos
    ADD CONSTRAINT youtube_videos_youtube_id_key UNIQUE (youtube_id);


--
-- Name: canteen_res_items_res_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX canteen_res_items_res_idx ON public.canteen_reservation_items USING btree (reservation_id);


--
-- Name: canteen_res_menu_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX canteen_res_menu_idx ON public.canteen_reservations USING btree (menu_id);


--
-- Name: canteen_res_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX canteen_res_user_idx ON public.canteen_reservations USING btree (user_id);


--
-- Name: event_rsvps_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_rsvps_event_idx ON public.event_rsvps USING btree (event_id);


--
-- Name: events_mesa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_mesa_idx ON public.events USING btree (mesa_id);


--
-- Name: events_ministry_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_ministry_idx ON public.events USING btree (ministry_id);


--
-- Name: events_rede_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_rede_idx ON public.events USING btree (rede_id);


--
-- Name: events_starts_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_starts_at_idx ON public.events USING btree (starts_at);


--
-- Name: family_links_person_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX family_links_person_idx ON public.family_links USING btree (person_id);


--
-- Name: family_links_relative_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX family_links_relative_idx ON public.family_links USING btree (relative_id);


--
-- Name: idx_announcement_reads_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcement_reads_user ON public.announcement_reads USING btree (user_id);


--
-- Name: idx_announcements_church; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_church ON public.announcements USING btree (church_id);


--
-- Name: idx_announcements_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_created_by ON public.announcements USING btree (created_by);


--
-- Name: idx_announcements_mesa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_mesa ON public.announcements USING btree (mesa_id);


--
-- Name: idx_announcements_ministry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_ministry ON public.announcements USING btree (ministry_id);


--
-- Name: idx_announcements_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_published ON public.announcements USING btree (is_published, published_at DESC);


--
-- Name: idx_announcements_rede; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_rede ON public.announcements USING btree (rede_id);


--
-- Name: idx_announcements_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_scope ON public.announcements USING btree (scope);


--
-- Name: idx_kids_checkins_child; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kids_checkins_child ON public.kids_checkins USING btree (child_id);


--
-- Name: idx_kids_checkins_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kids_checkins_session ON public.kids_checkins USING btree (session_id);


--
-- Name: idx_kids_guardians_child; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kids_guardians_child ON public.kids_guardians USING btree (child_id);


--
-- Name: idx_kids_guardians_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kids_guardians_profile ON public.kids_guardians USING btree (profile_id);


--
-- Name: idx_kids_sessions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kids_sessions_date ON public.kids_sessions USING btree (session_date DESC);


--
-- Name: idx_membership_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_membership_requests_status ON public.membership_requests USING btree (status);


--
-- Name: idx_worship_assignments_schedule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_assignments_schedule ON public.worship_schedule_assignments USING btree (schedule_id);


--
-- Name: idx_worship_assignments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_assignments_user ON public.worship_schedule_assignments USING btree (user_id);


--
-- Name: idx_worship_schedule_assignments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_schedule_assignments_user ON public.worship_schedule_assignments USING btree (user_id);


--
-- Name: idx_worship_schedules_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_schedules_date ON public.worship_schedules USING btree (event_date DESC);


--
-- Name: idx_worship_schedules_ministry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_schedules_ministry ON public.worship_schedules USING btree (ministry_id);


--
-- Name: idx_worship_schedules_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_schedules_team ON public.worship_schedules USING btree (team_id);


--
-- Name: idx_worship_setlist_schedule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_setlist_schedule ON public.worship_setlist_items USING btree (schedule_id);


--
-- Name: idx_worship_songs_ministry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_songs_ministry ON public.worship_songs USING btree (ministry_id);


--
-- Name: idx_worship_songs_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_songs_title ON public.worship_songs USING btree (title);


--
-- Name: idx_worship_team_members_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_team_members_team ON public.worship_team_members USING btree (team_id);


--
-- Name: idx_worship_team_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_team_members_user ON public.worship_team_members USING btree (user_id);


--
-- Name: idx_worship_teams_ministry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worship_teams_ministry ON public.worship_teams USING btree (ministry_id);


--
-- Name: kids_visitor_requests_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kids_visitor_requests_phone_idx ON public.kids_visitor_requests USING btree (guardian_phone);


--
-- Name: kids_visitor_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kids_visitor_requests_status_idx ON public.kids_visitor_requests USING btree (status, created_at DESC);


--
-- Name: leader_touchpoints_leader_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leader_touchpoints_leader_week ON public.leader_touchpoints USING btree (leader_id, week_start);


--
-- Name: leader_touchpoints_unique_week; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX leader_touchpoints_unique_week ON public.leader_touchpoints USING btree (leader_id, member_id, week_start);


--
-- Name: member_onboarding_person_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX member_onboarding_person_idx ON public.member_onboarding_steps USING btree (person_id);


--
-- Name: mesas_church_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mesas_church_id_idx ON public.mesas USING btree (church_id);


--
-- Name: ministries_church_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ministries_church_id_idx ON public.ministries USING btree (church_id);


--
-- Name: order_items_order_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: orders_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_user_id_idx ON public.orders USING btree (user_id);


--
-- Name: pastoral_notes_person_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pastoral_notes_person_idx ON public.pastoral_notes USING btree (person_id, happened_on DESC);


--
-- Name: profiles_church_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_church_id_idx ON public.profiles USING btree (church_id);


--
-- Name: profiles_gender_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_gender_idx ON public.profiles USING btree (gender);


--
-- Name: profiles_membership_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_membership_status_idx ON public.profiles USING btree (membership_status);


--
-- Name: rede_members_rede_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rede_members_rede_id_idx ON public.rede_members USING btree (rede_id);


--
-- Name: rede_members_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rede_members_user_id_idx ON public.rede_members USING btree (user_id);


--
-- Name: redes_church_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX redes_church_id_idx ON public.redes USING btree (church_id);


--
-- Name: sermons_preached_on_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sermons_preached_on_idx ON public.sermons USING btree (preached_on DESC);


--
-- Name: user_push_tokens_endpoint_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_push_tokens_endpoint_key ON public.user_push_tokens USING btree (endpoint) WHERE (endpoint IS NOT NULL);


--
-- Name: worship_musicians_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX worship_musicians_user_idx ON public.worship_musicians USING btree (user_id);


--
-- Name: announcements announcements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: app_settings app_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: canteen_items canteen_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER canteen_items_updated_at BEFORE UPDATE ON public.canteen_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: canteen_menus canteen_menus_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER canteen_menus_updated_at BEFORE UPDATE ON public.canteen_menus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: canteen_reservations canteen_res_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER canteen_res_updated_at BEFORE UPDATE ON public.canteen_reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: churches churches_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER churches_set_updated_at BEFORE UPDATE ON public.churches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_rsvps event_rsvps_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER event_rsvps_set_updated_at BEFORE UPDATE ON public.event_rsvps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: events events_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: family_links family_links_sync; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER family_links_sync AFTER INSERT OR DELETE OR UPDATE ON public.family_links FOR EACH ROW EXECUTE FUNCTION public.sync_family_link();


--
-- Name: family_links family_links_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER family_links_updated_at BEFORE UPDATE ON public.family_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kids_visitor_requests kids_visitor_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kids_visitor_requests_updated_at BEFORE UPDATE ON public.kids_visitor_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: member_onboarding_steps member_onboarding_steps_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER member_onboarding_steps_updated_at BEFORE UPDATE ON public.member_onboarding_steps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: mesas mesas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER mesas_updated_at BEFORE UPDATE ON public.mesas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ministries ministries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ministries_updated_at BEFORE UPDATE ON public.ministries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_rsvps on_event_rsvp_reminder; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_event_rsvp_reminder AFTER INSERT OR UPDATE ON public.event_rsvps FOR EACH ROW EXECUTE FUNCTION public.handle_event_rsvp_reminder();


--
-- Name: onboarding_steps onboarding_steps_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER onboarding_steps_updated_at BEFORE UPDATE ON public.onboarding_steps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: orders orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pastoral_notes pastoral_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER pastoral_notes_updated_at BEFORE UPDATE ON public.pastoral_notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: products products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: redes redes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER redes_updated_at BEFORE UPDATE ON public.redes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sermons sermons_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sermons_set_updated_at BEFORE UPDATE ON public.sermons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kids_checkins set_kids_checkins_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_kids_checkins_updated_at BEFORE UPDATE ON public.kids_checkins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kids_children set_kids_children_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_kids_children_updated_at BEFORE UPDATE ON public.kids_children FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kids_guardians set_kids_guardians_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_kids_guardians_updated_at BEFORE UPDATE ON public.kids_guardians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kids_sessions set_kids_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_kids_sessions_updated_at BEFORE UPDATE ON public.kids_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: membership_requests set_membership_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_membership_requests_updated_at BEFORE UPDATE ON public.membership_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: mesa_addresses tr_ensure_single_main_address; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_ensure_single_main_address BEFORE INSERT OR UPDATE OF is_main ON public.mesa_addresses FOR EACH ROW WHEN ((new.is_main = true)) EXECUTE FUNCTION public.handle_mesa_main_address();


--
-- Name: worship_schedule_assignments trg_worship_assignments_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_worship_assignments_updated BEFORE UPDATE ON public.worship_schedule_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: worship_schedules trg_worship_schedules_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_worship_schedules_updated BEFORE UPDATE ON public.worship_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: worship_songs trg_worship_songs_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_worship_songs_updated BEFORE UPDATE ON public.worship_songs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: worship_teams trg_worship_teams_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_worship_teams_updated BEFORE UPDATE ON public.worship_teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: worship_musicians worship_musicians_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER worship_musicians_updated_at BEFORE UPDATE ON public.worship_musicians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: announcement_reads announcement_reads_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_mesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_rede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_rede_id_fkey FOREIGN KEY (rede_id) REFERENCES public.redes(id) ON DELETE CASCADE;


--
-- Name: canteen_menu_items canteen_menu_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_menu_items
    ADD CONSTRAINT canteen_menu_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.canteen_items(id) ON DELETE CASCADE;


--
-- Name: canteen_menu_items canteen_menu_items_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_menu_items
    ADD CONSTRAINT canteen_menu_items_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.canteen_menus(id) ON DELETE CASCADE;


--
-- Name: canteen_reservation_items canteen_reservation_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_reservation_items
    ADD CONSTRAINT canteen_reservation_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.canteen_items(id) ON DELETE SET NULL;


--
-- Name: canteen_reservation_items canteen_reservation_items_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_reservation_items
    ADD CONSTRAINT canteen_reservation_items_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.canteen_reservations(id) ON DELETE CASCADE;


--
-- Name: canteen_reservations canteen_reservations_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canteen_reservations
    ADD CONSTRAINT canteen_reservations_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.canteen_menus(id) ON DELETE CASCADE;


--
-- Name: cleaning_photos cleaning_photos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_photos
    ADD CONSTRAINT cleaning_photos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: cleaning_photos cleaning_photos_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_photos
    ADD CONSTRAINT cleaning_photos_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.cleaning_schedules(id) ON DELETE CASCADE;


--
-- Name: cleaning_photos cleaning_photos_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_photos
    ADD CONSTRAINT cleaning_photos_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.cleaning_tasks(id) ON DELETE CASCADE;


--
-- Name: cleaning_schedules cleaning_schedules_mesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_schedules
    ADD CONSTRAINT cleaning_schedules_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id) ON DELETE SET NULL;


--
-- Name: cleaning_schedules cleaning_schedules_responsible_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_schedules
    ADD CONSTRAINT cleaning_schedules_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES auth.users(id);


--
-- Name: cleaning_tasks cleaning_tasks_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_tasks
    ADD CONSTRAINT cleaning_tasks_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES auth.users(id);


--
-- Name: cleaning_tasks cleaning_tasks_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cleaning_tasks
    ADD CONSTRAINT cleaning_tasks_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.cleaning_schedules(id) ON DELETE CASCADE;


--
-- Name: event_reminders event_reminders_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_reminders
    ADD CONSTRAINT event_reminders_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_reminders event_reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_reminders
    ADD CONSTRAINT event_reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: event_rsvps event_rsvps_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_rsvps event_rsvps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: events events_mesa_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_mesa_address_id_fkey FOREIGN KEY (mesa_address_id) REFERENCES public.mesa_addresses(id) ON DELETE SET NULL;


--
-- Name: events events_mesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id) ON DELETE CASCADE;


--
-- Name: events events_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: events events_rede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_rede_id_fkey FOREIGN KEY (rede_id) REFERENCES public.redes(id) ON DELETE CASCADE;


--
-- Name: family_links family_links_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_links
    ADD CONSTRAINT family_links_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: family_links family_links_relative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_links
    ADD CONSTRAINT family_links_relative_id_fkey FOREIGN KEY (relative_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: kids_checkins kids_checkins_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_checkins
    ADD CONSTRAINT kids_checkins_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.kids_children(id) ON DELETE CASCADE;


--
-- Name: kids_checkins kids_checkins_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_checkins
    ADD CONSTRAINT kids_checkins_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.kids_sessions(id) ON DELETE CASCADE;


--
-- Name: kids_children kids_children_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_children
    ADD CONSTRAINT kids_children_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: kids_emergency_alerts kids_emergency_alerts_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_emergency_alerts
    ADD CONSTRAINT kids_emergency_alerts_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.kids_children(id) ON DELETE CASCADE;


--
-- Name: kids_emergency_alerts kids_emergency_alerts_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_emergency_alerts
    ADD CONSTRAINT kids_emergency_alerts_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.kids_guardians(id) ON DELETE CASCADE;


--
-- Name: kids_emergency_alerts kids_emergency_alerts_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_emergency_alerts
    ADD CONSTRAINT kids_emergency_alerts_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.kids_sessions(id) ON DELETE CASCADE;


--
-- Name: kids_guardians kids_guardians_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_guardians
    ADD CONSTRAINT kids_guardians_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.kids_children(id) ON DELETE CASCADE;


--
-- Name: kids_guardians kids_guardians_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_guardians
    ADD CONSTRAINT kids_guardians_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: kids_schedule_volunteers kids_schedule_volunteers_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_schedule_volunteers
    ADD CONSTRAINT kids_schedule_volunteers_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.kids_schedules(id) ON DELETE CASCADE;


--
-- Name: kids_schedule_volunteers kids_schedule_volunteers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_schedule_volunteers
    ADD CONSTRAINT kids_schedule_volunteers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: kids_schedules kids_schedules_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_schedules
    ADD CONSTRAINT kids_schedules_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE CASCADE;


--
-- Name: kids_schedules kids_schedules_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_schedules
    ADD CONSTRAINT kids_schedules_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.kids_sessions(id) ON DELETE CASCADE;


--
-- Name: kids_sessions kids_sessions_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_sessions
    ADD CONSTRAINT kids_sessions_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: kids_visitor_requests kids_visitor_requests_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_visitor_requests
    ADD CONSTRAINT kids_visitor_requests_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.kids_children(id) ON DELETE SET NULL;


--
-- Name: kids_visitor_requests kids_visitor_requests_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kids_visitor_requests
    ADD CONSTRAINT kids_visitor_requests_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: leader_touchpoints leader_touchpoints_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leader_touchpoints
    ADD CONSTRAINT leader_touchpoints_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: leader_touchpoints leader_touchpoints_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leader_touchpoints
    ADD CONSTRAINT leader_touchpoints_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: leader_touchpoints leader_touchpoints_mesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leader_touchpoints
    ADD CONSTRAINT leader_touchpoints_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id) ON DELETE CASCADE;


--
-- Name: media_assets media_assets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: media_requests media_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_requests
    ADD CONSTRAINT media_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id);


--
-- Name: member_onboarding_steps member_onboarding_steps_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_onboarding_steps
    ADD CONSTRAINT member_onboarding_steps_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: member_onboarding_steps member_onboarding_steps_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_onboarding_steps
    ADD CONSTRAINT member_onboarding_steps_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.onboarding_steps(id) ON DELETE CASCADE;


--
-- Name: membership_requests membership_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_requests
    ADD CONSTRAINT membership_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: mesa_addresses mesa_addresses_mesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesa_addresses
    ADD CONSTRAINT mesa_addresses_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id) ON DELETE CASCADE;


--
-- Name: mesa_members mesa_members_mesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesa_members
    ADD CONSTRAINT mesa_members_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id) ON DELETE CASCADE;


--
-- Name: mesa_members mesa_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesa_members
    ADD CONSTRAINT mesa_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: mesas mesas_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT mesas_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: mesas mesas_rede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT mesas_rede_id_fkey FOREIGN KEY (rede_id) REFERENCES public.redes(id) ON DELETE SET NULL;


--
-- Name: ministries ministries_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ministries
    ADD CONSTRAINT ministries_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: ministry_members ministry_members_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ministry_members
    ADD CONSTRAINT ministry_members_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: ministry_members ministry_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ministry_members
    ADD CONSTRAINT ministry_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);


--
-- Name: notifications_history notifications_history_sent_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_history
    ADD CONSTRAINT notifications_history_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: notifications_history notifications_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_history
    ADD CONSTRAINT notifications_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: pastoral_notes pastoral_notes_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pastoral_notes
    ADD CONSTRAINT pastoral_notes_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: prayer_requests prayer_requests_mesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_requests
    ADD CONSTRAINT prayer_requests_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id) ON DELETE CASCADE;


--
-- Name: prayer_requests prayer_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_requests
    ADD CONSTRAINT prayer_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: rede_members rede_members_rede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rede_members
    ADD CONSTRAINT rede_members_rede_id_fkey FOREIGN KEY (rede_id) REFERENCES public.redes(id) ON DELETE CASCADE;


--
-- Name: rede_members rede_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rede_members
    ADD CONSTRAINT rede_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: redes redes_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redes
    ADD CONSTRAINT redes_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: sermons sermons_church_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sermons
    ADD CONSTRAINT sermons_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;


--
-- Name: sermons sermons_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sermons
    ADD CONSTRAINT sermons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sermons sermons_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sermons
    ADD CONSTRAINT sermons_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id) ON DELETE SET NULL;


--
-- Name: setlist_songs setlist_songs_setlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlist_songs
    ADD CONSTRAINT setlist_songs_setlist_id_fkey FOREIGN KEY (setlist_id) REFERENCES public.setlists(id) ON DELETE CASCADE;


--
-- Name: setlist_songs setlist_songs_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlist_songs
    ADD CONSTRAINT setlist_songs_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: setlists setlists_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: setlists setlists_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE SET NULL;


--
-- Name: setlists setlists_worship_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_worship_schedule_id_fkey FOREIGN KEY (worship_schedule_id) REFERENCES public.worship_schedules(id) ON DELETE SET NULL;


--
-- Name: social_assistance_requests_legacy social_assistance_requests_handled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_assistance_requests_legacy
    ADD CONSTRAINT social_assistance_requests_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES auth.users(id);


--
-- Name: social_assistance_requests social_assistance_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_assistance_requests
    ADD CONSTRAINT social_assistance_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_push_tokens user_push_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_push_tokens
    ADD CONSTRAINT user_push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: visitor_checkins visitor_checkins_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_checkins
    ADD CONSTRAINT visitor_checkins_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: worship_musicians worship_musicians_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_musicians
    ADD CONSTRAINT worship_musicians_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: worship_musicians worship_musicians_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_musicians
    ADD CONSTRAINT worship_musicians_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: worship_schedule_assignments worship_schedule_assignments_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_schedule_assignments
    ADD CONSTRAINT worship_schedule_assignments_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.worship_schedules(id) ON DELETE CASCADE;


--
-- Name: worship_schedule_assignments worship_schedule_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_schedule_assignments
    ADD CONSTRAINT worship_schedule_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: worship_schedules worship_schedules_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_schedules
    ADD CONSTRAINT worship_schedules_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: worship_schedules worship_schedules_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_schedules
    ADD CONSTRAINT worship_schedules_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.worship_teams(id) ON DELETE SET NULL;


--
-- Name: worship_setlist_items worship_setlist_items_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_setlist_items
    ADD CONSTRAINT worship_setlist_items_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.worship_schedules(id) ON DELETE CASCADE;


--
-- Name: worship_setlist_items worship_setlist_items_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_setlist_items
    ADD CONSTRAINT worship_setlist_items_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.worship_songs(id) ON DELETE CASCADE;


--
-- Name: worship_songs worship_songs_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_songs
    ADD CONSTRAINT worship_songs_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: worship_team_members worship_team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_team_members
    ADD CONSTRAINT worship_team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.worship_teams(id) ON DELETE CASCADE;


--
-- Name: worship_team_members worship_team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_team_members
    ADD CONSTRAINT worship_team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: worship_teams worship_teams_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worship_teams
    ADD CONSTRAINT worship_teams_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: membership_requests Admin geral atualiza solicitacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin geral atualiza solicitacoes" ON public.membership_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: family_links Admin geral gerencia vinculos familiares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin geral gerencia vinculos familiares" ON public.family_links TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: membership_requests Admin geral remove solicitacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin geral remove solicitacoes" ON public.membership_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: onboarding_steps Admin gerencia etapas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin gerencia etapas" ON public.onboarding_steps TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: visitor_checkins Admin management; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin management" ON public.visitor_checkins TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: social_assistance_requests_legacy Admins can manage assistance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage assistance requests" ON public.social_assistance_requests_legacy TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = 'admin'::text)))));


--
-- Name: kids_schedules Admins can manage kids schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage kids schedules" ON public.kids_schedules TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR public.has_role(auth.uid(), 'admin_kids'::public.app_role)));


--
-- Name: youtube_videos Admins can manage youtube videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage youtube videos" ON public.youtube_videos TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: leads Admins can view all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: social_assistance_requests Admins can view all social assistance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all social assistance requests" ON public.social_assistance_requests FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_geral'::public.app_role)))));


--
-- Name: social_assistance_requests_legacy Admins can view all social assistance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all social assistance requests" ON public.social_assistance_requests_legacy FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_geral'::public.app_role)))));


--
-- Name: kids_emergency_alerts Admins e Líderes Kids podem gerenciar alertas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins e Líderes Kids podem gerenciar alertas" ON public.kids_emergency_alerts TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR public.has_role(auth.uid(), 'admin_kids'::public.app_role)));


--
-- Name: cleaning_schedules Admins e responsáveis podem gerenciar escalas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins e responsáveis podem gerenciar escalas" ON public.cleaning_schedules TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (auth.uid() = responsible_id)));


--
-- Name: cleaning_photos Admins e responsáveis podem gerenciar fotos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins e responsáveis podem gerenciar fotos" ON public.cleaning_photos TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.cleaning_schedules s
  WHERE ((s.id = cleaning_photos.schedule_id) AND (public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (auth.uid() = s.responsible_id))))));


--
-- Name: cleaning_tasks Admins e responsáveis podem gerenciar tarefas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins e responsáveis podem gerenciar tarefas" ON public.cleaning_tasks TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.cleaning_schedules s
  WHERE ((s.id = cleaning_tasks.schedule_id) AND (public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (auth.uid() = s.responsible_id))))));


--
-- Name: songs Admins editam músicas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins editam músicas" ON public.songs TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR public.has_role(auth.uid(), 'admin_ministerio'::public.app_role)));


--
-- Name: social_assistance_campaigns Admins gerenciam campanhas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins gerenciam campanhas" ON public.social_assistance_campaigns TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: media_assets Admins gerenciam mídias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins gerenciam mídias" ON public.media_assets TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: setlist_songs Admins gerenciam músicas do setlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins gerenciam músicas do setlist" ON public.setlist_songs TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.setlists s
  WHERE ((s.id = setlist_songs.setlist_id) AND (public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR public.has_role(auth.uid(), 'admin_ministerio'::public.app_role))))));


--
-- Name: news Admins gerenciam notícias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins gerenciam notícias" ON public.news TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: setlists Admins gerenciam setlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins gerenciam setlists" ON public.setlists TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR public.has_role(auth.uid(), 'admin_ministerio'::public.app_role)));


--
-- Name: sermons Admins manage sermons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage sermons" ON public.sermons TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: leads Anyone can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);


--
-- Name: family_links Autenticados veem vinculos familiares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autenticados veem vinculos familiares" ON public.family_links FOR SELECT TO authenticated USING (true);


--
-- Name: youtube_videos Authenticated users can view youtube videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view youtube videos" ON public.youtube_videos FOR SELECT TO authenticated USING (true);


--
-- Name: pastoral_notes Autor edita anotacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autor edita anotacao" ON public.pastoral_notes FOR UPDATE TO authenticated USING ((author_id = auth.uid())) WITH CHECK ((author_id = auth.uid()));


--
-- Name: announcements Autor ou admin apaga avisos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autor ou admin apaga avisos" ON public.announcements FOR DELETE TO authenticated USING (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role)));


--
-- Name: announcements Autor ou admin edita avisos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autor ou admin edita avisos" ON public.announcements FOR UPDATE TO authenticated USING (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role))) WITH CHECK ((public.can_manage_announcement(auth.uid(), scope, ministry_id, mesa_id) OR (created_by = auth.uid())));


--
-- Name: pastoral_notes Autor ou admin remove anotacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autor ou admin remove anotacao" ON public.pastoral_notes FOR DELETE TO authenticated USING (((author_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role)));


--
-- Name: announcement_reads Cada um marca a propria leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cada um marca a propria leitura" ON public.announcement_reads FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: announcement_reads Cada um remove a propria leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cada um remove a propria leitura" ON public.announcement_reads FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: visitor_checkins Ecclesiastical view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ecclesiastical view" ON public.visitor_checkins FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.church_function = ANY (ARRAY['pastor'::public.church_function, 'apascentador'::public.church_function]))))) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role)));


--
-- Name: kids_visitor_requests Equipe kids atualiza os pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Equipe kids atualiza os pedidos" ON public.kids_visitor_requests FOR UPDATE TO authenticated USING (public.is_kids_admin(auth.uid())) WITH CHECK (public.is_kids_admin(auth.uid()));


--
-- Name: kids_visitor_requests Equipe kids remove pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Equipe kids remove pedidos" ON public.kids_visitor_requests FOR DELETE TO authenticated USING (public.is_kids_admin(auth.uid()));


--
-- Name: kids_visitor_requests Equipe kids ve os pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Equipe kids ve os pedidos" ON public.kids_visitor_requests FOR SELECT TO authenticated USING (public.is_kids_admin(auth.uid()));


--
-- Name: pastoral_notes Equipe pastoral cria anotacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Equipe pastoral cria anotacoes" ON public.pastoral_notes FOR INSERT TO authenticated WITH CHECK ((public.is_pastoral(auth.uid()) AND (author_id = auth.uid())));


--
-- Name: pastoral_notes Equipe pastoral le anotacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Equipe pastoral le anotacoes" ON public.pastoral_notes FOR SELECT TO authenticated USING ((public.is_pastoral(auth.uid()) AND ((visibility = 'pastoral'::text) OR (author_id = auth.uid()))));


--
-- Name: social_assistance_requests_legacy Everyone authenticated can select requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone authenticated can select requests" ON public.social_assistance_requests_legacy FOR SELECT TO authenticated USING (true);


--
-- Name: ministries Hierarquia Ministérios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Hierarquia Ministérios" ON public.ministries FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.ministry_members mim
  WHERE ((mim.ministry_id = ministries.id) AND (mim.user_id = auth.uid()))))));


--
-- Name: prayer_requests Leaders can view their Mesa's prayer requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leaders can view their Mesa's prayer requests" ON public.prayer_requests FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'lider_mesa'::public.app_role) AND (user_roles.mesa_id = prayer_requests.mesa_id)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin_geral'::public.app_role))))));


--
-- Name: leader_touchpoints Leaders manage own touchpoints; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leaders manage own touchpoints" ON public.leader_touchpoints TO authenticated USING ((auth.uid() = leader_id)) WITH CHECK ((auth.uid() = leader_id));


--
-- Name: leader_touchpoints Leadership can view touchpoints; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leadership can view touchpoints" ON public.leader_touchpoints FOR SELECT TO authenticated USING (public.is_pastoral(auth.uid()));


--
-- Name: announcement_reads Leitura propria ou do autor do aviso; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitura propria ou do autor do aviso" ON public.announcement_reads FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.announcements a
  WHERE ((a.id = announcement_reads.announcement_id) AND (a.created_by = auth.uid()))))));


--
-- Name: news Leitura pública de notícias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitura pública de notícias" ON public.news FOR SELECT USING (((is_published = true) OR ((auth.role() = 'authenticated'::text) AND public.has_role(auth.uid(), 'admin_geral'::public.app_role))));


--
-- Name: member_onboarding_steps Lideranca atualiza trilha; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lideranca atualiza trilha" ON public.member_onboarding_steps FOR UPDATE TO authenticated USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));


--
-- Name: announcements Lideranca cria avisos do seu alcance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lideranca cria avisos do seu alcance" ON public.announcements FOR INSERT TO authenticated WITH CHECK (((created_by = auth.uid()) AND public.can_manage_announcement(auth.uid(), scope, ministry_id, mesa_id)));


--
-- Name: member_onboarding_steps Lideranca registra trilha; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lideranca registra trilha" ON public.member_onboarding_steps FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()));


--
-- Name: member_onboarding_steps Lideranca remove trilha; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lideranca remove trilha" ON public.member_onboarding_steps FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()));


--
-- Name: member_onboarding_steps Membro ve sua trilha e lideranca ve todas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Membro ve sua trilha e lideranca ve todas" ON public.member_onboarding_steps FOR SELECT TO authenticated USING (((person_id = auth.uid()) OR public.is_leadership(auth.uid())));


--
-- Name: media_requests Membros criam pedidos de mídia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Membros criam pedidos de mídia" ON public.media_requests FOR INSERT TO authenticated WITH CHECK ((requester_id = auth.uid()));


--
-- Name: onboarding_steps Membros leem etapas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Membros leem etapas" ON public.onboarding_steps FOR SELECT TO authenticated USING (true);


--
-- Name: announcements Membros veem avisos publicados do seu alcance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Membros veem avisos publicados do seu alcance" ON public.announcements FOR SELECT TO authenticated USING (((is_published AND ((published_at IS NULL) OR (published_at <= now())) AND ((expires_at IS NULL) OR (expires_at > now())) AND public.can_view_announcement(auth.uid(), scope, church_id, ministry_id, rede_id, mesa_id)) OR (created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role)));


--
-- Name: media_requests Membros veem seus pedidos de mídia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Membros veem seus pedidos de mídia" ON public.media_requests FOR SELECT TO authenticated USING (((requester_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role)));


--
-- Name: ministries Membros visualizam seus próprios ministérios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Membros visualizam seus próprios ministérios" ON public.ministries FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.ministry_members mim
  WHERE ((mim.ministry_id = ministries.id) AND (mim.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role)));


--
-- Name: kids_emergency_alerts Pais podem confirmar recebimento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pais podem confirmar recebimento" ON public.kids_emergency_alerts FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.kids_guardians g
  WHERE ((g.child_id = kids_emergency_alerts.child_id) AND (g.profile_id = auth.uid()))))) WITH CHECK ((status = ANY (ARRAY['recebido'::text, 'confirmado'::text])));


--
-- Name: kids_emergency_alerts Pais podem ver alertas de seus filhos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pais podem ver alertas de seus filhos" ON public.kids_emergency_alerts FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.kids_guardians g
  WHERE ((g.child_id = kids_emergency_alerts.child_id) AND (g.profile_id = auth.uid())))));


--
-- Name: visitor_checkins Public registration access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public registration access" ON public.visitor_checkins FOR INSERT WITH CHECK (true);


--
-- Name: kids_schedules Public schedules are visible to all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public schedules are visible to all authenticated" ON public.kids_schedules FOR SELECT TO authenticated USING (((status = 'published'::text) OR (status = 'completed'::text)));


--
-- Name: social_assistance_campaigns Qualquer autenticado vê campanhas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer autenticado vê campanhas" ON public.social_assistance_campaigns FOR SELECT TO authenticated USING (true);


--
-- Name: media_assets Qualquer autenticado vê mídias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer autenticado vê mídias" ON public.media_assets FOR SELECT TO authenticated USING (true);


--
-- Name: cleaning_schedules Qualquer membro autenticado pode ver a escala; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer membro autenticado pode ver a escala" ON public.cleaning_schedules FOR SELECT TO authenticated USING (true);


--
-- Name: cleaning_photos Qualquer membro autenticado pode ver as fotos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer membro autenticado pode ver as fotos" ON public.cleaning_photos FOR SELECT TO authenticated USING (true);


--
-- Name: cleaning_tasks Qualquer membro autenticado pode ver as tarefas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer membro autenticado pode ver as tarefas" ON public.cleaning_tasks FOR SELECT TO authenticated USING (true);


--
-- Name: songs Qualquer membro vê músicas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer membro vê músicas" ON public.songs FOR SELECT TO authenticated USING (true);


--
-- Name: setlist_songs Qualquer membro vê músicas do setlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer membro vê músicas do setlist" ON public.setlist_songs FOR SELECT TO authenticated USING (true);


--
-- Name: setlists Qualquer membro vê setlists publicados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer membro vê setlists publicados" ON public.setlists FOR SELECT TO authenticated USING (((status = 'published'::text) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR public.has_role(auth.uid(), 'admin_ministerio'::public.app_role)));


--
-- Name: membership_requests Qualquer pessoa pode solicitar cadastro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer pessoa pode solicitar cadastro" ON public.membership_requests FOR INSERT TO anon WITH CHECK ((status = 'pendente'::text));


--
-- Name: prayer_requests Users can create own prayer requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own prayer requests" ON public.prayer_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: social_assistance_requests Users can create own social assistance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own social assistance requests" ON public.social_assistance_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: prayer_requests Users can view own prayer requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own prayer requests" ON public.prayer_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: social_assistance_requests Users can view own social assistance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own social assistance requests" ON public.social_assistance_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: membership_requests Usuarios autenticados podem solicitar cadastro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios autenticados podem solicitar cadastro" ON public.membership_requests FOR INSERT TO authenticated WITH CHECK (((status = 'pendente'::text) AND ((requested_by IS NULL) OR (requested_by = auth.uid()))));


--
-- Name: user_push_tokens Usuários gerenciam seus próprios tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários gerenciam seus próprios tokens" ON public.user_push_tokens TO authenticated USING ((auth.uid() = user_id));


--
-- Name: event_reminders Usuários podem gerenciar seus próprios lembretes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem gerenciar seus próprios lembretes" ON public.event_reminders TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: notifications_history Usuários veem suas próprias notificações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários veem suas próprias notificações" ON public.notifications_history FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: membership_requests Ver proprias solicitacoes ou todas se admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ver proprias solicitacoes ou todas se admin" ON public.membership_requests FOR SELECT TO authenticated USING (((requested_by = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role)));


--
-- Name: kids_visitor_requests Visitantes podem enviar cadastro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Visitantes podem enviar cadastro" ON public.kids_visitor_requests FOR INSERT TO anon, authenticated WITH CHECK (((status = 'pendente'::text) AND (reviewed_by IS NULL) AND (reviewed_at IS NULL)));


--
-- Name: kids_schedule_volunteers Volunteers can see and update their status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Volunteers can see and update their status" ON public.kids_schedule_volunteers TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR public.has_role(auth.uid(), 'admin_kids'::public.app_role)));


--
-- Name: announcement_reads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings app_settings_manage_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_settings_manage_admin ON public.app_settings TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: app_settings app_settings_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_settings_select ON public.app_settings FOR SELECT TO authenticated USING (true);


--
-- Name: canteen_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canteen_items ENABLE ROW LEVEL SECURITY;

--
-- Name: canteen_items canteen_items_manage_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_items_manage_admin ON public.canteen_items TO authenticated USING (public.is_cantina_admin(auth.uid())) WITH CHECK (public.is_cantina_admin(auth.uid()));


--
-- Name: canteen_items canteen_items_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_items_select_all ON public.canteen_items FOR SELECT TO authenticated USING (true);


--
-- Name: canteen_menu_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canteen_menu_items ENABLE ROW LEVEL SECURITY;

--
-- Name: canteen_menu_items canteen_menu_items_manage_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_menu_items_manage_admin ON public.canteen_menu_items TO authenticated USING (public.is_cantina_admin(auth.uid())) WITH CHECK (public.is_cantina_admin(auth.uid()));


--
-- Name: canteen_menu_items canteen_menu_items_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_menu_items_select ON public.canteen_menu_items FOR SELECT TO authenticated USING (true);


--
-- Name: canteen_menus; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canteen_menus ENABLE ROW LEVEL SECURITY;

--
-- Name: canteen_menus canteen_menus_manage_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_menus_manage_admin ON public.canteen_menus TO authenticated USING (public.is_cantina_admin(auth.uid())) WITH CHECK (public.is_cantina_admin(auth.uid()));


--
-- Name: canteen_menus canteen_menus_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_menus_select ON public.canteen_menus FOR SELECT TO authenticated USING (((status <> 'rascunho'::text) OR public.is_cantina_admin(auth.uid())));


--
-- Name: canteen_reservations canteen_res_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_res_delete_admin ON public.canteen_reservations FOR DELETE TO authenticated USING (public.is_cantina_admin(auth.uid()));


--
-- Name: canteen_reservations canteen_res_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_res_insert_own ON public.canteen_reservations FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: canteen_reservation_items canteen_res_items_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_res_items_insert ON public.canteen_reservation_items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.canteen_reservations r
  WHERE ((r.id = canteen_reservation_items.reservation_id) AND (r.user_id = auth.uid())))));


--
-- Name: canteen_reservation_items canteen_res_items_manage_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_res_items_manage_admin ON public.canteen_reservation_items TO authenticated USING (public.is_cantina_admin(auth.uid())) WITH CHECK (public.is_cantina_admin(auth.uid()));


--
-- Name: canteen_reservation_items canteen_res_items_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_res_items_select ON public.canteen_reservation_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.canteen_reservations r
  WHERE ((r.id = canteen_reservation_items.reservation_id) AND ((r.user_id = auth.uid()) OR public.is_cantina_admin(auth.uid()))))));


--
-- Name: canteen_reservations canteen_res_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_res_select ON public.canteen_reservations FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.is_cantina_admin(auth.uid())));


--
-- Name: canteen_reservations canteen_res_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canteen_res_update ON public.canteen_reservations FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR public.is_cantina_admin(auth.uid()))) WITH CHECK (((user_id = auth.uid()) OR public.is_cantina_admin(auth.uid())));


--
-- Name: canteen_reservation_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canteen_reservation_items ENABLE ROW LEVEL SECURITY;

--
-- Name: canteen_reservations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canteen_reservations ENABLE ROW LEVEL SECURITY;

--
-- Name: churches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

--
-- Name: churches churches_admin_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY churches_admin_manage ON public.churches TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: churches churches_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY churches_select_authenticated ON public.churches FOR SELECT TO authenticated USING (true);


--
-- Name: cleaning_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cleaning_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: cleaning_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cleaning_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: cleaning_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cleaning_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: event_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: event_rsvps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: events events_delete_admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_delete_admins ON public.events FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR ((ministry_id IS NOT NULL) AND public.has_ministry_role(auth.uid(), ministry_id)) OR ((mesa_id IS NOT NULL) AND public.has_mesa_role(auth.uid(), mesa_id))));


--
-- Name: events events_insert_admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_insert_admins ON public.events FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR ((ministry_id IS NOT NULL) AND public.has_ministry_role(auth.uid(), ministry_id)) OR ((mesa_id IS NOT NULL) AND public.has_mesa_role(auth.uid(), mesa_id))));


--
-- Name: events events_select_published; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_select_published ON public.events FOR SELECT TO authenticated USING (((status <> 'rascunho'::public.event_status) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR ((ministry_id IS NOT NULL) AND public.has_ministry_role(auth.uid(), ministry_id)) OR ((mesa_id IS NOT NULL) AND public.has_mesa_role(auth.uid(), mesa_id)) OR (created_by = auth.uid())));


--
-- Name: events events_update_admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_update_admins ON public.events FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR ((ministry_id IS NOT NULL) AND public.has_ministry_role(auth.uid(), ministry_id)) OR ((mesa_id IS NOT NULL) AND public.has_mesa_role(auth.uid(), mesa_id)))) WITH CHECK ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR ((ministry_id IS NOT NULL) AND public.has_ministry_role(auth.uid(), ministry_id)) OR ((mesa_id IS NOT NULL) AND public.has_mesa_role(auth.uid(), mesa_id))));


--
-- Name: family_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

--
-- Name: kids_checkins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kids_checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: kids_checkins kids_checkins_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kids_checkins_manage ON public.kids_checkins TO authenticated USING (public.is_kids_admin(auth.uid())) WITH CHECK (public.is_kids_admin(auth.uid()));


--
-- Name: kids_checkins kids_checkins_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kids_checkins_read ON public.kids_checkins FOR SELECT TO authenticated USING ((public.is_kids_admin(auth.uid()) OR public.is_guardian_of(auth.uid(), child_id)));


--
-- Name: kids_children; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kids_children ENABLE ROW LEVEL SECURITY;

--
-- Name: kids_children kids_children_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kids_children_manage ON public.kids_children TO authenticated USING (public.is_kids_admin(auth.uid())) WITH CHECK (public.is_kids_admin(auth.uid()));


--
-- Name: kids_children kids_children_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kids_children_read ON public.kids_children FOR SELECT TO authenticated USING ((public.is_kids_admin(auth.uid()) OR public.is_guardian_of(auth.uid(), id)));


--
-- Name: kids_emergency_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kids_emergency_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: kids_guardians; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kids_guardians ENABLE ROW LEVEL SECURITY;

--
-- Name: kids_guardians kids_guardians_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kids_guardians_manage ON public.kids_guardians TO authenticated USING (public.is_kids_admin(auth.uid())) WITH CHECK (public.is_kids_admin(auth.uid()));


--
-- Name: kids_guardians kids_guardians_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kids_guardians_read ON public.kids_guardians FOR SELECT TO authenticated USING ((public.is_kids_admin(auth.uid()) OR (profile_id = auth.uid())));


--
-- Name: kids_schedule_volunteers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kids_schedule_volunteers ENABLE ROW LEVEL SECURITY;

--
-- Name: kids_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kids_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: kids_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kids_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: kids_sessions kids_sessions_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kids_sessions_manage ON public.kids_sessions TO authenticated USING (public.is_kids_admin(auth.uid())) WITH CHECK (public.is_kids_admin(auth.uid()));


--
-- Name: kids_sessions kids_sessions_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kids_sessions_read ON public.kids_sessions FOR SELECT TO authenticated USING (true);


--
-- Name: kids_visitor_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kids_visitor_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: leader_touchpoints; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leader_touchpoints ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: media_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: media_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: member_onboarding_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.member_onboarding_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: membership_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: mesa_addresses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mesa_addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: mesa_addresses mesa_addresses_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mesa_addresses_manage ON public.mesa_addresses TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.mesa_members mm
  WHERE ((mm.mesa_id = mesa_addresses.mesa_id) AND (mm.user_id = auth.uid()) AND (mm.role = ANY (ARRAY['lider'::public.church_function, 'apascentador'::public.church_function, 'pastor'::public.church_function]))))))) WITH CHECK ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.mesa_members mm
  WHERE ((mm.mesa_id = mesa_addresses.mesa_id) AND (mm.user_id = auth.uid()) AND (mm.role = ANY (ARRAY['lider'::public.church_function, 'apascentador'::public.church_function, 'pastor'::public.church_function])))))));


--
-- Name: mesa_addresses mesa_addresses_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mesa_addresses_select ON public.mesa_addresses FOR SELECT TO authenticated USING (public.can_view_mesa(mesa_id, auth.uid()));


--
-- Name: mesa_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mesa_members ENABLE ROW LEVEL SECURITY;

--
-- Name: mesa_members mesa_members_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mesa_members_manage ON public.mesa_members TO authenticated USING (public.has_mesa_role(auth.uid(), mesa_id)) WITH CHECK (public.has_mesa_role(auth.uid(), mesa_id));


--
-- Name: mesa_members mesa_members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mesa_members_select ON public.mesa_members FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (user_id = auth.uid()) OR public.is_mesa_member(mesa_id, auth.uid())));


--
-- Name: mesas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;

--
-- Name: mesas mesas_admin_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mesas_admin_manage ON public.mesas TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: mesas mesas_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mesas_select ON public.mesas FOR SELECT TO authenticated USING (public.can_view_mesa(id, auth.uid()));


--
-- Name: ministries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;

--
-- Name: ministries ministries_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ministries_delete_admin ON public.ministries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: ministries ministries_insert_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ministries_insert_admin ON public.ministries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: ministries ministries_update_admin_or_ministry_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ministries_update_admin_or_ministry_admin ON public.ministries FOR UPDATE TO authenticated USING (public.has_ministry_role(auth.uid(), id)) WITH CHECK (public.has_ministry_role(auth.uid(), id));


--
-- Name: ministry_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;

--
-- Name: ministry_members ministry_members_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ministry_members_manage ON public.ministry_members TO authenticated USING (public.has_ministry_role(auth.uid(), ministry_id)) WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));


--
-- Name: news; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications_history ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items order_items_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY order_items_insert ON public.order_items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.user_id = auth.uid())))));


--
-- Name: order_items order_items_manage_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY order_items_manage_admin ON public.order_items TO authenticated USING (public.is_livraria_admin(auth.uid())) WITH CHECK (public.is_livraria_admin(auth.uid()));


--
-- Name: order_items order_items_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY order_items_select ON public.order_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND ((o.user_id = auth.uid()) OR public.is_livraria_admin(auth.uid()))))));


--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: orders orders_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY orders_delete_admin ON public.orders FOR DELETE TO authenticated USING (public.is_livraria_admin(auth.uid()));


--
-- Name: orders orders_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY orders_insert_own ON public.orders FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: orders orders_select_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY orders_select_own_or_admin ON public.orders FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.is_livraria_admin(auth.uid())));


--
-- Name: orders orders_update_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY orders_update_own_or_admin ON public.orders FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR public.is_livraria_admin(auth.uid()))) WITH CHECK (((user_id = auth.uid()) OR public.is_livraria_admin(auth.uid())));


--
-- Name: pastoral_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pastoral_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: prayer_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: products products_manage_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY products_manage_admin ON public.products TO authenticated USING (public.is_livraria_admin(auth.uid())) WITH CHECK (public.is_livraria_admin(auth.uid()));


--
-- Name: products products_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY products_select_all ON public.products FOR SELECT TO authenticated USING (true);


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_delete_admin ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: profiles profiles_insert_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert_admin ON public.profiles FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (auth.uid() = id)));


--
-- Name: profiles profiles_select_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_scoped ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) OR public.is_leadership(auth.uid()) OR public.shares_group(id, auth.uid())));


--
-- Name: profiles profiles_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: profiles profiles_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: push_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;

--
-- Name: rede_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rede_members ENABLE ROW LEVEL SECURITY;

--
-- Name: rede_members rede_members_admin_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rede_members_admin_manage ON public.rede_members TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: rede_members rede_members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rede_members_select ON public.rede_members FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (user_id = auth.uid()) OR public.is_rede_member(rede_id, auth.uid())));


--
-- Name: redes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.redes ENABLE ROW LEVEL SECURITY;

--
-- Name: redes redes_admin_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY redes_admin_manage ON public.redes TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: redes redes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY redes_select ON public.redes FOR SELECT TO authenticated USING (public.can_view_rede(id, auth.uid()));


--
-- Name: event_rsvps rsvp_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rsvp_delete_own ON public.event_rsvps FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role)));


--
-- Name: event_rsvps rsvp_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rsvp_insert_own ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: event_rsvps rsvp_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rsvp_select ON public.event_rsvps FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_rsvps.event_id) AND (((e.ministry_id IS NOT NULL) AND public.has_ministry_role(auth.uid(), e.ministry_id)) OR ((e.mesa_id IS NOT NULL) AND public.has_mesa_role(auth.uid(), e.mesa_id)) OR (e.created_by = auth.uid())))))));


--
-- Name: event_rsvps rsvp_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rsvp_update_own ON public.event_rsvps FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: sermons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

--
-- Name: setlist_songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;

--
-- Name: setlists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

--
-- Name: social_assistance_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_assistance_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: social_assistance_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_assistance_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: social_assistance_requests_legacy; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_assistance_requests_legacy ENABLE ROW LEVEL SECURITY;

--
-- Name: songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

--
-- Name: user_push_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_admin_all ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin_geral'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin_geral'::public.app_role));


--
-- Name: user_roles user_roles_select_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_select_own_or_admin ON public.user_roles FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_geral'::public.app_role)));


--
-- Name: visitor_checkins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.visitor_checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: worship_schedule_assignments worship_assignments_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_assignments_manage ON public.worship_schedule_assignments TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.worship_schedules s
  WHERE ((s.id = worship_schedule_assignments.schedule_id) AND public.has_ministry_role(auth.uid(), s.ministry_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.worship_schedules s
  WHERE ((s.id = worship_schedule_assignments.schedule_id) AND public.has_ministry_role(auth.uid(), s.ministry_id)))));


--
-- Name: worship_schedule_assignments worship_assignments_respond_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_assignments_respond_own ON public.worship_schedule_assignments FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: worship_schedule_assignments worship_assignments_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_assignments_select ON public.worship_schedule_assignments FOR SELECT TO authenticated USING (true);


--
-- Name: worship_musicians; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.worship_musicians ENABLE ROW LEVEL SECURITY;

--
-- Name: worship_musicians worship_musicians_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_musicians_manage ON public.worship_musicians TO authenticated USING (public.has_ministry_role(auth.uid(), ministry_id)) WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));


--
-- Name: worship_musicians worship_musicians_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_musicians_select ON public.worship_musicians FOR SELECT TO authenticated USING (true);


--
-- Name: worship_schedule_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.worship_schedule_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: worship_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.worship_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: worship_schedules worship_schedules_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_schedules_manage ON public.worship_schedules TO authenticated USING (public.has_ministry_role(auth.uid(), ministry_id)) WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));


--
-- Name: worship_schedules worship_schedules_select_published; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_schedules_select_published ON public.worship_schedules FOR SELECT TO authenticated USING (((status <> 'rascunho'::public.worship_schedule_status) OR public.has_ministry_role(auth.uid(), ministry_id)));


--
-- Name: worship_setlist_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.worship_setlist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: worship_setlist_items worship_setlist_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_setlist_manage ON public.worship_setlist_items TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.worship_schedules s
  WHERE ((s.id = worship_setlist_items.schedule_id) AND public.has_ministry_role(auth.uid(), s.ministry_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.worship_schedules s
  WHERE ((s.id = worship_setlist_items.schedule_id) AND public.has_ministry_role(auth.uid(), s.ministry_id)))));


--
-- Name: worship_setlist_items worship_setlist_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_setlist_select ON public.worship_setlist_items FOR SELECT TO authenticated USING (true);


--
-- Name: worship_songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.worship_songs ENABLE ROW LEVEL SECURITY;

--
-- Name: worship_songs worship_songs_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_songs_manage ON public.worship_songs TO authenticated USING (public.has_ministry_role(auth.uid(), ministry_id)) WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));


--
-- Name: worship_songs worship_songs_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_songs_select ON public.worship_songs FOR SELECT TO authenticated USING (true);


--
-- Name: worship_team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.worship_team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: worship_team_members worship_team_members_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_team_members_manage ON public.worship_team_members TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.worship_teams t
  WHERE ((t.id = worship_team_members.team_id) AND public.has_ministry_role(auth.uid(), t.ministry_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.worship_teams t
  WHERE ((t.id = worship_team_members.team_id) AND public.has_ministry_role(auth.uid(), t.ministry_id)))));


--
-- Name: worship_team_members worship_team_members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_team_members_select ON public.worship_team_members FOR SELECT TO authenticated USING (true);


--
-- Name: worship_teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.worship_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: worship_teams worship_teams_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_teams_manage ON public.worship_teams TO authenticated USING (public.has_ministry_role(auth.uid(), ministry_id)) WITH CHECK (public.has_ministry_role(auth.uid(), ministry_id));


--
-- Name: worship_teams worship_teams_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY worship_teams_select ON public.worship_teams FOR SELECT TO authenticated USING (true);


--
-- Name: youtube_videos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


