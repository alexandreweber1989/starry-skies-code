-- Campos para a captação pública de novos membros (formulário "Quero fazer parte").
-- Guardam a localização da pessoa para rotear a requisição ao líder/mesa mais próximo,
-- além de faixa etária e campos de atribuição. Tudo opcional (nullable).
alter table public.membership_requests
  add column if not exists city             text,
  add column if not exists neighborhood     text,
  add column if not exists zip_code         text,
  add column if not exists state            text,
  add column if not exists address          text,
  add column if not exists age_range        text,
  add column if not exists assigned_mesa_id uuid references public.mesas(id)    on delete set null,
  add column if not exists assigned_to      uuid references public.profiles(id) on delete set null;
