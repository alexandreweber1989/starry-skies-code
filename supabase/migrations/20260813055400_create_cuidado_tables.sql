-- Create prayer_requests table
CREATE TABLE public.prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mesa_id UUID NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('prayer', 'counseling')),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied')),
    response TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create social_assistance_requests table
CREATE TABLE public.social_assistance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    needs_food BOOLEAN DEFAULT false,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prayer_requests TO authenticated;
GRANT ALL ON public.prayer_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_assistance_requests TO authenticated;
GRANT ALL ON public.social_assistance_requests TO service_role;

-- RLS
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_assistance_requests ENABLE ROW LEVEL SECURITY;

-- Policies for prayer_requests: User can see their own, leaders can see their Mesa's
CREATE POLICY "Users can view own prayer requests" ON public.prayer_requests
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prayer requests" ON public.prayer_requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders can view their Mesa's prayer requests" ON public.prayer_requests
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'lider_mesa' 
            AND mesa_id = public.prayer_requests.mesa_id
        ) OR EXISTS (
            SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin_geral'
        )
    );

-- Policies for social_assistance_requests: User can see their own, 'social_worker' or admin can see all
CREATE POLICY "Users can view own social assistance requests" ON public.social_assistance_requests
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own social assistance requests" ON public.social_assistance_requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all social assistance requests" ON public.social_assistance_requests
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin_geral'
        )
    );
