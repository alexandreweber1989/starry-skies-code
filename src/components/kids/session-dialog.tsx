import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Pencil, CalendarDays, Clock, MapPin, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChurchSelect } from "@/components/admin/church-select";
import type { KidsSession } from "@/lib/kids";
import { cn } from "@/lib/utils";

function nextSundayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.toISOString().slice(0, 10);
}

export function SessionDialog({
  session,
  trigger,
}: {
  session?: KidsSession;
  trigger?: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [room, setRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [churchId, setChurchId] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(session?.title ?? "Culto de domingo — Kids");
    setDate(session?.session_date ?? nextSundayISO());
    setStartTime(session?.start_time?.slice(0, 5) ?? "18:00");
    setRoom(session?.room ?? "");
    setNotes(session?.notes ?? "");
    setChurchId(session?.church_id ?? "");
  }, [open, session]);

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Informe o nome da sessão.");
      if (!date) throw new Error("Informe a data.");
      const payload = {
        title: title.trim(),
        session_date: date,
        start_time: startTime || null,
        room: room.trim() || null,
        notes: notes.trim() || null,
        church_id: churchId || null,
      };
      const query = session
        ? supabase.from("kids_sessions").update(payload).eq("id", session.id)
        : supabase.from("kids_sessions").insert(payload);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["kids-sessions"] });
      toast.success(session ? "Sessão atualizada com sucesso." : "Sessão criada com sucesso.");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="h-12 rounded-xl px-6 shadow-xl shadow-primary/10 hover:-translate-y-1 transition-all">
            <CalendarPlus className="mr-2 h-4.5 w-4.5" /> Nova Sessão
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[2.5rem] border-border/50 shadow-2xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-serif">
            {session ? "Ajustar Sessão" : "Configurar Nova Sessão"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed mt-2">
            As sessões organizam os check-ins por evento. Defina os detalhes do culto para iniciar as atividades do Kids.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Identificação do Evento</Label>
            <div className="relative group">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="h-12 pl-12 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
                placeholder="Ex: Culto da Noite"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Data</Label>
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/50" />
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="h-12 pl-12 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Horário de Início</Label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/50" />
                <Input 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  className="h-12 pl-12 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Local / Sala</Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/50" />
              <Input 
                value={room} 
                onChange={(e) => setRoom(e.target.value)} 
                placeholder="Ex.: Sala Principal Kids" 
                className="h-12 pl-12 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Igreja Responsável</Label>
            <ChurchSelect value={churchId} onChange={setChurchId} />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Notas Adicionais</Label>
            <Textarea 
              rows={3} 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Informações para a equipe de recepção..."
              className="rounded-2xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium resize-none p-4"
            />
          </div>
        </div>

        <DialogFooter className="mt-10 sm:justify-between gap-4">
          <Button variant="ghost" onClick={() => setOpen(false)} className="h-12 px-6 rounded-xl hover:bg-destructive/5 hover:text-destructive transition-colors">
            Cancelar
          </Button>
          <Button 
            onClick={() => save.mutate()} 
            disabled={save.isPending}
            className="h-14 px-10 rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all group"
          >
            {save.isPending ? "Salvando..." : (session ? "Atualizar Sessão" : "Criar Sessão")}
            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditSessionButton({ session }: { session: KidsSession }) {
  return (
    <SessionDialog
      session={session}
      trigger={
        <Button variant="ghost" className="h-12 px-4 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
          <Pencil className="mr-2 h-3.5 w-3.5" /> 
          <span className="text-xs font-medium uppercase tracking-wider">Ajustar Detalhes</span>
        </Button>
      }
    />
  );
}
