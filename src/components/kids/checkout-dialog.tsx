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
import { KidsPhoto } from "@/components/kids/kids-photo";
import { GUARDIAN_RELATION_LABEL, type KidsCheckin } from "@/lib/kids";

interface CheckoutPanelProps {
  checkin: KidsCheckin;
  childName: string;
  /** Chamado depois que a retirada é confirmada com sucesso. */
  onDone?: () => void;
}

/**
 * Conferência de retirada: foto da criança, fotos dos responsáveis autorizados,
 * código de segurança e registro de quem levou. Usado no painel e na tela do QR.
 */
export function CheckoutPanel({ checkin, childName, onDone }: CheckoutPanelProps) {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [pickedBy, setPickedBy] = useState("");

  const { data: child } = useQuery({
    queryKey: ["kids-child-photo", checkin.child_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_children")
        .select("photo_url")
        .eq("id", checkin.child_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: guardians } = useQuery({
    queryKey: ["kids-guardians", checkin.child_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_guardians")
        .select("id, full_name, phone, relation, can_pickup, is_primary, photo_url")
        .eq("child_id", checkin.child_id)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const confirm = useMutation({
    mutationFn: async () => {
      if (code.trim().toUpperCase() !== checkin.security_code)
        throw new Error("Código de segurança incorreto. Confira o código do responsável.");
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
      setCode("");
      setPickedBy("");
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const authorized = (guardians ?? []).filter((g) => g.can_pickup);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2">
        <KidsPhoto
          value={child?.photo_url}
          alt={childName}
          variant="crianca"
          className="h-32 w-32 rounded-2xl border-2 border-primary/20 shadow-xl"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Identificação da criança
        </span>
      </div>

      <div className="border border-border rounded-sm p-3 bg-muted/30">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Autorizados a retirar — toque na foto de quem está levando
        </div>
        {authorized.length === 0 ? (
          <p className="text-sm text-destructive">
            Nenhum responsável autorizado cadastrado. Chame a liderança antes de liberar.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {authorized.map((g) => (
              <li
                key={g.id}
                className={`flex items-start justify-between gap-3 p-2 rounded-md border transition-all ${
                  pickedBy === g.full_name
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-border hover:bg-muted/50"
                }`}
              >
                <button
                  type="button"
                  className="flex gap-3 items-center text-left min-w-0"
                  onClick={() => setPickedBy(g.full_name)}
                >
                  <KidsPhoto
                    value={g.photo_url}
                    alt={g.full_name}
                    variant="responsavel"
                    className="h-12 w-12 rounded-full shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="font-medium text-sm block truncate">{g.full_name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {GUARDIAN_RELATION_LABEL[g.relation] ?? g.relation}
                      {g.is_primary && " · Principal"}
                    </span>
                  </span>
                </button>
                {g.phone && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                    <a
                      href={`https://wa.me/55${g.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Olá ${g.full_name}, aqui é do Kids da Igreja Atos sobre ${childName}.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enviar mensagem via WhatsApp"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
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

      <Button className="w-full" onClick={() => confirm.mutate()} disabled={confirm.isPending}>
        Confirmar retirada
      </Button>
    </div>
  );
}

interface CheckoutDialogProps {
  checkin: KidsCheckin;
  childName: string;
}

/** Retirada da criança a partir do painel de check-in. */
export function CheckoutDialog({ checkin, childName }: CheckoutDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <LogOut className="h-3.5 w-3.5" /> Entregar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Retirada de {childName}
          </DialogTitle>
          <DialogDescription>
            Confira a foto do responsável e o código antes de liberar a criança.
          </DialogDescription>
        </DialogHeader>

        <CheckoutPanel checkin={checkin} childName={childName} onDone={() => setOpen(false)} />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
