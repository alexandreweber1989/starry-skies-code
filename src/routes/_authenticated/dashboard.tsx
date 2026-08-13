import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Network,
  UtensilsCrossed,
  Users,
  Music,
  CalendarDays,
  BookOpen,
  Coffee,
  UserPlus,
  Baby,
  ArrowUpRight,
  Layout,
  CheckCircle2,
  FileText,
  HeartPulse,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { todayISO, formatDateBR, relativeDayLabel } from "@/lib/painel";
import { StatTile, PanelSection } from "@/components/painel/ui";
import { LoadingRegion, StatGridSkeleton } from "@/components/ui/loading-states";
import { GraficosDoPainel } from "@/components/painel/graficos";
import { MinhaSemana } from "@/components/painel/minha-semana";
import { AgendaCultos } from "@/components/painel/agenda-cultos";
import { Aniversariantes } from "@/components/painel/aniversariantes";
import { Operacao } from "@/components/painel/operacao";
import { MembershipRequestsPanel } from "@/components/membros/membership-requests-panel";
import { EscalaPendente } from "@/components/painel/escala-pendente";
import { MeusLideres } from "@/components/painel/meus-lideres";
import { ProximosEventos } from "@/components/painel/proximos-eventos";
import { ContribuicaoPix } from "@/components/painel/contribuicao-pix";
import { AvisosRecentes } from "@/components/painel/avisos-recentes";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Centro operacional da Igreja Batista Atos: agenda de cultos, escalas, membros, ministérios, livraria e cantina em um só lugar.",
      },
      { property: "og:title", content: "Painel — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Agenda, escalas, membros e operação da igreja em um único painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const atalhos: { to: string; label: string; icon: any; requiredRoles?: AppRole[] }[] = [
  { to: "/midia", label: "Mídia", icon: Layout, requiredRoles: ["admin_geral"] },
  { to: "/ministerios", label: "Ministérios", icon: Sparkles },
  { to: "/louvor", label: "Louvor", icon: Music },
  { to: "/redes", label: "Redes", icon: Network },
  { to: "/mesas", label: "Mesas", icon: UtensilsCrossed },
  { to: "/membros", label: "Membros", icon: Users, requiredRoles: ["admin_geral"] },
  { to: "/kids", label: "Kids", icon: Baby, requiredRoles: ["admin_geral", "admin_kids"] },
  { to: "/kids/relatorios", label: "Relatórios Kids", icon: FileText, requiredRoles: ["admin_geral", "admin_kids"] },
  {
    to: "/livraria",
    label: "Livraria",
    icon: BookOpen,
    requiredRoles: ["admin_geral", "admin_livraria"],
  },
  {
    to: "/cantina",
    label: "Cantina",
    icon: Coffee,
    requiredRoles: ["admin_geral", "admin_cantina"],
  },
  { to: "/perfil", label: "Meu perfil", icon: UserPlus },
  { to: "/cuidado", label: "Cuidado", icon: HeartPulse },
];

