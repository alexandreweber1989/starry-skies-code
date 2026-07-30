import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FUNCTION_GROUPS, functionGroupId, initials } from "@/lib/louvor";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  function_name: string;
  is_titular: boolean;
  user_id: string;
  team: { name: string } | null;
  profiles: { full_name: string; phone: string | null; avatar_url: string | null } | null;
}

/** Elenco do louvor agrupado por naipe (vozes, cordas, teclas, ritmo, sopros, técnica). */
export function Elenco() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["louvor-elenco"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_team_members")
        .select("id, function_name, is_titular, user_id, team:worship_teams(name), profiles:profiles(full_name, phone, avatar_url)")
        .order("function_name");
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (group && functionGroupId(r.function_name) !== group) return false;
      if (!q) return true;
      return (
        (r.profiles?.full_name ?? "").toLowerCase().includes(q) ||
        r.function_name.toLowerCase().includes(q) ||
        (r.team?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, query, group]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of data ?? []) {
      const id = functionGroupId(r.function_name);
      map[id] = (map[id] ?? 0) + 1;
    }
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-sm" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, função ou equipe"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar integrante do louvor"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGroup(null)}
            className={cn(
              "px-3 py-1.5 rounded-sm border font-mono text-[10px] uppercase tracking-widest transition-colors",
              group === null ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted",
            )}
          >
            Todos ({data?.length ?? 0})
          </button>
          {FUNCTION_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(group === g.id ? null : g.id)}
              className={cn(
                "px-3 py-1.5 rounded-sm border font-mono text-[10px] uppercase tracking-widest transition-colors",
                group === g.id ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted",
              )}
            >
              {g.label} ({counts[g.id] ?? 0})
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r, i) => (
          <article
            key={r.id}
            className="group border border-border bg-card rounded-sm p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${Math.min(i, 12) * 30}ms`, animationFillMode: "backwards" }}
          >
            <span className="h-12 w-12 shrink-0 rounded-full border border-border grid place-items-center font-mono text-xs transition-colors group-hover:bg-foreground group-hover:text-background">
              {initials(r.profiles?.full_name ?? "?")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="block truncate font-medium">{r.profiles?.full_name ?? "—"}</span>
                {r.is_titular && <Star className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Titular" />}
              </span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1 truncate">
                {r.function_name}
              </span>
              <span className="inline-block mt-2 border border-border px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {r.team?.name ?? "Sem equipe"}
              </span>
            </span>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhum integrante encontrado.</p>}
    </div>
  );
}