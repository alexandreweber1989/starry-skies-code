import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/membros")({
  head: () => ({ meta: [{ title: "Membros — IB Atos" }] }),
  component: MembrosPage,
});

function MembrosPage() {
  const [q, setQ] = useState("");
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
              </tr>
            </thead>
            <tbody>
              {filtered?.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">{p.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.phone ?? "—"}</td>
                </tr>
              ))}
              {filtered && filtered.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Nenhum membro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PageBody>
    </>
  );
}