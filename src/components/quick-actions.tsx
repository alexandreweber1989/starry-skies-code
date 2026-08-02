import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, X, Users, CalendarDays, Network, UtensilsCrossed, Baby, BookOpen, Coffee } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const ACTIONS = [
  { to: "/membros", label: "Cadastrar membro", icon: Users },
  { to: "/agenda", label: "Novo evento", icon: CalendarDays },
  { to: "/redes", label: "Nova rede", icon: Network },
  { to: "/mesas", label: "Nova mesa", icon: UtensilsCrossed },
  { to: "/kids", label: "Check-in Kids", icon: Baby },
  { to: "/livraria", label: "Produto da livraria", icon: BookOpen },
  { to: "/cantina", label: "Item da cantina", icon: Coffee },
] as const;

/** Botão flutuante de ações rápidas: leva direto às telas de cadastro. */
export function QuickActions() {
  const [open, setOpen] = useState(false);
  const { isAdmin, isLivrariaAdmin, isCantinaAdmin, isKidsAdmin } = useAuth();

  if (!isAdmin && !isLivrariaAdmin && !isCantinaAdmin && !isKidsAdmin) return null;

  const visible = ACTIONS.filter((a) => {
    if (isAdmin) return true;
    if (a.to === "/livraria") return isLivrariaAdmin;
    if (a.to === "/cantina") return isCantinaAdmin;
    if (a.to === "/kids") return isKidsAdmin;
    return false;
  });

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open &&
        visible.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              onClick={() => setOpen(false)}
              style={{ animationDelay: `${i * 30}ms` }}
              className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 rounded-none border border-border bg-card px-3 py-2 text-[10px] uppercase tracking-widest shadow-none hover:border-foreground transition-all"
            >
              <Icon className="h-4 w-4 text-primary" />
              {action.label}
            </Link>
          );
        })}
      <button
        type="button"
        aria-label={open ? "Fechar ações rápidas" : "Abrir ações rápidas"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-12 w-12 grid place-items-center rounded-none bg-primary text-primary-foreground shadow-none hover:opacity-90 active:scale-95 transition-all"
      >
        {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  );
}
