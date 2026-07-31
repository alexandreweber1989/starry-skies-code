import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify, useProfileOptions } from "@/lib/use-profiles";
import { ChurchSelect } from "./church-select";
import { MemberPicker } from "./member-picker";

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

/** Criação de uma nova rede (somente admin geral, garantido também por RLS). */
export function RedeDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [churchId, setChurchId] = useState("");
  const [audience, setAudience] = useState("");
  const [description, setDescription] = useState("");
  const [leaders, setLeaders] = useState<string[]>([]);
  const { data: profiles } = useProfileOptions();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 3) throw new Error("Informe o nome da rede.");
      if (!churchId) throw new Error("Selecione a igreja desta rede.");
      const { data, error } = await supabase
        .from("redes")
        .insert({
          name: name.trim(),
          slug: slugify(name),
          church_id: churchId,
          target_audience: audience.trim() || null,
          description: description.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Responsáveis são opcionais: cada um entra com a função que já tem na igreja.
      if (leaders.length > 0 && data?.id) {
        const rows = leaders.map((userId) => {
          const fn = profiles?.find((p) => p.id === userId)?.church_function;
          const role = fn && fn !== "membro" ? fn : "lider";
          return { rede_id: data.id, user_id: userId, role: role as never };
        });
        const { error: linkError } = await supabase.from("rede_members").insert(rows);
        if (linkError) throw linkError;
      }
    },

    onSuccess: () => {
      toast.success("Rede criada.");
      setOpen(false);
      setName("");
      setAudience("");
      setDescription("");
      setLeaders([]);
      void qc.invalidateQueries({ queryKey: ["redes"] });
      void qc.invalidateQueries({ queryKey: ["redes-full"] });
      void qc.invalidateQueries({ queryKey: ["rede-members-count"] });

    },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Nova rede</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Nova rede</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rede Jovens" />
          </div>
          <ChurchSelect value={churchId} onChange={setChurchId} />

          <div className="space-y-2">
            <Label>Público-alvo</Label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="18 a 29 anos" />
          </div>
          <div className="space-y-2">
            <Label>
              Responsáveis pela rede{" "}
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                opcional
              </span>
            </Label>
            <MemberPicker value={leaders} onChange={setLeaders} />
            <p className="text-xs text-muted-foreground">
              Pastores, apascentadores ou líderes já cadastrados em Membros.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <Button className="w-full" disabled={create.isPending} onClick={() => create.mutate()}>
            Criar rede
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
