import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Baby, CalendarDays, QrCode, ShieldCheck, Users } from "lucide-react";
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

/**
 * Painel do Ministério Infantil.
 *
 * Segurança: a leitura de crianças/sessões é controlada por RLS no banco —
 * este componente apenas reflete o que o usuário tem permissão de ver.
 * Ações de operação (criar sessão, cadastrar criança, aprovar visitante)
 * ficam visíveis somente para a equipe Kids/admin.
 */
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

  /** Sessão selecionada, com fallback para a mais recente disponível. */
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
    <div className="space-y-6">
      {/* Barra de operação: sessão do dia + acesso ao QR Code dos visitantes */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-border bg-card rounded-sm p-4 sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Culto / sessão
          </span>
          {loadingSessions ? (
            <span className="text-sm text-muted-foreground">Carregando sessões…</span>
          ) : (sessions ?? []).length === 0 ? (
            <span className="text-sm text-muted-foreground">
              Nenhuma sessão criada ainda.
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <Select
                value={activeSession?.id ?? ""}
                onValueChange={(v) => setSessionId(v)}
              >
                <SelectTrigger className="w-full sm:w-80" aria-label="Selecionar sessão">
                  <SelectValue placeholder="Selecione a sessão" />
                </SelectTrigger>
                <SelectContent>
                  {(sessions ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {new Date(`${s.session_date}T00:00:00`).toLocaleDateString("pt-BR")} · {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isKidsAdmin && activeSession && <EditSessionButton session={activeSession} />}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/kids/visitante" search={{ kiosk: true }}>
              <QrCode className="mr-1.5 h-4 w-4" /> Tela do QR Code
            </Link>
          </Button>
          {isKidsAdmin && <SessionDialog />}
        </div>
      </div>

      <Tabs defaultValue="checkin">
        <TabsList>
          <TabsTrigger value="checkin">
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Check-in
          </TabsTrigger>
          <TabsTrigger value="visitantes">
            <Users className="mr-1.5 h-4 w-4" /> Visitantes
          </TabsTrigger>
          <TabsTrigger value="criancas">
            <Baby className="mr-1.5 h-4 w-4" /> Crianças
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="mt-6">
          {activeSession ? (
            <CheckinBoard session={activeSession} children={children ?? []} />
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-5 w-5 text-primary" />}
              title="Nenhuma sessão ativa"
              description="Crie um culto/sessão para começar a registrar as entradas das crianças."
            />
          )}
        </TabsContent>

        <TabsContent value="visitantes" className="mt-6">
          <VisitorQueue session={activeSession} churchId={activeSession?.church_id ?? null} />
        </TabsContent>

        <TabsContent value="criancas" className="mt-6 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar criança por nome ou apelido"
              className="sm:max-w-sm"
              aria-label="Buscar crianças"
            />
            <Select value={classroom} onValueChange={setClassroom}>
              <SelectTrigger className="sm:w-56" aria-label="Filtrar por turma">
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {KIDS_CLASSROOMS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="self-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {filteredChildren.length} {filteredChildren.length === 1 ? "criança" : "crianças"}
            </span>
            {isKidsAdmin && (
              <div className="sm:ml-auto">
                <ChildDialog />
              </div>
            )}
          </div>

          {loadingChildren ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-sm border border-border bg-muted/40" />
              ))}
            </div>
          ) : filteredChildren.length === 0 ? (
            <EmptyState
              icon={<Baby className="h-5 w-5 text-primary" />}
              title="Nenhuma criança encontrada"
              description="Cadastre uma criança ou ajuste os filtros de busca."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredChildren.map((child) => {
                const age = ageInYears(child.birth_date);
                return (
                  <article
                    key={child.id}
                    className="flex flex-col rounded-sm border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-lg leading-tight">
                        {childDisplayName(child)}
                      </h3>
                      <Badge variant="secondary">
                        {KIDS_CLASSROOM_LABEL[child.classroom] ?? "A definir"}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {age === null ? "Idade não informada" : `${age} anos`}
                    </p>
                    {child.allergies && (
                      <p className="mt-2 text-sm text-destructive">
                        Alergias: {child.allergies}
                      </p>
                    )}
                    {child.special_needs && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Cuidados: {child.special_needs}
                      </p>
                    )}
                    {isKidsAdmin && (
                      <div className="mt-4 flex items-center gap-2">
                        <EditChildButton child={child} />
                      </div>
                    )}
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
    <div className="flex flex-col items-center gap-2 rounded-sm border border-dashed border-border bg-card px-6 py-14 text-center">
      {icon}
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
