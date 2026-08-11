import { createFileRoute, Link } from "@tanstack/react-router";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValue,
  useMotionValueEvent,
  useInView,
  animate,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect, type ReactNode } from "react";
import {
  Church,
  ArrowRight,
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

/* ---------------------------------------------------------------------------
 * Conteúdo
 * ------------------------------------------------------------------------- */

// Capítulos da história — dirigem o scrollytelling da seção "Nossa Gênese".
const capitulos = [
  {
    marca: "2014",
    titulo: "Uma sala pequena",
    texto:
      "Tudo começou na sala do Pastor Geraldo. Sem templo, sem estrutura — apenas um propósito que não cabia em quatro paredes.",
  },
  {
    marca: "A caminho",
    titulo: "A Kombi Branca",
    texto:
      "Foi buscando um a um, de casa em casa, que a Kombi Branca se tornou símbolo de uma igreja que forja discípulos no relacionamento.",
  },
  {
    marca: "Hoje",
    titulo: "Parque N. S. das Graças",
    texto:
      "A mesma missão de sempre, agora com uma casa: edificar um lugar de oração para todos os povos, onde cada filho é um sacerdote.",
  },
];

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

const anosDeCaminhada = new Date().getFullYear() - 2014;

const numeros = [
  { valor: anosDeCaminhada, sufixo: "+", rotulo: "Anos de caminhada" },
  { valor: 9, sufixo: "", rotulo: "Ministérios ativos" },
  { valor: 4, sufixo: "", rotulo: "Redes de relacionamento" },
];

/* ---------------------------------------------------------------------------
 * Página
 * ------------------------------------------------------------------------- */

function Landing() {
  const { user, loading } = useAuth();
  const cta =
    !loading && user
      ? { to: "/dashboard", label: "Entrar no painel" }
      : { to: "/auth", label: "Acessar plataforma" };

  return (
    <div className="bg-background text-foreground relative selection:bg-primary selection:text-primary-foreground">
      <ScrollProgress />
      <FloatingNav cta={cta} />
      <Hero cta={cta} />
      <Historia />
      <Numeros />
      <Pilares />
      <Ministerios />
      <FinalCTA cta={cta} />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Barra de progresso global
 * ------------------------------------------------------------------------- */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.2,
  });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 inset-x-0 z-[60] h-[3px] origin-left bg-primary"
    />
  );
}

/* ---------------------------------------------------------------------------
 * Navegação flutuante
 * ------------------------------------------------------------------------- */

function FloatingNav({ cta }: { cta: { to: string; label: string } }) {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50 px-6 lg:px-10 py-6 mix-blend-difference"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-background">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-background text-foreground grid place-items-center">
            <Church className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <div className="font-serif text-base leading-none font-semibold tracking-tight">
              Igreja Batista Atos
            </div>
            <div className="font-mono text-[8px] uppercase tracking-[0.3em] opacity-60 mt-1">
              PG · 2014
            </div>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="rounded-full bg-transparent border-background text-background hover:bg-background hover:text-foreground"
        >
          <Link to={cta.to}>
            <span>{cta.label}</span>
          </Link>
        </Button>
      </div>
    </motion.header>
  );
}

/* ---------------------------------------------------------------------------
 * Hero — fixado (pinned) com parallax e revelação linha-a-linha
 * ------------------------------------------------------------------------- */

const PALAVRAS_ROCHA = [
  "construída",
  "edificada",
  "fundada",
  "alicerçada",
  "firmada",
  "enraizada",
  "ancorada",
  "sustentada",
  "estabelecida",
  "erguida",
  "consolidada",
  "inabalável",
  "firme",
];

