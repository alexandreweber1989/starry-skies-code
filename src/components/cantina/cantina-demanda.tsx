import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Utensils, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PanelSection, EmptyLine, StatTile } from "@/components/painel/ui";

/** Demanda por item das reservas da cantina, agrupada por cardápio. */
export function CantinaDemanda() {
  const { data, isLoading } = useQuery({
    queryKey: ["cantina-demanda"],
    queryFn: async () => {
      const [menus, itens] = await Promise.all([
        supabase
          .from("canteen_menus")
          .select("id, title, service_date, status")
          .order("service_date", { ascending: false })
          .limit(6),
        supabase
          .from("canteen_reservation_items")
          .select(
            "item_name, quantity, unit_price_cents, reservation:canteen_reservations!inner(id, menu_id, status, user_id)",
          ),
      ]);
      if (menus.error) throw menus.error;
      if (itens.error) throw itens.error;
      return { menus: menus.data ?? [], itens: (itens.data ?? []) as any[] };
    },
  });

  if (isLoading) return <EmptyLine>Calculando demanda das reservas...</EmptyLine>;

  const menus = data?.menus ?? [];
  const itens = (data?.itens ?? []).filter((i) => i.reservation?.status !== "cancelada");

  const totalItens = itens.reduce((s, i) => s + i.quantity, 0);
  const totalPessoas = new Set(itens.map((i) => i.reservation?.user_id)).size;
  const totalCents = itens.reduce((s, i) => s + i.quantity * i.unit_price_cents, 0);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatTile label="Porções reservadas" value={totalItens} icon={Utensils} />
        <StatTile label="Pessoas com reserva" value={totalPessoas} icon={Users} />
        <StatTile
          label="Previsão de caixa"
          value={`R$ ${(totalCents / 100).toFixed(2)}`}
          icon={ClipboardList}
        />
      </div>

      {menus.length === 0 && <EmptyLine>Nenhum cardápio cadastrado ainda.</EmptyLine>}

      {menus.map((menu: any) => {
        const doMenu = itens.filter((i) => i.reservation?.menu_id === menu.id);
        const map = new Map<string, number>();
        doMenu.forEach((i) => map.set(i.item_name, (map.get(i.item_name) ?? 0) + i.quantity));
        const linhas = [...map.entries()].sort((a, b) => b[1] - a[1]);
        const maior = linhas[0]?.[1] ?? 1;

        return (
          <PanelSection
            key={menu.id}
            label={new Date(`${menu.service_date}T12:00:00`).toLocaleDateString("pt-BR")}
            title={menu.title}
          >
            {linhas.length === 0 ? (
              <EmptyLine>Sem reservas para este cardápio.</EmptyLine>
            ) : (
              <ul className="space-y-2">
                {linhas.map(([nome, qtd]) => (
                  <li key={nome} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm">{nome}</span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {qtd} porções
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-sm overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.round((qtd / maior) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
        );
      })}
    </div>
  );
}
