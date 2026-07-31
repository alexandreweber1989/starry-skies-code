CREATE TABLE public.membership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  notes text,
  requester_name text,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','recusado')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  profile_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_requests TO authenticated;
GRANT INSERT ON public.membership_requests TO anon;
GRANT ALL ON public.membership_requests TO service_role;

ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode solicitar cadastro"
ON public.membership_requests FOR INSERT TO anon WITH CHECK (status = 'pendente');

CREATE POLICY "Usuarios autenticados podem solicitar cadastro"
ON public.membership_requests FOR INSERT TO authenticated
WITH CHECK (status = 'pendente' AND (requested_by IS NULL OR requested_by = auth.uid()));

CREATE POLICY "Ver proprias solicitacoes ou todas se admin"
ON public.membership_requests FOR SELECT TO authenticated
USING (requested_by = auth.uid() OR public.has_role(auth.uid(), 'admin_geral'));

CREATE POLICY "Admin geral atualiza solicitacoes"
ON public.membership_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin_geral'))
WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));

CREATE POLICY "Admin geral remove solicitacoes"
ON public.membership_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin_geral'));

CREATE INDEX idx_membership_requests_status ON public.membership_requests(status);

CREATE TRIGGER set_membership_requests_updated_at
BEFORE UPDATE ON public.membership_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();