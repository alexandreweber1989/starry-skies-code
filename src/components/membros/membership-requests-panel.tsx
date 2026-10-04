import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, X, Clock, MapPin, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { approveMembershipRequest } from "@/lib/membership.functions";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface MembershipRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  requester_name: string | null;
  status: string;
  created_at: string;
  city: string | null;
  neighborhood: string | null;
  zip_code: string | null;
  age_range: string | null;
}

const FAIXA_LABEL: Record<string, string> = {
  crianca: "Criança",
  adolescente: "Adolescente",
  jovem: "Jovem",
  adulto: "Adulto",
  melhor_idade: "Melhor idade",
  prefiro_nao_dizer: "Idade não informada",
};

/** Monta um link wa.me a partir de um telefone brasileiro (adiciona 55 se faltar). */
function linkWhatsApp(phone: string | null, nome: string): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (!d.startsWith("55")) d = "55" + d;
  const msg = encodeURIComponent(
    `Olá, ${nome.split(" ")[0]}! Aqui é da Igreja Batista Atos. Vimos que você quer fazer parte e queremos te dar as boas-vindas. 💛`,
  );
  return `https://wa.me/${d}?text=${msg}`;
}

/** Solicitações de cadastro pendentes (admin vê todas; demais veem as suas). */
export function usePendingRequests() {
  return useQuery({
    queryKey: ["membership-requests", "pendente"],
    queryFn: async (): Promise<MembershipRequest[]> => {
      const { data, error } = await supabase
        .from("membership_requests")
        .select(
          "id, full_name, email, phone, notes, requester_name, status, created_at, city, neighborhood, zip_code, age_range",
        )
        .eq("status", "pendente")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MembershipRequest[];
    },
  });
}

/**
 * Painel de pendências: o admin geral aprova (cria a conta) ou recusa.
 * Líderes veem apenas o andamento das solicitações que enviaram.
 */
export function MembershipRequestsPanel({ compact = false }: { compact?: boolean }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = usePendingRequests();
  const [approving, setApproving] = useState<MembershipRequest | null>(null);
  const [password, setPassword] = useState("");
  const approve = useServerFn(approveMembershipRequest);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["membership-requests"] });
    void qc.invalidateQueries({ queryKey: ["profiles"] });
    void qc.invalidateQueries({ queryKey: ["profiles-min"] });
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!approving) throw new Error("Nenhuma solicitação selecionada.");
      if (password.trim().length < 8) throw new Error("A senha precisa ter ao menos 8 caracteres.");
      return approve({ data: { request_id: approving.id, password } });
    },
    onSuccess: () => {
      toast.success("Membro aprovado e cadastrado na plataforma.");
      setApproving(null);
      setPassword("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("membership_requests")
        .update({ status: "recusado", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação recusada.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  const rows = data ?? [];
  if (rows.length === 0 && compact) return null;

  return (
    <div className="border border-border bg-card rounded-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Clock className="h-4 w-4 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-widest">
          Solicitações de cadastro
        </span>
        <Badge variant="secondary" className="ml-auto">
          {rows.length} pendente{rows.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          Nenhuma solicitação pendente no momento.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{r.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.email || "sem e-mail"}
                  {r.phone ? ` · ${r.phone}` : ""}
                  {r.requester_name ? ` · indicado por ${r.requester_name}` : ""}
                </p>
                {(r.city || r.neighborhood || r.age_range) && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
                    {(r.city || r.neighborhood) && (
                      <>
                        <MapPin className="h-3 w-3 text-primary" />
                        {[r.neighborhood, r.city].filter(Boolean).join(", ")}
                      </>
                    )}
                    {r.age_range && (
                      <span>
                        {(r.city || r.neighborhood) ? " · " : ""}
                        {FAIXA_LABEL[r.age_range] ?? r.age_range}
                      </span>
                    )}
                  </p>
                )}
                {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">“{r.notes}”</p>}
              </div>
              {isAdmin ? (
                <div className="flex gap-2">
                  {linkWhatsApp(r.phone, r.full_name) && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={linkWhatsApp(r.phone, r.full_name)!} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setApproving(r)}>
                    <Check className="h-4 w-4" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reject.isPending}
                    onClick={() => reject.mutate(r.id)}
                  >
                    <X className="h-4 w-4" /> Recusar
                  </Button>
                </div>
              ) : (
                <Badge variant="outline">Aguardando aprovação</Badge>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!approving} onOpenChange={(v) => !v && setApproving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl">Aprovar cadastro</DialogTitle>
            <DialogDescription>
              A conta de {approving?.full_name} será criada já confirmada. Combine a senha inicial
              com a pessoa; ela poderá alterá-la depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Senha inicial (mín. 8 caracteres)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button
              className="w-full"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              Aprovar e criar acesso
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
