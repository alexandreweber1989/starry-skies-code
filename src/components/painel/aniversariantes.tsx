import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ageFrom, initialsOf } from "@/lib/painel";
import { Button } from "@/components/ui/button";
import { PanelSection, EmptyLine, Initials } from "./ui";

interface BirthdayRow {
  id: string;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
}

/** Aniversariantes do mês corrente, ordenados por dia. */
export function Aniversariantes() {
  const { data, isLoading } = useQuery({
    queryKey: ["painel-aniversariantes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, birth_date, phone")
        .not("birth_date", "is", null)
        .eq("membership_status", "ativo");
      if (error) throw error;
      return data as BirthdayRow[];
    },
  });

  const mes = String(new Date().getMonth() + 1).padStart(2, "0");
  const hojeDia = new Date().getDate();

  const lista = (data ?? [])
    .filter((p) => p.birth_date?.slice(5, 7) === mes)
    .sort((a, b) => (a.birth_date ?? "").slice(8, 10).localeCompare((b.birth_date ?? "").slice(8, 10)));

  return (
    <PanelSection
      label="Comunhão"
      title="Aniversariantes do mês"
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/membros">Ver membros</Link>
        </Button>
      }
    >
      {isLoading && <EmptyLine>Carregando…</EmptyLine>}
      {!isLoading && lista.length === 0 && <EmptyLine>Nenhum aniversariante neste mês.</EmptyLine>}
      <ul className="grid sm:grid-cols-2 gap-3">
        {lista.slice(0, 8).map((p) => {
          const dia = Number(p.birth_date!.slice(8, 10));
          const hoje = dia === hojeDia;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 border rounded-sm p-3 ${
                hoje ? "border-primary" : "border-border"
              }`}
            >
              <Initials text={initialsOf(p.full_name)} />
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{p.full_name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Dia {String(dia).padStart(2, "0")}
                  {ageFrom(p.birth_date) !== null ? ` · ${ageFrom(p.birth_date)} anos` : ""}
                </div>
              </div>
              {hoje && <Cake className="h-4 w-4 text-primary" />}
            </li>
          );
        })}
      </ul>
      {lista.length > 8 && (
        <p className="text-xs text-muted-foreground mt-4">
          + {lista.length - 8} outros aniversariantes neste mês.
        </p>
      )}
    </PanelSection>
  );
}