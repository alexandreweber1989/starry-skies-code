import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PanelSection } from "@/components/painel/ui";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Gráficos do Painel.
 *
 * Movimento: o recharts anima as barras na entrada. Como o Painel é a primeira
 * tela após o login (frequência alta), a animação é curta e some por completo
 * quando o usuário pede redução de movimento.
 *
 * Acessibilidade: o gráfico nunca é a única fonte da informação — cada bloco
 * traz também um resumo em texto, lido por leitores de tela.
 */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function usaMovimentoReduzido() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function GraficoSkeleton() {
  return (
    <div className="flex h-[220px] items-end gap-3" aria-hidden="true">
      {[45, 70, 55, 85, 62, 95].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function SemDados({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-sm border border-dashed border-border">
      <p className="max-w-xs text-center text-sm text-muted-foreground">{mensagem}</p>
    </div>
  );
}

/** Novos membros por mês nos últimos 12 meses. */
export function CrescimentoMembros() {
  const semMovimento = usaMovimentoReduzido();

  const { data, isPending } = useQuery({
    queryKey: ["grafico-crescimento-membros"],
    queryFn: async () => {
      const inicio = new Date();
      inicio.setMonth(inicio.getMonth() - 11);
      inicio.setDate(1);

      const { data, error } = await supabase
        .from("profiles")
        .select("member_since, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Monta os 12 baldes de mês, para que meses sem entrada apareçam como zero
      // em vez de sumirem do eixo (o buraco distorceria a leitura da tendência).
      const baldes = new Map<string, { mes: string; novos: number }>();
      for (let i = 0; i < 12; i++) {
        const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
        baldes.set(`${d.getFullYear()}-${d.getMonth()}`, {
          mes: MESES[d.getMonth()],
          novos: 0,
        });
      }

      for (const p of data ?? []) {
        const bruto = p.member_since ?? p.created_at;
        if (!bruto) continue;
        const d = new Date(bruto);
        if (Number.isNaN(d.getTime())) continue;
        const chave = `${d.getFullYear()}-${d.getMonth()}`;
        const balde = baldes.get(chave);
        if (balde) balde.novos += 1;
      }

      return Array.from(baldes.values());
    },
  });

  const total = useMemo(() => (data ?? []).reduce((s, d) => s + d.novos, 0), [data]);

  const config = {
    novos: { label: "Novos membros", color: "var(--primary)" },
  } satisfies ChartConfig;

  return (
    <PanelSection label="Crescimento" title="Novos membros por mês">
      {isPending ? (
        <GraficoSkeleton />
      ) : total === 0 ? (
        <SemDados mensagem="Ainda não há membros com data de entrada registrada nos últimos 12 meses." />
      ) : (
        <>
          <p className="sr-only">
            {`Nos últimos 12 meses entraram ${total} membros. Por mês: ` +
              (data ?? []).map((d) => `${d.mes}: ${d.novos}`).join(", ")}
          </p>
          <ChartContainer config={config} className="h-[220px] w-full aspect-auto">
            <BarChart data={data} margin={{ left: -20, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar
                dataKey="novos"
                fill="var(--color-novos)"
                radius={[3, 3, 0, 0]}
                isAnimationActive={!semMovimento}
                animationDuration={320}
              />
            </BarChart>
          </ChartContainer>
          <p className="mt-3 text-xs text-muted-foreground">
            {total} {total === 1 ? "novo membro" : "novos membros"} nos últimos 12 meses.
          </p>
        </>
      )}
    </PanelSection>
  );
}

/** Quantidade de membros por rede. */
export function DistribuicaoPorRede() {
  const semMovimento = usaMovimentoReduzido();

  const { data, isPending } = useQuery({
    queryKey: ["grafico-distribuicao-redes"],
    queryFn: async () => {
      const [{ data: redes, error: erroRedes }, { data: vinculos, error: erroVinculos }] =
        await Promise.all([
          supabase.from("redes").select("id, name").eq("is_active", true).order("name"),
          supabase.from("rede_members").select("rede_id"),
        ]);
      if (erroRedes) throw erroRedes;
      if (erroVinculos) throw erroVinculos;

      const contagem = new Map<string, number>();
      for (const v of vinculos ?? []) {
        if (!v.rede_id) continue;
        contagem.set(v.rede_id, (contagem.get(v.rede_id) ?? 0) + 1);
      }

      return (redes ?? [])
        .map((r) => ({ rede: r.name, membros: contagem.get(r.id) ?? 0 }))
        .sort((a, b) => b.membros - a.membros);
    },
  });

  const total = useMemo(() => (data ?? []).reduce((s, d) => s + d.membros, 0), [data]);

  const config = {
    membros: { label: "Membros", color: "var(--primary)" },
  } satisfies ChartConfig;

  return (
    <PanelSection label="Comunhão" title="Membros por rede">
      {isPending ? (
        <GraficoSkeleton />
      ) : !data || data.length === 0 ? (
        <SemDados mensagem="Nenhuma rede cadastrada ainda. Cadastre as redes para ver a distribuição." />
      ) : total === 0 ? (
        <SemDados mensagem="As redes existem, mas ainda não há membros vinculados a elas." />
      ) : (
        <>
          <p className="sr-only">
            {`Distribuição de ${total} vínculos entre as redes: ` +
              data.map((d) => `${d.rede}: ${d.membros}`).join(", ")}
          </p>
          <ChartContainer config={config} className="h-[220px] w-full aspect-auto">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="rede" tickLine={false} axisLine={false} width={110} />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar
                dataKey="membros"
                fill="var(--color-membros)"
                radius={[0, 3, 3, 0]}
                isAnimationActive={!semMovimento}
                animationDuration={320}
              />
            </BarChart>
          </ChartContainer>
          <p className="mt-3 text-xs text-muted-foreground">
            {data.length} {data.length === 1 ? "rede ativa" : "redes ativas"} · {total}{" "}
            {total === 1 ? "vínculo" : "vínculos"}.
          </p>
        </>
      )}
    </PanelSection>
  );
}
