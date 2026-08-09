import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingRegion, CardGridSkeleton } from "@/components/ui/loading-states";
import { Heart, Target, TrendingUp, Users, Gift, PlusCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/igrejas")({
  component: SocialActionPage,
});

function SocialActionPage() {
  const { data: campaigns, isPending } = useQuery({
    queryKey: ["social-campaigns"],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_assistance_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["social-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_assistance_requests")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const familiesInNeed = requests?.filter((r) => r.status === "pending").length || 0;
  const familiesReached =
    campaigns?.reduce((acc, curr) => acc + (curr.total_families_reached || 0), 0) || 0;

  return (
    <div style={{ "--group-primary": "#f43f5e" } as React.CSSProperties}>
      <PageHeader
        eyebrow="Ação Social"
        title="Atos de Amor"
        className="border-b-[3px] border-[var(--group-primary)]"
        description="Gestão de assistência social, campanhas de doação e apoio à comunidade."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 hover:text-[var(--group-primary)] transition-colors"
            >
              <Users className="h-4 w-4" />
              Ver Famílias
            </Button>
            <Button className="gap-2" style={{ backgroundColor: "var(--group-primary)" }}>
              <PlusCircle className="h-4 w-4" />
              Nova Campanha
            </Button>
          </div>
        }
      />
      <PageBody>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-serif text-2xl mb-6">Campanhas Ativas</h2>
              <div className="grid gap-6">
                {isPending ? (
                  <LoadingRegion label="Carregando campanhas…" className="contents">
                    <CardGridSkeleton count={2} className="grid gap-6" />
                  </LoadingRegion>
                ) : campaigns?.length === 0 ? (
                  <Card className="border-dashed p-12 flex flex-col items-center justify-center text-center">
                    <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle>Nenhuma campanha no momento</CardTitle>
                    <CardDescription>
                      Fique atento às próximas ações sociais da igreja.
                    </CardDescription>
                  </Card>
                ) : (
                  campaigns?.map((campaign) => {
                    const progress = campaign.goal_target
                      ? ((campaign.goal_current ?? 0) / campaign.goal_target) * 100
                      : 0;
                    return (
                      <Card key={campaign.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-start justify-between">
                          <div>
                            <CardTitle className="text-xl mb-1">{campaign.title}</CardTitle>
                            <CardDescription>{campaign.description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                            {campaign.goal_type}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {campaign.goal_target && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm font-mono uppercase tracking-wider">
                                <span className="text-muted-foreground">Progresso</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Arrecadado: {campaign.goal_current}</span>
                                <span>Meta: {campaign.goal_target}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex gap-3">
                            <Button className="flex-1 gap-2">
                              <Gift className="h-4 w-4" />
                              Quero Ajudar
                            </Button>
                            <Button variant="outline" size="icon">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <Card className="bg-foreground text-background">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Impacto Social
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <div className="text-3xl font-serif">{familiesReached}+</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-70">
                    Famílias Atendidas
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-serif text-primary">{familiesInNeed}</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-70">
                    Famílias Aguardando
                  </div>
                </div>
                <div className="space-y-1 pt-4 border-t border-background/20">
                  <div className="text-3xl font-serif">1.2t</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-70">
                    Total Arrecadado
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Próximas Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="h-10 w-10 shrink-0 bg-muted rounded-sm flex items-center justify-center font-serif text-lg">
                    20
                  </div>
                  <div>
                    <div className="text-sm font-medium">Bazar Solidário</div>
                    <div className="text-xs text-muted-foreground">Sábado, às 09:00 no Anexo 2</div>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="h-10 w-10 shrink-0 bg-muted rounded-sm flex items-center justify-center font-serif text-lg">
                    28
                  </div>
                  <div>
                    <div className="text-sm font-medium">Entrega de Cestas</div>
                    <div className="text-xs text-muted-foreground">
                      Domingo após o culto da manhã
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </PageBody>
    </div>
  );
}
