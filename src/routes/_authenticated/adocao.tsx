import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Smartphone,
  BellRing,
  Users,
  Activity,
  Apple,
  Monitor,
  Copy,
  Megaphone,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, PageBody } from "@/components/app-shell";
import { StatTile, PanelSection, EmptyLine } from "@/components/painel/ui";
import { StatTileSkeleton } from "@/components/ui/loading-states";
import { Button } from "@/components/ui/button";
import { estatisticasAdocao, type EnvioResumo } from "@/lib/adocao.functions";

export const Route = createFileRoute("/_authenticated/adocao")({
  head: () => ({ meta: [{ title: "Adoção do app — IB Atos" }] }),
  component: AdocaoPage,
});

const AUDIENCE_LABEL: Record<string, string> = {
  todos: "Todos",
  lideranca: "Liderança",
  mesa: "Mesa",
  rede: "Rede",
  ministerio: "Ministério",
  igreja: "Igreja",
  congregacao: "Igreja",
  teste: "Teste",
};

function labelPublico(a: string | null): string {
  if (!a) return "—";
  return AUDIENCE_LABEL[a] ?? a.charAt(0).toUpperCase() + a.slice(1);
}

function formatQuando(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Barra de proporção simples e monocromática. */
function Barra({ valor, total }: { valor: number; total: number }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

function AparelhoLinha({
  icon: Icon,
  label,
  valor,
  total,
}: {
  icon: typeof Apple;
  label: string;
  valor: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="w-20 shrink-0 text-sm">{label}</span>
      <div className="flex-1">
        <Barra valor={valor} total={total} />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums">{valor}</span>
    </div>
  );
}

function AdocaoPage() {
  const { isAdmin, loading } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adocao-stats"],
    enabled: isAdmin,
    queryFn: () => estatisticasAdocao(),
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader eyebrow="Carregando…" title="Adoção do app" description="Preparando os números de alcance." />
        <PageBody>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)}
          </div>
        </PageBody>
      </div>
    );
  }

  if (!isAdmin) {
    throw new Error("Acesso negado. Apenas administradores gerais podem ver a adoção do app.");
  }

  const totalAparelhos = data?.aparelhos ?? 0;

  function copiarSemApp() {
    const nomes = (data?.listaSemApp ?? []).map((p) => p.nome).join("\n");
    if (!nomes) return;
    navigator.clipboard
      .writeText(nomes)
      .then(() => toast.success("Lista copiada. Use para convidar por WhatsApp ou pessoalmente."))
      .catch(() => toast.error("Não foi possível copiar."));
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        eyebrow="Engajamento"
        title="Adoção do app"
        description="Quantos membros instalaram o app e realmente recebem as notificações da igreja — e quem ainda falta alcançar."
        actions={
          <Button asChild variant="outline">
            <Link to="/perfil">
              <BellRing className="h-4 w-4" /> Testar notificação
            </Link>
          </Button>
        }
      />
      <PageBody>
        {isError && (
          <div className="mb-6 rounded-sm border border-destructive/40 bg-destructive/5 p-4 text-sm">
            Não foi possível carregar os números de adoção. Recarregue a página.
          </div>
        )}

        {/* Aviso: notificações ainda não ativadas pela igreja */}
        {data && !data.pushConfigurado && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="font-medium">As notificações ainda não foram ativadas.</p>
              <p className="text-sm text-muted-foreground">
                Enquanto isso, ninguém recebe avisos no celular. Ative uma única vez em Meu perfil.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/perfil">Ativar agora</Link>
            </Button>
          </div>
        )}

        {/* Indicadores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                label="Taxa de adoção"
                value={`${data?.taxaAdocao ?? 0}%`}
                hint={data ? `${data.comApp} de ${data.totalMembros} membros` : undefined}
                icon={Activity}
              />
              <StatTile
                label="Com o app"
                value={data?.comApp ?? 0}
                hint="Recebem notificações"
                icon={Smartphone}
              />
              <StatTile label="Aparelhos" value={data?.aparelhos ?? 0} hint="Celulares e computadores" icon={BellRing} />
              <StatTile
                label="Ativos (30d)"
                value={data?.ativos30d ?? 0}
                hint="Usaram no último mês"
                icon={Users}
              />
            </>
          )}
        </div>

        {/* Progresso + aparelhos */}
        {data && (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <PanelSection label="Alcance" title="Quanto da igreja está no app">
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span className="font-serif text-4xl leading-none tabular-nums">{data.taxaAdocao}%</span>
                  <span className="text-sm text-muted-foreground">
                    {data.comApp} de {data.totalMembros}
                  </span>
                </div>
                <Barra valor={data.comApp} total={data.totalMembros || 1} />
                <p className="text-sm text-muted-foreground">
                  {data.semApp === 0
                    ? "Todos os membros cadastrados já estão no app. 🎉"
                    : `Faltam ${data.semApp} membro(s) para alcançar toda a igreja.`}
                </p>
              </div>
            </PanelSection>

            <PanelSection label="Por aparelho" title="Onde o app está instalado">
              {data.aparelhos === 0 ? (
                <EmptyLine>Nenhum aparelho ativo ainda.</EmptyLine>
              ) : (
                <div className="space-y-3">
                  <AparelhoLinha icon={Apple} label="iPhone" valor={data.porAparelho.ios} total={totalAparelhos} />
                  <AparelhoLinha icon={Smartphone} label="Android" valor={data.porAparelho.android} total={totalAparelhos} />
                  <AparelhoLinha icon={Monitor} label="Computador" valor={data.porAparelho.desktop} total={totalAparelhos} />
                  {data.porAparelho.outro > 0 && (
                    <AparelhoLinha icon={Smartphone} label="Outros" valor={data.porAparelho.outro} total={totalAparelhos} />
                  )}
                </div>
              )}
            </PanelSection>
          </div>
        )}

        {/* Quem ainda não instalou */}
        {data && (
          <div className="mt-8">
            <PanelSection
              label="Oportunidade"
              title={`Ainda sem o app (${data.semApp})`}
              action={
                data.listaSemApp.length > 0 ? (
                  <Button variant="ghost" size="sm" onClick={copiarSemApp}>
                    <Copy className="h-4 w-4" /> Copiar nomes
                  </Button>
                ) : undefined
              }
            >
              {data.semApp === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Toda a membresia cadastrada já instalou o app.
                </div>
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Essas pessoas não recebem avisos no celular. Como o push só chega a quem já tem o app, o
                    convite precisa ir por outro caminho — WhatsApp, no culto ou pela mesa. Mande o link{" "}
                    <span className="font-mono text-foreground">/instalar</span>.
                  </p>
                  <ul className="divide-y divide-border">
                    {data.listaSemApp.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                        <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{p.nome}</span>
                        {p.igreja && (
                          <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {p.igreja}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {data.semApp > data.listaSemApp.length && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Mostrando os primeiros {data.listaSemApp.length} de {data.semApp}.
                    </p>
                  )}
                </>
              )}
            </PanelSection>
          </div>
        )}

        {/* Últimos envios */}
        {data && (
          <div className="mt-8">
            <PanelSection
              label="Comunicação"
              title="Últimos envios"
              action={
                <Link to="/avisos" className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-primary hover:underline">
                  Novo aviso <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              {data.envios.length === 0 ? (
                <EmptyLine>Nenhuma notificação enviada ainda. Publique um aviso para começar.</EmptyLine>
              ) : (
                <div className="divide-y divide-border">
                  {data.envios.map((e: EnvioResumo, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-3 first:pt-0">
                      <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {labelPublico(e.audience)} · {formatQuando(e.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm tabular-nums">
                          {e.entregues}/{e.total}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">entregues</p>
                        {e.semAparelho > 0 && (
                          <p className="text-[10px] text-amber-500">{e.semAparelho} sem app</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PanelSection>
          </div>
        )}
      </PageBody>
    </div>
  );
}
