import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = Route.useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const finishLogin = () => {
      if (!mounted || settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      toast.success("Login realizado com sucesso!");
      navigate({ to: "/dashboard", replace: true });
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        finishLogin();
      }
    });

    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");

        if (oauthError) {
          throw new Error(decodeURIComponent(oauthError.replace(/\+/g, " ")));
        }

        const code = url.searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (session) {
          finishLogin();
          return;
        }

        timeout = setTimeout(() => {
          if (!mounted || settled) return;
          settled = true;
          setError("Tempo esgotado ao aguardar autenticação. Tente novamente.");
          setTimeout(() => {
            if (mounted) navigate({ to: "/auth", replace: true });
          }, 3000);
        }, 8000);
      } catch (callbackError) {
        if (!mounted) return;
        settled = true;
        const message = callbackError instanceof Error ? callbackError.message : "Erro ao processar login.";
        console.error("Erro no callback de autenticação:", callbackError);
        setError(message);
        setTimeout(() => {
          if (mounted) navigate({ to: "/auth", replace: true });
        }, 3000);
      }
    };

    void handleCallback();

    return () => {
      mounted = false;
      if (timeout) clearTimeout(timeout);
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="mb-2 text-xl font-serif text-destructive">Falha na autenticação</h2>
        <p className="mb-4 max-w-md text-muted-foreground">{error}</p>
        <p className="animate-pulse text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Redirecionando para login...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Finalizando autenticação...
        </p>
      </div>
    </div>
  );
}
