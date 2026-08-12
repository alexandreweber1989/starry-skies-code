-- Atualizar a função de gatilho para incluir o novo e-mail
CREATE OR REPLACE FUNCTION public.elevate_specific_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o e-mail é um dos e-mails privilegiados
  IF NEW.email IN ('alew123@gmail.com', 'alew15_7@hotmail.com') THEN
    -- Remove papel membro padrão se existir
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'membro';
    
    -- Insere o papel de administrador geral
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin_geral')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
