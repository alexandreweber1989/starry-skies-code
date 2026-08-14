-- Step 1: Create visitor_checkins table
CREATE TABLE public.visitor_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'integrado')),
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);

-- Step 2: Grant Data API access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitor_checkins TO authenticated;
GRANT INSERT ON public.visitor_checkins TO anon;
GRANT ALL ON public.visitor_checkins TO service_role;

-- Step 3: Enable RLS
ALTER TABLE public.visitor_checkins ENABLE ROW LEVEL SECURITY;

-- Step 4: Create Policies
-- Allow anyone to register (Insert) - needed for the QR Code flow
CREATE POLICY "Anyone can register as a visitor"
ON public.visitor_checkins
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow Admins to manage all records
CREATE POLICY "Admins can manage visitors"
ON public.visitor_checkins
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin_geral'));

-- Allow Pastors to see visitors (reading profiles for ecclesiastical function)
-- Note: Using profile check since pastor role is in church_function
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