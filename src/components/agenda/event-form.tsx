import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KIND_LABEL,
  SCOPE_LABEL,
  STATUS_LABEL,
  fromLocalInput,
  toLocalInput,
  type ChurchEvent,
  type EventKind,
  type EventScope,
  type EventStatus,
} from "@/lib/agenda";

interface FormState {
  title: string;
  description: string;
  kind: EventKind;
  scope: EventScope;
  target_id: string;
  starts_at: string;
  ends_at: string;
  location: string;
  requires_rsvp: boolean;
  capacity: string;
  is_featured: boolean;
  status: EventStatus;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  kind: "evento",
  scope: "igreja",
  target_id: "",
  starts_at: "",
  ends_at: "",
  location: "",
  requires_rsvp: true,
  capacity: "",
  is_featured: false,
  status: "publicado",
};

function fromEvent(e: ChurchEvent): FormState {
  return {
    title: e.title,
    description: e.description ?? "",
    kind: e.kind,
    scope: e.scope,
    target_id: e.ministry_id ?? e.rede_id ?? e.mesa_id ?? "",
    starts_at: toLocalInput(e.starts_at),
    ends_at: toLocalInput(e.ends_at),
    location: e.location ?? "",
    requires_rsvp: e.requires_rsvp,
    capacity: e.capacity ? String(e.capacity) : "",
    is_featured: e.is_featured,
    status: e.status,
  };
}

/** Formulário de criação/edição de evento (admin geral, de ministério ou líder de mesa). */
export function EventForm({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event?: ChurchEvent | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (open) setForm(event ? fromEvent(event) : EMPTY);
  }, [open, event]);

  const { data: targets } = useQuery({
    queryKey: ["agenda-targets"],
    queryFn: async () => {
      const [min, red, mes] = await Promise.all([
        supabase.from("ministries").select("id, name").eq("is_active", true).order("name"),
        supabase.from("redes").select("id, name").eq("is_active", true).order("name"),
        supabase.from("mesas").select("id, name").eq("is_active", true).order("name"),
      ]);
      return {
        ministerio: min.data ?? [],
        rede: red.data ?? [],
        mesa: mes.data ?? [],
      };
    },
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Informe o título do evento.");
      const startsAt = fromLocalInput(form.starts_at);
      if (!startsAt) throw new Error("Informe a data e hora de início.");
      if (form.scope !== "igreja" && !form.target_id)
        throw new Error(`Selecione ${SCOPE_LABEL[form.scope].toLowerCase()} do evento.`);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        kind: form.kind,
        scope: form.scope,
        ministry_id: form.scope === "ministerio" ? form.target_id : null,
        rede_id: form.scope === "rede" ? form.target_id : null,
        mesa_id: form.scope === "mesa" ? form.target_id : null,
        starts_at: startsAt,
        ends_at: fromLocalInput(form.ends_at),
        location: form.location.trim() || null,
        requires_rsvp: form.requires_rsvp,
        capacity: form.capacity ? Number(form.capacity) : null,
        is_featured: form.is_featured,
        status: form.status,
      };

      if (event) {
        const { error } = await supabase.from("events").update(payload).eq("id", event.id);
        if (error) throw error;
      } else {
        const { data: auth } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("events")
          .insert({ ...payload, created_by: auth.user?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda-events"] });
      toast.success(event ? "Evento atualizado." : "Evento criado.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const targetOptions = form.scope === "igreja" ? [] : (targets?.[form.scope] ?? []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {event ? "Editar evento" : "Novo evento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ev-title">Título</Label>
            <Input
              id="ev-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex.: Culto de Celebração"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.kind} onValueChange={(v) => set("kind", v as EventKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(KIND_LABEL).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Situação</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as EventStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Público</Label>
              <Select
                value={form.scope}
                onValueChange={(v) => setForm((f) => ({ ...f, scope: v as EventScope, target_id: "" }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SCOPE_LABEL).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.scope !== "igreja" && (
              <div className="space-y-2">
                <Label>{SCOPE_LABEL[form.scope]}</Label>
                <Select value={form.target_id} onValueChange={(v) => set("target_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {targetOptions.map((t: { id: string; name: string }) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ev-start">Início</Label>
              <Input
                id="ev-start"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set("starts_at", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-end">Término (opcional)</Label>
              <Input
                id="ev-end"
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set("ends_at", e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ev-loc">Local</Label>
              <Input
                id="ev-loc"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Templo Sede"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-cap">Vagas (opcional)</Label>
              <Input
                id="ev-cap"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-desc">Descrição</Label>
            <Textarea
              id="ev-desc"
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detalhes, orientações e o que levar."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between border border-border rounded-sm px-4 py-3">
              <span className="text-sm">Pedir confirmação</span>
              <Switch
                checked={form.requires_rsvp}
                onCheckedChange={(v) => set("requires_rsvp", v)}
              />
            </label>
            <label className="flex items-center justify-between border border-border rounded-sm px-4 py-3">
              <span className="text-sm">Destacar na agenda</span>
              <Switch
                checked={form.is_featured}
                onCheckedChange={(v) => set("is_featured", v)}
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : event ? "Salvar alterações" : "Criar evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
