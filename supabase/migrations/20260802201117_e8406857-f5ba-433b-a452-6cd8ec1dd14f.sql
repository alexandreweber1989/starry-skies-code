INSERT INTO public.user_roles (user_id, role)
VALUES ('051ed524-98ea-4faa-bce0-057b406a73c6', 'admin_geral')
ON CONFLICT (user_id, role, ministry_id, mesa_id) DO NOTHING;