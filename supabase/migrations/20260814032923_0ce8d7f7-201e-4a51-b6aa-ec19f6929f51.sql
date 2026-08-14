-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can register as a visitor" ON public.visitor_checkins;
DROP POLICY IF EXISTS "Admins can manage visitors" ON public.visitor_checkins;
DROP POLICY IF EXISTS "Pastors can view visitors" ON public.visitor_checkins;

-- Ensure anonymous users have INSERT permission
GRANT INSERT ON public.visitor_checkins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitor_checkins TO authenticated;
GRANT ALL ON public.visitor_checkins TO service_role;

-- Policy for registration: MUST allow anon and authenticated for the public form
-- The previous policy failed because 'anon' wasn't explicitly allowed to INSERT without restriction
CREATE POLICY "Anyone can register as a visitor"
ON public.visitor_checkins
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy for full management (Admins)
CREATE POLICY "Admins can manage visitors"
ON public.visitor_checkins
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin_geral'));

-- Policy for viewing (Pastors and Leaders)
CREATE POLICY "Pastors can view visitors"
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