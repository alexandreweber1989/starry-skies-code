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
  Coffee,
  User as UserIcon,
  ChevronRight,
  MapPin,
  Smartphone,
  Quote,
  Gift,
  TrendingUp,
  CheckCircle2,
  HeartHandshake,
  Play,
  Music,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAvisos, isVigente, formatData, CATEGORY_LABEL } from "@/lib/avisos";
import { PageHeader, PageBody } from "@/components/app-shell";
import { StatTile, PanelSection } from "@/components/painel/ui";
import { StatTileSkeleton } from "@/components/ui/loading-states";
import { BannerInstalarApp } from "@/components/pwa/instalar-app";
import { AtivarPush } from "@/components/notificacoes/ativar-push";
import { estatisticasAdocao } from "@/lib/adocao.functions";
import {
  saudacaoPorHorario,
  dataHojeExtenso,
  versiculoDoDia,
  completudePerfil,
  aniversariantesProximos,
} from "@/lib/dashboard-helpers";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel Principal — IB Atos" }] }),
  component: DashboardPage,
});

/* ------------------------------------------------------------------ hooks --- */

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

/** Perfil do próprio usuário (para completude do cadastro). */
function useMeuPerfil(userId?: string) {
  return useQuery({
    queryKey: ["dashboard-meu-perfil", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data as Record<string, unknown> | null;
    },
  });
}

function formatHorario(dia: string | null, hora: string | null) {
  const h = hora ? hora.slice(0, 5) : null;
  return [dia, h].filter(Boolean).join(" · ") || "Horário a definir";
}

/* ------------------------------------------------------ blocos compartilhados */

/** Versículo do dia — presença pastoral discreta no topo. */
function VersiculoDoDia() {
  const v = versiculoDoDia();
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-start gap-3">
        <Quote className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-serif text-lg leading-snug">"{v.texto}"</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{v.ref}</p>
        </div>
      </div>
    </div>
  );
}