// Palavra rotativa com efeito glitch (monocromático) no título do hero.
function PalavraGlitch({ palavras }: { palavras: string[] }) {
  const reduce = useReducedMotion();
  const [texto, setTexto] = useState(palavras[0]);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const pool = "01</>{}[]=+*#\\|!?~:;=ABEFHKMNRSXYZ";
    let alvoIdx = 0;
    let scrambleTimer: ReturnType<typeof setInterval> | undefined;

    const proxima = () => {
      alvoIdx = (alvoIdx + 1) % palavras.length;
      const alvo = palavras[alvoIdx];
      setGlitch(true);
      let frame = 0;
      const totalFrames = 18;
      if (scrambleTimer) clearInterval(scrambleTimer);
      scrambleTimer = setInterval(() => {
        frame++;
        const revelado = Math.floor((frame / totalFrames) * alvo.length);
        let out = "";
        for (let i = 0; i < alvo.length; i++) {
          out +=
            i < revelado
              ? alvo[i]
              : pool[Math.floor(Math.random() * pool.length)];
        }
        setTexto(out);
        if (frame >= totalFrames) {
          if (scrambleTimer) clearInterval(scrambleTimer);
          setTexto(alvo);
          setGlitch(false);
        }
      }, 38);
    };

    const agenda = setInterval(proxima, 3200);
    return () => {
      clearInterval(agenda);
      if (scrambleTimer) clearInterval(scrambleTimer);
    };
  }, [reduce, palavras]);

  return (
    <span
      className="palavra-glitch inline-block"
      data-text={texto}
      data-glitch={glitch ? "true" : undefined}
    >
      {texto}
    </span>
  );
}

// Envolve a palavra-glitch e calcula o MAIOR tamanho de fonte que ainda faz a
// palavra mais longa caber na largura disponível (protagonista, sem cortar).
function LinhaGlitch({ palavras }: { palavras: string[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fontPx, setFontPx] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const maisLonga = palavras.reduce((a, b) => (b.length > a.length ? b : a), "");

    const calc = () => {
      const alvo = el.parentElement ?? el;
      const disponivel = alvo.clientWidth;
      if (!disponivel) return;
      const cs = getComputedStyle(el);
      const meas = document.createElement("span");
      Object.assign(meas.style, {
        position: "absolute",
        visibility: "hidden",
        whiteSpace: "nowrap",
        fontFamily: cs.fontFamily,
        fontStyle: cs.fontStyle,
        fontWeight: cs.fontWeight,
        letterSpacing: "-0.04em",
        textTransform: "uppercase",
        fontSize: "100px",
      });
      meas.textContent = maisLonga;
      document.body.appendChild(meas);
      const larguraA100 = meas.getBoundingClientRect().width;
      meas.remove();
      if (!larguraA100) return;
      const idealLargura = (disponivel * 0.92) / (larguraA100 / 100);
      const capAltura = window.innerHeight * 0.24; // evita sobrepor as linhas em paisagem
      setFontPx(Math.max(28, Math.min(200, idealLargura, capAltura)));
    };

    calc();
    // recalcula quando a fonte (Syne) terminar de carregar, para medir com as
    // métricas reais e não com a fonte de fallback.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(calc).catch(() => {});
    }
    const ro = new ResizeObserver(calc);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener("resize", calc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, [palavras]);

  return (
    <span
      ref={ref}
      className="block italic text-foreground whitespace-nowrap text-[10vw] md:text-[8vw] lg:text-[8rem]"
      style={fontPx ? { fontSize: `${fontPx}px`, lineHeight: 1 } : undefined}
    >
      <PalavraGlitch palavras={palavras} />
    </span>
  );
}

