import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = Route.useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // O Supabase JS client detecta automaticamente os tokens no hash da URL
        // e estabelece a sessão. getSession() confirma isso.
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) throw authError;

        if (session) {
          toast.success("Login realizado com sucesso!");
          navigate({ to: '/dashboard', replace: true });
        } else {
          // Se não houver sessão imediata, aguardamos um pouco para o evento onAuthStateChange
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              subscription.unsubscribe();
              toast.success("Login realizado com sucesso!");
              navigate({ to: '/dashboard', replace: true });
            }
          });

          // Timeout de segurança
          const timeout = setTimeout(() => {
            subscription.unsubscribe();
            setError("Não foi possível recuperar a sessão. Tente novamente.");
            setTimeout(() => navigate({ to: '/auth', replace: true }), 3000);
          }, 5000);
        }
      } catch (err: any) {
        console.error("Erro no callback de autenticação:", err);
        setError(err.message || "Erro ao processar login.");
        setTimeout(() => navigate({ to: '/auth', replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-xl font-serif mb-2 text-destructive">Falha na Autenticação</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <p className="text-xs font-mono uppercase tracking-widest animate-pulse">
          Redirecionando para login...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Finalizando autenticação...
        </p>
      </div>
    </div>
  );
}
