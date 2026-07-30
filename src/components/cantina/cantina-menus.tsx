import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Coffee } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function CantinaMenus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cart, setCart] = useState<Record<string, number>>({});

  const { data: menus } = useQuery({
    queryKey: ["cantina-menus", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_menus")
        .select("*, entries:canteen_menu_items(id, price_cents, is_available, item:canteen_items(id, name, description, category, image_url))")
        .eq("status", "aberto")
        .order("service_date");
      if (error) throw error;
      return data;
    },
  });

  const reserve = useMutation({
    mutationFn: async (menu: any) => {
      if (!user) throw new Error("Faça login para reservar.");
      const lines = (menu.entries ?? [])
        .filter((e: any) => (cart[e.id] ?? 0) > 0)
        .map((e: any) => ({
          entryId: e.id,
          name: e.item?.name ?? "Item",
          itemId: e.item?.id ?? null,
          price: e.price_cents,
          qty: cart[e.id],
        }));
      if (lines.length === 0) throw new Error("Escolha pelo menos um item.");
      const total = lines.reduce((s: number, l: any) => s + l.price * l.qty, 0);
      const { data: res, error } = await supabase
        .from("canteen_reservations")
        .insert({ menu_id: menu.id, user_id: user.id, total_cents: total })
        .select("id, pickup_code")
        .single();
      if (error) throw error;
      const { error: itemsError } = await supabase.from("canteen_reservation_items").insert(
        lines.map((l: any) => ({
          reservation_id: res.id,
          item_id: l.itemId,
          item_name: l.name,
          unit_price_cents: l.price,
          quantity: l.qty,
        })),
      );
      if (itemsError) throw itemsError;
      return res;
    },
    onSuccess: (res) => {
      setCart({});
      toast.success(`Reserva confirmada! Código ${res.pickup_code} — pague na retirada.`);
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
      qc.invalidateQueries({ queryKey: ["menu-reservations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (menus && menus.length === 0) {
    return (
      <div className="border border-border bg-card rounded-sm p-10 text-center">
        <Coffee className="h-6 w-6 text-muted-foreground mx-auto" />
        <p className="mt-3 text-muted-foreground">
          Nenhum cardápio aberto no momento. Fique de olho — a cantina publica o cardápio antes de cada culto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {menus?.map((menu: any) => (
        <MenuCard
          key={menu.id}
          menu={menu}
          cart={cart}
          setCart={setCart}
          onReserve={() => reserve.mutate(menu)}
          pending={reserve.isPending}
        />
      ))}
    </div>
  );
}

function MenuCard({
  menu,
  cart,
  setCart,
  onReserve,
  pending,
}: {
  menu: any;
  cart: Record<string, number>;
  setCart: (fn: (c: Record<string, number>) => Record<string, number>) => void;
  onReserve: () => void;
  pending: boolean;
}) {
  const entries = (menu.entries ?? []).filter((e: any) => e.is_available && e.item);
  const total = useMemo(
    () => entries.reduce((s: number, e: any) => s + e.price_cents * (cart[e.id] ?? 0), 0),
    [entries, cart],
  );
  const setQty = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));

  return (
    <section className="border border-border bg-card rounded-sm overflow-hidden">
      {menu.art_url && (
        <img src={menu.art_url} alt={menu.title} loading="lazy" className="w-full max-h-72 object-cover" />
      )}
      <div className="p-6 lg:p-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          {new Date(menu.service_date + "T12:00:00").toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </div>
        <h2 className="font-serif text-4xl mt-2">{menu.title}</h2>
        {menu.notes && <p className="mt-2 text-muted-foreground max-w-2xl">{menu.notes}</p>}

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {entries.map((e: any) => (
            <div key={e.id} className="border border-border rounded-sm p-4 flex flex-col">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {e.item.category}
              </div>
              <div className="font-serif text-xl mt-1">{e.item.name}</div>
              {e.item.description && (
                <p className="text-sm text-muted-foreground mt-1">{e.item.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-sm">{formatBRL(e.price_cents)}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(e.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center font-mono text-sm">{cart[e.id] ?? 0}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(e.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Total da reserva
            </div>
            <div className="font-serif text-3xl">{formatBRL(total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sem pagamento antecipado — você paga ao retirar no final do culto.
            </p>
          </div>
          <Button disabled={total === 0 || pending} onClick={onReserve}>
            {pending ? "Reservando..." : "Reservar meu pedido"}
          </Button>
        </div>
      </div>
    </section>
  );
}