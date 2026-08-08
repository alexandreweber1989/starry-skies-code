import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { RedeDialog, EditRedeButton } from "@/components/admin/rede-dialog";
import { MesaDialog, MesaMembersDialog, EditMesaButton } from "@/components/admin/mesa-dialog";
import { RedeMembersDialog } from "@/components/admin/rede-members-dialog";
import { GroupSummary } from "@/components/admin/group-summary";
import { statsOf, useGroupStats } from "@/lib/use-grupos";

export const Route = createFileRoute("/_authenticated/redes")({
  head: () => ({
    meta: [
      { title: "Redes — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Redes da Igreja Batista Atos: liderança responsável, mesas vinculadas e pessoas de cada rede.",
      },
      { property: "og:title", content: "Redes — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Estrutura de redes e mesas de comunhão da Igreja Batista Atos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RedesPage,
});

function RedesPage() {
  const { isAdmin } = useAuth();
  const [term, setTerm] = useState("");

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
      const { data, error } = await supabase.from("mesas").select("*");
      if (error) throw error;
      const grouped: Record<string, any[]> = {};
      for (const m of data ?? []) {
        const k = m.rede_id ?? "sem-rede";
        (grouped[k] ||= []).push(m);
      }
      return grouped;
    },
  });

  const { data: stats } = useGroupStats();

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return redes ?? [];
    return (redes ?? []).filter((r) => {
      const mesaNames = (mesasByRede?.[r.id] ?? []).map((m: any) => m.name).join(" ");
      const leaders = statsOf(stats?.redes, r.id).leaders.map((l) => l.name).join(" ");
      return [r.name, r.description, r.target_audience, r.church?.name, mesaNames, leaders]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [redes, mesasByRede, stats, term]);

  return (
    <>
      <PageHeader
        eyebrow="Comunhão"
        title="Redes"
        description={isAdmin ? "As redes reúnem pessoas por afinidade e as organizam em Mesas — grupos semanais de comunhão." : "Redes de comunhão das quais você faz parte."}
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
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por rede, responsável ou mesa"
            className="sm:max-w-sm"
            aria-label="Buscar redes"
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground self-center">
            {filtered.length} {filtered.length === 1 ? "rede" : "redes"}
          </span>
        </div>

        <div className="space-y-8">
          {filtered.map((r, i) => {
            const redeStats = statsOf(stats?.redes, r.id);
            const mesas = mesasByRede?.[r.id] ?? [];
            return (
              <div key={r.id} className="border border-border bg-card rounded-sm">
                <div className="p-6 border-b border-border flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] uppercase tracking-widest text-primary mb-2">
                      Rede {String(i + 1).padStart(2, "0")} · {r.target_audience}
                      {r.church?.name ? ` · ${r.church.name}` : ""}
                    </div>

                    <h3 className="font-serif text-3xl">{r.name}</h3>
                    {r.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                    )}

                    <div className="mt-4">
                      <GroupSummary
                        stats={redeStats}
                        emptyHint="Nenhum responsável ou membro vinculado a esta rede ainda."
                      />
                    </div>

                    {isAdmin && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <EditRedeButton rede={r} />
                        <RedeMembersDialog redeId={r.id} redeName={r.name} />
                        <MesaDialog redeId={r.id} compact />
                      </div>
                    )}
                  </div>
                  <div className="font-serif text-4xl text-muted-foreground text-right shrink-0">
                    {mesas.length.toString().padStart(2, "0")}
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      mesas
                    </div>
                  </div>
                </div>
                <ul className="divide-y divide-border">
                  {mesas.map((m: any) => {
                    const mesaStats = statsOf(stats?.mesas, m.id);
                    return (
                      <li
                        key={m.id}
                        className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="font-serif text-lg">{m.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {mesaStats.leaders.length
                              ? mesaStats.leaders.map((l) => l.name).join(" · ")
                              : "Sem liderança definida"}
                            {" — "}
                            {mesaStats.total} {mesaStats.total === 1 ? "pessoa" : "pessoas"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {m.meeting_day ?? "Dia a definir"} · {m.meeting_time ?? "—"}
                          </div>
                          {isAdmin && <MesaMembersDialog mesaId={m.id} mesaName={m.name} />}
                          {isAdmin && <EditMesaButton mesa={m} />}
                        </div>
                      </li>
                    );
                  })}
                  {mesas.length === 0 && (
                    <li className="px-6 py-4 text-sm text-muted-foreground">
                      Nenhuma mesa cadastrada nesta rede.
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
          {redes && filtered.length === 0 && (
            <p className="text-muted-foreground">
              {redes.length === 0
                ? "Nenhuma rede cadastrada ainda."
                : "Nenhuma rede encontrada para essa busca."}
            </p>
          )}
        </div>
      </PageBody>
    </>
  );
}
