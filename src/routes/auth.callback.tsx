import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = Route.useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        navigate({ to: '/dashboard', replace: true });
      } else {
        const timeout = setTimeout(() => {
          navigate({ to: '/auth', replace: true });
        }, 3000);
        return () => clearTimeout(timeout);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Autenticando...
        </p>
      </div>
    </div>
  );
}
