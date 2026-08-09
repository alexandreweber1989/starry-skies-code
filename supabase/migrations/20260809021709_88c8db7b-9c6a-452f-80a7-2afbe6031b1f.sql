-- Create social_assistance_requests table to track families in need
CREATE TABLE public.social_assistance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_name TEXT NOT NULL,
    requester_phone TEXT,
    family_members_count INTEGER DEFAULT 1,
    needs_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    handled_by UUID REFERENCES auth.users(id),
    notes TEXT
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_assistance_requests TO authenticated;
GRANT ALL ON public.social_assistance_requests TO service_role;

-- Enable RLS
ALTER TABLE public.social_assistance_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone authenticated can select requests"
ON public.social_assistance_requests FOR SELECT TO authenticated USING (true);

-- Assuming has_role or similar might exist from previous turns, or we use a simple check for now
-- Let's try to use a more robust policy if user_roles exists
CREATE POLICY "Admins can manage assistance requests"
ON public.social_assistance_requests FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin'));

-- Add stats to campaigns
ALTER TABLE public.social_assistance_campaigns 
ADD COLUMN IF NOT EXISTS total_families_reached INTEGER DEFAULT 0;
