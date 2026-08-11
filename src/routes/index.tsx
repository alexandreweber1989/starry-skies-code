import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { Church, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: ScrolltellingLanding,
});

function ScrolltellingLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Efeito Parallax no título principal
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="relative bg-background text-foreground">
      {/* SEÇÃO 1: HERO (Focado) */}
      <section className="h-screen flex flex-col justify-center px-6 lg:px-10 border-b border-border/20 sticky top-0 overflow-hidden">
        <motion.div style={{ y, opacity }} className="max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground mb-10">
            <span className="h-px w-10 bg-foreground/40" />
            Est. 2014 · Ponta Grossa / PR
          </div>
          <h1 className="font-serif font-semibold tracking-[-0.04em] text-[15vw] md:text-[10vw] lg:text-[8rem] leading-[0.85] uppercase selection:bg-primary selection:text-primary-foreground">
            Uma casa <br />
            <span className="italic font-normal text-primary/80">construída</span> <br />
            sobre a rocha.
          </h1>
        </motion.div>
      </section>

      {/* SEÇÃO 2: A HISTÓRIA (Reveal Scroll) */}
      <section className="min-h-screen py-32 px-6 lg:px-10 max-w-5xl mx-auto flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="space-y-12"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">§ 01 — Nossa Gênese</div>
          <h2 className="font-serif text-5xl md:text-7xl leading-tight">
            Tudo começou com uma Kombi branca e um propósito.
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            De reuniões na sala do Pastor Geraldo a um templo erguido pelas mãos dos próprios filhos, nossa história não é feita de tijolos, mas de vidas forjadas pelo Evangelho.
          </p>
        </motion.div>
      </section>

      {/* SEÇÃO 3: PILARES (Grid Interativo) */}
      <section className="py-32 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <h2 className="font-serif text-5xl mb-20">Fundamentos da fé.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {["Mesa", "Sacerdócio", "Paternidade", "Adoração", "Ministério"].map((item, i) => (
              <motion.div 
                key={item}
                whileHover={{ y: -10 }}
                className="p-10 border border-background/20 rounded-3xl group"
              >
                <div className="text-6xl mb-8 font-serif text-background/20 group-hover:text-primary transition-colors">0{i+1}</div>
                <h3 className="text-3xl font-serif mb-4">{item}</h3>
                <p className="text-background/60">Uma base inabalável para nossa comunhão e missão.</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: CTA FINAL */}
      <section className="h-screen flex items-center justify-center text-center px-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="space-y-8"
        >
          <h2 className="font-serif text-6xl md:text-8xl">A casa está pronta.</h2>
          <Button asChild size="lg" className="rounded-full text-lg h-16 px-10">
            <Link to="/auth">
              Junte-se a nós <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
