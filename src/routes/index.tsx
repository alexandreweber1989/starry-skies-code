import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Church, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Igreja Batista Atos" },
      { name: "description", content: "Plataforma da Igreja Batista Atos — ministérios, redes, mesas e comunidade em um só lugar." },
      { property: "og:title", content: "Igreja Batista Atos" },
      { property: "og:description", content: "Plataforma oficial dos ministérios da Igreja Batista Atos." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Church className="h-5 w-5 text-primary" />
            <div>
              <div className="font-serif text-lg leading-none">Igreja Batista Atos</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">
                Plataforma dos ministérios
              </div>
            </div>
          </div>
          <div>
            {loading ? null : user ? (
              <Button asChild>
                <Link to="/dashboard">Entrar no painel <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 lg:px-10 py-20 lg:py-32 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">
              Um corpo · muitos ministérios · uma missão
            </div>
            <h1 className="font-serif text-5xl lg:text-7xl leading-[1.05] tracking-tight">
              A casa digital da Igreja Batista Atos.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Escalas, mesas, redes, kids, louvor, mídia, Atos de Amor — tudo em um só lugar,
              pensado para pastores, líderes e cada membro do corpo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Acessar plataforma <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-4 border-l border-border pl-8 space-y-6 text-sm text-muted-foreground">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">Ministérios</div>
              <div className="font-serif text-4xl text-foreground mt-1">09</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">Redes</div>
              <div className="font-serif text-4xl text-foreground mt-1">04</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">Comunhão semanal</div>
              <div className="font-serif text-2xl text-foreground mt-1">nas Mesas</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Igreja Batista Atos · Plataforma interna
        </div>
      </footer>
    </div>
  );
}
