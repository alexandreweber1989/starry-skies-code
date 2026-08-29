import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Clock, MessageSquare, Car, Heart, Music, Coffee, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageBody } from "@/components/app-shell";
import { ChurchLogo } from "@/components/ui/church-logo";
import { SundayExperience } from "@/components/home/SundayExperience";
import { PastoralFAQ } from "@/components/home/PastoralFAQ";
import { WelcomeTeam } from "@/components/home/WelcomeTeam";
import { PracticalInfo } from "@/components/home/PracticalInfo";
import { motion } from "framer-motion";

export const Route = createFileRoute("/conheca")({
  head: () => ({
    meta: [
      { title: "Conheça a IB Atos | Venha sem compromisso" },
      {
        name: "description",
        content:
          "Quer conhecer a Igreja Batista Atos sem pressão? Veja como é um domingo, tire suas dúvidas, conheça quem vai te receber e veja informações práticas. Todos são bem-vindos.",
      },
      { property: "og:title", content: "Conheça a IB Atos | Venha sem compromisso" },
      {
        property: "og:description",
        content:
          "Veja como é um domingo, tire suas dúvidas, conheça quem vai te receber. Sem formalidades, sem cobranças. Apenas um lugar para pertencer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConhecaPage,
});

function ConhecaPage() {
  return (
    <div className="bg-background text-foreground">
      <PageHeader
        eyebrow="Portas abertas"
        title="Venha conhecer sem compromisso"
        description="Sem formalidades, sem cobranças. Apenas um lugar para pertencer. Role a página e veja como é fazer parte da nossa família."
        className="border-b border-border/40 bg-card/40 backdrop-blur-xl"
      />

      <PageBody>
        {/* Hero simples com CTA suave */}
        <section className="relative py-20 md:py-28 px-6 lg:px-10 text-center">
          <div className="max-w-4xl mx-auto">
            <ChurchLogo className="h-16 w-16 mx-auto mb-6 bg-primary/5 rounded-2xl p-2 text-primary" />
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Uma casa sobre a rocha
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Você não precisa ter tudo resolvido. Não precisa ser perfeito. Só venha como você é — a gente cuida do resto.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full h-14 sm:h-16 px-8 sm:px-10 text-lg sm:text-xl font-medium group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-2xl shadow-primary/20">
              <Link to="/auth">
                <span className="relative z-10 flex items-center justify-center">
                  Quero dar o próximo passo
                  <ArrowRight className="ml-3 h-6 w-6 transition-transform duration-500 group-hover:translate-x-2" />
                </span>
              </Link>
            </Button>
            <p className="mt-6 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Parque N. S. das Graças · Ponta Grossa / PR · Todos são bem-vindos
            </p>
          </div>
        </section>

        {/* O que esperar num domingo */}
        <SundayExperience />

        {/* FAQ Pastoral */}
        <PastoralFAQ />

        {/* Quem vai te receber */}
        <WelcomeTeam />

        {/* Info prática */}
        <PracticalInfo variant="footer" />

        {/* CTA final */}
        <section className="relative z-20 bg-foreground text-background py-24 sm:py-32 md:py-48 px-6 lg:px-10 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-background/50 mb-10">
                § 07 — O convite
              </div>

              <h2 className="font-serif font-semibold text-4xl sm:text-6xl md:text-[7rem] leading-[0.95] uppercase tracking-[-0.04em]">
                <span className="italic" style={{ WebkitTextStroke: "1.5px var(--background)", color: "transparent" }}>
                  Faça parte desta
                </span>
                <br />
                <span>casa.</span>
              </h2>

              <p className="mt-10 text-lg md:text-2xl text-background/70 leading-relaxed max-w-2xl mx-auto">
                Você leu até aqui — e talvez seja porque algo em você procura um lugar pra chamar de lar. Aqui tem mesa, tem abraço e tem um espaço guardado pra sua história. Venha ser parte da nossa casa.
              </p>

              <div className="mt-14 flex flex-col items-center gap-6">
                <Button asChild size="lg" className="group rounded-full h-14 sm:h-16 md:h-20 px-8 sm:px-10 md:px-14 text-base sm:text-lg md:text-xl bg-background text-foreground border border-transparent hover:bg-transparent hover:text-background hover:border-background transition-all duration-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-background/10">
                  <Link to="/auth">
                    <span>
                      Acessar plataforma
                      <ArrowRight className="ml-3 h-6 w-6 inline-block transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Button>

                <p className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-background/40 max-w-xs sm:max-w-none">
                  Parque N. S. das Graças · Ponta Grossa / PR · Todos são bem-vindos
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </PageBody>
    </div>
  );
}