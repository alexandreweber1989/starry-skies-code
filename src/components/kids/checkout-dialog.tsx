import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, LogOut, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GUARDIAN_RELATION_LABEL, type KidsCheckin } from "@/lib/kids";

interface CheckoutDialogProps {
  checkin: KidsCheckin;
  childName: string;
}

/**
 * Retirada da criança. A confirmação exige o código de segurança da etiqueta
 * e o registro de quem levou — é a proteção principal do módulo.
 */
export function CheckoutDialog({ checkin, childName }: CheckoutDialogProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [pickedBy, setPickedBy] = useState("");

  const { data: guardians } = useQuery({
    queryKey: ["kids-guardians", checkin.child_id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_guardians")
        .select("id, full_name, phone, relation, can_pickup, is_primary")
        .eq("child_id", checkin.child_id)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const confirm = useMutation({
    mutationFn: async () => {
      if (code.trim().toUpperCase() !== checkin.security_code)
        throw new Error("Código de segurança incorreto. Confira a etiqueta do responsável.");
      if (!pickedBy.trim()) throw new Error("Informe quem está retirando a criança.");
      const { error } = await supabase
        .from("kids_checkins")
        .update({
          status: "retirada",
          checked_out_at: new Date().toISOString(),
          picked_up_by_name: pickedBy.trim(),
        })
        .eq("id", checkin.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["kids-checkins"] });
      toast.success(`${childName} entregue com segurança.`);
      setOpen(false);
      setCode("");
      setPickedBy("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const authorized = (guardians ?? []).filter((g) => g.can_pickup);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <LogOut className="h-3.5 w-3.5" /> Entregar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Retirada de {childName}
          </DialogTitle>
          <DialogDescription>
            Confira o código impresso na etiqueta do responsável antes de liberar a criança.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border border-border rounded-sm p-3 bg-muted/30">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Autorizados a retirar
            </div>
            {authorized.length === 0 ? (
              <p className="text-sm text-destructive">
                Nenhum responsável autorizado cadastrado. Chame a liderança antes de liberar.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {authorized.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => setPickedBy(g.full_name)}
                    >
                      {g.full_name}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {GUARDIAN_RELATION_LABEL[g.relation] ?? g.relation}
                      </span>
                      {g.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                          asChild
                        >
                          <a
                            href={`https://wa.me/${g.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Olá ${g.full_name}, estamos com a ${childName} aqui no Kids da Igreja Atos. Precisa de algo?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar mensagem via WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label>Código de segurança</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex.: A7KQ"
              maxLength={6}
              className="font-mono tracking-[0.3em] text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label>Quem está retirando</Label>
            <Input
              value={pickedBy}
              onChange={(e) => setPickedBy(e.target.value)}
              placeholder="Nome de quem levou a criança"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => confirm.mutate()} disabled={confirm.isPending}>
            Confirmar retirada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
