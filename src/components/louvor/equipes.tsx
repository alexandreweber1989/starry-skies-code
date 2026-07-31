import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LOUVOR_MINISTRY_ID, WORSHIP_FUNCTIONS } from "@/lib/louvor";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueryError } from "./visao-geral";

function useProfiles() {
  return useQuery({
    queryKey: ["profiles-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

function TeamDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ministerId, setMinisterId] = useState("");
  const { data: profiles } = useProfiles();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Informe o nome da equipe.");
      const { error } = await supabase.from("worship_teams").insert({
        name: name.trim(),
        description: description || null,
        minister_id: ministerId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipe criada.");
      setOpen(false);
      setName("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["worship-teams"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Nova equipe</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Nova equipe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input placeholder="Equipe Manhã" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ministro(a) responsável</Label>
            <Select value={ministerId} onValueChange={setMinisterId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {profiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button className="w-full" disabled={create.isPending} onClick={() => create.mutate()}>
            Criar equipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [fn, setFn] = useState<string>(WORSHIP_FUNCTIONS[1]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const { data: profiles } = useProfiles();
  const qc = useQueryClient();

  const toggleInstrument = (value: string) =>
    setInstruments((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );

  const add = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Selecione a pessoa.");
      const { error } = await supabase
        .from("worship_team_members")
        .insert({ team_id: teamId, user_id: userId, function_name: fn, instruments });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Integrante adicionado.");
      setOpen(false);
      setUserId("");
      setInstruments([]);
      qc.invalidateQueries({ queryKey: ["worship-teams"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><UserPlus className="h-4 w-4" /> Integrante</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Adicionar integrante</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pessoa</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {profiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Função principal</Label>
            <Select value={fn} onValueChange={setFn}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {WORSHIP_FUNCTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Instrumentos e habilidades</Label>
            <p className="text-xs text-muted-foreground">
              Marque tudo o que a pessoa consegue cobrir nas escalas.
            </p>
            <div className="flex flex-wrap gap-2">
              {WORSHIP_FUNCTIONS.map((f) => {
                const active = instruments.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleInstrument(f)}
                    className={`px-3 py-1.5 rounded-sm border text-xs transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
          <Button className="w-full" disabled={add.isPending} onClick={() => add.mutate()}>Adicionar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function Equipes() {
  const { isMinistryAdmin } = useAuth();
  const canManage = isMinistryAdmin(LOUVOR_MINISTRY_ID);
  const qc = useQueryClient();

  const { data: teams, error } = useQuery({
    queryKey: ["worship-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_teams")
        .select("*, members:worship_team_members(id, function_name, is_titular, instruments, user_id, profiles:profiles!inner(full_name))")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("worship_team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worship-teams"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {canManage && <TeamDialog />}
      {error && <QueryError error={error as Error} />}
      <div className="grid lg:grid-cols-2 gap-4">
        {teams?.map((team: any) => (
          <div key={team.id} className="border border-border bg-card rounded-sm p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {(team.members ?? []).length} integrantes
                </div>
                <h3 className="font-serif text-3xl leading-none mt-1">{team.name}</h3>
                {team.description && <p className="text-sm text-muted-foreground mt-2">{team.description}</p>}
              </div>
              {canManage && <AddMemberDialog teamId={team.id} />}
            </div>
            <ul className="mt-5 divide-y divide-border">
              {(team.members ?? []).map((m: any) => (
                <li key={m.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm">{m.profiles?.full_name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {m.function_name}
                    </div>
                    {(m.instruments ?? []).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(m.instruments as string[]).map((i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground"
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => removeMember.mutate(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
              {(team.members ?? []).length === 0 && (
                <li className="py-3 text-sm text-muted-foreground">Nenhum integrante ainda.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
      {teams?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma equipe cadastrada.</p>}
    </div>
  );
}