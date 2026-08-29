import { useReducedMotion, motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Quote, Star, Users, MapPin } from "lucide-react";

const depoimentos = [
  {
    nome: "João",
    idade: 34,
    foto: "JS",
    texto: "Cheguei sozinho em Ponta Grossa, sem conhecer ninguém. Hoje tenho irmãos que oram por mim, uma Mesa que virou família e um propósito que não cabia no meu peito antes.",
    rede: "Rede Zadoque",
    mesa: "Mesa Zadoque 1",
  },
  {
    nome: "Maria",
    idade: 29,
    foto: "MS",
    texto: "Meus filhos amam o Kids — pedem pra ir no domingo! Eu tenho paz no culto sabendo que eles estão seguros, aprendendo e se divertindo. O check-in com foto me dá total tranquilidade.",
    rede: "Rede Sabaoth",
    mesa: "Mesa Sabaoth 2",
  },
  {
    nome: "Pedro",
    idade: 41,
    texto: "A Mesa virou minha família em PG. Não é só um encontro semanal — é onde a vida acontece de verdade. Serviço, relacionamento, adoração, conhecimento. Os quatro pilares não são teoria, são prática.",
    rede: "Rede Zadoque",
    mesa: "Mesa Zadoque 3",
    foto: "PD",
  },
  {
    nome: "Ana",
    idade: 26,
    texto: "Vim cheia de dúvidas, machucada por experiências passadas. Ninguém me pressionou, ninguém me julgou. Me deram espaço pra chegar no meu tempo. Hoje sou batizada e sirvo no Kids.",
    rede: "Rede de Adolescentes",
    mesa: "Mesa dos Teens",
    foto: "AN",
  },
  {
    nome: "Carlos e Lúcia",
    idade: "38 e 35",
    texto: "Casados há 10 anos, a Mesa restaurou nosso casamento. Aprendemos a servir juntos (Marta), a conversar de verdade (Lázaro), a adorar como casal (Maria) e a crescer na Palavra (Jesus).",
    rede: "Rede Sabaoth",
    mesa: "Mesa Sabaoth 1",
    foto: "CL",
  },
];

export function Testimonials() {
  const reduce = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % depoimentos.length);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + depoimentos.length) % depoimentos.length);
  }, []);

  // Auto-advance only if reduced motion is false
  useEffect(() => {
    if (reduce) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [reduce, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      diff > 0 ? prev() : next();
    }
    setTouchStart(null);
  };

  const dep = depoimentos[currentIndex];

  return (
    <section
      id="depoimentos"
      className="relative z-20 bg-background border-t border-border/10 py-20 md:py-28 px-6 lg:px-10"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full text-center mb-12 lg:mb-20"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">
            § 06 — Histórias reais
          </div>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            O que Deus fez na vida deles
          </h2>
          <p className="text-muted-foreground text-sm md:text-base lg:text-xl">
            Não são casos de sucesso — são filhos voltando pra casa.
          </p>
        </motion.div>

        <div className="relative">
          {/* Card principal */}
          <motion.div
            key={currentIndex}
            initial={reduce ? undefined : { opacity: 0, scale: 0.96, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center"
          >
            <Quote className="h-10 w-10 text-primary/20 mx-auto mb-6" aria-hidden="true" />
            
            <motion.blockquote
              initial={reduce ? undefined : { opacity: 0, y: 12 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg sm:text-xl md:text-2xl font-serif italic leading-relaxed text-foreground mb-8 max-w-3xl mx-auto"
            >
              "{dep.texto}"
            </motion.blockquote>

            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 12 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center font-serif text-lg font-bold">
                {dep.foto}
              </div>
              <div className="text-left">
                <div className="font-serif text-base font-medium">{dep.nome}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{dep.idade} anos</div>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 12 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 flex items-center justify-center gap-4 flex-wrap text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Users className="h-3 w-3" aria-hidden="true" />
                {dep.rede}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {dep.mesa}
              </span>
            </motion.div>
          </motion.div>

          {/* Navigation arrows - desktop only */}
          <div className="hidden md:flex items-center justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0 px-4 pointer-events-none">
            <button
              onClick={prev}
              className="pointer-events-auto h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-foreground flex items-center justify-center hover:bg-background hover:border-primary/40 transition-all duration-300 shadow-lg"
              aria-label="Depoimento anterior"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              onClick={next}
              className="pointer-events-auto h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-foreground flex items-center justify-center hover:bg-background hover:border-primary/40 transition-all duration-300 shadow-lg"
              aria-label="Próximo depoimento"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Mobile dots indicator */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 12 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden flex justify-center gap-2 mt-8"
            role="tablist"
            aria-label="Navegação de depoimentos"
          >
            {depoimentos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${i === currentIndex ? "w-8 bg-primary" : "bg-foreground/10 hover:bg-foreground/20"}`}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Depoimento ${i + 1}`}
              />
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Sua história pode ser a próxima. Venha fazer parte.
          </p>
          <a
            href="/conheca"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
          >
            Quero conhecer
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}