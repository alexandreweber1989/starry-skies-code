import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MinistryDialog } from "@/components/admin/ministry-dialog";

export const Route = createFileRoute("/_authenticated/ministerios/")({
  head: () => ({ meta: [{ title: "Ministérios — IB Atos" }] }),
  component: MinistriesPage,
});

function MinistriesPage() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["ministries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ministries")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Corpo em serviço"
        title="Ministérios"
        description="Os nove ministérios da Igreja Batista Atos, cada um com sua vocação e seus servos."
        actions={isAdmin ? <MinistryDialog /> : undefined}
      />
      <PageBody>
        {isLoading && <div className="text-muted-foreground">Carregando...</div>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((m, i) => (
            <Link
              key={m.id}
              to="/ministerios/$slug"
              params={{ slug: m.slug }}
              className="group border border-border bg-card rounded-sm p-6 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className="font-mono text-[11px] uppercase tracking-widest text-primary"
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
              <h3 className="font-serif text-2xl leading-tight">{m.name}</h3>
              {m.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{m.description}</p>
              )}
              {m.meeting_info && (
                <div className="mt-6 pt-4 border-t border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {m.meeting_info}
                </div>
              )}
            </Link>
          ))}
        </div>
      </PageBody>
    </>
  );
}