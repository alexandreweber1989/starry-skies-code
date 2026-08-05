import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, QrCode, ShieldQuestion, Sticker, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  GUARDIAN_RELATION_LABEL,
  KIDS_CLASSROOM_LABEL,
  generateSecurityCode,
  shortTime,
  type KidsSession,
} from "@/lib/kids";
import { cn } from "@/lib/utils";

export interface VisitorRequest {
  id: string;
  child_id: string | null;
  child_full_name: string;
  child_nickname: string | null;
  birth_date: string | null;
  classroom: string;
  allergies: string | null;
  health_notes: string | null;
  special_needs: string | null;
  photo_consent: boolean;
  guardian_full_name: string;
  guardian_phone: string;
  guardian_relation: string;
  guardian_document: string | null;
  other_pickup: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface VisitorQueueProps {
  session: KidsSession | null;
  churchId?: string | null;
}

export function VisitorQueue({ session, churchId }: VisitorQueueProps) {
  const qc = useQueryClient();

  const { data: requests } = useQuery({
    queryKey: ["kids-visitor-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_visitor_requests")
        .select("*")
        .eq("status", "pendente")
        .order("created_at");
      if (error) throw error;
      return data as VisitorRequest[];
    },
    refetchInterval: 20000,
  });

  const approve = useMutation({
    mutationFn: async (req: VisitorRequest) => {
      let childId = req.child_id;

      if (!childId) {
        const { data: child, error: childError } = await supabase
          .from("kids_children")
          .insert({
            full_name: req.child_full_name,
            nickname: req.child_nickname,
            birth_date: req.birth_date,
            classroom: req.classroom,
            church_id: churchId ?? null,
            allergies: req.allergies,
            health_notes: req.health_notes,
            special_needs: req.special_needs,
            photo_consent: req.photo_consent,
            can_leave_alone: false,
            notes: [req.notes, req.other_pickup ? `Também podem retirar: ${req.other_pickup}` : null]
              .filter(Boolean)
              .join(" · ") || null,
          })
          .select("id")
          .single();
        if (childError) throw childError;
        childId = child.id;

        const { error: guardianError } = await supabase.from("kids_guardians").insert({
          child_id: childId,
          full_name: req.guardian_full_name,
          phone: req.guardian_phone,
          relation: req.guardian_relation,
          document: req.guardian_document,
          is_primary: true,
          can_pickup: true,
        });
        if (guardianError) throw guardianError;
      }

      let code: string | null = null;
      if (session) {
        const { data: existing } = await supabase
          .from("kids_checkins")
          .select("security_code, child_id")
          .eq("session_id", session.id);
        const already = (existing ?? []).some((c) => c.child_id === childId);
        if (!already) {
          code = generateSecurityCode((existing ?? []).map((c) => c.security_code));
          const { error } = await supabase.from("kids_checkins").insert({
            session_id: session.id,
            child_id: childId,
            security_code: code,
            dropped_by_name: req.guardian_full_name,
          });
          if (error) throw error;
        }
      }

      const { error: updateError } = await supabase
        .from("kids_visitor_requests")
        .update({
          status: "aprovado",
          child_id: childId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", req.id);
      if (updateError) throw updateError;

      return code;
    },
    onSuccess: (code) => {
      void qc.invalidateQueries({ queryKey: ["kids-visitor-requests"] });
      void qc.invalidateQueries({ queryKey: ["kids-children"] });
      if (session) void qc.invalidateQueries({ queryKey: ["kids-checkins", session.id] });
      toast.success(
        code
          ? `Aprovado e check-in feito. Código da etiqueta: ${code}`
          : "Cadastro aprovado. A criança já aparece na lista.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (req: VisitorRequest) => {
      const { error } = await supabase
        .from("kids_visitor_requests")
        .update({ status: "recusado", reviewed_at: new Date().toISOString() })
        .eq("id", req.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["kids-visitor-requests"] });
      toast.success("Cadastro descartado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = requests ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h3 className="font-serif text-3xl tracking-tight">Fila de Visitantes</h3>
          <p className="text-muted-foreground/60 text-sm max-w-lg leading-relaxed">
            Confira o documento do responsável antes de validar. {session ? "O check-in será automático após a aprovação." : "Isso criará o cadastro permanente da criança."}
          </p>
        </div>
        <QrDialog />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 border-2 border-dashed border-border/50 rounded-[3rem] bg-muted/10 animate-reveal">
          <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center shadow-xl shadow-black/5 ring-1 ring-border/50 mb-6">
            <ShieldQuestion className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h4 className="font-serif text-2xl tracking-tight">Fila vazia</h4>
          <p className="max-w-xs mx-auto text-sm text-muted-foreground leading-relaxed mt-2 text-center">
            Novos cadastros via QR Code aparecerão aqui em tempo real para sua conferência.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {list.map((req) => (
            <li key={req.id} className="group relative flex flex-col bg-card/60 backdrop-blur-md border border-border/50 rounded-[2.5rem] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 hover:border-primary/20">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="font-serif text-2xl truncate tracking-tight group-hover:text-primary transition-colors">
                    {req.child_nickname
                      ? `${req.child_full_name} (${req.child_nickname})`
                      : req.child_full_name}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 px-2 py-0.5 rounded-lg bg-muted/50 border border-border/40">
                      {KIDS_CLASSROOM_LABEL[req.classroom] ?? req.classroom}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/50">
                      {shortTime(req.created_at)}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                  {req.child_id ? "Retorno" : "Visitante"}
                </Badge>
              </div>

              <div className="mt-6 p-5 rounded-2xl bg-muted/20 border border-border/40 space-y-4">
                <dl className="grid grid-cols-1 gap-y-3">
                  <Line
                    label="Responsável"
                    value={`${req.guardian_full_name} · ${
                      GUARDIAN_RELATION_LABEL[req.guardian_relation] ?? req.guardian_relation
                    }`}
                  />
                  <Line label="Telefone" value={req.guardian_phone} />
                  {req.guardian_document && <Line label="Documento" value={req.guardian_document} />}
                  {req.other_pickup && <Line label="Autorizados" value={req.other_pickup} />}
                </dl>
                
                {req.notes && (
                  <div className="pt-3 border-t border-border/40 italic text-xs text-muted-foreground">
                    Obs: {req.notes}
                  </div>
                )}
              </div>

              {(req.allergies || req.health_notes || req.special_needs) && (
                <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                   <p className="text-[11px] leading-relaxed text-destructive/80 font-medium">
                     {[req.allergies, req.health_notes, req.special_needs].filter(Boolean).join(" · ")}
                   </p>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <Button
                  className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/10 hover:-translate-y-1 transition-all"
                  onClick={() => approve.mutate(req)}
                  disabled={approve.isPending || reject.isPending}
                >
                  <Sticker className="mr-2 h-4 w-4" />
                  {session ? "Aprovar Check-in" : "Validar Cadastro"}
                </Button>
                <Button
                  variant="ghost"
                  className="h-12 w-12 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-colors p-0 border border-border/50"
                  onClick={() => reject.mutate(req)}
                  disabled={approve.isPending || reject.isPending}
                  title="Descartar"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 pt-1 w-24 shrink-0">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground truncate">{value}</dd>
    </div>
  );
}

function QrDialog() {
  const [open, setOpen] = useState(false);
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/kids/visitante` : "/kids/visitante";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11 rounded-xl px-5 border-border/50 hover:bg-accent transition-all group">
          <QrCode className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" /> 
          <span className="font-medium">QR da Porta</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/50 shadow-2xl p-10 max-w-md">
        <DialogHeader className="text-center space-y-4">
          <DialogTitle className="text-3xl font-serif">Cadastro Expresso</DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed">
            Aponte a câmera para o QR Code. Os pais preenchem o cadastro em segundos e ele aparece aqui na fila.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-8 py-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-3xl group-hover:bg-primary/20 transition-colors" />
            <div className="relative bg-white p-6 rounded-[2rem] shadow-xl border border-border/50 transition-transform duration-500 hover:scale-[1.02]">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}`}
                alt="QR Code do cadastro de crianças visitantes"
                width={220}
                height={220}
              />
            </div>
          </div>
          
          <div className="w-full flex flex-col gap-3">
            <Button
              className="w-full h-12 rounded-2xl bg-muted/50 text-foreground border border-border/50 hover:bg-muted"
              onClick={() => {
                void navigator.clipboard.writeText(url);
                toast.success("Link copiado para a área de transferência.");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar Link
            </Button>
            <Button className="w-full h-12 rounded-2xl" asChild>
              <a href={`${url}?kiosk=1`} target="_blank" rel="noreferrer">
                <Check className="mr-2 h-4 w-4" /> Abrir Modo Quiosque
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
