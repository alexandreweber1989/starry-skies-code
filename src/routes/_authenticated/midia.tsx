import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { LoadingRegion, CardGridSkeleton } from "@/components/ui/loading-states";
import {
  Library,
  PlusCircle,
  Clock,
  FileVideo,
  Image as ImageIcon,
  Layout,
  Type,
  Search,
  Filter,
  Download,
  ExternalLink,
  MessageSquarePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveStreamCard } from "@/components/midia/live-stream-card";
import { Video, MonitorPlay, Play } from "lucide-react";



export const Route = createFileRoute("/_authenticated/midia")({
  component: MediaModule,
});

function MediaModule() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("library");

  const { data: assets, isPending } = useQuery({
    queryKey: ["media-assets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["media-requests"],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("media_requests")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filteredAssets = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return assets ?? [];
    return (assets ?? []).filter(a => 
      a.title.toLowerCase().includes(term) || 
      (a.description && a.description.toLowerCase().includes(term)) ||
      a.category.toLowerCase().includes(term)
    );
  }, [assets, q]);

  return (
    <>
      <PageHeader
        eyebrow="Comunicação"
        title="Central de Mídia"
        className="border-b-[3px] border-[var(--group-primary)]"
        description="Biblioteca de ativos, logos, artes e central de solicitações para o time de design da IB Atos."
        actions={
          <Button className="gap-2 shadow-lg shadow-pink-500/20" style={{ backgroundColor: "var(--group-primary)" }}>
            <MessageSquarePlus className="h-4 w-4" />
            Nova Solicitação
          </Button>
        }
      />
      <PageBody>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="library" className="gap-2">
                <Library className="h-4 w-4" />
                <span>Biblioteca</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2">
                <Clock className="h-4 w-4" />
                <span>Solicitações</span>
                {requests && requests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 bg-pink-500/10 text-pink-500 border-none">
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="live" className="gap-2">
                <MonitorPlay className="h-4 w-4" />
                <span>Transmissão</span>
              </TabsTrigger>
            </TabsList>


            {activeTab === "library" && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar ativos..." 
                  className="pl-9 bg-muted/30 border-border/50"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            )}
          </div>

          <TabsContent value="library" className="mt-0 space-y-8 animate-in fade-in duration-500">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isPending ? (
                    <LoadingRegion label="Carregando biblioteca de mídia…" className="contents">
                      <CardGridSkeleton count={6} className="contents" />
                    </LoadingRegion>
                  ) : filteredAssets.length === 0 ? (
                    <Card className="col-span-full border-dashed p-16 flex flex-col items-center justify-center text-center bg-muted/5">
                      <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                        <Library className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <CardTitle className="text-xl mb-2">Nenhum ativo encontrado</CardTitle>
                      <CardDescription>
                        Tente ajustar sua busca ou explore as categorias laterais.
                      </CardDescription>
                    </Card>
                  ) : (
                    filteredAssets.map((asset) => (
                      <Card key={asset.id} className="overflow-hidden group hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-300 border-border/50 hover:border-pink-500/30">
                        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                          {asset.thumbnail_url ? (
                            <img
                              src={asset.thumbnail_url}
                              alt={asset.title}
                              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <Badge className="uppercase text-[9px] tracking-widest bg-pink-500 border-none">
                              {asset.category}
                            </Badge>
                          </div>
                        </div>
                        <CardHeader className="p-4 space-y-1">
                          <CardTitle className="text-lg group-hover:text-pink-500 transition-colors">{asset.title}</CardTitle>
                          {asset.description && (
                            <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                              {asset.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full font-mono text-[10px] uppercase tracking-wider group-hover:bg-pink-500 group-hover:text-white transition-colors"
                            asChild
                          >
                            <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3.5 w-3.5 mr-2" /> Baixar Ativo
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <aside className="space-y-8">
                <section className="space-y-4">
                  <h3 className="font-serif text-xl px-1">Categorias</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Logos", icon: Layout, color: "text-blue-500" },
                      { label: "Vídeos", icon: FileVideo, color: "text-red-500" },
                      { label: "Fontes", icon: Type, color: "text-amber-500" },
                      { label: "Fotos", icon: ImageIcon, color: "text-green-500" },
                    ].map((cat) => (
                      <Button
                        key={cat.label}
                        variant="outline"
                        className="h-20 flex flex-col gap-2 border-border/50 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group"
                      >
                        <cat.icon className={`h-6 w-6 ${cat.color} group-hover:scale-110 transition-transform`} />
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold">
                          {cat.label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </section>

                <Card className="bg-pink-500/5 border-pink-500/20 shadow-none overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <ImageIcon className="h-20 w-20 text-pink-500" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase tracking-widest font-mono text-pink-500">
                      Brand Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Nossa identidade visual reflete nossa essência. Use sempre os logos oficiais. Para posts de mesas, prefira fundos limpos e a tipografia Plus Jakarta Sans.
                    </p>
                    <Button variant="link" className="p-0 h-auto text-[10px] uppercase tracking-widest text-pink-500 mt-3 font-bold">
                      Ver manual completo <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-0 animate-in slide-in-from-right-4 duration-500">
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-3xl">Fluxo de Criação</h2>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                    Designers Online
                  </div>
                </div>

                {requests?.length === 0 ? (
                  <Card className="border-dashed p-20 flex flex-col items-center justify-center text-center bg-muted/5">
                    <MessageSquarePlus className="h-12 w-12 text-muted-foreground/30 mb-6" />
                    <CardTitle>Nenhuma solicitação ativa</CardTitle>
                    <CardDescription className="max-w-xs mx-auto mt-2">
                      Precisa de uma arte para seu ministério ou rede? Clique no botão "Nova Solicitação" para começar.
                    </CardDescription>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {requests?.map((req) => (
                      <Card key={req.id} className="hover:border-pink-500/30 transition-colors">
                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium text-lg">{req.title}</h3>
                              <Badge
                                variant={req.status === "concluido" ? "default" : "secondary"}
                                className={`text-[9px] px-2 py-0.5 uppercase tracking-wider border-none ${
                                  req.status === "concluido" ? "bg-green-500" : 
                                  req.status === "em_producao" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {req.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{req.description || "Sem descrição adicional."}</p>
                            <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Prazo: {req.deadline ? new Date(req.deadline).toLocaleDateString("pt-BR") : "A definir"}</span>
                              <span className="flex items-center gap-1"><Layout className="h-3 w-3" /> Tipo: Social</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm" className="h-9 px-4 font-mono text-[10px] uppercase tracking-wider">
                              Ver Detalhes
                            </Button>
                            {req.status === "concluido" && (
                              <Button size="sm" className="h-9 px-4 bg-pink-500 hover:bg-pink-600 font-mono text-[10px] uppercase tracking-wider">
                                Baixar Entrega
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
             </div>
          </TabsContent>

          <TabsContent value="live" className="mt-0 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <LiveStreamCard />
                </div>
                <div className="space-y-6">
                  <Card className="bg-muted/30 border-none shadow-none">
                    <CardHeader>
                      <CardTitle className="text-sm font-mono uppercase tracking-widest text-primary flex items-center gap-2">
                        <Video className="h-4 w-4" /> Playlist
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Acesse todos os cultos, pregações e momentos especiais da IB Atos em nosso canal oficial.
                      </p>
                      <div className="space-y-2">
                        {[
                          "Cultos de Celebração",
                          "Série de Mensagens",
                          "Louvor e Adoração",
                          "Podcast Atos"
                        ].map(item => (
                          <div key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                            <div className="h-8 w-8 rounded bg-red-600/10 flex items-center justify-center">
                              <Play className="h-3 w-3 text-red-600 fill-current" />
                            </div>
                            <span className="text-xs font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      </PageBody>
    </>
  );
}
