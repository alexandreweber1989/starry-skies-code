import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Versiculo {
  texto: string;
  referencia: string;
}

const VERSICULOS: Versiculo[] = [
  { texto: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", referencia: "João 3:16" },
  { texto: "O Senhor é o meu pastor, nada me faltará.", referencia: "Salmos 23:1" },
  { texto: "Tudo posso naquele que me fortalece.", referencia: "Filipenses 4:13" },
  { texto: "Não fui eu que lhe ordenei? Seja forte e corajoso! Não se apavore, nem se desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.", referencia: "Josué 1:9" },
  { texto: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", referencia: "Mateus 11:28" },
  { texto: "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fadigarão.", referencia: "Isaías 40:31" },
  { texto: "Guardei no coração a tua palavra para não pecar contra ti.", referencia: "Salmos 119:11" },
  { texto: "O meu mandamento é este: amem-se uns aos outros como eu os amei.", referencia: "João 15:12" },
  { texto: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.", referencia: "Jeremias 29:11" },
  { texto: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", referencia: "Romanos 8:28" },
];

type TransitionType = "particles" | "hacker" | "cinematic" | "slide";

export function VersiculoAnimado() {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [displayRef, setDisplayRef] = useState("");
  const [phase, setPhase] = useState<"typing-text" | "typing-ref" | "waiting" | "transitioning">("typing-text");
  const [transitionType, setTransitionType] = useState<TransitionType>("cinematic");
  const [hackerText, setHackerText] = useState("");

  const getRandomTransition = useCallback((): TransitionType => {
    const types: TransitionType[] = ["particles", "hacker", "cinematic", "slide"];
    return types[Math.floor(Math.random() * types.length)];
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const currentVersiculo = VERSICULOS[index];

    if (phase === "typing-text") {
      if (displayText.length < currentVersiculo.texto.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentVersiculo.texto.slice(0, displayText.length + 1));
        }, 30);
      } else {
        timeout = setTimeout(() => {
          setPhase("typing-ref");
        }, 500);
      }
    } else if (phase === "typing-ref") {
      if (displayRef.length < currentVersiculo.referencia.length) {
        timeout = setTimeout(() => {
          setDisplayRef(currentVersiculo.referencia.slice(0, displayRef.length + 1));
        }, 20);
      } else {
        setPhase("waiting");
      }
    } else if (phase === "waiting") {
      timeout = setTimeout(() => {
        setPhase("transitioning");
      }, 5000);
    } else if (phase === "transitioning") {
      if (transitionType === "hacker") {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
        let iterations = 0;
        const interval = setInterval(() => {
          setHackerText(
            currentVersiculo.texto
              .split("")
              .map((char, i) => {
                if (i < iterations) return char;
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join("")
          );
          iterations += currentVersiculo.texto.length / 10;
          if (iterations >= currentVersiculo.texto.length) {
            clearInterval(interval);
          }
        }, 50);
      }

      timeout = setTimeout(() => {
        setPhase("typing-text");
        setDisplayText("");
        setDisplayRef("");
        setHackerText("");
        setTransitionType(getRandomTransition());
        setIndex((prev) => (prev + 1) % VERSICULOS.length);
      }, 1200);
    }

    return () => clearTimeout(timeout);
  }, [displayText, displayRef, index, phase, transitionType, getRandomTransition]);

  const getTransitionVariants = () => {
    switch (transitionType) {
      case "particles":
        return {
          initial: { opacity: 0, scale: 0.8, filter: "blur(20px)" },
          animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
          exit: { 
            opacity: 0, 
            scale: 1.2, 
            filter: "blur(20px)",
            transition: { duration: 0.8 }
          }
        };
      case "hacker":
        return {
          initial: { opacity: 0, x: -10 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 10 }
        };
      case "cinematic":
        return {
          initial: { opacity: 0, scale: 1.1, filter: "blur(10px)" },
          animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
          exit: { opacity: 0, scale: 0.9, filter: "blur(10px)" }
        };
      case "slide":
        return {
          initial: { opacity: 0, x: 100 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -100 }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const variants = getTransitionVariants();

  return (
    <div className="min-h-[220px] flex flex-col justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${transitionType}`}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <h2 className="font-serif text-3xl md:text-4xl leading-tight min-h-[140px] text-sidebar-foreground">
            <div className="relative">
              <span className="relative z-10 block">
                "{transitionType === "hacker" && phase === "transitioning" ? hackerText : displayText}"
                {phase === "typing-text" && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-0.5 h-8 bg-sidebar-primary ml-1 align-middle"
                  />
                )}
              </span>
            </div>
          </h2>
          <div className="mt-6 flex items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-widest text-sidebar-foreground/60 min-h-[20px]">
              {displayRef}
            </p>
            {phase === "typing-ref" && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-0.5 h-4 bg-sidebar-primary align-middle"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}