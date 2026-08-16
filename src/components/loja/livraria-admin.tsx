import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, ORDER_STATUS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProductDraft {
  id?: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  stock: number;
  track_stock: boolean;
  image_url: string;
  is_active: boolean;
}

const emptyProduct: ProductDraft = {
  name: "",
  description: "",
  category: "livros",
  price_cents: 0,
  stock: 0,
  track_stock: true,
  image_url: "",
  is_active: true,
};

function ProductDialog({ initial, trigger }: { initial: ProductDraft; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: draft.name,
        description: draft.description || null,
        category: draft.category,
        price_cents: draft.price_cents,
        stock: draft.stock,
        track_stock: draft.track_stock,
        image_url: draft.image_url || null,
        is_active: draft.is_active,
      };
      const { error } = draft.id
        ? await supabase.from("products").update(payload).eq("id", draft.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto salvo.");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(initial); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            {draft.id ? "Editar produto" : "Novo produto"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={(draft.price_cents / 100).toString()}
                onChange={(e) =>
                  setDraft({ ...draft, price_cents: Math.round((Number(e.target.value) || 0) * 100) })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>URL da imagem</Label>
            <Input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>Estoque</Label>
              <Input
                type="number"
                value={draft.stock}
                onChange={(e) => setDraft({ ...draft, stock: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-3 pb-2">
              <Switch
                checked={draft.track_stock}
                onCheckedChange={(v) => setDraft({ ...draft, track_stock: v })}
              />
              <Label className="text-sm">Controlar estoque</Label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
            <Label className="text-sm">Visível no catálogo</Label>
          </div>
          <Button className="w-full" disabled={!draft.name || save.isPending} onClick={() => save.mutate()}>
            Salvar produto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LivrariaAdminProducts() {
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <ProductDialog
        initial={emptyProduct}
        trigger={
          <Button>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        }
      />
      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50">
              <th className="px-6 py-4">Produto</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Preço</th>
              <th className="px-6 py-4">Estoque</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data?.map((p: any) => (
              <tr key={p.id} className="group hover:bg-muted/10 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted/30 overflow-hidden flex-shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 font-serif text-xs">A</div>
                      )}
                    </div>
                    <span className="font-serif text-base">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary" className="bg-muted/50 font-mono text-[9px] uppercase tracking-widest border-border/50 px-2">
                    {p.category}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-mono font-medium">{formatBRL(p.price_cents)}</td>
                <td className="px-6 py-4">
                  {p.track_stock ? (
                    <span className={cn(
                      "font-mono text-xs px-2 py-0.5 rounded-md",
                      p.stock <= 5 ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-primary/5 text-primary border border-primary/20"
                    )}>
                      {p.stock} un
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40 font-mono text-[10px]">ILIMITADO</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "h-2 w-2 rounded-full inline-block mr-2",
                    p.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"
                  )} />
                  <span className="text-xs font-light">{p.is_active ? "Ativo" : "Inativo"}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <ProductDialog
                    initial={{
                      id: p.id,
                      name: p.name,
                      description: p.description ?? "",
                      category: p.category,
                      price_cents: p.price_cents,
                      stock: p.stock,
                      track_stock: p.track_stock,
                      image_url: p.image_url ?? "",
                      is_active: p.is_active,
                    }}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary group-hover:scale-105 transition-transform">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export function LivrariaAdminOrders() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: orders } = useQuery({
    queryKey: ["all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(id, product_id, product_name, quantity, unit_price_cents)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ order, status }: { order: any; status: string }) => {
      const patch: {
        status: string;
        confirmed_at?: string;
        delivered_at?: string;
      } = { status };
      if (status === "pago") patch.confirmed_at = new Date().toISOString();
      if (status === "entregue") patch.delivered_at = new Date().toISOString();
      const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (error) throw error;

      if (status === "entregue") {
        for (const item of order.items ?? []) {
          if (!item.product_id) continue;
          const { data: prod } = await supabase
            .from("products")
            .select("stock, track_stock")
            .eq("id", item.product_id)
            .maybeSingle();
          if (prod?.track_stock) {
            await supabase
              .from("products")
              .update({ stock: Math.max(0, prod.stock - item.quantity) })
              .eq("id", item.product_id);
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Pedido atualizado.");
      qc.invalidateQueries({ queryKey: ["all-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = orders?.filter((o: any) =>
    !q.trim() ? true : o.pickup_code.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Input
        className="max-w-xs"
        placeholder="Buscar pelo código de retirada..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {filtered?.map((o: any) => {
        const status = ORDER_STATUS[o.status];
        return (
          <div key={o.id} className="border border-border bg-card rounded-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-serif text-2xl">{o.pickup_code}</div>
              <span className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase tracking-widest ${status.className}`}>
                {status.label}
              </span>
            </div>
            <ul className="mt-3 text-sm text-muted-foreground">
              {o.items?.map((i: any) => (
                <li key={i.id}>
                  {i.quantity}× {i.product_name}
                </li>
              ))}
            </ul>
            <div className="mt-3 font-serif text-xl">{formatBRL(o.total_cents)}</div>
            {o.payment_proof_url && (
              <a
                href={o.payment_proof_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs underline underline-offset-4"
              >
                Ver comprovante enviado
              </a>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {o.status === "aguardando_pagamento" && (
                <Button size="sm" onClick={() => setStatus.mutate({ order: o, status: "pago" })}>
                  Confirmar pagamento
                </Button>
              )}
              {o.status === "pago" && (
                <Button size="sm" onClick={() => setStatus.mutate({ order: o, status: "entregue" })}>
                  Marcar como entregue
                </Button>
              )}
              {o.status !== "cancelado" && o.status !== "entregue" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus.mutate({ order: o, status: "cancelado" })}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {filtered && filtered.length === 0 && <p className="text-muted-foreground">Nenhum pedido encontrado.</p>}
    </div>
  );
}