function Hero({ cta }: { cta: { to: string; label: string } }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const blur = useTransform(scrollYProgress, [0, 0.75], [0, 6]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <section ref={ref} className="relative h-[200vh] z-10">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center px-6 lg:px-10">
        <motion.div
          style={
            reduce ? undefined : { opacity, scale, y, filter }
          }
          className="max-w-7xl mx-auto w-full"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground mb-10"
          >
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="h-px w-10 bg-foreground/40 origin-left"
            />
            Est. 2014 · Ponta Grossa / PR
          </motion.div>

          <h1 className="font-serif font-semibold tracking-[-0.04em] leading-[0.9] uppercase">
            <span className="block overflow-hidden pb-[0.04em]">
              <motion.span
                initial={reduce ? undefined : { y: "110%" }}
                animate={reduce ? undefined : { y: "0%" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                className="block text-muted-foreground text-[min(7vw,8.5vh)] md:text-[min(5vw,8.5vh)] lg:text-[5rem]"
              >
                Uma casa
              </motion.span>
            </span>
            <span className="block py-[0.02em]">
              <motion.span
                initial={reduce ? undefined : { opacity: 0, y: 20 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.27 }}
                className="block"
              >
                <LinhaGlitch palavras={PALAVRAS_ROCHA} />
              </motion.span>
            </span>
            <span className="block overflow-hidden pt-[0.02em]">
              <motion.span
                initial={reduce ? undefined : { y: "110%" }}
                animate={reduce ? undefined : { y: "0%" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.39 }}
                className="block text-muted-foreground text-[min(7vw,8.5vh)] md:text-[min(5vw,8.5vh)] lg:text-[5rem]"
              >
                sobre a rocha.
              </motion.span>
            </span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-16 md:mt-20 flex flex-wrap gap-4"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full h-14 px-8 text-lg group"
            >
              <Link to={cta.to}>
                <span>
                  {cta.label}
                  <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Indicador de rolagem */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
          style={reduce ? undefined : { opacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground">
            Role para explorar
          </span>
          <motion.div
            animate={reduce ? undefined : { scaleY: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-12 w-px bg-gradient-to-b from-primary to-transparent origin-top"
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * História — scrollytelling: painel fixo que troca os capítulos ao rolar
 * ------------------------------------------------------------------------- */

function Historia() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const [ativo, setAtivo] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(
      capitulos.length - 1,
      Math.max(0, Math.floor(v * capitulos.length)),
    );
    setAtivo(idx);
  });

  // Fallback sem animação: pilha simples, legível e acessível.
  if (reduce) {
    return (
      <section className="relative z-20 bg-background border-t border-border/10 py-32 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-10">
            § 01 — Nossa Gênese
          </div>
          <div className="space-y-16">
            {capitulos.map((c) => (
              <div key={c.titulo}>
                <div className="font-mono text-sm text-primary mb-3">
                  {c.marca}
                </div>
                <h3 className="font-serif text-4xl md:text-5xl mb-4">
                  {c.titulo}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  {c.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      className="relative z-20 bg-background border-t border-border/10"
      style={{ height: `${capitulos.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex items-center px-6 lg:px-10">
        {/* elemento flutuante de fundo */}
        <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-[32rem] h-[32rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[auto_1fr] gap-12 lg:gap-24 items-center">
          {/* Trilho de capítulos */}
          <div className="flex lg:flex-col gap-6">
            {capitulos.map((c, i) => (
              <button
                key={c.titulo}
                type="button"
                aria-label={c.titulo}
                className="flex items-center gap-4 text-left group"
              >
                <span
                  className={`font-mono text-[10px] transition-colors duration-500 ${
                    i === ativo ? "text-primary" : "text-muted-foreground/40"
                  }`}
                >
                  0{i + 1}
                </span>
                <span
                  className={`h-px transition-all duration-500 ${
                    i === ativo
                      ? "w-12 bg-primary"
                      : "w-6 bg-muted-foreground/20"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Painel do capítulo ativo */}
          <div className="relative min-h-[16rem]">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-8">
              § 01 — Nossa Gênese
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={ativo}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="font-serif text-primary text-2xl md:text-3xl mb-4">
                  {capitulos[ativo].marca}
                </div>
                <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-8">
                  {capitulos[ativo].titulo}
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  {capitulos[ativo].texto}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Números — contadores animados ao entrar na tela
 * ------------------------------------------------------------------------- */

function Numeros() {
  return (
    <section className="relative z-20 bg-background py-24 md:py-32 px-6 lg:px-10 border-t border-border/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6">
        {numeros.map((n) => (
          <div key={n.rotulo} className="text-center md:text-left">
            <div className="font-serif text-6xl md:text-8xl tracking-tight">
              <Contador para={n.valor} sufixo={n.sufixo} />
            </div>
            <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground mt-4">
              {n.rotulo}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contador({ para, sufixo }: { para: number; sufixo: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const emVista = useInView(ref, { once: true, margin: "-80px" });
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (!emVista) return;
    if (reduce) {
      setValor(para);
      return;
    }
    const controls = animate(0, para, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValor(Math.round(v)),
    });
    return () => controls.stop();
  }, [emVista, para, reduce]);

  return (
    <span ref={ref}>
      {valor}
      {sufixo}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Pilares — scroll horizontal dirigido pelo scroll vertical
 * ------------------------------------------------------------------------- */

function Pilares() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const [travel, setTravel] = useState(0);
  useEffect(() => {
    const calc = () => {
      const el = trackRef.current;
      if (!el) return;
      setTravel(Math.max(0, el.scrollWidth - window.innerWidth));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);
  const barra = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const Cabecalho = (
    <div className="mb-6 md:mb-10">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40 mb-4">
        § 02 — Pilares
      </div>
      <h2 className="font-serif text-4xl md:text-[min(4.5rem,11vh)] leading-tight">
        Os fundamentos da nossa fé.
      </h2>
    </div>
  );

  const Cartao = ({ p, i }: { p: (typeof pilares)[number]; i: number }) => (
    <div className="flex flex-col justify-between p-6 md:p-10 rounded-3xl border border-background/10 bg-background/[0.03] min-h-[min(22rem,50vh)] md:min-h-[min(26rem,52vh)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.4em] opacity-30">
          {p.n}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-30">
          0{i + 1} / 0{pilares.length}
        </span>
      </div>
      <div>
        <h3 className="font-serif text-3xl md:text-4xl mb-4">{p.nome}</h3>
        <p className="text-sm md:text-base opacity-60 leading-relaxed">
          {p.desc}
        </p>
      </div>
    </div>
  );

  // Fallback sem animação / telas muito pequenas: grade vertical.
  if (reduce) {
    return (
      <section className="relative z-20 bg-foreground text-background py-32 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          {Cabecalho}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilares.map((p, i) => (
              <Cartao key={p.n} p={p} i={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      className="relative z-20 bg-foreground text-background"
      style={{ height: "320vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        <div className="px-6 lg:px-10 max-w-7xl mx-auto w-full">{Cabecalho}</div>

        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex gap-6 px-6 lg:px-10 will-change-transform"
        >
          {pilares.map((p, i) => (
            <div
              key={p.n}
              className="shrink-0 w-[82vw] sm:w-[60vw] md:w-[42vw] lg:w-[30vw]"
            >
              <Cartao p={p} i={i} />
            </div>
          ))}
        </motion.div>

        {/* barra de progresso da faixa horizontal */}
        <div className="px-6 lg:px-10 max-w-7xl mx-auto w-full mt-6 md:mt-10">
          <div className="h-px w-full bg-background/10 overflow-hidden">
            <motion.div style={{ width: barra }} className="h-full bg-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Ministérios — grade com holofote que segue o cursor
 * ------------------------------------------------------------------------- */

function Ministerios() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(-1000);
  const my = useMotionValue(-1000);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  }

  const holofote = useTransform(
    [mx, my],
    ([x, y]) =>
      `radial-gradient(320px circle at ${x}px ${y}px, color-mix(in oklch, var(--primary) 7%, transparent), transparent 70%)`,
  );

  return (
    <section
      onMouseMove={onMove}
      className="relative z-20 bg-background py-32 md:py-40 px-6 lg:px-10 overflow-hidden"
    >
      {!reduce && (
        <motion.div
          aria-hidden
          style={{ background: holofote }}
          className="pointer-events-none absolute inset-0"
        />
      )}
      <div className="relative max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 md:mb-20">
          <div className="max-w-2xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
              § 03 — Serviço
            </div>
            <h2 className="font-serif text-4xl md:text-7xl leading-tight">
              Um corpo. Muitos membros.
            </h2>
          </div>
          <p className="text-muted-foreground text-lg md:text-xl max-w-sm">
            Conecte-se ao seu propósito através das nossas frentes de ação.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministerios.map((m, idx) => (
            <motion.div
              key={m.nome}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: (idx % 3) * 0.06,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              viewport={{ once: true, margin: "-60px" }}
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
                <h3 className="font-serif text-2xl mb-2 group-hover:translate-x-1 transition-transform">
                  {m.nome}
                </h3>
                <div className="h-px w-0 group-hover:w-full bg-primary/20 transition-all duration-700" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * CTA final + rodapé (com marquee sutil)
 * ------------------------------------------------------------------------- */

function FinalCTA({ cta }: { cta: { to: string; label: string } }) {
  const reduce = useReducedMotion();

  const palavras = ["Faça", "parte", "desta"];

  return (
    <footer className="relative z-20 bg-foreground text-background py-32 md:py-48 px-6 lg:px-10 overflow-hidden">
      {/* Brilho suave: dá calor e foco ao convite sobre o fundo escuro */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] max-w-[120vw] rounded-full bg-background/[0.06] blur-[130px]"
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-background/50 mb-10">
            § 04 — O convite
          </div>

          <h2 className="font-serif font-semibold text-5xl md:text-[7rem] leading-[0.95] uppercase tracking-[-0.04em]">
            {palavras.map((p, i) => (
              <span key={p} className="inline-block overflow-hidden align-bottom">
                <motion.span
                  initial={reduce ? undefined : { y: "110%" }}
                  whileInView={reduce ? undefined : { y: "0%" }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                    delay: i * 0.08,
                  }}
                  className="inline-block pr-[0.25em]"
                >
                  {p}
                </motion.span>
              </span>
            ))}
            <br />
            {/* Palavra em destaque: contorno (outline) — visível e sofisticado no preto */}
            <span
              className="italic"
              style={{
                WebkitTextStroke: "1.5px var(--background)",
                color: "transparent",
              }}
            >
              casa.
            </span>
          </h2>

          <p className="mt-10 text-lg md:text-2xl text-background/70 leading-relaxed max-w-2xl mx-auto">
            Você leu até aqui — e talvez seja porque algo em você procura um lugar
            pra chamar de lar. Aqui tem mesa, tem abraço e tem um espaço guardado
            pra sua história. Venha ser parte da nossa casa.
          </p>

          <div className="mt-14 flex flex-col items-center gap-6">
            <Button
              asChild
              size="lg"
              className="group rounded-full h-16 md:h-20 px-10 md:px-14 text-lg md:text-xl bg-background text-foreground border border-transparent hover:bg-transparent hover:text-background hover:border-background transition-all duration-300"
            >
              <Link to={cta.to}>
                <span>
                  {cta.label}
                  <ArrowRight className="ml-3 h-6 w-6 inline-block transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Button>

            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-background/40">
              Parque N. S. das Graças · Ponta Grossa / PR · Todos são bem-vindos
            </div>
          </div>
        </motion.div>

        <div className="mt-28 md:mt-40 pt-10 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-8 text-background/40 font-mono text-[10px] uppercase tracking-[0.3em]">
          <div className="flex items-center gap-3">
            <Church className="h-4 w-4" />
            <span>Igreja Batista Atos · PG</span>
          </div>
          <span>© {new Date().getFullYear()} · Desenvolvido com propósito</span>
        </div>
      </div>

      {/* Marquee de fundo */}
      <Marquee reduce={!!reduce}>IGREJA BATISTA ATOS&nbsp;·&nbsp;</Marquee>
    </footer>
  );
}

function Marquee({ children, reduce }: { children: ReactNode; reduce: boolean }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 -mb-[6vw] overflow-hidden pointer-events-none select-none">
      <motion.div
        aria-hidden
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="font-serif text-[20vw] leading-none opacity-[0.03] whitespace-nowrap flex"
      >
        <span>{children}{children}{children}{children}</span>
      </motion.div>
    </div>
  );
}
