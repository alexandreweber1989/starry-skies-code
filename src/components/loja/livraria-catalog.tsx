import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PixDialog } from "@/components/loja/pix-dialog";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_cents: number;
  stock: number;
  track_stock: boolean;
  image_url: string | null;
}

export function LivrariaCatalog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placed, setPlaced] = useState<{ code: string; total: number } | null>(null);

  const { data: products } = useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, category, price_cents, stock, track_stock, image_url")
        .eq("is_active", true)
        .order("category")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
    },
  });

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: products?.find((p) => p.id === id), qty }))
        .filter((l): l is { product: Product; qty: number } => Boolean(l.product) && l.qty > 0),
    [cart, products],
  );
  const total = lines.reduce((sum, l) => sum + l.product.price_cents * l.qty, 0);

  const setQty = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));

  const checkout = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para comprar.");
      const { data: order, error } = await supabase
        .from("orders")
        .insert({ user_id: user.id, total_cents: total })
        .select("id, pickup_code, total_cents")
        .single();
      if (error) throw error;
      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.product.id,
          product_name: l.product.name,
          unit_price_cents: l.product.price_cents,
          quantity: l.qty,
        })),
      );
      if (itemsError) throw itemsError;
      return order;
    },
    onSuccess: (order) => {
      setCart({});
      setPlaced({ code: order.pickup_code, total: order.total_cents });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["all-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {products?.map((p) => {
          const soldOut = p.track_stock && p.stock <= 0;
          return (
            <div key={p.id} className="border border-border bg-card rounded-sm overflow-hidden flex flex-col">
              <div className="aspect-4/3 bg-muted flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {p.category}
                </div>
                <h3 className="font-serif text-xl mt-1 leading-tight">{p.name}</h3>
                {p.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="font-serif text-2xl">{formatBRL(p.price_cents)}</span>
                  {soldOut ? (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Esgotado
                    </span>
                  ) : cart[p.id] ? (
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(p.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center font-mono text-sm">{cart[p.id]}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(p.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setQty(p.id, 1)}>
                      Adicionar
                    </Button>
                  )}
                </div>
                {p.track_stock && !soldOut && (
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.stock} em estoque
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {products && products.length === 0 && (
          <p className="text-muted-foreground">Nenhum produto disponível no momento.</p>
        )}
      </div>

      <aside className="border border-border bg-card rounded-sm p-6 lg:sticky lg:top-6">
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Seu pedido</span>
        </div>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Adicione produtos para montar seu pedido.</p>
        ) : (
          <div className="space-y-3">
            {lines.map((l) => (
              <div key={l.product.id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {l.qty}× {l.product.name}
                </span>
                <span className="font-mono">{formatBRL(l.product.price_cents * l.qty)}</span>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-border flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total</span>
              <span className="font-serif text-3xl">{formatBRL(total)}</span>
            </div>
            <Button className="w-full" disabled={checkout.isPending} onClick={() => checkout.mutate()}>
              {checkout.isPending ? "Gerando pedido..." : "Finalizar e pagar com PIX"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Pagamento por PIX no CNPJ da igreja. A retirada é feita presencialmente com o código gerado.
            </p>
          </div>
        )}
      </aside>

      {placed && (
        <PixDialog
          open
          onOpenChange={(o) => !o && setPlaced(null)}
          pickupCode={placed.code}
          totalCents={placed.total}
          pixKey={settings?.pix_key ?? ""}
          pixName={settings?.pix_name ?? "Igreja Batista Atos"}
          pixCity={settings?.pix_city ?? "Sao Paulo"}
        />
      )}
    </div>
  );
}