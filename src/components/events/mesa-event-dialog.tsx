import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMesaAddresses } from "@/lib/use-mesa-addresses";
import { format, addDays, nextDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mesa: {
    id: string;
    name: string;
    meeting_day: string | null;
    meeting_time: string | null;
  };
}

const dayMap: Record<string, number> = {
  "Domingo": 0,
  "Segunda": 1,
  "Terça": 2,
  "Quarta": 3,
  "Quinta": 4,
  "Sexta": 5,
  "Sábado": 6,
};

export function MesaEventDialog({ open, onOpenChange, mesa }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: addresses } = useMesaAddresses(mesa.id);
  
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(mesa.meeting_time || "20:00");

  useEffect(() => {
    if (open) {
      // Tenta achar a próxima data baseada no dia da semana da mesa
      if (mesa.meeting_day && dayMap[mesa.meeting_day] !== undefined) {
        const today = new Date();
        const next = nextDay(today, dayMap[mesa.meeting_day] as any);
        setDate(format(next, "yyyy-MM-dd"));
      } else {
        setDate(format(new Date(), "yyyy-MM-dd"));
      }

      if (addresses && addresses.length > 0) {
        setSelectedAddressId(addresses[0].id);
      }
    }
  }, [open, mesa, addresses]);

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!selectedAddressId) throw new Error("Selecione o local da reunião.");
      if (!date) throw new Error("Selecione a data.");

      const addr = addresses?.find(a => a.id === selectedAddressId);
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      // Assume 2 horas de duração
      const endsAt = new Date(new Date(`${date}T${time}:00`).getTime() + 2 * 60 * 60 * 1000).toISOString();

      const payload = {
        title: `Reunião - ${mesa.name}`,
        description: `Encontro semanal da mesa ${mesa.name}.`,
        kind: "reuniao",
        scope: "mesa",
        mesa_id: mesa.id,
        starts_at: startsAt,
        ends_at: endsAt,
        location: addr?.full_address || "A definir",
        mesa_address_id: selectedAddressId,
        status: "publicado",
        created_by: user?.id,
        requires_rsvp: true,
        reminder_settings: {
          enabled: true,
          lead_time: 1440, // 1 dia antes
          type: "push"
        }
      };

      const { error } = await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento da Mesa agendado com sucesso!");
      qc.invalidateQueries({ queryKey: ["agenda-events"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Agendar Reunião da Mesa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Onde será o encontro?</Label>
            <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um endereço" />
              </SelectTrigger>
              <SelectContent>
                {addresses?.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label} ({a.street}, {a.number})
                  </SelectItem>
                ))}
                {(!addresses || addresses.length === 0) && (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    Nenhum endereço cadastrado para esta mesa.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/30 p-2 rounded-sm">
            Um lembrete (Push) será enviado automaticamente para os membros 24 horas antes do evento.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => createEvent.mutate()} disabled={createEvent.isPending || !selectedAddressId}>
            Confirmar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
