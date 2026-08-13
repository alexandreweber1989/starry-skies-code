import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/noticias")({
  component: NoticiasPage,
});

function NoticiasPage() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*, author:author_id")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div style={{ "--group-primary": "#f97316" } as React.CSSProperties}>
      <PageHeader
        eyebrow="Comunidade"
        title="Portal de Notícias"
        className="border-b-[3px] border-[var(--group-primary)]"
        description="Fique por dentro de tudo o que acontece na Igreja Batista Atos."
      />
      <PageBody>
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[400px] rounded-xl" />
            ))}
          </div>
        ) : news?.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-xl bg-muted/10">
            <Newspaper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notícia publicada no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news?.map((post) => (
              <Card key={post.id} className="group overflow-hidden border-border/50 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-500 flex flex-col">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground/20">
                      <Newspaper className="h-12 w-12" />
                    </div>
                  )}
                  {post.category && (
                    <Badge className="absolute top-4 left-4 bg-orange-500 border-none uppercase text-[9px] tracking-widest font-bold">
                      {post.category}
                    </Badge>
                  )}
                </div>
                <CardHeader className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.published_at).toLocaleDateString("pt-BR")}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author?.full_name || "Comunicação"}</span>
                  </div>
                  <CardTitle className="text-2xl font-serif leading-tight group-hover:text-orange-500 transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" className="w-full group/btn font-mono text-[10px] uppercase tracking-widest border border-border/50 hover:bg-orange-500 hover:text-white transition-all">
                    Ler matéria completa <ArrowRight className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageBody>
    </div>
  );
}
