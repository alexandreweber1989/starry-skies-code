-- Push notifications (Web Push / PWA) — assinaturas reais dos dispositivos.
--
-- A tabela user_push_tokens guardava apenas um "token" (que na prática era um
-- valor simulado). O padrão Web Push exige três dados por dispositivo:
--   endpoint  — URL do serviço de push do navegador (Google/Mozilla/Apple)
--   p256dh    — chave pública do dispositivo (criptografia da mensagem)
--   auth      — segredo de autenticação do dispositivo
-- Sem eles não é possível entregar nada no celular.

ALTER TABLE public.user_push_tokens
  ADD COLUMN IF NOT EXISTS endpoint text,
  ADD COLUMN IF NOT EXISTS p256dh text,
  ADD COLUMN IF NOT EXISTS auth text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

-- Remove as assinaturas simuladas criadas pela versão anterior.
DELETE FROM public.user_push_tokens WHERE token LIKE 'web-push-token-%';

-- Cada endpoint é único: reinstalar/reassinar atualiza em vez de duplicar.
CREATE UNIQUE INDEX IF NOT EXISTS user_push_tokens_endpoint_key
  ON public.user_push_tokens (endpoint) WHERE endpoint IS NOT NULL;

-- Histórico: guarda o público-alvo para o painel de envios.
ALTER TABLE public.notifications_history
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