function Dashboard() {
  const { user, profile, isAdmin, roles, isLivrariaAdmin, isCantinaAdmin } = useAuth();
  const podeVerOperacao = isAdmin || isLivrariaAdmin || isCantinaAdmin;
  const isLiderMesaOuRede = roles.some(
    (r) => r.role === "lider_mesa" || r.role === "admin_ministerio",
  );

  const filteredAtalhos = atalhos.filter((a) => {
    if (isAdmin) return true;
    if (!a.requiredRoles) return true;
    return roles.some((r) => a.requiredRoles?.includes(r.role));
  });

  const { data, isPending } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const hoje = todayISO();
      const inicioMes = hoje.slice(0, 8) + "01";
      const [m, r, mesas, ativos, novos, proximo, pendentes] = await Promise.all([
        supabase
          .from("ministries")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase.from("redes").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("mesas").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("membership_status", "ativo"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", `${inicioMes}T00:00:00Z`),
        supabase
          .from("worship_schedules")
          .select("title, event_date, start_time, location")
          .eq("status", "publicada")
          .gte("event_date", hoje)
          .order("event_date", { ascending: true })
          .limit(1),
        supabase
          .from("worship_schedule_assignments")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente"),
      ]);
      return {
        ministries: m.count ?? 0,
        redes: r.count ?? 0,
        mesas: mesas.count ?? 0,
        ativos: ativos.count ?? 0,
        novos: novos.count ?? 0,
        pendentes: pendentes.count ?? 0,
        proximo: (proximo.data ?? [])[0] as
          | {
              title: string;
              event_date: string;
              start_time: string | null;
              location: string | null;
            }
          | undefined,
      };
    },
  });

  const nomeCompleto = profile?.full_name || user?.user_metadata?.["full_name"];
  const nome = nomeCompleto?.trim()?.split(" ")[0] || user?.email?.split("@")[0];

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "Admin geral" : "Painel"}
        title={`Olá, ${nome ?? "irmão(ã)"}.`}
        description="Centro operacional da Igreja Batista Atos. Tudo que precisa de você hoje aparece primeiro."
        actions={
          data?.proximo ? (
            <div className="border border-border rounded-xl px-4 py-3 bg-card/50 backdrop-blur-sm w-full md:w-auto transition-all duration-300 hover:shadow-md hover:border-primary/30">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                Próximo culto · {relativeDayLabel(data.proximo.event_date)}
              </div>
              <div className="font-serif text-lg mt-1 leading-none">{data.proximo.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDateBR(data.proximo.event_date, { day: "2-digit", month: "long" })}
                {data.proximo.start_time ? ` · ${data.proximo.start_time.slice(0, 5)}` : ""}
                {data.proximo.location ? ` · ${data.proximo.location}` : ""}
              </div>
            </div>
          ) : undefined
        }
      />
      <PageBody>
        <div className="mb-6">
          <EscalaPendente />
        </div>
        <div className="mb-6">
          <MembershipRequestsPanel compact />
        </div>

        {isPending ? (
          <LoadingRegion label="Carregando indicadores da igreja…">
            <StatGridSkeleton count={4} />
          </LoadingRegion>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isAdmin ? (
              <StatTile
                label="Membros ativos"
                value={data?.ativos ?? "—"}
                hint={data ? `${data.novos} novo(s) neste mês` : undefined}
                icon={Users}
                to="/membros"
              />
            ) : (
              <StatTile
                label="Ministérios"
                value={data?.ministries ?? "—"}
                icon={Sparkles}
                to="/ministerios"
              />
            )}
            {isAdmin ? (
              <StatTile
                label="Ministérios"
                value={data?.ministries ?? "—"}
                icon={Sparkles}
                to="/ministerios"
              />
            ) : (
              <StatTile
                label="Mesas ativas"
                value={data?.mesas ?? "—"}
                icon={UtensilsCrossed}
                to="/mesas"
              />
            )}
            {isAdmin ? (
              <StatTile
                label="Mesas ativas"
                value={data?.mesas ?? "—"}
                icon={UtensilsCrossed}
                to="/mesas"
              />
            ) : (
              <StatTile
                label="Escalas pendentes"
                value={data?.pendentes ?? "—"}
                hint="Aguardando confirmação"
                icon={CalendarDays}
                to="/louvor"
              />
            )}
            {isAdmin && (
              <StatTile
                label="Escalas pendentes"
                value={data?.pendentes ?? "—"}
                hint="Aguardando confirmação"
                icon={CalendarDays}
                to="/louvor"
              />
            )}
          </div>
        )}

        {/* Leitura de tendência: os números acima dizem "quanto"; os gráficos
            abaixo dizem "para onde". Restrito a quem tem visão da igreja toda. */}
        {isAdmin && (
          <div className="mt-6 grid lg:grid-cols-2 gap-6">
            <GraficosDoPainel />
          </div>
        )}

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <MinhaSemana />
          <MeusLideres />
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <AgendaCultos />
          <Aniversariantes />
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <AvisosRecentes />
          <ProximosEventos />
        </div>

        <div className="mt-6">
          <ContribuicaoPix />
        </div>

        <div className="mt-6">
          <div className="border border-border bg-sidebar text-sidebar-foreground p-6 sm:p-8 rounded-xl flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-sidebar/10 hover:border-sidebar-border/80">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-sidebar-primary mb-4">
                Nossa base
              </div>
              <p className="font-serif text-xl leading-snug">
                "E perseveravam na doutrina dos apóstolos, e na comunhão, e no partir do pão, e nas
                orações."
              </p>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/60 mt-6">
              Atos 2:42
            </p>
          </div>
        </div>

        {podeVerOperacao && (
          <div className="mt-6">
            <Operacao />
          </div>
        )}

        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <PanelSection label="Navegação" title="Atalhos" className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredAtalhos.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="group border border-border bg-card/40 backdrop-blur-sm rounded-xl p-4 hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <a.icon className="h-4 w-4 text-primary" />
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] mt-6">
                    {a.label}
                  </div>
                </Link>
              ))}
            </div>
          </PanelSection>

          <PanelSection label="Roadmap" title="Fases Concluídas">
            <ol className="space-y-3 text-sm text-muted-foreground">
              {[
                "Kids — check-in seguro e QR Code",
                "Mídia — biblioteca e central de mídias",
                "Atos de Amor — campanhas e impacto",
                "Hierarchy — isolamento de mesas e redes",
                "Pedidos online: reserva com retirada na igreja",
                "Personalização — interface adaptativa",
              ].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="font-mono text-[10px] text-primary pt-1">
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <span className="line-through opacity-50">{t}</span>
                </li>
              ))}
            </ol>
          </PanelSection>
        </div>
      </PageBody>
    </>
  );
}
