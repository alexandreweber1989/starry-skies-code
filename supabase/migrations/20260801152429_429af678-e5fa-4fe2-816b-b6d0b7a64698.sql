CREATE TABLE public.kids_visitor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  child_id uuid REFERENCES public.kids_children(id) ON DELETE SET NULL,
  child_full_name text NOT NULL,
  child_nickname text,
  birth_date date,
  gender text,
  classroom text NOT NULL DEFAULT 'nao_definida',
  allergies text,
  health_notes text,
  special_needs text,
  photo_consent boolean NOT NULL DEFAULT false,
  guardian_full_name text NOT NULL,
  guardian_phone text NOT NULL,
  guardian_relation text NOT NULL DEFAULT 'responsavel',
  guardian_document text,
  other_pickup text,
  notes text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','recusado')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX kids_visitor_requests_status_idx ON public.kids_visitor_requests (status, created_at DESC);
CREATE INDEX kids_visitor_requests_phone_idx ON public.kids_visitor_requests (guardian_phone);

GRANT INSERT ON public.kids_visitor_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids_visitor_requests TO authenticated;
GRANT ALL ON public.kids_visitor_requests TO service_role;

ALTER TABLE public.kids_visitor_requests ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa com o link pode enviar um pedido, sempre como pendente.
CREATE POLICY "Visitantes podem enviar cadastro"
  ON public.kids_visitor_requests FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pendente' AND reviewed_by IS NULL AND reviewed_at IS NULL);

CREATE POLICY "Equipe kids ve os pedidos"
  ON public.kids_visitor_requests FOR SELECT TO authenticated
  USING (public.is_kids_admin(auth.uid()));

CREATE POLICY "Equipe kids atualiza os pedidos"
  ON public.kids_visitor_requests FOR UPDATE TO authenticated
  USING (public.is_kids_admin(auth.uid()))
  WITH CHECK (public.is_kids_admin(auth.uid()));

CREATE POLICY "Equipe kids remove pedidos"
  ON public.kids_visitor_requests FOR DELETE TO authenticated
  USING (public.is_kids_admin(auth.uid()));

CREATE TRIGGER kids_visitor_requests_updated_at
  BEFORE UPDATE ON public.kids_visitor_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Retorno da família: devolve apenas id + primeiro nome das crianças
-- vinculadas ao telefone informado. Nunca expõe saúde, documento ou endereço.
CREATE OR REPLACE FUNCTION public.kids_find_family_by_phone(_phone text)
RETURNS TABLE (child_id uuid, first_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.kids_find_family_by_phone(text) TO anon, authenticated;