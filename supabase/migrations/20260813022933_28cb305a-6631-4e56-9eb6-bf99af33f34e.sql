ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pix_name text,
  ADD COLUMN IF NOT EXISTS pix_city text;