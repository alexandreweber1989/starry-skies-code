import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MapPin, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  LOUVOR_MINISTRY_ID,
  SCHEDULE_STATUS,
  SCHEDULE_TYPE_LABELS,
  formatDate,
  formatTime,
} from "@/lib/louvor";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleDialog } from "./schedule-dialog";
import { ScheduleDetail } from "./schedule-detail";
import { QueryError } from "./visao-geral";

export function Escalas() {
  const { isMinistryAdmin } = useAuth();
  const canManage = isMinistryAdmin(LOUVOR_MINISTRY_ID);
  const [openId, setOpenId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["worship-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_schedules")
        .select("*, team:worship_teams(name), assignments:worship_schedule_assignments(id, status)")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "rascunho" | "publicada" | "concluida" }) => {
      const { error } = await supabase.from("worship_schedules").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Situação atualizada.");
      qc.invalidateQueries({ queryKey: ["worship-schedules"] });
      qc.invalidateQueries({ queryKey: ["my-worship-assignments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("worship_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Escala removida.");
      qc.invalidateQueries({ queryKey: ["worship-schedules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <QueryError error={error as Error} />;

  if (isLoading) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-sm" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {canManage && <ScheduleDialog />}
      {data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma escala cadastrada.</p>}
      {data?.map((s: any) => {
        const confirmed = (s.assignments ?? []).filter((a: any) => a.status === "confirmado").length;
        const total = (s.assignments ?? []).length;
        const open = openId === s.id;
        return (
          <div key={s.id} className="border border-border bg-card rounded-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {SCHEDULE_TYPE_LABELS[s.schedule_type]} · {formatDate(s.event_date)} · {s.team?.name ?? "Sem equipe"}
                </div>
                <h3 className="font-serif text-3xl leading-none mt-1">{s.title}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatTime(s.start_time)}</span>
                  {s.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {s.location}</span>}
                  <span>{confirmed}/{total} confirmados</span>
                </div>
                {s.notes && <p className="text-sm text-muted-foreground mt-2">{s.notes}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-1 rounded-sm font-mono text-[10px] uppercase tracking-widest ${SCHEDULE_STATUS[s.status].className}`}>
                  {SCHEDULE_STATUS[s.status].label}
                </span>
                {canManage && s.status === "rascunho" && (
                  <Button size="sm" onClick={() => setStatus.mutate({ id: s.id, status: "publicada" })}>Publicar</Button>
                )}
                {canManage && s.status === "publicada" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: s.id, status: "concluida" })}>
                    Concluir
                  </Button>
                )}
                {canManage && (
                  <Button variant="ghost" size="icon" aria-label="Remover escala" onClick={() => remove.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setOpenId(open ? null : s.id)}>
                  {open ? "Fechar" : "Detalhes"} <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>
            {open && <ScheduleDetail scheduleId={s.id} canManage={canManage} />}
          </div>
        );
      })}
    </div>
  );
}