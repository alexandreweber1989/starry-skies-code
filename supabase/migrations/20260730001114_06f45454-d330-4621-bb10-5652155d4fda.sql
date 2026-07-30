REVOKE ALL ON FUNCTION public.is_livraria_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_cantina_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.gen_pickup_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_livraria_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_cantina_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.gen_pickup_code(text) TO authenticated, service_role;