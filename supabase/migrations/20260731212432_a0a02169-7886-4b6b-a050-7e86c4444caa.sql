ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL;
ALTER TABLE public.redes ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ministries_church_id_idx ON public.ministries(church_id);
CREATE INDEX IF NOT EXISTS redes_church_id_idx ON public.redes(church_id);
CREATE INDEX IF NOT EXISTS mesas_church_id_idx ON public.mesas(church_id);

UPDATE public.ministries SET church_id = (SELECT id FROM public.churches WHERE is_headquarters ORDER BY created_at LIMIT 1) WHERE church_id IS NULL;
UPDATE public.redes SET church_id = (SELECT id FROM public.churches WHERE is_headquarters ORDER BY created_at LIMIT 1) WHERE church_id IS NULL;
UPDATE public.mesas SET church_id = (SELECT id FROM public.churches WHERE is_headquarters ORDER BY created_at LIMIT 1) WHERE church_id IS NULL;