-- Configuração das notificações guardada no banco.
--
-- Motivo: depender de variáveis de ambiente (VAPID_*) tornou o recurso frágil —
-- quem publica o site (Vercel) e quem hospeda o app (Lovable) são ambientes
-- diferentes, e a chave não chegava ao servidor. Guardando aqui, a igreja
-- configura por um botão na própria plataforma, sem depender de deploy.
--
-- SEGURANÇA: a chave privada NUNCA pode ser lida pelo navegador. Por isso esta
-- tabela tem RLS ativo e NENHUMA policy: nem 'authenticated' nem 'anon'
-- conseguem ler ou escrever. Apenas o service_role (que roda no servidor e
-- ignora RLS) tem acesso. Note que não há GRANT para authenticated.

CREATE TABLE IF NOT EXISTS public.push_config (
    id boolean PRIMARY KEY DEFAULT true CHECK (id),  -- linha única
    public_key text NOT NULL,
    private_key text NOT NULL,
    subject text NOT NULL DEFAULT 'mailto:contato@igrejabatistaatos.com.br',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.push_config FROM anon, authenticated;
GRANT ALL ON public.push_config TO service_role;
