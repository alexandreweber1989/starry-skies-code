import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sprout } from "lucide-react";
import { PageBody, PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OnboardingTracker } from "@/components/membros/onboarding-tracker";
import { useOnboardingOverview } from "@/lib/onboarding";
import { useAuth } from "@/lib/auth-context";
import { initialsOf } from "@/lib/membros";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Integração de novos membros — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Trilha de integração dos novos membros: boas-vindas, curso, definição de mesa, batismo e ministério.",
      },
      { property: "og:title", content: "Integração de novos membros — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Acompanhe em que etapa cada novo membro está na trilha de integração.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingPage,
});

/** Diferença em dias entre hoje e uma data ISO. */
function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function OnboardingPage() {
  const { isAdmin, profile } = useAuth();
  const canEdit =
    isAdmin || ["pastor", "apascentador", "lider"].includes(profile?.church_function ?? "");
  const { rows, total, isLoading } = useOnboardingOverview();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (term && !r.person.full_name.toLowerCase().includes(term)) return false;
      if (status === "concluidos") return total > 0 && r.done >= total;
      if (status === "andamento") return r.done > 0 && r.done < total;
      if (status === "nao_iniciados") return r.done === 0;
      return true;
    });
  }, [rows, search, status, total]);

  return (
    <>
      <PageHeader
        eyebrow="Comunidade"
        title="Integração de novos membros"
        description="Acompanhe a trilha de cada pessoa que chegou: boas-vindas, curso, mesa, batismo e ministério."
      />
      <PageBody>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="nao_iniciados">Ainda não iniciados</SelectItem>
              <SelectItem value="andamento">Em andamento</SelectItem>
              <SelectItem value="concluidos">Concluídos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && !list.length && (
          <p className="text-sm text-muted-foreground">Nenhum membro encontrado com esse filtro.</p>
        )}

        <ul className="space-y-3">
          {list.map((row) => {
            const pct = total ? Math.round((row.done / total) * 100) : 0;
            const parado = daysSince(row.lastAt);
            const aberto = openId === row.person.id;
            return (
              <li
                key={row.person.id}
                className="border border-border rounded-xl bg-card/50 backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(aberto ? null : row.person.id)}
                  className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="h-9 w-9 shrink-0 rounded-sm border border-border bg-muted grid place-items-center font-mono text-[11px]">
                    {initialsOf(row.person.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{row.person.full_name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {row.done}/{total} etapas
                      {row.done > 0 && row.done < total && parado !== null
                        ? ` · última há ${parado} dia(s)`
                        : ""}
                    </div>
                  </div>
                  <div className="sm:w-48 flex items-center gap-3">
                    <Progress value={pct} className="h-2 flex-1" />
                    {total > 0 && row.done >= total ? (
                      <Badge variant="secondary" className="gap-1">
                        <Sprout className="h-3 w-3" /> Integrado
                      </Badge>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground">{pct}%</span>
                    )}
                  </div>
                </button>
                {aberto && (
                  <div className="border-t border-border p-4">
                    <OnboardingTracker
                      personId={row.person.id}
                      enabled
                      canEdit={canEdit}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </PageBody>
    </>
  );
}
