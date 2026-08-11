import { createFileRoute, Link } from "@tanstack/react-router";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";
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
      {
        name: "description",
        content:
          "Plataforma da Igreja Batista Atos — ministérios, redes, mesas e comunidade em um só lugar.",
      },
      { property: "og:title", content: "Igreja Batista Atos" },
      {
        property: "og:description",
        content:
          "Plataforma da Igreja Batista Atos — ministérios, redes, mesas e comunidade em um só lugar.",
      },
    ],
  }),
  component: Landing,
});

const pilares = [
  {
    n: "01",
    nome: "Mesa",
    desc: "Comunhão semanal, oração e Palavra ao redor da mesa — o berço dos discípulos.",
  },
  {
    n: "02",
    nome: "Sacerdócio",
    desc: "Cada filho um sacerdote, servindo a Deus e ao próximo com vida consagrada.",
  },
  {
    n: "03",
    nome: "Paternidade",
    desc: "Referência, cuidado e formação de identidade que sustenta gerações.",
  },
  {
    n: "04",
    nome: "Adoração",
    desc: "Um povo que se ajoelha, entrega e vive uma vida inteira como louvor.",
  },
  {
    n: "05",
    nome: "Ministério Quíntuplo",
    desc: "Apóstolos, profetas, evangelistas, pastores e mestres edificando o corpo.",
  },
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
  const cta =
    !loading && user
      ? { to: "/dashboard", label: "Entrar no painel" }
      : { to: "/auth", label: "Acessar plataforma" };

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Hero Parallax
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.85]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);

  // Pillar Parallax
  const pillarsY = useTransform(scrollYProgress, [0.3, 0.6], [100, 0]);
  const pillarsOpacity = useTransform(scrollYProgress, [0.3, 0.4], [0, 1]);

  return (
    <div ref={containerRef} className="bg-background text-foreground relative selection:bg-primary selection:text-primary-foreground">
      {/* NAVEGAÇÃO FLUTUANTE */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 inset-x-0 z-50 px-6 lg:px-10 py-6 mix-blend-difference"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between text-background">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-background text-foreground grid place-items-center">
              <Church className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <div className="font-serif text-base leading-none font-semibold tracking-tight">Igreja Batista Atos</div>
              <div className="font-mono text-[8px] uppercase tracking-[0.3em] opacity-60 mt-1">PG · 2014</div>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-full bg-transparent border-background text-background hover:bg-background hover:text-foreground">
            <Link to={cta.to}>
              <span>{cta.label}</span>
            </Link>
          </Button>
        </div>
      </motion.header>

      {/* HERO SECTION - PINNED */}
      <section className="relative h-[200vh] z-10">
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center px-6 lg:px-10">
          <motion.div 
            style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            className="max-w-7xl mx-auto w-full"
          >
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground mb-10">
              <span className="h-px w-10 bg-foreground/40" />
              Est. 2014 · Ponta Grossa / PR
            </div>
            <h1 className="font-serif font-semibold tracking-[-0.04em] text-[15vw] md:text-[10vw] lg:text-[10rem] leading-[0.85] uppercase">
              Uma casa <br />
              <span className="italic font-normal text-primary/80 relative">
                construída
              </span> <br />
              sobre a rocha.
            </h1>
            <div className="mt-20 flex flex-wrap gap-4">
               <Button asChild size="lg" className="rounded-full h-14 px-8 text-lg group">
                <Link to={cta.to}>
                  <span>{cta.label} <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" /></span>
                </Link>
              </Button>
            </div>
          </motion.div>
          
          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground">Role para explorar</span>
            <div className="h-12 w-px bg-gradient-to-b from-primary to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* HISTÓRIA - TEXT REVEAL ON SCROLL */}
      <section className="relative z-20 bg-background border-t border-border/10 py-40 px-6 lg:px-10 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
             <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-8">§ 01 — Nossa Gênese</div>
             <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] mb-12">
               De uma sala pequena à <span className="text-primary italic">Kombi Branca</span> que forjou discípulos.
             </h2>
             <div className="grid md:grid-cols-2 gap-12 text-xl text-muted-foreground leading-relaxed">
               <p>
                 Nossa jornada começou em 2014 na sala do Pastor Geraldo. Sem templo, mas com um propósito que não cabia em quatro paredes.
               </p>
               <p>
                 Hoje, no Parque N. S. das Graças, continuamos a mesma missão: edificar uma casa de oração para todos os povos, onde cada filho é um sacerdote.
               </p>
             </div>
          </motion.div>
        </div>
        
        {/* Background Floating Element */}
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      </section>

      {/* PILARES - HORIZONTAL SCROLL SIMULATION / STAGGERED REVEAL */}
      <section className="relative z-20 bg-foreground text-background py-40 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <motion.div style={{ y: pillarsY, opacity: pillarsOpacity }} className="mb-20">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40 mb-4">§ 02 — Pilares</div>
            <h2 className="font-serif text-5xl md:text-8xl leading-tight">Os fundamentos da nossa fé.</h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-px bg-background/10 border border-background/10 overflow-hidden rounded-3xl">
            {pilares.map((p, idx) => (
              <motion.div
                key={p.n}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-foreground p-10 flex flex-col gap-12 hover:bg-background/[0.05] transition-colors group min-h-[400px]"
              >
                <div className="font-mono text-xs tracking-[0.4em] opacity-30">{p.n}</div>
                <div className="flex-1 flex flex-col justify-end">
                  <h3 className="font-serif text-3xl mb-4 group-hover:text-primary transition-colors">{p.nome}</h3>
                  <p className="text-sm opacity-60 leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MINISTÉRIOS - GRID WITH SPOTLIGHT */}
      <section className="relative z-20 bg-background py-40 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
            <div className="max-w-2xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">§ 03 — Serviço</div>
              <h2 className="font-serif text-5xl md:text-7xl leading-tight">Um corpo. Muitos membros.</h2>
            </div>
            <p className="text-muted-foreground text-lg md:text-xl max-w-sm">
              Conecte-se ao seu propósito através das nossas frentes de ação.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ministerios.map((m, idx) => (
              <motion.div
                key={m.nome}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="group relative p-8 bg-card border border-border/50 rounded-3xl hover:border-primary/30 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="relative z-10 flex justify-between items-start mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 rotate-3 group-hover:rotate-0">
                    <m.icon className="h-6 w-6" />
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] px-3 py-1 bg-muted rounded-full text-muted-foreground">
                    {m.tag}
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="font-serif text-2xl mb-2 group-hover:translate-x-1 transition-transform">{m.nome}</h3>
                  <div className="h-px w-0 group-hover:w-full bg-primary/20 transition-all duration-700" />
                </div>
                {/* Spotlight background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER / FINAL CTA */}
      <footer className="relative z-20 bg-foreground text-background py-40 px-6 lg:px-10 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-6xl md:text-[8rem] leading-none mb-20 uppercase tracking-tighter">
              Faça parte <br /> desta <span className="italic text-primary">casa.</span>
            </h2>
            <Button asChild size="lg" className="rounded-full h-20 px-12 text-xl bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
              <Link to={cta.to}>
                <span>{cta.label} <ArrowRight className="ml-3 h-6 w-6 inline-block" /></span>
              </Link>
            </Button>
          </motion.div>
          
          <div className="mt-40 pt-10 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 font-mono text-[10px] uppercase tracking-[0.3em]">
            <div className="flex items-center gap-3">
              <Church className="h-4 w-4" />
              <span>Igreja Batista Atos · PG</span>
            </div>
            <span>© {new Date().getFullYear()} · Desenvolvido com propósito</span>
          </div>
        </div>
        
        {/* Floating background text */}
        <div className="absolute bottom-0 left-0 right-0 font-serif text-[20vw] opacity-[0.02] whitespace-nowrap pointer-events-none -mb-[10vw] select-none">
          IGREJA BATISTA ATOS IGREJA BATISTA ATOS
        </div>
      </footer>
    </div>
  );
}
