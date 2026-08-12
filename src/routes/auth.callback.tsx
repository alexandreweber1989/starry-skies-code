import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = Route.useNavigate();

  Route.useLayoutEffect(() => {
    const handleCallback = async () => {
      // O Supabase JS client processa o fragmento da URL (#access_token=...) automaticamente
      // se detectSessionInUrl estiver ativado (é o padrão).
      // Apenas aguardamos um pouco para garantir que a sessão foi estabelecida.
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        navigate({ to: '/dashboard', replace: true });
      } else {
        // Caso não haja sessão imediata, o onAuthStateChange no AuthProvider cuidará do redirecionamento
        // ou podemos redirecionar de volta para o login após um curto delay se falhar.
        const timeout = setTimeout(() => {
          navigate({ to: '/auth', replace: true });
        }, 2000);
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
