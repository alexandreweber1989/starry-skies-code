REVOKE EXECUTE ON FUNCTION public.claim_first_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_cantina_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_livraria_admin(uuid) FROM authenticated;