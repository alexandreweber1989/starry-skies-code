import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Coffee, Music, Heart, Users } from "lucide-react";

const experiencias = [
  {
    icon: Coffee,
    titulo: "Chegada",
    descricao: "Café, abraço, sem pressão. Você entra e já se sente em casa.",
    cor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    corHover: "hover:bg-amber-500/20 hover:border-amber-500/40",
  },
  {
    icon: Music,
    titulo: "Culto",
    descricao: "Música que toca o coração, mensagem que fala na sua vida real.",
    cor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    corHover: "hover:bg-emerald-500/20 hover:border-emerald-500/40",
  },
  {
    icon: Heart,
    titulo: "Depois",
    descricao: "Mesa de conversa, oração se quiser, almoço em família. A vida acontece aqui.",
    cor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    corHover: "hover:bg-rose-500/20 hover:border-rose-500/40",
  },
];

export function SundayExperience() {
  const reduce = useReducedMotion();

  return (
    <section
      id="domingo"
      className="relative z-20 bg-background border-t border-border/10 py-20 md:py-28 px-6 lg:px-10"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full text-center mb-12 lg:mb-20"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">
            § 03 — Como é um domingo
          </div>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            O que esperar quando você vier
          </h2>
          <p className="text-muted-foreground text-sm md:text-base lg:text-xl max-w-2xl mx-auto">
            Sem formalidades, sem cobranças. Apenas um lugar para pertencer.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {experiencias.map((exp, i) => (
            <motion.article
              key={exp.titulo}
              initial={reduce ? undefined : { opacity: 0, y: 24 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative p-6 sm:p-8 ${exp.cor} rounded-2xl sm:rounded-3xl border transition-all duration-500 ${exp.corHover} hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1`}
            >
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-current/10 grid place-items-center group-hover:bg-current group-hover:text-background transition-all duration-500 mb-6">
                  <exp.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl mb-3">
                  {exp.titulo}
                </h3>
                <p className="text-sm md:text-base leading-relaxed max-w-xs mx-auto">
                  {exp.descricao}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}