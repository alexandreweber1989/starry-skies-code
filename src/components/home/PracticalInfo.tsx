import { MapPin, Clock, MessageSquare, Car, ExternalLink } from "lucide-react";

interface PracticalInfoProps {
  variant?: "hero" | "footer";
}

export function PracticalInfo({ variant = "hero" }: PracticalInfoProps) {
  const infos = [
    {
      icon: MapPin,
      label: "Endereço",
      value: "Av. Visconde de Taunay, 1200 — Parque N. S. das Graças, Ponta Grossa/PR",
      action: {
        label: "Ver no Google Maps",
        href: "https://maps.app.goo.gl/example",
      },
    },
    {
      icon: Clock,
      label: "Horários",
      value: "Domingos 9h30 e 18h30  |  Quartas 20h (Mesas em casas)",
    },
    {
      icon: MessageSquare,
      label: "WhatsApp",
      value: "(42) 9999-0000",
      action: {
        label: "Falar na secretaria",
        href: "https://wa.me/554299990000",
      },
    },
    {
      icon: Car,
      label: "Acesso",
      value: "Estacionamento no local  |  Acessibilidade para cadeirantes",
    },
  ];

  const isHero = variant === "hero";

  return (
    <section
      className={`relative z-20 ${isHero ? "py-8" : "py-12"} px-6 lg:px-10`}
      aria-label="Informações práticas"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className={`grid gap-4 sm:gap-6 ${isHero ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4"}`}
        >
          {infos.map((info, i) => (
            <motion.div
              key={info.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: isHero ? 1.6 + i * 0.1 : i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative p-4 sm:p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl hover:border-primary/40 transition-all duration-500"
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <info.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 mb-1">
                    {info.label}
                  </p>
                  <p className="font-sans text-sm sm:text-base text-foreground leading-relaxed">
                    {info.value}
                  </p>
                  {info.action && (
                    <a
                      href={info.action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
                    >
                      {info.action.label}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}