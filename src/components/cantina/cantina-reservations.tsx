import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL, RESERVATION_STATUS } from "@/lib/store";

export function CantinaMyReservations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["my-reservations", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_reservations")
        .select("*, menu:canteen_menus(title, service_date), items:canteen_reservation_items(id, item_name, quantity, unit_price_cents)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("canteen_reservations")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-reservations"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (data && data.length === 0) {
    return <p className="text-muted-foreground">Você ainda não reservou nada na cantina.</p>;
  }

  return (
    <div className="space-y-4">
      {data?.map((r: any) => {
        const status = RESERVATION_STATUS[r.status];
        return (
          <div key={r.id} className="border border-border bg-card rounded-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {r.menu?.title}
                </div>
                <div className="font-serif text-3xl">{r.pickup_code}</div>
              </div>
              <span className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase tracking-widest ${status.className}`}>
                {status.label}
              </span>
            </div>
            <ul className="mt-4 text-sm space-y-1">
              {r.items?.map((i: any) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span>
                    {i.quantity}× {i.item_name}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatBRL(i.unit_price_cents * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-border flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Pagar na retirada
              </span>
              <span className="font-serif text-2xl">{formatBRL(r.total_cents)}</span>
            </div>
            {r.status === "reservado" && (
              <button
                className="mt-4 text-xs text-muted-foreground underline underline-offset-4"
                onClick={() => cancel.mutate(r.id)}
              >
                Cancelar reserva
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}