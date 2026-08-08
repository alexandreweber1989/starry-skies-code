import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Church,
  ArrowRight,
  ArrowUpRight,
  Music,
  Camera,
  Sparkles,
  Users,
  UserSquare2,
  Flame,
  Baby,
  HeartHandshake,
  Compass,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Igreja Batista Atos" },
      { name: "description", content: "Plataforma da Igreja Batista Atos — ministérios, redes, mesas e comunidade em um só lugar." },
      { property: "og:title", content: "Igreja Batista Atos" },
      { property: "og:description", content: "Plataforma da Igreja Batista Atos — ministérios, redes, mesas e comunidade em um só lugar." },
    ],
  }),
  component: Landing,
});

const pilares = [
  { n: "01", nome: "Mesa", desc: "Comunhão semanal, oração e Palavra ao redor da mesa — o berço dos discípulos." },
  { n: "02", nome: "Sacerdócio", desc: "Cada filho um sacerdote, servindo a Deus e ao próximo com vida consagrada." },
  { n: "03", nome: "Paternidade", desc: "Referência, cuidado e formação de identidade que sustenta gerações." },
  { n: "04", nome: "Adoração", desc: "Um povo que se ajoelha, entrega e vive uma vida inteira como louvor." },
  { n: "05", nome: "Ministério Quíntuplo", desc: "Apóstolos, profetas, evangelistas, pastores e mestres edificando o corpo." },
];

const ministerios = [
  { icon: Music, nome: "Louvor", tag: "Adoração" },
  { icon: Camera, nome: "Mídia", tag: "Comunicação" },
  { icon: Sparkles, nome: "Dança", tag: "Expressão" },
  { icon: Users, nome: "Mulheres · Sabaoth", tag: "Rede" },
  { icon: UserSquare2, nome: "Homens · Zadoque", tag: "Rede" },
  { icon: Flame, nome: "Jovens", tag: "Rede" },
  { icon: Compass, nome: "Adolescentes", tag: "Formação" },
  { icon: Baby, nome: "Kids", tag: "Infância" },
  { icon: HeartHandshake, nome: "Atos de Amor", tag: "Ação social" },
];

