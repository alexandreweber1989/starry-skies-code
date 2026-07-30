import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, RESERVATION_STATUS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ItemDraft {
  id?: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  image_url: string;
  is_active: boolean;
}

const emptyItem: ItemDraft = {
  name: "",
  description: "",
  category: "salgados",
  price_cents: 0,
  image_url: "",
  is_active: true,
};

function ItemDialog({ initial, trigger }: { initial: ItemDraft; trigger: React.ReactNode }) {
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
        image_url: draft.image_url || null,
        is_active: draft.is_active,
      };
      const { error } = draft.id
        ? await supabase.from("canteen_items").update(payload).eq("id", draft.id)
        : await supabase.from("canteen_items").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item salvo.");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["canteen-items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(initial); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">{draft.id ? "Editar item" : "Novo item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
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
                onChange={(e) => setDraft({ ...draft, price_cents: Math.round((Number(e.target.value) || 0) * 100) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>URL da imagem / arte</Label>
            <Input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
            <Label className="text-sm">Item ativo</Label>
          </div>
          <Button className="w-full" disabled={!draft.name || save.isPending} onClick={() => save.mutate()}>
            Salvar item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CantinaAdminItems() {
  const { data } = useQuery({
    queryKey: ["canteen-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("canteen_items").select("*").order("category").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <ItemDialog
        initial={emptyItem}
        trigger={
          <Button>
            <Plus className="h-4 w-4" /> Novo item
          </Button>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.map((i: any) => (
          <div key={i.id} className="border border-border bg-card rounded-sm p-4 flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{i.category}</div>
              <div className="font-serif text-xl">{i.name}</div>
              <div className="font-mono text-sm mt-1">{formatBRL(i.price_cents)}</div>
              {!i.is_active && <div className="text-xs text-muted-foreground mt-1">Inativo</div>}
            </div>
            <ItemDialog
              initial={{
                id: i.id,
                name: i.name,
                description: i.description ?? "",
                category: i.category,
                price_cents: i.price_cents,
                image_url: i.image_url ?? "",
                is_active: i.is_active,
              }}
              trigger={
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [artUrl, setArtUrl] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ["canteen-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_items")
        .select("id, name, price_cents, category")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const chosen = (items ?? []).filter((i) => selected[i.id]);
      if (chosen.length === 0) throw new Error("Selecione ao menos um item.");
      const { data: menu, error } = await supabase
        .from("canteen_menus")
        .insert({ title, service_date: date, notes: notes || null, art_url: artUrl || null, status: "aberto" })
        .select("id")
        .single();
      if (error) throw error;
      const { error: linkError } = await supabase.from("canteen_menu_items").insert(
        chosen.map((i) => ({ menu_id: menu.id, item_id: i.id, price_cents: i.price_cents })),
      );
      if (linkError) throw linkError;
    },
    onSuccess: () => {
      toast.success("Cardápio publicado.");
      setOpen(false);
      setTitle("");
      setSelected({});
      qc.invalidateQueries({ queryKey: ["cantina-menus"] });
      qc.invalidateQueries({ queryKey: ["admin-menus"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Novo cardápio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Cardápio do culto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Culto de domingo à noite" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>URL da arte de divulgação</Label>
            <Input value={artUrl} onChange={(e) => setArtUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Itens do dia</Label>
            <div className="border border-border rounded-sm divide-y divide-border">
              {items?.map((i) => (
                <label key={i.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={Boolean(selected[i.id])}
                    onCheckedChange={(v) => setSelected((s) => ({ ...s, [i.id]: Boolean(v) }))}
                  />
                  <span className="flex-1">{i.name}</span>
                  <span className="font-mono text-muted-foreground">{formatBRL(i.price_cents)}</span>
                </label>
              ))}
            </div>
          </div>
          <Button className="w-full" disabled={!title || create.isPending} onClick={() => create.mutate()}>
            Publicar cardápio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CantinaAdminMenus() {
  const qc = useQueryClient();
  const { data: menus } = useQuery({
    queryKey: ["admin-menus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_menus")
        .select("*, reservations:canteen_reservations(id, pickup_code, status, total_cents, user_id, items:canteen_reservation_items(id, item_name, quantity))")
        .order("service_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setMenuStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("canteen_menus").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-menus"] });
      qc.invalidateQueries({ queryKey: ["cantina-menus"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setResStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("canteen_reservations")
        .update({ status, picked_up_at: status === "retirado" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-menus"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <MenuDialog />
      {menus?.map((menu: any) => {
        const active = (menu.reservations ?? []).filter((r: any) => r.status !== "cancelado");
        const totals = new Map<string, number>();
        for (const r of active) {
          for (const i of r.items ?? []) {
            totals.set(i.item_name, (totals.get(i.item_name) ?? 0) + i.quantity);
          }
        }
        return (
          <div key={menu.id} className="border border-border bg-card rounded-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {new Date(menu.service_date + "T12:00:00").toLocaleDateString("pt-BR")} · {menu.status}
                </div>
                <h3 className="font-serif text-2xl">{menu.title}</h3>
              </div>
              <div className="flex gap-2">
                {menu.status !== "encerrado" ? (
                  <Button size="sm" variant="outline" onClick={() => setMenuStatus.mutate({ id: menu.id, status: "encerrado" })}>
                    Encerrar
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setMenuStatus.mutate({ id: menu.id, status: "aberto" })}>
                    Reabrir
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Produção necessária
              </div>
              {totals.size === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma reserva ainda.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[...totals.entries()].map(([name, qty]) => (
                    <span key={name} className="border border-border rounded-sm px-3 py-1 text-sm">
                      <strong className="font-serif text-lg mr-1">{qty}</strong> {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {active.length > 0 && (
              <div className="mt-6 space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Reservas ({active.length})
                </div>
                {active.map((r: any) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-2 text-sm">
                    <span className="font-serif text-lg">{r.pickup_code}</span>
                    <span className="text-muted-foreground flex-1 min-w-40">
                      {(r.items ?? []).map((i: any) => `${i.quantity}× ${i.item_name}`).join(", ")}
                    </span>
                    <span className="font-mono">{formatBRL(r.total_cents)}</span>
                    <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-widest ${RESERVATION_STATUS[r.status].className}`}>
                      {RESERVATION_STATUS[r.status].label}
                    </span>
                    {r.status === "reservado" && (
                      <Button size="sm" onClick={() => setResStatus.mutate({ id: r.id, status: "retirado" })}>
                        Retirado
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}