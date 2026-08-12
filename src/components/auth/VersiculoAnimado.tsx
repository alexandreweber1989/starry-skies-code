import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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

export function VersiculoAnimado() {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [displayRef, setDisplayRef] = useState("");
  const [phase, setPhase] = useState<"typing-text" | "typing-ref" | "waiting" | "glitch">("typing-text");
  const [scrambledText, setScrambledText] = useState("");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const currentVersiculo = VERSICULOS[index];
    const pool = "01</>{}[]=+*#\\|!?~:;=ABEFHKMNRSXYZ";

    if (phase === "typing-text") {
      if (displayText.length < currentVersiculo.texto.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentVersiculo.texto.slice(0, displayText.length + 1));
        }, 40);
      } else {
        timeout = setTimeout(() => {
          setPhase("typing-ref");
        }, 500);
      }
    } else if (phase === "typing-ref") {
      if (displayRef.length < currentVersiculo.referencia.length) {
        timeout = setTimeout(() => {
          setDisplayRef(currentVersiculo.referencia.slice(0, displayRef.length + 1));
        }, 30);
      } else {
        setPhase("waiting");
      }
    } else if (phase === "waiting") {
      timeout = setTimeout(() => {
        setPhase("glitch");
        let frame = 0;
        const totalFrames = 22;
        
        const scrambleInterval = setInterval(() => {
          frame++;
          const progress = frame / totalFrames;
          const nextVersiculo = VERSICULOS[(index + 1) % VERSICULOS.length];
          
          let out = "";
          const targetLength = Math.max(currentVersiculo.texto.length, nextVersiculo.texto.length);
          
          for (let i = 0; i < targetLength; i++) {
            if (Math.random() > progress) {
              if (i < currentVersiculo.texto.length) {
                out += Math.random() > 0.8 ? pool[Math.floor(Math.random() * pool.length)] : currentVersiculo.texto[i];
              } else {
                out += pool[Math.floor(Math.random() * pool.length)];
              }
            } else {
              if (i < nextVersiculo.texto.length) {
                out += Math.random() > 0.2 ? pool[Math.floor(Math.random() * pool.length)] : nextVersiculo.texto[i];
              } else {
                out += " ";
              }
            }
          }
          
          setScrambledText(out);
          
          if (frame >= totalFrames) {
            clearInterval(scrambleInterval);
            setPhase("typing-text");
            setDisplayText("");
            setDisplayRef("");
            setScrambledText("");
            setIndex((prev) => (prev + 1) % VERSICULOS.length);
          }
        }, 40);
      }, 5000);
    }

    return () => clearTimeout(timeout);
  }, [displayText, displayRef, index, phase]);

  return (
    <div className="min-h-[220px] flex flex-col justify-center">
      <div className="relative">
        <h2 
          className="font-serif text-3xl md:text-4xl leading-tight min-h-[140px] text-sidebar-foreground"
        >
          {phase === "glitch" ? (
            <span 
              className="font-mono text-primary break-words block leading-tight relative"
              style={{ 
                color: 'var(--color-sidebar-primary)',
                textShadow: '0 0 8px var(--color-sidebar-primary)' 
              }}
            >
              {scrambledText}
            </span>
          ) : (
            <div className="relative">
              <span className="relative z-10 block">
                "{displayText}"
                {phase === "typing-text" && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-0.5 h-8 bg-sidebar-primary ml-1 align-middle"
                  />
                )}
              </span>
            </div>
          )}
        </h2>
        <div className="mt-6 flex items-center gap-2">
          {phase !== "glitch" && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