function Landing() {
  const { user, loading } = useAuth();
  const cta = !loading && user
    ? { to: "/dashboard", label: "Entrar no painel" }
    : { to: "/auth", label: "Acessar plataforma" };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* NAV */}
      <header className="border-b border-border sticky top-0 z-40 bg-background/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-foreground text-background grid place-items-center">
              <Church className="h-4 w-4" />
            </div>
            <div>
              <div className="font-serif text-base leading-none font-semibold tracking-tight">Igreja Batista Atos</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                Ponta Grossa · desde 2014
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#historia" className="hover:text-foreground transition-colors">História</a>
            <a href="#pilares" className="hover:text-foreground transition-colors">Pilares</a>
            <a href="#ministerios" className="hover:text-foreground transition-colors">Ministérios</a>
          </nav>
          <Button asChild size="sm">
            <Link to={cta.to}>{cta.label} <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
            aria-hidden
          />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24 lg:pt-32 lg:pb-40">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground mb-10">
              <span className="h-px w-10 bg-foreground/40" />
              Est. 2014 · Ponta Grossa / PR
            </div>
            <h1 className="font-serif font-semibold tracking-[-0.03em] text-[15vw] md:text-[10vw] lg:text-[9rem] leading-[0.88] uppercase animate-reveal">
              Uma casa <br />
              <span className="italic font-normal">construída</span> <br />
              sobre a rocha.
            </h1>
            <div className="mt-12 grid lg:grid-cols-12 gap-10 items-end">
              <div className="lg:col-span-6 space-y-4">
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Plataforma da Igreja Batista Atos — ministérios, redes, mesas e comunidade em um só lugar.
                </p>
              </div>
              <div className="lg:col-span-6 flex flex-col items-start lg:items-end gap-6">
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="rounded-full h-12 px-6">
                    <Link to={cta.to}>{cta.label} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6">
                    <a href="#historia">Nossa história <ArrowUpRight className="ml-2 h-4 w-4" /></a>
                  </Button>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Cultos · Dom 09h30 e 18h30
                </div>
              </div>
            </div>

            <div className="mt-12 grid md:grid-cols-2 gap-6 animate-reveal-slow" style={{ animationDelay: '400ms' }}>
              <div className="p-6 bg-card border rounded-xl shadow-sm text-left">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Blueprint Técnico Master
                </h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  Documentação de engenharia completa (BLUEPRINT.md) atualizada para a V3.0, detalhando arquitetura, RLS e o guia de replicação.
                </p>
                <a 
                  href="/BLUEPRINT.md" 
                  target="_blank"
                  className="inline-flex items-center text-sm font-medium underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Visualizar Blueprint Técnico <ArrowUpRight className="ml-1 h-3 w-3" />
                </a>
              </div>

              <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl shadow-sm text-left">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                  <Sparkles className="w-4 h-4" />
                  O que vem por aí?
                </h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  Gamificação de discipulado, central de mídias, automação via WhatsApp e o novo portal "Atos de Amor" já estão no roadmap de inovação.
                </p>
                <Link 
                  to="/dashboard"
                  className="inline-flex items-center text-sm font-medium underline underline-offset-4 hover:text-primary transition-colors text-primary"
                >
                  Ver Roadmap no Painel <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Marquee tira */}
            <div className="mt-20 border-y border-border -mx-6 lg:-mx-10 overflow-hidden">
              <div className="flex whitespace-nowrap animate-[marquee_38s_linear_infinite] py-4 font-serif text-2xl md:text-3xl uppercase tracking-tight">
                {Array.from({ length: 2 }).map((_, k) => (
                  <div key={k} className="flex items-center gap-8 pr-8">
                    {["Mesa", "Sacerdócio", "Paternidade", "Adoração", "Ministério Quíntuplo", "Atos de Amor", "Kombi Branca", "05 · 01 · 2015"].map((w) => (
                      <span key={w} className="flex items-center gap-8">
                        <span>{w}</span>
                        <span className="text-muted-foreground">✳</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`@keyframes marquee { from { transform: translateX(0);} to { transform: translateX(-50%);} }`}</style>
        </section>

        {/* HISTÓRIA */}
        <section id="historia" className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32 grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">§ 01 — História</div>
              <h2 className="mt-4 font-serif text-4xl md:text-5xl tracking-tight leading-[1.05]">
                Da sala do pastor à casa de famílias.
              </h2>
              <div className="mt-8 space-y-6 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-2xl text-foreground normal-case tracking-normal">2014</span>
                  <span>Reuniões na casa do Pr. Geraldo</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-2xl text-foreground normal-case tracking-normal">05·01·2015</span>
                  <span>Primeiros cultos oficiais</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-2xl text-foreground normal-case tracking-normal">Hoje</span>
                  <span>Templo no Parque N. S. das Graças</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 space-y-6 text-base md:text-lg leading-relaxed text-muted-foreground">
              <p>
                No início as reuniões aconteciam na casa do pastor Geraldo — um lugar pequeno,
                cheio de amor e esperança. Sem templo físico, a sala virava altar de adoração,
                oração, Palavra e comunhão.
              </p>
              <p>
                A famosa <span className="text-foreground font-medium">Kombi branca</span> se
                tornou símbolo desses primeiros dias — mais que um veículo, uma escola de
                discipulado percorrendo Ponta Grossa com jovens sendo forjados pela Palavra
                em cada quilômetro.
              </p>
              <p>
                Após dez meses de encontros nas casas, no dia 05 de janeiro de 2015,
                começaram os cultos num espaço que podia ser chamado de casa. A nuvem se
                moveu para o barracão no Parque N. S. das Graças, onde os próprios filhos
                da casa levantaram o púlpito de madeira, a salinha das crianças e o mezanino.
              </p>
              <blockquote className="border-l-2 border-foreground pl-6 py-2 font-serif text-2xl md:text-3xl italic text-foreground leading-snug">
                “Compreendemos que o mais importante não era o local em si,
                mas o propósito que estava sendo gerado em nossos corações.”
              </blockquote>
            </div>
          </div>
        </section>

        {/* PILARES */}
        <section id="pilares" className="border-b border-border bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60">§ 02 — Pilares</div>
                <h2 className="mt-4 font-serif text-4xl md:text-6xl tracking-tight leading-[1.02] max-w-3xl">
                  Cinco pilares que sustentam a casa.
                </h2>
              </div>
              <p className="max-w-sm text-background/70">
                Cada um deles é essencial para a edificação do corpo de Cristo e para
                cumprirmos juntos a Grande Comissão.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-px bg-background/15 border border-background/15">
              {pilares.map((p) => (
                <article key={p.n} className="bg-foreground p-8 flex flex-col gap-8 min-h-[240px] group hover:bg-background/[0.08] transition-all duration-500 hover:-translate-y-2 cursor-default">
                  <div className="font-mono text-xs tracking-[0.3em] text-background/50">{p.n}</div>
                  <div className="flex-1 flex flex-col justify-end gap-3">
                    <h3 className="font-serif text-2xl leading-tight">{p.nome}</h3>
                    <p className="text-sm text-background/60 leading-relaxed">{p.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* MINISTÉRIOS */}
        <section id="ministerios" className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">§ 03 — Ministérios</div>
                <h2 className="mt-4 font-serif text-4xl md:text-6xl tracking-tight leading-[1.02] max-w-3xl">
                  Um corpo. Muitos chamados.
                </h2>
              </div>
              <p className="max-w-sm text-muted-foreground">
                Nove frentes de serviço, escalas e comunhão — todas conectadas na mesma plataforma.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              {ministerios.map(({ icon: Icon, nome, tag }) => (
                <div key={nome} className="bg-background/40 backdrop-blur-md p-8 flex items-start justify-between gap-6 hover:bg-secondary/80 transition-all duration-500 group border border-transparent hover:border-border/50 hover:shadow-lg hover:-translate-y-1 rounded-2xl">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{tag}</div>
                    <div className="font-serif text-2xl mt-2">{nome}</div>
                  </div>
                  <div className="h-11 w-11 rounded-full border border-border grid place-items-center group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32 grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">§ 04 — Entre</div>
              <h2 className="mt-4 font-serif text-4xl md:text-6xl tracking-tight leading-[1.02]">
                A plataforma da nossa casa está aberta.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                Escalas, avisos, mesas, redes, kids, louvor, mídia e Atos de Amor —
                tudo em um lugar, pra cada líder e cada membro do corpo.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <Button asChild size="lg" className="rounded-full h-14 px-8 text-base">
                <Link to={cta.to}>{cta.label} <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Church className="h-4 w-4" />
            <span className="font-serif text-base">Igreja Batista Atos</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60">
            Ponta Grossa · PR · Plataforma interna © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
