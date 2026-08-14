import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { KidsCheckinDashboard } from "@/components/kids/kids-dashboard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/kids")({
  head: () => ({
    meta: [
      { title: "Kids — Igreja Batista Atos" },
      { name: "description", content: "Módulo de check-in e segurança para o ministério infantil." },
    ],
  }),
  component: KidsPage,
});

function KidsPage() {
  const { loading, isKidsAdmin, isAdmin } = useAuth();
  const canAccess = isKidsAdmin || isAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4 text-center">
        <h1 className="text-2xl font-serif text-destructive">Acesso negado</h1>
        <p className="text-muted-foreground max-w-md">
          Apenas administradores do Kids ou gerais podem acessar este painel.
          Se você acredita que deveria ter acesso, entre em contato com o administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="font-kids" style={{ "--group-primary": "#f97316" } as React.CSSProperties}>
      <PageHeader
        eyebrow="Ministério Infantil"
        title="Kids"
        className="border-b-[3px] border-[var(--group-primary)]"
        description="Gestão de check-in, turmas e segurança das crianças da casa."
      />
      <PageBody>
        <KidsCheckinDashboard />
      </PageBody>
    </div>
  );
}