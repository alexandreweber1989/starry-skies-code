-- Create a security definer function to handle the insert
CREATE OR REPLACE FUNCTION public.register_public_visitor(
  _full_name TEXT,
  _whatsapp TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  INSERT INTO public.visitor_checkins (full_name, whatsapp, status)
  VALUES (_full_name, _whatsapp, 'novo')
  RETURNING row_to_json(visitor_checkins.*) INTO _result;
  
  RETURN _result;
END;
$$;

-- Grant execution to service_role (called from server)
GRANT EXECUTE ON FUNCTION public.register_public_visitor TO service_role;
GRANT EXECUTE ON FUNCTION public.register_public_visitor TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_public_visitor TO anon;
