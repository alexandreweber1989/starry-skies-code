import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Library, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  FileVideo,
  Image as ImageIcon,
  Layout,
  Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/louvor")({
  component: MediaModule,
});

function MediaModule() {
  const { isAdmin } = useAuth();

  const { data: assets } = useQuery({
    queryKey: ["media-assets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    }
  });

  const { data: requests } = useQuery({
    queryKey: ["media-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("media_requests")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    }
  });

  return (
    <>
      <PageHeader
        eyebrow="Comunicação"
        title="Central de Mídia"
        description="Biblioteca de ativos, logos, artes e central de solicitações para o time de design."
        actions={
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nova Solicitação
          </Button>
        }
      />
      <PageBody>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl">Biblioteca de Ativos</h2>
                <div className="flex gap-2">
                   <Badge variant="outline" className="cursor-pointer">Todos</Badge>
                   <Badge variant="outline" className="cursor-pointer">Identidade</Badge>
                   <Badge variant="outline" className="cursor-pointer">Templates</Badge>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {assets?.length === 0 ? (
                  <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center">
                    <Library className="h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle>Nenhum ativo disponível</CardTitle>
                    <CardDescription>A biblioteca de mídia ainda está sendo populada.</CardDescription>
                  </Card>
                ) : (
                  assets?.map(asset => (
                    <Card key={asset.id} className="overflow-hidden group">
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        {asset.thumbnail_url ? (
                          <img src={asset.thumbnail_url} alt={asset.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2 uppercase text-[10px] tracking-wider">
                          {asset.category}
                        </Badge>
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{asset.title}</CardTitle>
                        <CardDescription className="line-clamp-1">{asset.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Button variant="secondary" size="sm" className="w-full" asChild>
                          <a href={asset.file_url} target="_blank" rel="noopener noreferrer">Baixar Arquivo</a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="font-serif text-2xl mb-6">Categorias Rápidas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Logos", icon: Layout },
                  { label: "Vídeos", icon: FileVideo },
                  { label: "Fontes", icon: Type },
                  { label: "Sociais", icon: ImageIcon },
                ].map(cat => (
                  <Button key={cat.label} variant="outline" className="h-24 flex flex-col gap-2">
                    <cat.icon className="h-6 w-6" />
                    <span className="font-mono text-[10px] uppercase tracking-wider">{cat.label}</span>
                  </Button>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Minhas Solicitações
                </CardTitle>
                <CardDescription>Acompanhe o status das suas artes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {requests?.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Você não possui solicitações pendentes.</p>
                ) : (
                  requests?.map(req => (
                    <div key={req.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-sm">{req.title}</div>
                        <Badge variant={req.status === 'concluido' ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                          {req.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {req.deadline ? `Prazo: ${new Date(req.deadline).toLocaleDateString('pt-BR')}` : 'Sem prazo'}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest font-mono">Dica de Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  Utilize sempre os logos oficiais da IB Atos. Para posts de mesas, prefira fundos limpos e tipografia Plus Jakarta Sans.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </PageBody>
    </>
  );
}