/** Convite para completar o cadastro — some quando o perfil está 100%. */
function CompleteSeuCadastro({ perfil }: { perfil: Record<string, unknown> | null | undefined }) {
  const { pct, faltando } = completudePerfil(perfil);
  if (!perfil || pct >= 100) return null;
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-serif text-lg leading-tight">Complete seu cadastro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Faltam: {faltando.slice(0, 4).join(", ")}
            {faltando.length > 4 ? "…" : ""}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-serif text-2xl tabular-nums">{pct}%</span>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/perfil">Completar</Link>
          </Button>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Seus compromissos: eventos confirmados + escalas de louvor, já ordenados. */
function SeusCompromissos({ userId }: { userId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-compromissos", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const agora = new Date().toISOString();
      const hoje = new Date().toISOString().slice(0, 10);
      const [rsvps, escalas] = await Promise.all([
        supabase
          .from("event_rsvps")
          .select("status, event:events(id, title, starts_at, location)")
          .eq("user_id", userId!)
          .eq("status", "vou"),
        supabase
          .from("worship_schedule_assignments")
          .select("function_name, status, schedule:worship_schedules(id, title, event_date, start_time, location)")
          .eq("user_id", userId!),
      ]);
      type Item = { id: string; tipo: "evento" | "escala"; titulo: string; quando: string; extra: string | null };
      const itens: Item[] = [];
      for (const r of (rsvps.data ?? []) as any[]) {
        const e = r.event;
        if (e && e.starts_at >= agora) {
          itens.push({ id: `ev-${e.id}`, tipo: "evento", titulo: e.title, quando: e.starts_at, extra: e.location ?? null });
        }
      }
      for (const a of (escalas.data ?? []) as any[]) {
        const s = a.schedule;
        if (s && s.event_date >= hoje) {
          const iso = `${s.event_date}T${(s.start_time ?? "00:00:00").slice(0, 8)}`;
          itens.push({ id: `es-${s.id}`, tipo: "escala", titulo: s.title, quando: iso, extra: a.function_name ?? null });
        }
      }
      itens.sort((x, y) => x.quando.localeCompare(y.quando));
      return itens.slice(0, 5);
    },
  });

  const itens = data ?? [];
  return (
    <PanelSection label="Depende de você" title="Seus próximos compromissos">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Você não tem compromissos confirmados. Confirme presença na <Link to="/agenda" className="text-primary hover:underline">agenda</Link>.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {itens.map((i) => (
            <li key={i.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              {i.tipo === "escala" ? (
                <Music className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{i.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {formatData(i.quando)}
                  {i.extra ? ` · ${i.extra}` : ""}
                  {i.tipo === "escala" ? " · escala" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}

/** Última pregação publicada (com fallback para vídeo do YouTube). */
function UltimaPregacao() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-ultima-pregacao"],
    queryFn: async () => {
      // `sermons` ainda não está nos tipos gerados do Supabase: cast local.
      const serm = await (supabase.from("sermons" as any) as any)
        .select("id, title, preacher, cover_image_url, youtube_url, preached_on, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (serm.data) {
        const s = serm.data as any;
        return { titulo: s.title, sub: s.preacher ?? "Pregação", capa: s.cover_image_url, url: s.youtube_url, to: "/pregacoes" };
      }
      const vid = await supabase
        .from("youtube_videos")
        .select("title, thumbnail_url, url, published_at")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (vid.data) {
        const v = vid.data as any;
        return { titulo: v.title, sub: "Vídeo", capa: v.thumbnail_url, url: v.url, to: "/pregacoes" };
      }
      return null;
    },
  });

  return (
    <PanelSection
      label="Palavra"
      title="Última pregação"
      action={
        <Link to="/pregacoes" className="text-xs font-mono uppercase tracking-widest text-primary hover:underline">
          Ver todas
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Nenhuma pregação publicada ainda.</p>
      ) : (
        <a
          href={data.url || undefined}
          target={data.url ? "_blank" : undefined}
          rel="noreferrer"
          className="group flex items-center gap-4"
        >
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
            {data.capa ? (
              <img src={data.capa} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <Play className="h-5 w-5" />
              </div>
            )}
            <div className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{data.titulo}</p>
            <p className="text-xs text-muted-foreground">{data.sub}</p>
          </div>
        </a>
      )}
    </PanelSection>
  );
}

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

/** Faixa de adoção do app (somente admin). */
function ResumoAdocao() {
  const { data } = useQuery({
    queryKey: ["dashboard-adocao"],
    queryFn: () => estatisticasAdocao(),
    retry: false,
  });
  if (!data) return null;
  const pct = data.taxaAdocao;
  return (
    <Link
      to="/adocao"
      className="group flex flex-col gap-4 rounded-xl border border-border bg-card/50 p-5 transition-colors hover:border-primary/50 sm:flex-row sm:items-center"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <p className="font-serif text-lg leading-tight">Adoção do app</p>
          <p className="text-sm text-muted-foreground">
            {data.comApp} de {data.totalMembros} membros recebem avisos no celular
          </p>
        </div>
      </div>
      <div className="flex-1 sm:px-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-serif text-2xl leading-none tabular-nums">{pct}%</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

/* --------------------------------------------------------------- aniversários */

function CardAniversariantes({ pessoas }: { pessoas: { id: string; full_name: string | null; birth_date: string | null }[] }) {
  const lista = aniversariantesProximos(pessoas, 7);
  return (
    <PanelSection label="Cuidado" title="Aniversariantes da semana">
      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguém faz aniversário nos próximos 7 dias.</p>
      ) : (
        <ul className="divide-y divide-border">
          {lista.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <Gift className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate font-medium">{p.full_name ?? "Sem nome"}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {p.diaMes} · {p.quando}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}

/* --------------------------------------------------------------------- admin */

function DashboardAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats-admin"],
    queryFn: async () => {
      const [membros, ministerios, mesas, louvor, visitantes, solicitacoes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, birth_date, created_at", { count: "exact" }),
        supabase.from("ministries").select("id", { count: "exact", head: true }),
        supabase.from("mesas").select("id", { count: "exact", head: true }),
        supabase.from("worship_schedules").select("id", { count: "exact", head: true }).eq("status", "rascunho"),
        supabase.from("visitor_checkins").select("id", { count: "exact", head: true }).eq("status", "novo"),
        supabase.from("membership_requests").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ]);
      const perfis = (membros.data ?? []) as { id: string; full_name: string | null; birth_date: string | null; created_at: string }[];
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const novos = perfis.filter((m) => new Date(m.created_at) >= inicioMes).length;
      // Série dos últimos 6 meses (novos cadastros por mês) para o sparkline.
      const serie: { label: string; n: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const ini = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        const fim = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
        serie.push({
          label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
          n: perfis.filter((p) => {
            const t = new Date(p.created_at).getTime();
            return t >= ini && t < fim;
          }).length,
        });
      }
      return {
        ativos: membros.count ?? 0,
        novos,
        ministries: ministerios.count ?? 0,
        mesas: mesas.count ?? 0,
        pendentes: louvor.count ?? 0,
        v_pendentes: visitantes.count ?? 0,
        solicitacoes: solicitacoes.count ?? 0,
        aniversariantes: perfis,
        serie,
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

      <ResumoAdocao />

      <div className="grid gap-8 lg:grid-cols-2">
        <FilaDeAcoes
          solicitacoes={data?.solicitacoes ?? 0}
          visitantes={data?.v_pendentes ?? 0}
          escalas={data?.pendentes ?? 0}
        />
        <CrescimentoMembros serie={data?.serie ?? []} novos={data?.novos ?? 0} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <CardAniversariantes pessoas={data?.aniversariantes ?? []} />
        <AvisosRecentes />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <UltimaPregacao />
        <ProximosEventos />
      </div>
    </div>
  );
}

/** Fila de pendências do admin, acionável. */
function FilaDeAcoes({ solicitacoes, visitantes, escalas }: { solicitacoes: number; visitantes: number; escalas: number }) {
  const itens = [
    { n: solicitacoes, label: "Solicitações de membresia", hint: "aguardando aprovação", to: "/membros", icon: UserPlus },
    { n: visitantes, label: "Visitantes novos", hint: "para acolher", to: "/visitantes", icon: Users },
    { n: escalas, label: "Escalas em rascunho", hint: "para publicar", to: "/louvor", icon: CalendarDays },
  ].filter((i) => i.n > 0);

  return (
    <PanelSection label="Ação" title="Precisa de você">
      {itens.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Tudo em dia. Nenhuma pendência no momento.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {itens.map((i) => (
            <li key={i.label}>
              <Link to={i.to} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <i.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="tabular-nums">{i.n}</span> {i.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{i.hint}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}

/** Crescimento de membros nos últimos 6 meses, com sparkline. */
function CrescimentoMembros({ serie, novos }: { serie: { label: string; n: number }[]; novos: number }) {
  const max = Math.max(1, ...serie.map((s) => s.n));
  const w = 240;
  const h = 48;
  const step = serie.length > 1 ? w / (serie.length - 1) : w;
  const pontos = serie.map((s, i) => {
    const x = i * step;
    const y = h - (s.n / max) * (h - 6) - 3;
    return { x, y, ...s };
  });
  const linha = pontos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${linha} ${w},${h}`;

  return (
    <PanelSection label="Visão" title="Crescimento de membros">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-serif text-3xl leading-none tabular-nums">{novos}</div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-primary" /> novo(s) neste mês
          </div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-40 overflow-visible" preserveAspectRatio="none" aria-hidden>
          <polygon points={area} className="fill-primary/10" />
          <polyline points={linha} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {pontos.length > 0 && (
            <circle cx={pontos[pontos.length - 1].x} cy={pontos[pontos.length - 1].y} r="3" className="fill-primary" />
          )}
        </svg>
      </div>
      <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
        {serie.map((s, i) => (
          <span key={i}>{s.label}</span>
        ))}
      </div>
    </PanelSection>
  );
}

/* ---------------------------------------------------------------- liderança */

function DashboardLideranca() {
  const { user, roles, isPastoral, isAdmin } = useAuth();
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
                  <Link to="/mesas" className="ml-auto text-xs font-mono uppercase tracking-widest text-primary hover:underline">
                    Abrir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PanelSection>
        <CuidadoPastoral userId={user?.id} isAdmin={isAdmin} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <SeusCompromissos userId={user?.id} />
        <AvisosRecentes />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <UltimaPregacao />
        <ProximosEventos />
      </div>
    </div>
  );
}

/** Painel de cuidado: pedidos de oração em aberto + visitantes atribuídos. */
function CuidadoPastoral({ userId, isAdmin }: { userId?: string; isAdmin: boolean }) {
  const { data } = useQuery({
    queryKey: ["dashboard-cuidado", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [oracoes, atribuidos] = await Promise.all([
        supabase
          .from("prayer_requests")
          .select("id, content, created_at")
          .neq("status", "respondido")
          .order("created_at", { ascending: false })
          .limit(3),
        // Colunas de roteamento (assigned_to/city/neighborhood) ainda fora dos
        // tipos gerados: cast local.
        (supabase.from("membership_requests" as any) as any)
          .select("id, full_name, city, neighborhood")
          .eq("assigned_to", userId!)
          .eq("status", "pendente")
          .limit(5),
      ]);
      return {
        oracoes: (oracoes.data ?? []) as { id: string; content: string | null; created_at: string }[],
        atribuidos: (atribuidos.data ?? []) as { id: string; full_name: string | null; city: string | null; neighborhood: string | null }[],
      };
    },
  });

  const oracoes = data?.oracoes ?? [];
  const atribuidos = data?.atribuidos ?? [];
  const vazio = oracoes.length === 0 && atribuidos.length === 0;

  return (
    <PanelSection
      label="Cuidado"
      title="Para acompanhar"
      action={
        <Link to="/cuidado" className="text-xs font-mono uppercase tracking-widest text-primary hover:underline">
          Abrir cuidado
        </Link>
      }
    >
      {vazio ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HeartHandshake className="h-4 w-4 text-primary" /> Nada pendente de acompanhamento agora.
        </div>
      ) : (
        <div className="space-y-4">
          {atribuidos.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Pessoas para acolher
              </p>
              <ul className="divide-y divide-border">
                {atribuidos.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2 first:pt-0">
                    <UserPlus className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate font-medium">{a.full_name ?? "Visitante"}</span>
                    {(a.neighborhood || a.city) && (
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {[a.neighborhood, a.city].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {oracoes.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Pedidos de oração
              </p>
              <ul className="space-y-2">
                {oracoes.map((o) => (
                  <li key={o.id} className="flex items-start gap-2 text-sm">
                    <HeartHandshake className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="line-clamp-2 text-muted-foreground">{o.content ?? "Pedido de oração"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </PanelSection>
  );
}

/* ------------------------------------------------------------------- membro */

function DashboardMembro() {
  const { user } = useAuth();
  const { data: mesas, isLoading } = useMinhasMesas(user?.id);
  const minhasMesas = (mesas ?? []).filter((m) => m.mesa);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
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
        <SeusCompromissos userId={user?.id} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <AvisosRecentes />
        <UltimaPregacao />
      </div>

      <ProximosEventos />

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

/* --------------------------------------------------------------------- page */

function DashboardPage() {
  const { isAdmin, isLeadership, isPastoral, profile, user } = useAuth();
  const { data: meuPerfil } = useMeuPerfil(user?.id);
  const primeiroNome =
    (profile?.full_name ?? "").trim().split(/\s+/)[0] || (user?.email ?? "").split("@")[0] || "";
  const papel = isAdmin ? "Administração" : isPastoral ? "Pastoral" : isLeadership ? "Liderança" : "Membro";
  const saudacao = saudacaoPorHorario();

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        eyebrow={`${papel} · ${dataHojeExtenso()}`}
        title={primeiroNome ? `${saudacao}, ${primeiroNome}` : "Painel Principal"}
        description="O que está acontecendo na Igreja Batista Atos."
      />
      <PageBody>
        <div className="space-y-5">
          <BannerInstalarApp />
          <CompleteSeuCadastro perfil={meuPerfil} />
          <VersiculoDoDia />
          <div className="pt-1">
            <AtivarPush compact />
          </div>
        </div>
        <div className="mt-8">
          {isAdmin ? <DashboardAdmin /> : isLeadership ? <DashboardLideranca /> : <DashboardMembro />}
        </div>
      </PageBody>
    </div>
  );
}
