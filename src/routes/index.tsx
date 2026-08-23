import { createFileRoute, Link } from "@tanstack/react-router";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
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
import { CadastroLead } from "@/components/home/cadastro-lead";
import { ChurchLogo } from "@/components/ui/church-logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Igreja Batista Atos | Uma casa sobre a rocha" },
      {
        name: "description",
        content:
          "Comunidade cristã dedicada a edificar um lugar de oração para todos os povos. Forjando discípulos através do relacionamento, da mesa e da paternidade em Ponta Grossa.",
      },
      { property: "og:title", content: "Igreja Batista Atos | Uma casa sobre a rocha" },
      {
        property: "og:description",
        content:
          "Comunidade cristã dedicada a edificar um lugar de oração para todos os povos. Forjando discípulos através do relacionamento, da mesa e da paternidade em Ponta Grossa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <NoiseOverlay />
      <FloatingNav cta={cta} />
      <Hero cta={cta} />
      <CadastroSection />
      <Historia />
      <Numeros />
      <Pilares />
      <Ministerios />
      <FinalCTA cta={cta} />
    </div>
  );
}

function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
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
          <ChurchLogo className="h-8 w-8 bg-background text-foreground rounded-md p-1" />
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
      }, 32);
    };

    const agenda = setInterval(proxima, 2200);
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
      const idealLargura = (disponivel * 0.94) / (larguraA100 / 100);
      const capAltura = window.innerHeight * 0.22; // evita sobrepor as linhas em paisagem
      setFontPx(Math.max(24, Math.min(200, idealLargura, capAltura)));
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
      className="block italic text-foreground whitespace-nowrap leading-[0.9]"
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
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
          }}
        />

        <motion.div
          style={
            reduce ? undefined : { opacity, scale, y, filter }
          }
          className="max-w-7xl mx-auto w-full relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 md:gap-5 mb-8"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <ChurchLogo className="relative h-14 w-14 md:h-20 md:w-20 rounded-2xl md:rounded-[2rem] bg-foreground/5 backdrop-blur-md border border-foreground/10 text-foreground p-3 shrink-0" />
            </div>
            <div>
              <span className="block font-serif font-extrabold tracking-[-0.03em] leading-[0.95] text-3xl md:text-5xl lg:text-7xl">
                Igreja Batista Atos
              </span>
              <div className="h-1 w-12 bg-primary mt-2 rounded-full opacity-60" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-4 font-mono text-[10px] md:text-[12px] uppercase tracking-[0.4em] text-muted-foreground mb-12"
          >
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="h-px w-12 bg-primary/60 origin-left"
            />
            PG · Est. 2014 · Ponta Grossa / PR
          </motion.div>

          <h1 className="font-serif font-bold tracking-[-0.05em] leading-[0.85] uppercase">
            <span className="block overflow-hidden pb-[0.04em]">
              <motion.span
                initial={reduce ? undefined : { y: "100%" }}
                animate={reduce ? undefined : { y: "0%" }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="block text-muted-foreground/60 text-[min(11vw,9vh)] sm:text-[min(8vw,9vh)] lg:text-[5.5rem]"
              >
                Uma casa
              </motion.span>
            </span>
            <span className="block py-[0.05em]">
              <motion.span
                initial={reduce ? undefined : { opacity: 0, scale: 0.95 }}
                animate={reduce ? undefined : { opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                className="block"
              >
                <LinhaGlitch palavras={PALAVRAS_ROCHA} />
              </motion.span>
            </span>
            <span className="block overflow-hidden pt-[0.02em]">
              <motion.span
                initial={reduce ? undefined : { y: "100%" }}
                animate={reduce ? undefined : { y: "0%" }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                className="block text-muted-foreground/60 text-[min(11vw,9vh)] sm:text-[min(8vw,9vh)] lg:text-[5.5rem]"
              >
                sobre a rocha.
              </motion.span>
            </span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 sm:mt-20 md:mt-24 flex flex-wrap gap-4 sm:gap-6"
          >
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto rounded-full h-14 sm:h-16 px-8 sm:px-10 text-lg sm:text-xl font-medium group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-2xl shadow-primary/20"
            >
              <Link to={cta.to}>
                <span className="relative z-10 flex items-center">
                  {cta.label}
                  <ArrowRight className="ml-3 h-6 w-6 transition-transform duration-500 group-hover:translate-x-2" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Link>
            </Button>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="flex items-center gap-4 px-0 sm:px-6 border-l-0 sm:border-l border-foreground/10"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden flex items-center justify-center text-[10px] font-bold">
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium max-w-[120px] leading-tight">
                Junte-se a centenas de famílias
              </span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Indicador de rolagem aprimorado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1.5 }}
          style={reduce ? undefined : { opacity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-muted-foreground/60">
            Explorar Gênese
          </span>
          <div className="h-20 w-px relative overflow-hidden">
            <motion.div
              animate={reduce ? undefined : { 
                y: ["-100%", "100%"] 
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute inset-0 bg-gradient-to-b from-transparent via-primary to-transparent"
            />
            <div className="absolute inset-0 bg-foreground/10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * História — scrollytelling: painel fixo que troca os capítulos ao rolar
 * ------------------------------------------------------------------------- */

function CadastroSection() {
  const reduce = useReducedMotion();
  return (
    <section
      id="cadastro"
      className="relative z-20 bg-background border-t border-border/10 py-20 md:py-28 px-6 lg:px-10"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full text-center mb-12 lg:mb-20"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">
            Comece por aqui
          </div>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Dê o seu próximo passo
          </h2>
          <p className="text-muted-foreground text-sm md:text-base lg:text-xl max-w-2xl mx-auto">
            Acreditamos que ninguém deve caminhar sozinho. Preencha os dados e
            te ajudaremos a encontrar a Mesa mais próxima da sua casa.
          </p>
        </motion.div>

        <div className="w-full">
          <CadastroLead />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Nossa Gênese — scrollytelling contínuo
 *
 * Antes os capítulos trocavam em degraus (um índice de estado + AnimatePresence),
 * então a animação começava depois do scroll e sempre com a mesma duração fixa.
 * Agora as três camadas coexistem e cada uma tem opacidade, deslocamento, escala
 * e desfoque derivados direto do progresso — a página responde ao dedo, quadro a
 * quadro, e o título ainda se monta palavra por palavra conforme se desce.
 * ------------------------------------------------------------------------- */

// Quantos vh de rolagem cada capítulo ocupa. Menos que os 180 anteriores: o
// trecho ficava com muito scroll morto entre uma troca e outra.
const ALTURA_CAPITULO_VH = 150;

// Marca d'água do capítulo: o ano quando existe, senão a própria marca por
// extenso. Antes o fallback virava "02"/"03", números que não diziam nada.
function marcaDeFundo(marca: string) {
  return marca.replace(/\D/g, "") || marca;
}

// O servidor não sabe se o visitante pede menos animação, então a primeira
// renderização no cliente precisa ser igual à do servidor — só depois trocamos
// para a versão sem movimento. Sem isso o React descarta e refaz a árvore.
function usaMenosMovimento() {
  const reduce = useReducedMotion();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado && !!reduce;
}

function Historia() {
  const reduce = usaMenosMovimento();
  return reduce ? <HistoriaEmpilhada /> : <HistoriaScroll />;
}

// Fallback sem animação: pilha simples, legível e acessível.
function HistoriaEmpilhada() {
  return (
    <section className="relative z-20 bg-background border-t border-border/10 py-32 px-6 lg:px-10">
      <div className="max-w-4xl mx-auto">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-10">
          § 01 — Nossa Gênese
        </div>
        <div className="space-y-16">
          {capitulos.map((c) => (
            <div key={c.titulo}>
              <div className="font-mono text-sm text-primary mb-3">{c.marca}</div>
              <h3 className="font-serif text-4xl md:text-5xl mb-4">{c.titulo}</h3>
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

function HistoriaScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // O valor bruto do scroll é entrecortado (uma amostra por evento). A mola dá
  // inércia: o conteúdo alcança o dedo com um leve atraso, em vez de tremer.
  const p = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  const [ativo, setAtivo] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.floor(Math.max(0, Math.min(0.999, v)) * capitulos.length);
    setAtivo(idx);
  });

  // Luzes de fundo: derivam do valor suavizado para não pulsar junto com a roda.
  const luzAX = useTransform(p, [0, 1], [0, 120]);
  const luzAOpacidade = useTransform(p, [0, 0.5, 1], [0.08, 0.2, 0.08]);
  const luzAEscala = useTransform(p, [0, 0.5, 1], [1, 1.25, 1]);
  const luzBX = useTransform(p, [0, 1], [0, -120]);
  const luzBOpacidade = useTransform(p, [0, 0.5, 1], [0.05, 0.15, 0.05]);
  const luzBEscala = useTransform(p, [0, 0.5, 1], [1.2, 1, 1.2]);

  // A grade de fundo desliza devagar: dá profundidade sem chamar atenção.
  const grade = useTransform(p, [0, 1], ["0px 0px", "0px -140px"]);

  const marcadorTopo = useTransform(p, (v) => `${v * 100}%`);
  const marcadorOpacidade = useTransform(p, [0, 0.04, 0.96, 1], [0, 1, 1, 0]);
  const percentual = useTransform(p, (v) => `${Math.round(v * 100)}%`);
  const tracoEyebrow = useTransform(p, [0, 1], [0.4, 1.6]);

  const irParaCapitulo = (i: number) => {
    const alvo = ref.current;
    if (!alvo) return;
    // Meio da janela do capítulo: cai com ele já montado, não na transição.
    const dentro = ((i + 0.45) / capitulos.length) * alvo.offsetHeight;
    window.scrollTo({ top: alvo.offsetTop + dentro, behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className="relative z-20 bg-background border-t border-border/10"
      style={{ height: `${capitulos.length * ALTURA_CAPITULO_VH}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex items-center px-6 lg:px-10">
        {/* Luz atmosférica */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div
            style={{ x: luzAX, opacity: luzAOpacidade, scale: luzAEscala }}
            className="absolute top-1/2 -right-40 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/20 rounded-full blur-[140px]"
          />
          <motion.div
            style={{ x: luzBX, opacity: luzBOpacidade, scale: luzBEscala }}
            className="absolute bottom-0 -left-40 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[120px]"
          />
        </div>

        {/* Grade de fundo */}
        <motion.div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
            backgroundPosition: grade,
            maskImage:
              "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          }}
        />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[200px_1fr] gap-12 sm:gap-20 lg:gap-32 items-center relative z-10">
          {/* Sumário vertical */}
          <div className="hidden lg:flex flex-col gap-10 relative py-10">
            <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-foreground/5">
              <motion.div
                className="absolute top-0 left-0 w-full bg-primary origin-top"
                style={{ scaleY: p }}
              />
              <motion.div
                style={{ top: marcadorTopo, opacity: marcadorOpacidade }}
                className="absolute right-5 -translate-y-1/2 whitespace-nowrap"
              >
                <span className="font-mono text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm inline-block">
                  <motion.span>{percentual}</motion.span>
                </span>
              </motion.div>
            </div>

            {capitulos.map((c, i) => (
              <button
                key={c.titulo}
                type="button"
                onClick={() => irParaCapitulo(i)}
                className="relative flex items-center gap-8 group text-left outline-none"
              >
                <motion.div
                  animate={{
                    scale: i === ativo ? 1.2 : 1,
                    backgroundColor: i <= ativo ? "var(--primary)" : "transparent",
                    borderColor:
                      i <= ativo ? "var(--primary)" : "rgba(128,128,128,0.25)",
                  }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                >
                  {i === ativo && (
                    <motion.div
                      layoutId="active-dot-glow"
                      className="absolute inset-0 rounded-full bg-primary blur-[6px] opacity-50"
                    />
                  )}
                </motion.div>
                <div className="flex flex-col">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-500 ${
                      i === ativo ? "text-primary" : "text-muted-foreground/40"
                    }`}
                  >
                    Cap. 0{i + 1}
                  </span>
                  {/* Antes os títulos inativos ficavam invisíveis e o sumário não
                      servia de sumário. Agora só recuam. */}
                  <span
                    className={`font-serif text-sm font-semibold transition-all duration-500 ${
                      i === ativo
                        ? "text-foreground opacity-100 translate-x-0"
                        : "text-muted-foreground opacity-30 -translate-x-1 group-hover:opacity-70"
                    }`}
                  >
                    {c.titulo}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Sumário no mobile */}
          <div className="lg:hidden flex flex-col items-center gap-4 mb-6 w-full">
            <div className="flex justify-center gap-2">
              {capitulos.map((c, i) => (
                <button
                  key={c.titulo}
                  type="button"
                  aria-label={`Capítulo ${i + 1}: ${c.titulo}`}
                  onClick={() => irParaCapitulo(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === ativo ? "w-10 bg-primary" : "w-2 bg-foreground/15"
                  }`}
                />
              ))}
            </div>
            <div className="w-full max-w-[200px] h-px bg-foreground/10 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-primary/60 origin-left"
                style={{ scaleX: p }}
              />
            </div>
          </div>

          {/* Camadas dos capítulos: todas montadas, reveladas pelo scroll */}
          <div className="relative flex flex-col justify-center">
            <div className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.4em] text-primary/60 mb-6 sm:mb-12 flex items-center gap-4">
              <motion.span
                className="h-px bg-primary/40 origin-left"
                style={{ width: 32, scaleX: tracoEyebrow }}
              />
              Nossa Gênese
            </div>

            {/* O contêiner precisa de altura própria: as camadas são absolutas e,
                sem isso, colapsavam por cima do rótulo acima. */}
            <div className="relative min-h-[26rem] sm:min-h-[32rem]">
              {capitulos.map((c, i) => (
                <CapituloCamada
                  key={c.titulo}
                  capitulo={c}
                  indice={i}
                  total={capitulos.length}
                  progresso={p}
                  ativo={i === ativo}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CapituloCamada({
  capitulo,
  indice,
  total,
  progresso,
  ativo,
}: {
  capitulo: (typeof capitulos)[number];
  indice: number;
  total: number;
  progresso: MotionValue<number>;
  ativo: boolean;
}) {
  const passo = 1 / total;
  const inicio = indice * passo;
  const fim = inicio + passo;

  // Janelas com sobreposição: um capítulo termina de entrar antes de o anterior
  // acabar de sair, então nunca existe um quadro em branco no meio.
  const entrada = inicio + passo * 0.3;
  const saida = fim - passo * 0.18;
  const primeiro = indice === 0;
  const ultimo = indice === total - 1;
  const antes = primeiro ? -0.001 : inicio - passo * 0.2;
  const depois = ultimo ? 1.001 : fim + passo * 0.05;
  const janela = [antes, entrada, saida, depois];

  const opacity = useTransform(progresso, janela, [primeiro ? 1 : 0, 1, 1, ultimo ? 1 : 0]);
  const y = useTransform(progresso, janela, [primeiro ? 0 : 90, 0, 0, ultimo ? 0 : -90]);
  const scale = useTransform(progresso, janela, [primeiro ? 1 : 0.95, 1, 1, ultimo ? 1 : 1.05]);
  const desfoque = useTransform(progresso, janela, [primeiro ? 0 : 12, 0, 0, ultimo ? 0 : 10]);
  const filter = useTransform(desfoque, (v) => `blur(${v.toFixed(2)}px)`);

  // Marca d'água: entra deslocada e vai se assentando ao longo do capítulo.
  const marcaX = useTransform(progresso, [antes, depois], [60, -60]);
  const marcaOpacidade = useTransform(
    progresso,
    janela,
    [0, 0.05, 0.05, 0],
  );

  // Progresso interno do capítulo — alimenta o traço de baixo.
  const local = useTransform(progresso, [inicio, fim], [0, 1]);

  const palavras = capitulo.titulo.split(" ");

  return (
    <motion.div
      aria-hidden={!ativo}
      style={{ opacity, y, scale, filter }}
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 will-change-transform"
    >
      {/* Fundo: marca d'água gigante */}
      <motion.div
        style={{
          x: marcaX,
          opacity: marcaOpacidade,
          // Ano cabe em 18vw; marcas por extenso ("A CAMINHO") precisam encolher
          // ou vazam para fora da tela.
          fontSize: `${Math.min(18, 150 / Math.max(4, marcaDeFundo(capitulo.marca).length))}vw`,
        }}
        className="absolute -top-24 -left-10 font-serif font-extrabold uppercase text-foreground pointer-events-none select-none z-0 leading-none tracking-tighter whitespace-nowrap"
      >
        {marcaDeFundo(capitulo.marca)}
      </motion.div>

      <div className="relative z-10">
        <div className="font-serif text-primary text-3xl md:text-5xl font-light mb-6 italic tracking-tight">
          {capitulo.marca}
        </div>

        {/* Título montado palavra a palavra pelo próprio scroll */}
        <h2 className="font-serif text-3xl sm:text-5xl md:text-8xl lg:text-9xl leading-[0.9] font-bold tracking-[-0.04em] mb-6 sm:mb-12 uppercase text-foreground">
          {palavras.map((palavra, j) => (
            <PalavraGenese
              key={`${palavra}-${j}`}
              palavra={palavra}
              progresso={progresso}
              de={inicio + (entrada - inicio) * (j / (palavras.length + 1))}
              ate={inicio + (entrada - inicio) * ((j + 1.6) / (palavras.length + 1))}
            />
          ))}
        </h2>

        <p className="text-base sm:text-lg md:text-2xl text-muted-foreground leading-relaxed max-w-2xl font-medium tracking-tight">
          {capitulo.texto}
        </p>

        {/* Traço-medidor: cresce enquanto o capítulo está em cena */}
        <div className="mt-10 sm:mt-16 h-px w-32 bg-foreground/10 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-primary/50 origin-left"
            style={{ scaleX: local }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Uma palavra do título: sobe, desembaça e aparece no seu próprio trecho de
// rolagem. O `overflow-hidden` externo faz a palavra emergir de trás da linha.
function PalavraGenese({
  palavra,
  progresso,
  de,
  ate,
}: {
  palavra: string;
  progresso: MotionValue<number>;
  de: number;
  ate: number;
}) {
  const opacity = useTransform(progresso, [de, ate], [0, 1]);
  const y = useTransform(progresso, [de, ate], ["0.55em", "0em"]);
  const desfoque = useTransform(progresso, [de, ate], [10, 0]);
  const filter = useTransform(desfoque, (v) => `blur(${v.toFixed(2)}px)`);

  return (
    <span className="inline-block overflow-hidden align-bottom mr-[0.22em] pb-[0.06em]">
      <motion.span style={{ opacity, y, filter }} className="inline-block">
        {palavra}
      </motion.span>
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Números — a contagem acompanha a rolagem
 *
 * O contador antigo usava `useInView({ once: true })` dentro de um bloco fixo:
 * os três números já estavam "em vista" quando a seção encostava na tela, então
 * os três contavam de uma vez e, ao chegar no segundo e no terceiro, a animação
 * já tinha acabado. Agora cada número conta dentro da sua própria faixa de
 * scroll — e o número da sombra reaproveita o mesmo valor, sem dessincronizar.
 * ------------------------------------------------------------------------- */

function Numeros() {
  const reduce = usaMenosMovimento();
  return reduce ? <NumerosEstaticos /> : <NumerosScroll />;
}

function NumerosEstaticos() {
  return (
    <section className="relative z-20 bg-background py-32 px-6">
      <div className="max-w-5xl mx-auto grid gap-16 sm:grid-cols-3 text-center">
        {numeros.map((n) => (
          <div key={n.rotulo}>
            <div className="font-serif text-7xl tracking-tighter text-foreground tabular-nums">
              {n.valor}
              <span className="text-primary ml-1">{n.sufixo}</span>
            </div>
            <div className="mt-4 font-serif italic text-xl text-muted-foreground">
              {n.rotulo.toLowerCase()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NumerosScroll() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  return (
    <section
      ref={sectionRef}
      className="relative z-20 bg-background"
      style={{ height: `${numeros.length * 110}vh` }}
    >
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, var(--foreground) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 h-full flex flex-col justify-center">
          {numeros.map((n, i) => (
            <NumeroScrollItem
              key={n.rotulo}
              n={n}
              index={i}
              progress={p}
              total={numeros.length}
            />
          ))}
        </div>

        <motion.div
          style={{ scaleX: p }}
          className="absolute bottom-0 left-0 h-1 bg-primary/40 w-full origin-left z-20"
        />
      </div>
    </section>
  );
}

// Conta de 0 até `para` conforme o scroll atravessa [de, ate]. A mola remove os
// degraus do scroll e dá a inércia de um odômetro.
function useContagemPorScroll(
  progresso: MotionValue<number>,
  de: number,
  ate: number,
  para: number,
) {
  const bruto = useTransform(progresso, [de, ate], [0, para]);
  const suave = useSpring(bruto, { stiffness: 90, damping: 26, mass: 0.5 });
  const [valor, setValor] = useState(() => Math.round(bruto.get()));
  useMotionValueEvent(suave, "change", (v) => setValor(Math.round(v)));
  return valor;
}

function NumeroScrollItem({
  n,
  index,
  progress,
  total,
}: {
  n: (typeof numeros)[number];
  index: number;
  progress: MotionValue<number>;
  total: number;
}) {
  const passo = 1 / total;
  const start = index * passo;
  const end = start + passo;
  const primeiro = index === 0;
  const ultimo = index === total - 1;

  const antes = primeiro ? -0.001 : start - passo * 0.12;
  const entrada = start + passo * 0.22;
  const saida = end - passo * 0.18;
  const depois = ultimo ? 1.001 : end + passo * 0.05;
  const janela = [antes, entrada, saida, depois];

  const opacity = useTransform(progress, janela, [primeiro ? 1 : 0, 1, 1, ultimo ? 1 : 0]);
  const scale = useTransform(progress, janela, [primeiro ? 1 : 0.72, 1, 1, ultimo ? 1 : 0.72]);
  // Deslocamento contido: o bloco tem ~700px de altura, e a amplitude antiga
  // (±250) jogava o algarismo para fora do topo da tela no meio da janela.
  const y = useTransform(progress, [antes, depois], [primeiro ? 0 : 150, ultimo ? 0 : -110]);
  // `transformPerspective` e não `perspective`: perspective no próprio elemento
  // só afeta os filhos, então o rotateX antigo saía achatado.
  const rotateX = useTransform(progress, [antes, depois], [primeiro ? 0 : 22, ultimo ? 0 : -22]);

  // A contagem cabe na primeira metade da janela e depois segura o valor.
  const valor = useContagemPorScroll(progress, start, start + passo * 0.42, n.valor);
  const traco = useTransform(progress, [start, start + passo * 0.5], [0, 1]);

  const digitos = (
    <span className="tabular-nums">
      {valor}
      <span className="text-primary ml-1">{n.sufixo}</span>
    </span>
  );

  return (
    <motion.div
      style={{
        opacity,
        y,
        scale,
        rotateX,
        transformPerspective: 1000,
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        translateY: "-50%",
      }}
      className="w-full flex flex-col items-center justify-center text-center will-change-transform"
    >
      <div className="relative group cursor-default">
        <div className="absolute -inset-20 bg-primary/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        <div className="relative flex flex-col items-center">
          {/* Varredura: o brilho antigo usava rgba(var(--primary)), mas o token
              é oklch() e a sombra era descartada em silêncio. */}
          <motion.div
            style={{ opacity }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent z-20 pointer-events-none"
          />

          <div className="font-serif text-[22vw] sm:text-[20vw] md:text-[18vw] lg:text-[22rem] tracking-tighter leading-[0.75] text-foreground select-none flex items-baseline relative">
            {/* Sombra 3D — mesmo valor do número da frente, sem contador extra */}
            <span
              className="absolute inset-0 text-primary/15 -z-10 blur-md translate-x-4 translate-y-4 select-none pointer-events-none"
              aria-hidden="true"
            >
              {digitos}
            </span>
            {digitos}
          </div>

          <div className="mt-12 md:mt-16 flex flex-col items-center w-full max-w-4xl px-6">
            <div className="h-px w-[120px] bg-foreground/10 mb-8 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-primary/60 origin-left"
                style={{ scaleX: traco }}
              />
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-[12px] md:text-[14px] text-primary/40 tracking-[0.5em] uppercase">
                0{index + 1} / 0{total}
              </span>
              <span className="font-serif italic text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-muted-foreground group-hover:text-primary transition-colors duration-500 text-center tracking-tight">
                {n.rotulo.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
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
      <h2 className="font-serif text-3xl sm:text-4xl md:text-[min(4.5rem,11vh)] leading-tight">
        Os fundamentos da nossa fé.
      </h2>
    </div>
  );

  const Cartao = ({ p, i }: { p: (typeof pilares)[number]; i: number }) => (
    <div className="flex flex-col justify-between p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-background/10 bg-background/[0.03] min-h-[min(18rem,50vh)] sm:min-h-[min(26rem,52vh)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.4em] opacity-30">
          {p.n}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-30">
          0{i + 1} / 0{pilares.length}
        </span>
      </div>
      <div>
        <h3 className="font-serif text-2xl sm:text-4xl mb-3 sm:mb-4">{p.nome}</h3>
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
            <h2 className="font-serif text-3xl sm:text-4xl md:text-7xl leading-tight">
              Um corpo. Muitos membros.
            </h2>
          </div>
          <p className="text-muted-foreground text-lg md:text-xl max-w-sm">
            Conecte-se ao seu propósito através das nossas frentes de ação.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              className="group relative p-6 sm:p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl hover:border-primary/40 transition-all duration-700 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2"
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
                <h3 className="font-serif text-xl sm:text-2xl mb-2 group-hover:translate-x-1 transition-transform">
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
    <footer className="relative z-20 bg-foreground text-background py-24 sm:py-32 md:py-48 px-6 lg:px-10 overflow-hidden">
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

          <h2 className="font-serif font-semibold text-4xl sm:text-6xl md:text-[7rem] leading-[0.95] uppercase tracking-[-0.04em]">
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
              className="group rounded-full h-14 sm:h-16 md:h-20 px-8 sm:px-10 md:px-14 text-base sm:text-lg md:text-xl bg-background text-foreground border border-transparent hover:bg-transparent hover:text-background hover:border-background transition-all duration-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-background/10"
            >
              <Link to={cta.to}>
                <span>
                  {cta.label}
                  <ArrowRight className="ml-3 h-6 w-6 inline-block transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Button>

            <div className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-background/40 max-w-xs sm:max-w-none">
              Parque N. S. das Graças · Ponta Grossa / PR · Todos são bem-vindos
            </div>
          </div>
        </motion.div>

        <div className="mt-20 sm:mt-28 md:mt-40 pt-10 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-8 text-background/40 font-mono text-[10px] uppercase tracking-[0.3em]">
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
