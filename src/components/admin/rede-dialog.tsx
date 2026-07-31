import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/use-profiles";
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
  const [audience, setAudience] = useState("");
  const [description, setDescription] = useState("");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 3) throw new Error("Informe o nome da rede.");
      const { error } = await supabase.from("redes").insert({
        name: name.trim(),
        slug: slugify(name),
        target_audience: audience.trim() || null,
        description: description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rede criada.");
      setOpen(false);
      setName("");
      setAudience("");
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["redes"] });
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
          <div className="space-y-2">
            <Label>Público-alvo</Label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="18 a 29 anos" />
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
