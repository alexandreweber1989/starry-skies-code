import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const GRANTABLE = [
  { role: "admin_livraria" as const, label: "Livraria" },
  { role: "admin_cantina" as const, label: "Cantina" },
];

export const Route = createFileRoute("/_authenticated/membros")({
  head: () => ({ meta: [{ title: "Membros — IB Atos" }] }),
  component: MembrosPage,
});

function MembrosPage() {
  const [q, setQ] = useState("");
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, member_since")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["all-roles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id, user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({
      userId,
      role,
      existingId,
    }: {
      userId: string;
      role: "admin_livraria" | "admin_cantina";
      existingId?: string;
    }) => {
      const { error } = existingId
        ? await supabase.from("user_roles").delete().eq("id", existingId)
        : await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permissões atualizadas.");
      qc.invalidateQueries({ queryKey: ["all-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = data?.filter((p) =>
    !q.trim() ? true : (p.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader
        eyebrow="Corpo de Cristo"
        title="Membros"
        description="Todos os irmãos e irmãs cadastrados na plataforma."
      />
      <PageBody>
        <div className="mb-6 max-w-md">
          <Input placeholder="Buscar por nome ou e-mail..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="border border-border bg-card rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Telefone</th>
                {isAdmin && (
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Administra
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered?.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">{p.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.phone ?? "—"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {GRANTABLE.map(({ role, label }) => {
                          const existing = roles?.find((r) => r.user_id === p.id && r.role === role);
                          return (
                            <Button
                              key={role}
                              size="sm"
                              variant={existing ? "default" : "outline"}
                              onClick={() =>
                                toggleRole.mutate({ userId: p.id, role, existingId: existing?.id })
                              }
                            >
                              {label}
                            </Button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered && filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 4 : 3} className="px-4 py-6 text-center text-muted-foreground">Nenhum membro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PageBody>
    </>
  );
}