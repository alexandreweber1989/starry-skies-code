import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Sparkles, Network, UtensilsCrossed, Users, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel — IB Atos" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const [m, r, mesas, p] = await Promise.all([
        supabase.from("ministries").select("id", { count: "exact", head: true }),
        supabase.from("redes").select("id", { count: "exact", head: true }),
        supabase.from("mesas").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return {
        ministries: m.count ?? 0,
        redes: r.count ?? 0,
        mesas: mesas.count ?? 0,
        profiles: p.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Ministérios", value: data?.ministries ?? "—", to: "/ministerios", icon: Sparkles },
    { label: "Redes", value: data?.redes ?? "—", to: "/redes", icon: Network },
    { label: "Mesas", value: data?.mesas ?? "—", to: "/mesas", icon: UtensilsCrossed },
    { label: "Membros", value: data?.profiles ?? "—", to: "/membros", icon: Users },
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "Admin geral" : "Painel"}
        title={`Olá, ${user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "irmão(ã)"}.`}
        description="Este é o centro operacional da Igreja Batista Atos. A partir daqui você acessa ministérios, redes, mesas e membros."
      />
      <PageBody>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="group border border-border bg-card p-6 rounded-sm hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <c.icon className="h-5 w-5 text-primary" />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="font-serif text-4xl mt-6">{c.value}</div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-2">
                {c.label}
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-12 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-border bg-card p-8 rounded-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-4">
              O que vem por aí
            </div>
            <h2 className="font-serif text-2xl mb-4">Próximas fases da plataforma</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Escalas de louvor e mídia por evento</li>
              <li>• Check-in seguro do Kids por QR Code</li>
              <li>• Portal de notícias, avisos e eventos</li>
              <li>• Rede social interna dos jovens e adolescentes</li>
              <li>• Campanhas mensais do Atos de Amor</li>
            </ul>
          </div>
          <div className="border border-border bg-sidebar text-sidebar-foreground p-8 rounded-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-sidebar-primary mb-4">
              Nossa base
            </div>
            <p className="font-serif text-xl leading-snug">
              "E perseveravam na doutrina dos apóstolos, e na comunhão, e no partir do pão, e nas orações."
            </p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-sidebar-foreground/60 mt-4">
              Atos 2:42
            </p>
          </div>
        </section>
      </PageBody>
    </>
  );
}