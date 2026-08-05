import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Search, Sticker, QrCode, Baby, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  KIDS_CLASSROOM_LABEL,
  ageInYears,
  childDisplayName,
  generateSecurityCode,
  shortTime,
  type KidsChild,
  type KidsCheckin,
  type KidsSession,
} from "@/lib/kids";
import { CheckoutDialog } from "@/components/kids/checkout-dialog";
import { CheckinQrDialog } from "@/components/kids/checkin-qr-dialog";
import { KidsPhoto } from "@/components/kids/kids-photo";
import { cn } from "@/lib/utils";

interface CheckinBoardProps {
  session: KidsSession;
  children: KidsChild[];
}

export function CheckinBoard({ session, children }: CheckinBoardProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: checkins } = useQuery({
    queryKey: ["kids-checkins", session.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_checkins")
        .select("*")
        .eq("session_id", session.id)
        .order("checked_in_at");
      if (error) throw error;
      return data as KidsCheckin[];
    },
    refetchInterval: 20000,
  });

  const byChild = useMemo(
    () => new Map((checkins ?? []).map((c) => [c.child_id, c])),
    [checkins],
  );

  const checkIn = useMutation({
    mutationFn: async (child: KidsChild) => {
      const used = (checkins ?? []).map((c) => c.security_code);
      const { error } = await supabase.from("kids_checkins").insert({
        session_id: session.id,
        child_id: child.id,
        security_code: generateSecurityCode(used),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["kids-checkins", session.id] });
      toast.success("Check-in registrado. Entregue a etiqueta ao responsável.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const term = search.trim().toLowerCase();
  const filtered = children.filter((c) =>
    term ? `${c.full_name} ${c.nickname ?? ""}`.toLowerCase().includes(term) : true,
  );

  const presentes = (checkins ?? []).filter((c) => c.status === "presente").length;
  const retiradas = (checkins ?? []).filter((c) => c.status === "retirada").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Stat label="Na sala agora" value={presentes} variant="primary" />
        <Stat label="Já retiradas" value={retiradas} variant="secondary" />
        <Stat label="Total registrado" value={checkins?.length ?? 0} variant="muted" />
      </div>

      <div className="relative group max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rápida busca por nome da criança..."
          className="h-14 pl-12 rounded-2xl bg-card/40 backdrop-blur-md border-border/50 shadow-lg shadow-black/5 focus-visible:ring-primary/20 transition-all text-lg font-medium"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((child) => {
          const checkin = byChild.get(child.id);
          const age = ageInYears(child.birth_date);
          const alertMessage = [child.allergies, child.health_notes, child.special_needs]
            .filter(Boolean)
            .join(" · ");
            
          return (
            <div 
              key={child.id} 
              className={cn(
                "group relative flex flex-col bg-card/60 backdrop-blur-md border border-border/50 rounded-[2.5rem] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 hover:border-primary/20",
                checkin?.status === "retirada" && "opacity-60 saturate-[0.8]"
              )}
            >
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className={cn(
                    "absolute inset-0 rounded-2xl blur-lg scale-90 group-hover:scale-110 transition-transform duration-500",
                    checkin ? "bg-primary/20" : "bg-muted/40"
                  )} />
                  <KidsPhoto
                    value={child.photo_url}
                    alt={child.full_name}
                    variant="crianca"
                    className="relative h-20 w-20 rounded-2xl object-cover shadow-xl border-4 border-background ring-1 ring-border/50"
                  />
                  {checkin?.status === "presente" && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full border-4 border-background shadow-lg shadow-green-500/30 flex items-center justify-center animate-pulse">
                       <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                     <h4 className="font-serif text-2xl truncate tracking-tight">{childDisplayName(child)}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 px-2 py-0.5 rounded-lg bg-muted/50 border border-border/40">
                      {KIDS_CLASSROOM_LABEL[child.classroom] ?? child.classroom}
                    </span>
                    {age !== null && (
                      <span className="text-xs text-muted-foreground font-medium italic">
                        {age} anos
                      </span>
                    )}
                  </div>
                </div>

                {checkin && (
                  <div className="text-right pl-4">
                    <div className="font-mono text-3xl font-bold tracking-[-0.05em] text-primary tabular-nums">
                      {checkin.security_code}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 mt-0.5">
                      {checkin.status === "retirada" ? "Retirada" : "Confirmado"}
                    </div>
                  </div>
                )}
              </div>

              {alertMessage && (
                <div className="mt-5 p-3 rounded-2xl bg-destructive/5 border border-destructive/10 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed text-destructive/80 font-medium">
                    {alertMessage}
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {!checkin && (
                    <Button 
                      className="rounded-2xl h-11 px-6 shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95" 
                      onClick={() => checkIn.mutate(child)} 
                      disabled={checkIn.isPending}
                    >
                      <Sticker className="mr-2 h-4 w-4" /> Registrar Check-in
                    </Button>
                  )}
                  {checkin?.status === "presente" && (
                    <div className="flex items-center gap-2">
                      <CheckoutDialog checkin={checkin} childName={childDisplayName(child)} />
                      <CheckinQrDialog checkin={checkin} childName={childDisplayName(child)} />
                    </div>
                  )}
                  {checkin?.status === "retirada" && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/30 text-secondary-foreground text-xs font-semibold">
                      <Check className="h-3.5 w-3.5" /> Entregue p/ {checkin.picked_up_by_name}
                    </div>
                  )}
                </div>

                {checkin && (
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 whitespace-nowrap">
                    {checkin.status === "retirada"
                      ? `SAÍDA ${shortTime(checkin.checked_out_at)}`
                      : `ENTRADA ${shortTime(checkin.checked_in_at)}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-border/50 rounded-[3rem] bg-muted/10 animate-reveal">
           <Baby className="h-12 w-12 text-muted-foreground/20 mb-4" />
           <p className="text-xl font-serif text-muted-foreground/60 italic">Nenhuma criança encontrada com esse nome.</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, variant }: { label: string; value: number; variant: 'primary' | 'secondary' | 'muted' }) {
  const variants = {
    primary: "bg-primary/5 text-primary border-primary/10 shadow-primary/5 shadow-inner",
    secondary: "bg-green-500/5 text-green-600 border-green-500/10 shadow-green-500/5 shadow-inner",
    muted: "bg-muted/30 text-muted-foreground border-border/50 shadow-black/5 shadow-inner"
  };

  return (
    <div className={cn("relative group border rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-1", variants[variant])}>
      <div className="relative z-10 flex flex-col">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] opacity-60 mb-2">
          {label}
        </span>
        <span className="text-5xl font-serif font-medium tracking-tighter leading-none">
          {value}
        </span>
      </div>
      <div className="absolute bottom-4 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
         <ShieldCheck className="h-12 w-12" />
      </div>
    </div>
  );
}
