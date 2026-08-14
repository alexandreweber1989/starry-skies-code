-- Re-grant everything explicitly
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.visitor_checkins TO anon, authenticated, service_role;

-- Drop all possible conflicting policies
DROP POLICY IF EXISTS "Anyone can register as a visitor" ON public.visitor_checkins;
DROP POLICY IF EXISTS "Public visitor registration" ON public.visitor_checkins;
DROP POLICY IF EXISTS "Public access for registration" ON public.visitor_checkins;
DROP POLICY IF EXISTS "Admins can manage visitors" ON public.visitor_checkins;
DROP POLICY IF EXISTS "Pastors can view visitors" ON public.visitor_checkins;

-- Create a single, hyper-permissive policy for INSERT to bypass the RLS error
CREATE POLICY "Public registration access"
ON public.visitor_checkins
FOR INSERT
TO public
WITH CHECK (true);

-- Re-add internal management policies
CREATE POLICY "Admin management"
ON public.visitor_checkins
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin_geral'));

CREATE POLICY "Ecclesiastical view"
ON public.visitor_checkins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND church_function IN ('pastor', 'apascentador')
  ) OR public.has_role(auth.uid(), 'admin_geral')
);