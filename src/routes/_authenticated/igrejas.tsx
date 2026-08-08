import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Church, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { ChurchDialog, EditChurchButton } from "@/components/admin/church-dialog";

export const Route = createFileRoute("/_authenticated/igrejas")({
  head: () => ({
    meta: [
      { title: "Igrejas — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Cadastro das igrejas e congregações da Igreja Batista Atos, com cidade, contato e pastor responsável.",
      },
      { property: "og:title", content: "Igrejas — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Sede e congregações em outras cidades, com os membros vinculados a cada casa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IgrejasPage,
});

function IgrejasPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    throw new Error("Acesso negado. Apenas administradores gerais podem gerenciar igrejas.");
  }

  const { data: churches } = useQuery({
    queryKey: ["churches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("churches")
        .select("*")
        .order("is_headquarters", { ascending: false })
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["church-member-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("church_id");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.church_id) map[row.church_id] = (map[row.church_id] ?? 0) + 1;
      }
      return map;
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Uma família, várias casas"
        title="Igrejas"
        description="Ponto de partida do cadastro: Igreja → Ministérios → Redes → Mesas → Pastores, Apascentadores e Líderes → Membros. Cada ministério, rede e mesa pertence a uma igreja."
        actions={isAdmin ? <ChurchDialog /> : undefined}
      />
      <PageBody>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {churches?.map((c: any) => (
            <div key={c.id} className="border border-border bg-card p-6 rounded-sm">
              <div className="flex items-start justify-between gap-3">
                <Church className="h-5 w-5 text-primary" />
                <div className="flex items-center gap-2">
                  {c.is_headquarters && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Sede</span>
                  )}
                  {isAdmin && <EditChurchButton church={c} />}
                </div>
              </div>
              <h2 className="font-serif text-2xl mt-4">{c.name}</h2>
              {c.lead_pastor && (
                <p className="mt-1 text-sm text-muted-foreground">Pastor(a): {c.lead_pastor}</p>
              )}
              <div className="mt-4 space-y-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {(c.city || c.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> {c.city}
                    {c.state ? `/${c.state}` : ""}
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-end justify-between">
                <div className="font-serif text-3xl leading-none">
                  {(counts?.[c.id] ?? 0).toString().padStart(2, "0")}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  membros vinculados
                </div>
              </div>
              {!c.is_active && (
                <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Inativa
                </div>
              )}
            </div>
          ))}
        </div>
        {churches && churches.length === 0 && (
          <p className="text-muted-foreground">
            Nenhuma igreja cadastrada ainda. Comece pela sede.
          </p>
        )}
      </PageBody>
    </>
  );
}
