-- The error 'new row violates row-level security policy' usually means the WITH CHECK clause failed
-- or the role doesn't have enough permissions even with the policy.

-- Let's try a more robust policy for public insertion
DROP POLICY IF EXISTS "Anyone can register as a visitor" ON public.visitor_checkins;

-- Explicitly allow INSERT for public/anon without any hidden checks
CREATE POLICY "Public visitor registration"
ON public.visitor_checkins
FOR INSERT
TO public
WITH CHECK (true);

-- Ensure the grants are correctly applied at the schema level if needed
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT ON public.visitor_checkins TO anon;
GRANT INSERT ON public.visitor_checkins TO authenticated;
GRANT SELECT ON public.visitor_checkins TO service_role;
GRANT ALL ON public.visitor_checkins TO service_role;
