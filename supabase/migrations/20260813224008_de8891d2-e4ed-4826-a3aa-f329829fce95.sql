
-- Adiciona coluna is_main à tabela mesa_addresses
ALTER TABLE public.mesa_addresses ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- Função para garantir que apenas um endereço seja principal por mesa
CREATE OR REPLACE FUNCTION public.handle_mesa_main_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_main = true THEN
    UPDATE public.mesa_addresses
    SET is_main = false
    WHERE mesa_id = NEW.mesa_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função antes de insert ou update
DROP TRIGGER IF EXISTS tr_ensure_single_main_address ON public.mesa_addresses;
CREATE TRIGGER tr_ensure_single_main_address
BEFORE INSERT OR UPDATE OF is_main ON public.mesa_addresses
FOR EACH ROW
WHEN (NEW.is_main = true)
EXECUTE FUNCTION public.handle_mesa_main_address();
