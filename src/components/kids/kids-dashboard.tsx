import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Baby, CalendarDays, QrCode, ShieldCheck, Users, Search, Filter, Plus, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { CheckinBoard } from "@/components/kids/checkin-board";
import { VisitorQueue } from "@/components/kids/visitor-queue";
import { SessionDialog, EditSessionButton } from "@/components/kids/session-dialog";
import { ChildDialog, EditChildButton } from "@/components/kids/child-dialog";
import {
  KIDS_CLASSROOMS,
  KIDS_CLASSROOM_LABEL,
  ageInYears,
  childDisplayName,
  type KidsChild,
  type KidsSession,
} from "@/lib/kids";
import { cn } from "@/lib/utils";
import { KidsPhoto } from "@/components/kids/kids-photo";

export function KidsCheckinDashboard() {
  const { isKidsAdmin } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classroom, setClassroom] = useState("all");

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["kids-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_sessions")
        .select("*")
        .order("session_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as KidsSession[];
    },
  });

  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["kids-children"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_children")
        .select("*")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as KidsChild[];
    },
  });

  const activeSession = useMemo<KidsSession | null>(() => {
    const list = sessions ?? [];
    if (list.length === 0) return null;
    return list.find((s) => s.id === sessionId) ?? list[0] ?? null;
  }, [sessions, sessionId]);

  const filteredChildren = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (children ?? []).filter((c) => {
      if (classroom !== "all" && c.classroom !== classroom) return false;
      if (!q) return true;
      return [c.full_name, c.nickname, KIDS_CLASSROOM_LABEL[c.classroom]]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [children, search, classroom]);

  return (
    <div className="space-y-8 animate-reveal">
      {/* Session Controls Section */}
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl shadow-black/5">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-mono uppercase tracking-[0.2em] text-primary border border-primary/20">
              Sessão Ativa
            </span>
            {loadingSessions ? (
              <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
            ) : (sessions ?? []).length === 0 ? (
              <h2 className="text-xl font-serif text-muted-foreground italic">Nenhuma sessão encontrada</h2>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={activeSession?.id ?? ""}
                  onValueChange={(v) => setSessionId(v)}
                >
                  <SelectTrigger className="w-full sm:w-[320px] h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 transition-all text-lg font-serif">
                    <SelectValue placeholder="Selecione a sessão" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                    {(sessions ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id} className="rounded-lg py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{s.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(`${s.session_date}T00:00:00`).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isKidsAdmin && activeSession && <EditSessionButton session={activeSession} />}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-6 bg-background/50 border-border/50 hover:bg-accent group transition-all duration-300">
              <Link to="/kids/visitante" search={{ kiosk: true }}>
                <QrCode className="mr-2 h-4.5 w-4.5 group-hover:scale-110 transition-transform" /> 
                <span className="font-medium">Modo Kiosk QR</span>
              </Link>
            </Button>
            {isKidsAdmin && <SessionDialog />}
          </div>
        </div>
      </div>

      <Tabs defaultValue="checkin" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <TabsList className="h-14 p-1.5 bg-muted/30 backdrop-blur-sm border border-border/50 rounded-2xl w-full md:w-auto">
            <TabsTrigger value="checkin" className="flex-1 md:flex-none px-8 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-black/5 transition-all">
              <ShieldCheck className="mr-2 h-4 w-4" /> Check-in
            </TabsTrigger>
            <TabsTrigger value="visitantes" className="flex-1 md:flex-none px-8 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-black/5 transition-all">
              <Users className="mr-2 h-4 w-4" /> Visitantes
            </TabsTrigger>
            <TabsTrigger value="criancas" className="flex-1 md:flex-none px-8 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-black/5 transition-all">
              <Baby className="mr-2 h-4 w-4" /> Crianças
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
             {/* Dynamic context actions could go here */}
          </div>
        </div>

        <TabsContent value="checkin" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeSession ? (
            <CheckinBoard session={activeSession} children={children ?? []} />
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-12 w-12 text-muted-foreground/30" />}
              title="Aguardando Sessão"
              description="Para gerenciar o check-in das crianças, você precisa selecionar ou criar uma sessão para o dia de hoje."
            />
          )}
        </TabsContent>

        <TabsContent value="visitantes" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card/30 backdrop-blur-sm rounded-3xl border border-border/50 p-6 md:p-8">
            <VisitorQueue session={activeSession} churchId={activeSession?.church_id ?? null} />
          </div>
        </TabsContent>

        <TabsContent value="criancas" className="mt-0 space-y-8 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Crianças Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-4 shadow-xl shadow-black/5">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome da criança ou apelido..."
                className="w-full h-12 pl-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/20 transition-all font-medium"
                aria-label="Buscar crianças"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={classroom} onValueChange={setClassroom}>
                  <SelectTrigger className="w-full sm:w-[220px] h-12 pl-11 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 transition-all font-medium" aria-label="Filtrar por turma">
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {KIDS_CLASSROOMS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isKidsAdmin && <ChildDialog />}
            </div>
          </div>

          {loadingChildren ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-3xl border border-border/50 bg-muted/30" />
              ))}
            </div>
          ) : filteredChildren.length === 0 ? (
            <EmptyState
              icon={<Baby className="h-12 w-12 text-muted-foreground/30" />}
              title="Nenhum resultado"
              description="Não encontramos crianças com os critérios selecionados. Tente ajustar o nome ou a turma."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredChildren.map((child) => {
                const age = ageInYears(child.birth_date);
                return (
                  <article
                    key={child.id}
                    className="group relative flex flex-col bg-card/60 backdrop-blur-sm border border-border/50 rounded-3xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 hover:border-primary/20 hover:-translate-y-1.5 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                       {isKidsAdmin && <EditChildButton child={child} />}
                    </div>

                    <div className="flex items-center gap-4 mb-5">
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg scale-0 group-hover:scale-110 transition-transform duration-500" />
                        <KidsPhoto
                          value={child.photo_url}
                          alt={child.full_name}
                          variant="crianca"
                          className="relative h-16 w-16 rounded-2xl object-cover shadow-lg border-2 border-background ring-1 ring-border/50"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif text-xl leading-tight truncate group-hover:text-primary transition-colors">
                          {childDisplayName(child)}
                        </h3>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70 mt-1">
                          {age === null ? "Idade n/d" : `${age} anos`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mt-auto">
                      <div className="flex flex-wrap gap-2">
                         <Badge variant="secondary" className="rounded-lg bg-secondary/50 text-secondary-foreground border-transparent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                           {KIDS_CLASSROOM_LABEL[child.classroom] ?? "N/D"}
                         </Badge>
                      </div>
                      
                      {(child.allergies || child.special_needs) && (
                        <div className="pt-3 border-t border-border/50 space-y-1.5">
                          {child.allergies && (
                            <div className="flex items-center gap-2 text-[11px] text-destructive font-medium bg-destructive/5 px-2 py-1 rounded-lg">
                               <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                               <span className="truncate">Alergia: {child.allergies}</span>
                            </div>
                          )}
                          {child.special_needs && (
                            <p className="text-[11px] text-muted-foreground truncate italic">
                               Ref: {child.special_needs}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-20 text-center animate-reveal">
      <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center shadow-xl shadow-black/5 ring-1 ring-border/50">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="font-serif text-2xl tracking-tight text-foreground">{title}</h3>
        <p className="max-w-xs mx-auto text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
