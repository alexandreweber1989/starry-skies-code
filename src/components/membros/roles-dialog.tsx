import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateMemberRoles } from "@/lib/members.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Role = "admin_geral" | "admin_livraria" | "admin_cantina" | "admin_kids" | "membro";

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "membro", label: "Membro", description: "Acesso padrão à plataforma." },
  { value: "admin_geral", label: "Admin geral", description: "Acesso e edição total em tudo." },
  { value: "admin_livraria", label: "Admin livraria", description: "Produtos e fila de pedidos." },
  { value: "admin_cantina", label: "Admin cantina", description: "Cardápios, itens e reservas." },
  { value: "admin_kids", label: "Admin kids", description: "Crianças, sessões e check-in." },
];

/** Concessão e remoção de papéis globais de acesso (somente admin geral). */
export function MemberRolesDialog({ userId, fullName }: { userId: string; fullName: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Role[]>([]);
  const qc = useQueryClient();
  const save = useServerFn(updateMemberRoles);

  const { data: current } = useQuery({
    queryKey: ["member-roles", userId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, ministry_id, mesa_id")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? [])
        .filter((r: any) => !r.ministry_id && !r.mesa_id)
        .map((r: any) => r.role as Role)
        .filter((r) => ROLES.some((o) => o.value === r));
    },
  });

  useEffect(() => {
    if (current) setSelected(current);
  }, [current]);

  const mutation = useMutation({
    mutationFn: async () => save({ data: { user_id: userId, roles: selected } }),
    onSuccess: () => {
      toast.success("Permissões atualizadas.");
      qc.invalidateQueries({ queryKey: ["member-roles", userId] });
      qc.invalidateQueries({ queryKey: ["member-links", userId] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (role: Role) =>
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShieldCheck className="h-4 w-4" /> Permissões
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Permissões e Liderança</DialogTitle>
          <DialogDescription>
            Defina o nível de acesso e os grupos que {fullName} lidera.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {ROLES.map((role) => {
            const active = selected.includes(role.value);
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => toggle(role.value)}
                aria-pressed={active}
                className={`w-full text-left rounded-sm border px-4 py-3 transition-colors ${
                  active ? "border-primary bg-primary/5" : "border-border hover:border-foreground"
                }`}
              >
                <div className="font-mono text-[11px] uppercase tracking-widest">{role.label}</div>
                <div className="text-sm text-muted-foreground">{role.description}</div>
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar permissões"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
