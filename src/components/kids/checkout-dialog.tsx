import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, LogOut, MessageSquare, ChevronRight } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface CheckoutPanelProps {
  checkin: KidsCheckin;
  childName: string;
  onDone?: () => void;
}

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
    <div className="space-y-8 py-4">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative group">
           <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 opacity-50" />
           <KidsPhoto
             value={child?.photo_url}
             alt={childName}
             variant="crianca"
             className="relative h-40 w-40 rounded-full border-4 border-background shadow-2xl ring-1 ring-border/50 object-cover"
           />
        </div>
        <div className="space-y-1">
          <h4 className="font-serif text-3xl tracking-tight">{childName}</h4>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
            Conferência de Identidade
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <h5 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Responsáveis Autorizados</h5>
           <span className="text-[10px] font-mono text-primary/60">{authorized.length} pessoas</span>
        </div>
        
        {authorized.length === 0 ? (
          <div className="p-6 rounded-3xl bg-destructive/5 border border-destructive/10 text-center">
            <p className="text-sm text-destructive font-medium leading-relaxed">
              ATENÇÃO: Nenhum responsável autorizado cadastrado. <br/>Solicite autorização da liderança.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {authorized.map((g) => (
              <button
                key={g.id}
                type="button"
                className={cn(
                  "group flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 text-left",
                  pickedBy === g.full_name
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/30"
                )}
                onClick={() => setPickedBy(g.full_name)}
              >
                <div className="relative shrink-0">
                  <KidsPhoto
                    value={g.photo_url}
                    alt={g.full_name}
                    variant="responsavel"
                    className={cn(
                      "h-14 w-14 rounded-2xl object-cover border-2 border-background shadow-md transition-transform duration-300",
                      pickedBy === g.full_name && "scale-110"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-base block truncate group-hover:text-primary transition-colors">{g.full_name}</span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground/60 mt-0.5 block">
                    {GUARDIAN_RELATION_LABEL[g.relation] ?? g.relation}
                    {g.is_primary && " · Principal"}
                  </span>
                </div>
                {pickedBy === g.full_name && (
                   <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-300">
                     <ShieldCheck className="h-3 w-3 text-primary-foreground" />
                   </div>
                )}
                {g.phone && pickedBy !== g.full_name && (
                   <a
                    href={`https://wa.me/55${g.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${g.full_name}, aqui é do Kids da Igreja Atos.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </a>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground ml-1">Código de Segurança</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="A7KQ"
            maxLength={6}
            className="h-14 font-mono tracking-[0.4em] text-2xl text-center rounded-2xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground ml-1">Quem retirou</Label>
          <Input
            value={pickedBy}
            onChange={(e) => setPickedBy(e.target.value)}
            placeholder="Nome completo..."
            className="h-14 rounded-2xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
          />
        </div>
      </div>

      <Button 
        className="w-full h-16 rounded-[1.5rem] text-lg font-serif shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all" 
        onClick={() => confirm.mutate()} 
        disabled={confirm.isPending || !pickedBy || code.length < 2}
      >
        {confirm.isPending ? "Processando..." : "Confirmar Entrega com Segurança"}
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

interface CheckoutDialogProps {
  checkin: KidsCheckin;
  childName: string;
}

export function CheckoutDialog({ checkin, childName }: CheckoutDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all group">
          <LogOut className="mr-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /> Entregar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto rounded-[2rem] border-border/50 shadow-2xl p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl font-serif">
            <ShieldCheck className="h-6 w-6 text-primary" /> Retirada Segura
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Confirme as informações abaixo para liberar a criança com total segurança.
          </DialogDescription>
        </DialogHeader>

        <CheckoutPanel checkin={checkin} childName={childName} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
