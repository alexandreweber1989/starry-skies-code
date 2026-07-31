import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfileOptions } from "@/lib/use-profiles";
import { ChurchSelect } from "./church-select";

import {
  CHURCH_FUNCTIONS,
  CHURCH_FUNCTION_LABEL,
  churchFunctionRank,
  type ChurchFunction,
} from "@/lib/igreja";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

/** Criação de uma nova mesa vinculada a uma rede e a uma igreja (admin geral). */
export function MesaDialog({ redeId, compact }: { redeId?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rede, setRede] = useState(redeId ?? "");
  const [churchId, setChurchId] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const qc = useQueryClient();

  const { data: redes } = useQuery({
    queryKey: ["redes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("redes").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 3) throw new Error("Informe o nome da mesa.");
      if (!churchId) throw new Error("Selecione a igreja desta mesa.");
      const { error } = await supabase.from("mesas").insert({
        name: name.trim(),
        rede_id: rede || redeId || null,
        church_id: churchId,
        meeting_day: day || null,
        meeting_time: time || null,
        meeting_location: location.trim() || null,
        description: description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mesa criada.");
      setOpen(false);
      setName("");
      setDay("");
      setTime("");
      setLocation("");
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["mesas-full"] });
      void qc.invalidateQueries({ queryKey: ["mesas-by-rede"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> Nova mesa nesta rede</Button>
        ) : (
          <Button><Plus className="h-4 w-4" /> Nova mesa</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Nova mesa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mesa Betel" />
          </div>
          <ChurchSelect value={churchId} onChange={setChurchId} />
          <div className="space-y-2">
            <Label>Rede</Label>
            <Select value={rede} onValueChange={setRede} disabled={Boolean(redeId)}>
              <SelectTrigger><SelectValue placeholder="Selecione a rede" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {redes?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dia</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Local</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Casa da família Silva" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button className="w-full" disabled={create.isPending} onClick={() => create.mutate()}>
            Criar mesa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Gerencia os integrantes de uma mesa: membros, líderes, apascentadores e pastores. */
export function MesaMembersDialog({ mesaId, mesaName }: { mesaId: string; mesaName: string }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<ChurchFunction>("membro");
  const { data: profiles } = useProfileOptions();
  const qc = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ["mesa-members", mesaId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesa_members")
        .select("id, user_id, role, profiles:profiles!inner(full_name)")
        .eq("mesa_id", mesaId);
      if (error) throw error;
      const rows = data as unknown as {
        id: string;
        user_id: string;
        role: string;
        profiles: { full_name: string };
      }[];
      return rows.sort(
        (a, b) =>
          churchFunctionRank(a.role) - churchFunctionRank(b.role) ||
          a.profiles.full_name.localeCompare(b.profiles.full_name),
      );
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Selecione a pessoa.");
      const { error } = await supabase
        .from("mesa_members")
        .insert({ mesa_id: mesaId, user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Integrante adicionado à mesa.");
      setUserId("");
      void qc.invalidateQueries({ queryKey: ["mesa-members", mesaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: ChurchFunction }) => {
      const { error } = await supabase.from("mesa_members").update({ role: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["mesa-members", mesaId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mesa_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["mesa-members", mesaId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><UserPlus className="h-4 w-4" /> Integrantes</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">{mesaName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Adicionar pessoa</Label>
            <div className="grid sm:grid-cols-[1fr_auto] gap-2">
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {profiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={role} onValueChange={(v) => setRole(v as ChurchFunction)}>
                <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHURCH_FUNCTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={add.isPending} onClick={() => add.mutate()}>
              Adicionar
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {members?.map((m) => (
              <li key={m.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{m.profiles?.full_name}</span>
                <div className="flex items-center gap-2">
                  <Select
                    value={m.role}
                    onValueChange={(v) => changeRole.mutate({ id: m.id, value: v as ChurchFunction })}
                  >
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue>{CHURCH_FUNCTION_LABEL[m.role]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CHURCH_FUNCTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => remove.mutate(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {members?.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">Nenhum integrante ainda.</li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

