import { useReducedMotion, motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const faqs = [
  {
    pergunta: "Preciso ser batizado para ir?",
    resposta: "Não. Todos são bem-vindos — batizado ou não. A igreja é hospital para doentes, não clube para santos. Venha como você é.",
  },
  {
    pergunta: "E se eu não acreditar em tudo?",
    resposta: "Dúvidas são bem-vindas. Ninguém aqui tem todas as respostas. A jornada de fé se faz caminhando junto, não tendo certeza de tudo antes de começar.",
  },
  {
    pergunta: "Tenho filhos — tem lugar pra eles?",
    resposta: "Sim! O Kids tem check-in seguro com foto e QR Code, turmas por idade, e voluntários treinados. Seu filho vai amar, você vai ter paz no culto.",
  },
  {
    pergunta: "Sou solteiro/divorciado/ferido... tem espaço pra mim?",
    resposta: "As Mesas acolhem sua história — não seu status civil. Temos redes de homens, mulheres, jovens e adolescentes. Você vai encontrar gente que entende.",
  },
  {
    pergunta: "Como faço para conhecer alguém?",
    resposta: "Preencha o cadastro no final da página → um líder da Mesa mais perto da sua casa te chama no WhatsApp → vocês marcam um café. Simples assim.",
  },
  {
    pergunta: "Como é a estrutura da igreja?",
    resposta: "Igreja → Redes (Sabaoth, Zadoque, Jovens, Adolescentes) → Mesas (células em casas). Ministérios (Louvor, Kids, Mídia, Dança, Atos de Amor) são transversais. Você entra na Mesa, serve no Ministério.",
  },
];

export function PastoralFAQ() {
  const reduce = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="relative z-20 bg-background border-t border-border/10 py-20 md:py-28 px-6 lg:px-10"
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full text-center mb-12 lg:mb-20"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">
            § 04 — Perguntas que você pode ter
          </div>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Dúvidas são bem-vindas
          </h2>
          <p className="text-muted-foreground text-sm md:text-base lg:text-xl">
            Ninguém espera que você tenha todas as respostas. Só venha.
          </p>
        </motion.div>

        <div className="space-y-4" role="list" aria-label="Perguntas frequentes">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.pergunta}
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group"
            >
              <Collapsible open={openIndex === i} onOpenChange={() => setOpenIndex(openIndex === i ? null : i)}>
                <CollapsibleTrigger
                  className="w-full text-left p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:border-primary/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-between gap-4"
                  aria-expanded={openIndex === i}
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <HelpCircle className="h-5 w-5 text-primary/60 flex-shrink-0" aria-hidden="true" />
                    <span className="font-serif text-lg leading-relaxed">{faq.pergunta}</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${openIndex === i ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-[0.22,1,0.36,1]">
                  <div className="px-6 pb-6 pt-2 text-muted-foreground leading-relaxed border-t border-border/30 mt-2">
                    {faq.resposta}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Ainda tem dúvida? Vem tomar um café com a gente.
          </p>
          <a
            href="/conheca"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
          >
            Conheça nossa casa sem compromisso
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}