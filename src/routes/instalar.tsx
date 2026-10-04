import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Apple, Smartphone, Bell } from "lucide-react";
import { InstalarApp, PassosInstalacao } from "@/components/pwa/instalar-app";

export const Route = createFileRoute("/instalar")({
  component: InstalarPage,
  head: () => ({
    meta: [
      { title: "Instalar o app — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Instale o app da Igreja Batista Atos no seu celular em poucos toques e receba os avisos da igreja.",
      },
    ],
  }),
});

function InstalarPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>

        <div className="mt-10 flex flex-col items-center text-center">
          <img
            src="/icons/icon-192.png"
            alt="Ícone do app da Igreja Batista Atos"
            width={96}
            height={96}
            className="h-24 w-24 rounded-[22px] shadow-lg"
          />
          <h1 className="mt-6 font-serif text-4xl font-semibold">Leve a igreja no bolso</h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Instale o app da <strong>Igreja Batista Atos</strong> no seu celular. Ele abre em tela
            cheia, como um aplicativo normal, e é por ele que chegam os avisos e as notificações.
          </p>

          <div className="mt-8">
            <InstalarApp />
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Bell className="h-3.5 w-3.5 text-primary" /> Depois de instalar, ative as notificações
            no seu perfil.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <section className="rounded-sm border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
              <Apple className="h-4 w-4" /> iPhone (Safari)
            </h2>
            <PassosInstalacao ios />
          </section>
          <section className="rounded-sm border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
              <Smartphone className="h-4 w-4" /> Android (Chrome)
            </h2>
            <PassosInstalacao ios={false} />
          </section>
        </div>
      </div>
    </div>
  );
}
