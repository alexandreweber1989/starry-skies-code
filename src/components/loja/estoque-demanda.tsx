import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PanelSection, EmptyLine, StatTile } from "@/components/painel/ui";

interface DemandRow {
  name: string;
  quantity: number;
  revenueCents: number;
}

/** Estoque baixo e demanda real dos últimos 90 dias na livraria. */
export function LivrariaEstoque() {
  const { data, isLoading } = useQuery({
    queryKey: ["livraria-demanda"],
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 86400000).toISOString();
      const [produtos, itens] = await Promise.all([
        supabase.from("products").select("id, name, stock, track_stock, is_active").order("name"),
        supabase
          .from("order_items")
          .select("product_name, quantity, unit_price_cents, orders!inner(status, created_at)")
          .gte("orders.created_at", since),
      ]);
      if (produtos.error) throw produtos.error;
      if (itens.error) throw itens.error;

      const map = new Map<string, DemandRow>();
      (itens.data ?? []).forEach((i: any) => {
        // Pedidos cancelados não representam demanda real.
        if (i.orders?.status === "cancelado") return;
        const row = map.get(i.product_name) ?? { name: i.product_name, quantity: 0, revenueCents: 0 };
        row.quantity += i.quantity;
        row.revenueCents += i.quantity * i.unit_price_cents;
        map.set(i.product_name, row);
      });

      return {
        produtos: produtos.data ?? [],
        demanda: [...map.values()].sort((a, b) => b.quantity - a.quantity),
      };
    },
  });

  if (isLoading) return <EmptyLine>Calculando estoque e demanda...</EmptyLine>;

  const produtos = data?.produtos ?? [];
  const baixo = produtos.filter((p: any) => p.track_stock && p.is_active && p.stock <= 3);
  const demanda = data?.demanda ?? [];
  const totalVendido = demanda.reduce((s, d) => s + d.quantity, 0);
  const receita = demanda.reduce((s, d) => s + d.revenueCents, 0);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatTile label="Itens vendidos (90 dias)" value={totalVendido} icon={PackageCheck} />
        <StatTile
          label="Receita no período"
          value={`R$ ${(receita / 100).toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatTile
          label="Estoque crítico"
          value={baixo.length}
          icon={AlertTriangle}
          hint="Produtos com 3 unidades ou menos"
        />
      </div>

      <PanelSection label="Reposição" title="Estoque crítico">
        {baixo.length === 0 ? (
          <EmptyLine>Nenhum produto com estoque crítico.</EmptyLine>
        ) : (
          <ul className="divide-y divide-border">
            {baixo.map((p: any) => (
              <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-sm">{p.name}</span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                    p.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.stock === 0 ? "esgotado" : `${p.stock} restantes`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      <PanelSection label="Previsão" title="Mais procurados nos últimos 90 dias">
        {demanda.length === 0 ? (
          <EmptyLine>Ainda não há pedidos suficientes para estimar demanda.</EmptyLine>
        ) : (
          <ul className="space-y-2">
            {demanda.slice(0, 10).map((d) => {
              const pct = Math.round((d.quantity / demanda[0]!.quantity) * 100);
              return (
                <li key={d.name} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm">{d.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {d.quantity} un · R$ {(d.revenueCents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-sm overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PanelSection>
    </div>
  );
}
