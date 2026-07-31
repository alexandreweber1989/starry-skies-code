import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

const LABELS: Record<string, string> = {
  "/dashboard": "Painel",
  "/agenda": "Agenda",
  "/ministerios": "Ministérios",
  "/louvor": "Louvor",
  "/redes": "Redes",
  "/mesas": "Mesas",
  "/membros": "Membros",
  "/livraria": "Livraria",
  "/cantina": "Cantina",
  "/perfil": "Perfil",
};

function labelFor(pathname: string): string {
  const key = Object.keys(LABELS).find(
    (k) => pathname === k || pathname.startsWith(k + "/"),
  );
  return key ? LABELS[key] : "Atos";
}

/** Variantes de transição disponíveis. */
const VARIANTS = ["cols", "rows", "wave", "iris", "split", "glitch"] as const;
type Variant = (typeof VARIANTS)[number];

/** Quantidade de peças e classe de entrada do conteúdo por variante. */
const PIECES: Record<Variant, number> = {
  cols: 7,
  rows: 5,
  wave: 6,
  iris: 1,
  split: 2,
  glitch: 9,
};

const ENTER_CLASS: Record<Variant, string> = {
  cols: "pt-enter",
  rows: "pt-enter-rows",
  wave: "pt-enter-wave",
  iris: "pt-enter-scale",
  split: "pt-enter-split",
  glitch: "pt-enter-glitch",
};

const DURATION = 950;

function pickVariant(exclude?: Variant): Variant {
  const pool = VARIANTS.filter((v) => v !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Transição editorial entre páginas. A cada navegação sorteia uma variante
 * diferente da anterior (persianas, grade, íris, corte ao meio, glitch),
 * revelando o nome da seção antes do conteúdo entrar.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const previous = useRef(pathname);
  const lastVariant = useRef<Variant | undefined>(undefined);
  const [wipe, setWipe] = useState<
    { id: number; label: string; variant: Variant } | null
  >(null);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    const variant = pickVariant(lastVariant.current);
    lastVariant.current = variant;
    const id = Date.now();
    setWipe({ id, label: labelFor(pathname), variant });
    const timer = window.setTimeout(
      () => setWipe((w) => (w && w.id === id ? null : w)),
      DURATION,
    );
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const enterClass = wipe ? ENTER_CLASS[wipe.variant] : "pt-enter";

  return (
    <div className="relative">
      <div key={pathname} className={enterClass}>
        {children}
      </div>

      {wipe && (
        <div
          key={wipe.id}
          className={`pt-overlay pt-v-${wipe.variant}`}
          aria-hidden="true"
        >
          <div className="pt-pieces">
            {Array.from({ length: PIECES[wipe.variant] }).map((_, i) => (
              <span
                key={i}
                className="pt-piece"
                style={{ "--i": i } as React.CSSProperties}
              />
            ))}
          </div>
          <div className="pt-word">
            <span className="pt-word-mark">Igreja Batista Atos</span>
            <span className="pt-word-title">{wipe.label}</span>
            <span className="pt-word-rule" />
          </div>
        </div>
      )}
    </div>
  );
}