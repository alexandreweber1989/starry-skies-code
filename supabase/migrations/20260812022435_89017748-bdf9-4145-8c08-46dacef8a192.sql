-- Criar função para elevar o usuário específico
CREATE OR REPLACE FUNCTION public.elevate_specific_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'alew123@gmail.com' THEN
    -- Remove papel membro padrão se existir para evitar duplicidade ou conflito de lógica
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'membro';
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin_geral')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger rode após a criação do usuário
DROP TRIGGER IF EXISTS on_auth_admin_elevation ON auth.users;
CREATE TRIGGER on_auth_admin_elevation
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.elevate_specific_admin();

-- Grants necessários
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
