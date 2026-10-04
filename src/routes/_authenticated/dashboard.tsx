import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CalendarDays,
  UtensilsCrossed,
  Sparkles,
  UserPlus,
  Megaphone,
  Bell,
  Baby,
  Coffee,
  User as UserIcon,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAvisos, isVigente, formatData, CATEGORY_LABEL } from "@/lib/avisos";
import { PageHeader, PageBody } from "@/components/app-shell";
import { StatTile, PanelSection } from "@/components/painel/ui";
import { StatTileSkeleton } from "@/components/ui/loading-states";
import { BannerInstalarApp } from "@/components/pwa/instalar-app";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel Principal — IB Atos" }] }),
  component: DashboardPage,
});

/** Próximos eventos (todos os perfis). */
function useProximosEventos() {
  return useQuery({
    queryKey: ["dashboard-eventos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, starts_at, location")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Mesas da pessoa (como membro ou líder) — usado por liderança e membros. */
function useMinhasMesas(userId?: string) {
  return useQuery({
    queryKey: ["dashboard-minhas-mesas", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesa_members")
        .select("role, mesa:mesas(id, name, meeting_day, meeting_time)")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []) as unknown as {
        role: string;
        mesa: { id: string; name: string; meeting_day: string | null; meeting_time: string | null } | null;
      }[];
    },
  });
}

function formatHorario(dia: string | null, hora: string | null) {
  const h = hora ? hora.slice(0, 5) : null;
  return [dia, h].filter(Boolean).join(" · ") || "Horário a definir";
}

/** Painel de avisos recentes (todos os perfis). */
function AvisosRecentes() {
  const { data, isLoading } = useAvisos();
  const vigentes = (data ?? []).filter(isVigente).slice(0, 4);
  return (
    <PanelSection
      label="Comunicação"
      title="Avisos recentes"
      action={
        <Link to="/avisos" className="text-xs font-mono uppercase tracking-widest text-primary hover:underline">
          Ver todos
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : vigentes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum aviso no momento.</p>
      ) : (
        <ul className="divide-y divide-border">
          {vigentes.map((a) => (
            <li key={a.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <Megaphone className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-medium truncate">{a.title}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {CATEGORY_LABEL[a.category]}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">{formatData(a.published_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}

/** Próximos eventos (todos os perfis). */
function ProximosEventos() {
  const { data, isLoading } = useProximosEventos();
  const eventos = data ?? [];
  return (
    <PanelSection
      label="Agenda"
      title="Próximos eventos"
      action={
        <Link to="/agenda" className="text-xs font-mono uppercase tracking-widest text-primary hover:underline">
          Ver agenda
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento agendado.</p>
      ) : (
        <ul className="divide-y divide-border">
          {eventos.map((e) => (
            <li key={e.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
              <CalendarDays className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatData(e.starts_at)}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}

/** Atalho simples (usado pelo painel do membro). */
function Atalho({ to, icon: Icon, label }: { to: string; icon: typeof Users; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 transition-colors hover:border-primary/50 hover:bg-card"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="font-medium">{label}</span>
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

/* ----------------------------- Painéis por papel ----------------------------- */

function DashboardAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats-admin"],
    queryFn: async () => {
      const [membros, ministerios, mesas, louvor, visitantes, solicitacoes] = await Promise.all([
        supabase.from("profiles").select("id, created_at", { count: "exact" }),
        supabase.from("ministries").select("id", { count: "exact", head: true }),
        supabase.from("mesas").select("id", { count: "exact", head: true }),
        supabase.from("worship_schedules").select("id", { count: "exact", head: true }).eq("status", "rascunho"),
        supabase.from("visitor_checkins").select("id", { count: "exact", head: true }).eq("status", "novo"),
        supabase.from("membership_requests").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ]);
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const novos = (membros.data ?? []).filter((m) => new Date(m.created_at) >= inicioMes).length;
      return {
        ativos: membros.count ?? 0,
        novos,
        ministries: ministerios.count ?? 0,
        mesas: mesas.count ?? 0,
        pendentes: louvor.count ?? 0,
        v_pendentes: visitantes.count ?? 0,
        solicitacoes: solicitacoes.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatTileSkeleton key={i} />)
        ) : (
          <>
            <StatTile label="Solicitações" value={data?.solicitacoes ?? "—"} hint="Cadastros pendentes" icon={UserPlus} to="/membros" />
            <StatTile label="Membros ativos" value={data?.ativos ?? "—"} hint={data ? `${data.novos} novo(s) no mês` : undefined} icon={Users} to="/membros" />
            <StatTile label="Ministérios" value={data?.ministries ?? "—"} icon={Sparkles} to="/ministerios" />
            <StatTile label="Mesas" value={data?.mesas ?? "—"} icon={UtensilsCrossed} to="/mesas" />
            <StatTile label="Escalas" value={data?.pendentes ?? "—"} hint="Aguardando" icon={CalendarDays} to="/louvor" />
            <StatTile label="Visitantes" value={data?.v_pendentes ?? "—"} hint="Novos" icon={Sparkles} to="/visitantes" />
          </>
        )}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <AvisosRecentes />
        <ProximosEventos />
      </div>
    </div>
  );
}

function DashboardLideranca() {
  const { user, roles, isPastoral } = useAuth();
  const { data: mesas, isLoading } = useMinhasMesas(user?.id);
  const minhasMesas = (mesas ?? []).filter((m) => m.mesa);
  const ministeriosAdmin = roles.filter((r) => r.role === "admin_ministerio").length;

  const { data: escalas } = useQuery({
    queryKey: ["dashboard-escalas-lideranca"],
    queryFn: async () => {
      const { count } = await supabase
        .from("worship_schedules")
        .select("id", { count: "exact", head: true })
        .eq("status", "rascunho");
      return count ?? 0;
    },
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Minhas mesas" value={minhasMesas.length} icon={UtensilsCrossed} to="/mesas" />
        {ministeriosAdmin > 0 && (
          <StatTile label="Meus ministérios" value={ministeriosAdmin} icon={Sparkles} to="/ministerios" />
        )}
        <StatTile label="Escalas" value={escalas ?? "—"} hint="Em rascunho" icon={CalendarDays} to="/louvor" />
        {isPastoral && <StatTile label="Membros" value="Ver" icon={Users} to="/membros" />}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <PanelSection label="Pastoreio" title="Sua liderança">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : minhasMesas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não lidera nenhuma mesa cadastrada. Fale com a administração para vincular sua liderança.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {minhasMesas.map((m) => (
                <li key={m.mesa!.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                  <UtensilsCrossed className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.mesa!.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatHorario(m.mesa!.meeting_day, m.mesa!.meeting_time)}
                    </p>
                  </div>
                  <Link
                    to="/mesas"
                    className="ml-auto text-xs font-mono uppercase tracking-widest text-primary hover:underline"
                  >
                    Abrir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PanelSection>
        <AvisosRecentes />
      </div>
      <ProximosEventos />
    </div>
  );
}

function DashboardMembro() {
  const { user } = useAuth();
  const { data: mesas, isLoading } = useMinhasMesas(user?.id);
  const minhasMesas = (mesas ?? []).filter((m) => m.mesa);

  return (
    <div className="space-y-8">
      <PanelSection label="Sua mesa" title="Onde você caminha">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : minhasMesas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Você ainda não está em uma mesa. Uma mesa é um grupo pequeno pra caminhar junto — fale com a
            liderança para participar de uma perto de você.
          </p>
        ) : (
          <ul className="space-y-2">
            {minhasMesas.map((m) => (
              <li key={m.mesa!.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.mesa!.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatHorario(m.mesa!.meeting_day, m.mesa!.meeting_time)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      <div className="grid gap-8 lg:grid-cols-2">
        <AvisosRecentes />
        <ProximosEventos />
      </div>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">Atalhos</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Atalho to="/avisos" icon={Bell} label="Avisos" />
          <Atalho to="/agenda" icon={CalendarDays} label="Agenda" />
          <Atalho to="/cantina" icon={Coffee} label="Cantina" />
          <Atalho to="/perfil" icon={UserIcon} label="Meu perfil" />
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { isAdmin, isLeadership, isPastoral, profile, user } = useAuth();
  const primeiroNome =
    (profile?.full_name ?? "").trim().split(/\s+/)[0] || (user?.email ?? "").split("@")[0] || "";
  const papel = isAdmin ? "Administração" : isPastoral ? "Pastoral" : isLeadership ? "Liderança" : "Membro";

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        eyebrow={papel}
        title={primeiroNome ? `Olá, ${primeiroNome}` : "Painel Principal"}
        description="O que está acontecendo na Igreja Batista Atos."
      />
      <PageBody>
        <BannerInstalarApp />
        {isAdmin ? <DashboardAdmin /> : isLeadership ? <DashboardLideranca /> : <DashboardMembro />}
      </PageBody>
    </div>
  );
}
