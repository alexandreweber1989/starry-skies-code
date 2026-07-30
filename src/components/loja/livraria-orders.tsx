import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL, ORDER_STATUS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LivrariaOrders() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [proof, setProof] = useState<Record<string, string>>({});

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(id, product_name, quantity, unit_price_cents)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sendProof = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase.from("orders").update({ payment_proof_url: url }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comprovante enviado. Aguarde a confirmação da livraria.");
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ status: "cancelado" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (orders && orders.length === 0) {
    return <p className="text-muted-foreground">Você ainda não fez nenhum pedido na livraria.</p>;
  }

  return (
    <div className="space-y-4">
      {orders?.map((o: any) => {
        const status = ORDER_STATUS[o.status];
        return (
          <div key={o.id} className="border border-border bg-card rounded-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Código de retirada
                </div>
                <div className="font-serif text-3xl">{o.pickup_code}</div>
              </div>
              <span className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase tracking-widest ${status.className}`}>
                {status.label}
              </span>
            </div>
            <ul className="mt-5 space-y-1 text-sm">
              {o.items?.map((i: any) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span>
                    {i.quantity}× {i.product_name}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatBRL(i.unit_price_cents * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-border flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total</span>
              <span className="font-serif text-2xl">{formatBRL(o.total_cents)}</span>
            </div>
            {o.status === "aguardando_pagamento" && (
              <div className="mt-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Link do comprovante do PIX"
                    value={proof[o.id] ?? o.payment_proof_url ?? ""}
                    onChange={(e) => setProof((p) => ({ ...p, [o.id]: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    disabled={!(proof[o.id] ?? o.payment_proof_url)}
                    onClick={() => sendProof.mutate({ id: o.id, url: proof[o.id] ?? o.payment_proof_url })}
                  >
                    Enviar comprovante
                  </Button>
                </div>
                <button
                  className="text-xs text-muted-foreground underline underline-offset-4"
                  onClick={() => cancel.mutate(o.id)}
                >
                  Cancelar pedido
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}