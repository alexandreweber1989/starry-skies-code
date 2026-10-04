-- Alcance de evento por igreja específica.
-- Adiciona o valor "congregacao" ao enum event_scope, para permitir eventos
-- direcionados a uma igreja específica (church_id), além de "igreja" (todas),
-- ministério, rede e mesa. Já aplicado no projeto iba-atos-producao.
alter type public.event_scope add value if not exists 'congregacao';
