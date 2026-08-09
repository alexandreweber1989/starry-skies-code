import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Estados de carregamento (skeleton screens).
 *
 * Princípio (design-motion-principles): o skeleton existe para dar
 * CONTINUIDADE — ele ocupa o mesmo espaço que o conteúdo real vai ocupar,
 * evitando o salto de layout e o "pisca" de estado vazio.
 *
 * Por isso estes componentes espelham a estrutura de `StatTile` e
 * `PanelSection` (mesma borda, mesmo padding, mesmas alturas) em vez de
 * usar caixas cinzas genéricas.
 */

/** Envolve um skeleton anunciando o carregamento para leitores de tela. */
export function LoadingRegion({
  label = "Carregando…",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Espelha `StatTile`: ícone, número grande e rótulo. */
export function StatTileSkeleton() {
  return (
    <div className="border border-border bg-card p-6 rounded-sm">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-4 rounded-sm" />
      </div>
      <Skeleton className="h-9 w-20 mt-6" />
      <Skeleton className="h-2.5 w-24 mt-3" />
    </div>
  );
}

/** Grade de cartões numéricos, no mesmo formato do painel. */
export function StatGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <StatTileSkeleton key={i} />
      ))}
    </div>
  );
}

/** Espelha `PanelSection`: cabeçalho com rótulo + título e corpo em linhas. */
export function PanelSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <section className={cn("border border-border bg-card rounded-sm", className)}>
      <header className="px-6 pt-6 pb-4 border-b border-border">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-6 w-48 mt-2" />
      </header>
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Grade de cartões (redes, mesas, igrejas, mídia). */
export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="border border-border bg-card rounded-sm p-6">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-6 w-3/4 mt-3" />
          <Skeleton className="h-3 w-1/2 mt-3" />
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lista simples de linhas (tabelas, filas, listagens). */
export function RowsSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border border-border bg-card rounded-sm p-4"
        >
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
