import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ASSIGNMENT_STATUS, WORSHIP_FUNCTIONS } from "@/lib/louvor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ScheduleDetail({ scheduleId, canManage }: { scheduleId: string; canManage: boolean }) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [fn, setFn] = useState<string>(WORSHIP_FUNCTIONS[1]);
  const [songId, setSongId] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["worship-schedules"] });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: songs } = useQuery({
    queryKey: ["worship-songs-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_songs")
        .select("id, title, song_key")
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: detail } = useQuery({
    queryKey: ["worship-schedules", scheduleId, "detail"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_schedules")
        .select(
          "id, assignments:worship_schedule_assignments(id, function_name, status, response_note, user_id, profiles:profiles!inner(full_name)), setlist:worship_setlist_items(id, position, song_key, notes, song:worship_songs!inner(id, title, artist))",
        )
        .eq("id", scheduleId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const addAssignment = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Selecione a pessoa.");
      const { error } = await supabase
        .from("worship_schedule_assignments")
        .insert({ schedule_id: scheduleId, user_id: userId, function_name: fn });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pessoa escalada."); setUserId(""); invalidate(); qc.invalidateQueries({ queryKey: ["worship-schedules", scheduleId, "detail"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("worship_schedule_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worship-schedules", scheduleId, "detail"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addSong = useMutation({
    mutationFn: async () => {
      if (!songId) throw new Error("Selecione a música.");
      const song = songs?.find((s) => s.id === songId);
      const position = (detail?.setlist?.length ?? 0) + 1;
      const { error } = await supabase
        .from("worship_setlist_items")
        .insert({ schedule_id: scheduleId, song_id: songId, position, song_key: song?.song_key ?? null });
      if (error) throw error;
    },
    onSuccess: () => { setSongId(""); qc.invalidateQueries({ queryKey: ["worship-schedules", scheduleId, "detail"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSong = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("worship_setlist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worship-schedules", scheduleId, "detail"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setlist = [...(detail?.setlist ?? [])].sort((a: any, b: any) => a.position - b.position);

  return (
    <div className="grid md:grid-cols-2 gap-8 border-t border-border pt-6 mt-6">
      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Escalados</div>
        <ul className="divide-y divide-border">
          {(detail?.assignments ?? []).map((a: any) => (
            <li key={a.id} className="py-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm">{a.profiles?.full_name}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {a.function_name}
                </div>
                {a.response_note && <div className="text-xs text-muted-foreground mt-0.5">“{a.response_note}”</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-widest ${ASSIGNMENT_STATUS[a.status].className}`}>
                  {ASSIGNMENT_STATUS[a.status].label}
                </span>
                {canManage && (
                  <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => removeAssignment.mutate(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
          {(detail?.assignments ?? []).length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">Ninguém escalado ainda.</li>
          )}
        </ul>
        {canManage && (
          <div className="space-y-2 pt-2">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Escalar pessoa</Label>
            <div className="flex flex-wrap gap-2">
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="flex-1 min-w-40"><SelectValue placeholder="Pessoa" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {profiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fn} onValueChange={setFn}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {WORSHIP_FUNCTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="icon" aria-label="Escalar" onClick={() => addAssignment.mutate()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Repertório do dia</div>
        <ol className="divide-y divide-border">
          {setlist.map((item: any, index: number) => (
            <li key={item.id} className="py-2 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-2xl text-muted-foreground">{index + 1}</span>
                <div>
                  <div className="text-sm">{item.song?.title}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {[item.song?.artist, item.song_key && `Tom ${item.song_key}`].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              {canManage && (
                <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => removeSong.mutate(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
          {setlist.length === 0 && <li className="py-2 text-sm text-muted-foreground">Repertório ainda não definido.</li>}
        </ol>
        {canManage && (
          <div className="space-y-2 pt-2">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Adicionar música</Label>
            <div className="flex gap-2">
              <Select value={songId} onValueChange={setSongId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Música do repertório" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {songs?.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="icon" aria-label="Adicionar música" onClick={() => addSong.mutate()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}