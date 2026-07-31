import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { RedeDialog } from "@/components/admin/rede-dialog";
import { MesaDialog, MesaMembersDialog } from "@/components/admin/mesa-dialog";
import { RedeMembersDialog } from "@/components/admin/rede-members-dialog";

export const Route = createFileRoute("/_authenticated/redes")({
  head: () => ({ meta: [{ title: "Redes — IB Atos" }] }),
  component: RedesPage,
});

function RedesPage() {
  const { isAdmin } = useAuth();
  const { data: redes } = useQuery({
    queryKey: ["redes-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("redes")
        .select("*, church:churches(name, city)")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });


  const { data: mesasByRede } = useQuery({
    queryKey: ["mesas-by-rede"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mesas").select("id, name, rede_id, meeting_day, meeting_time");
      if (error) throw error;
      const grouped: Record<string, typeof data> = {};
      for (const m of data ?? []) {
        const k = m.rede_id ?? "sem-rede";
        (grouped[k] ||= []).push(m);
      }
      return grouped;
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Comunhão"
        title="Redes"
        description="As redes reúnem pessoas por afinidade e as organizam em Mesas — grupos semanais de comunhão."
        actions={
          isAdmin ? (
            <>
              <RedeDialog />
              <MesaDialog />
            </>
          ) : undefined
        }
      />
      <PageBody>
        <div className="space-y-8">
          {redes?.map((r, i) => (
            <div key={r.id} className="border border-border bg-card rounded-sm">
              <div className="p-6 border-b border-border flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-widest text-primary mb-2">
                    Rede {String(i + 1).padStart(2, "0")} · {r.target_audience}
                  </div>
                  <h3 className="font-serif text-3xl">{r.name}</h3>
                  {r.description && <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>}
                  {isAdmin && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RedeMembersDialog redeId={r.id} redeName={r.name} />
                      <MesaDialog redeId={r.id} compact />
                    </div>
                  )}

                </div>
                <div className="font-serif text-4xl text-muted-foreground">
                  {(mesasByRede?.[r.id]?.length ?? 0).toString().padStart(2, "0")}
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">mesas</div>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {(mesasByRede?.[r.id] ?? []).map((m) => (
                  <li key={m.id} className="px-6 py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="font-serif text-lg">{m.name}</div>
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {m.meeting_day} · {m.meeting_time}
                      </div>
                      {isAdmin && <MesaMembersDialog mesaId={m.id} mesaName={m.name} />}
                    </div>
                  </li>
                ))}
                {(mesasByRede?.[r.id]?.length ?? 0) === 0 && (
                  <li className="px-6 py-4 text-sm text-muted-foreground">Nenhuma mesa cadastrada nesta rede.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </PageBody>
    </>
  );
}