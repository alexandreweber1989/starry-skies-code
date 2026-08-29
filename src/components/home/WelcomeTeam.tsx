import { useReducedMotion, motion } from "framer-motion";
import { MapPin, Users, Heart, Star } from "lucide-react";

const lideres = [
  {
    nome: "Pr. Geraldo",
    funcao: "Pastor titular · Fundador",
    rede: "Igreja Batista Atos",
    descricao: "30 anos pastoreando famílias em Ponta Grossa. Iniciou na sala de casa, hoje lidera uma casa sobre a rocha.",
    icone: Star,
    cor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    avatar: "PG",
  },
  {
    nome: "Ap. André",
    funcao: "Apascentador · Rede Zadoque",
    rede: "Homens · Zadoque",
    descricao: "Lidera a rede de homens. Apaixonado por ver pais assumindo seu papel de paternidade na família e na igreja.",
    icone: Users,
    cor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    avatar: "AA",
  },
  {
    nome: "Ap. Débora",
    funcao: "Apascentadora · Rede Sabaoth",
    rede: "Mulheres · Sabaoth",
    descricao: "Cuida da rede de mulheres com coração de mãe. Discipulado, acolhimento e formação de identidade em Cristo.",
    icone: Heart,
    cor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    avatar: "AD",
  },
  {
    nome: "Líder Lucas",
    funcao: "Líder de Mesa · Jovens",
    rede: "Jovens",
    descricao: "Mesa dos Jovens no templo. Sábados 19h. Conecta a nova geração com propósito e comunidade real.",
    icone: MapPin,
    cor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    avatar: "LL",
  },
];

export function WelcomeTeam() {
  const reduce = useReducedMotion();

  return (
    <section
      id="time"
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
            § 05 — Quem vai te receber
          </div>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Rostos reais, corações abertos
          </h2>
          <p className="text-muted-foreground text-sm md:text-base lg:text-xl max-w-2xl mx-auto">
            Não somos uma instituição — somos uma família. Conheça quem vai te acolher.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {lideres.map((lider, i) => (
            <motion.article
              key={lider.nome}
              initial={reduce ? undefined : { opacity: 0, y: 24 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative p-6 ${lider.cor} rounded-2xl sm:rounded-3xl border transition-all duration-500 hover:border-current/40 hover:shadow-xl hover:shadow-current/10 hover:-translate-y-1`}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-current/10 grid place-items-center font-serif text-lg font-bold text-current flex-shrink-0">
                    {lider.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg font-semibold truncate">{lider.nome}</h3>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-current/70">{lider.funcao}</p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-4">{lider.descricao}</p>

                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-current/60">
                  <lider.icone className="h-3 w-3" aria-hidden="true" />
                  <span>{lider.rede}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Quer conhecer mais líderes? Cada Mesa tem seu apascentador.
          </p>
          <a
            href="/conheca"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
          >
            Ver todas as Mesas e líderes
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}