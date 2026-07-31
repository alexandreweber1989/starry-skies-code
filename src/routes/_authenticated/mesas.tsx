import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { MesaDialog, MesaMembersDialog } from "@/components/admin/mesa-dialog";

export const Route = createFileRoute("/_authenticated/mesas")({
  head: () => ({ meta: [{ title: "Mesas — IB Atos" }] }),
  component: MesasPage,
});

function MesasPage() {
  const { data } = useQuery({
    queryKey: ["mesas-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesas")
        .select("*, rede:redes(name, target_audience)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Comunhão semanal"
        title="Mesas"
        description="Cada Mesa é um grupo de comunhão que se reúne durante a semana, sob a liderança de um casal ou líder da rede."
      />
      <PageBody>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((m: any) => (
            <div key={m.id} className="border border-border bg-card p-6 rounded-sm">
              <div className="flex items-start justify-between mb-4">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                {m.rede && (
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {m.rede.name}
                  </div>
                )}
              </div>
              <h3 className="font-serif text-2xl">{m.name}</h3>
              {m.description && <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>}
              <div className="mt-6 pt-4 border-t border-border space-y-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <div>{m.meeting_day ?? "Dia a definir"} · {m.meeting_time ?? "—"}</div>
                <div>{m.meeting_location ?? "Local a definir"}</div>
              </div>
            </div>
          ))}
        </div>
        {data && data.length === 0 && (
          <p className="text-muted-foreground">Nenhuma mesa cadastrada ainda.</p>
        )}
      </PageBody>
    </>
  );
}