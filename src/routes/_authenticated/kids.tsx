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
  const { isAdmin, isKidsAdmin } = useAuth();

  if (!isKidsAdmin) {
    throw new Error("Acesso negado. Apenas administradores do Kids ou gerais podem acessar este painel.");
  }

  return (
    <>
      <PageHeader
        eyebrow="Ministério Infantil"
        title="Kids"
        description="Gestão de check-in, turmas e segurança das crianças da casa."
      />
      <PageBody>
        <KidsCheckinDashboard />
      </PageBody>
    </>
  );
}
