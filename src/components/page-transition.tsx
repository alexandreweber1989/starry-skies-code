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

const COLUMNS = 7;
const DURATION = 900;

/**
 * Transição editorial entre páginas: colunas verticais varrem a tela
 * (persianas tipográficas) revelando o nome da seção antes do conteúdo entrar.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const previous = useRef(pathname);
  const [wipe, setWipe] = useState<{ id: number; label: string } | null>(null);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    const id = Date.now();
    setWipe({ id, label: labelFor(pathname) });
    const timer = window.setTimeout(
      () => setWipe((w) => (w && w.id === id ? null : w)),
      DURATION,
    );
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="relative">
      <div key={pathname} className="pt-enter">
        {children}
      </div>

      {wipe && (
        <div key={wipe.id} className="pt-overlay" aria-hidden="true">
          <div className="pt-cols">
            {Array.from({ length: COLUMNS }).map((_, i) => (
              <span key={i} className="pt-col" style={{ "--i": i } as React.CSSProperties} />
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