import { CalendarClock, Check, Eye, Pencil, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CATEGORY_CLASS,
  CATEGORY_LABEL,
  SCOPE_LABEL,
  formatData,
  isVigente,
  type Announcement,
} from "@/lib/avisos";

export interface AvisoCardProps {
  aviso: Announcement;
  lido: boolean;
  leitores?: number;
  podeGerenciar: boolean;
  onMarcarLido: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}

/** Cartão de um aviso do mural, com destaque para fixados e urgentes. */
export function AvisoCard({
  aviso,
  lido,
  leitores,
  podeGerenciar,
  onMarcarLido,
  onEditar,
  onExcluir,
}: AvisoCardProps) {
  const vigente = isVigente(aviso);

  return (
    <article
      className={cn(
        "rounded-xl border bg-card/50 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300 hover:shadow-md",
        aviso.is_pinned ? "border-primary/50 shadow-sm" : "border-border",
        !lido && vigente && "ring-1 ring-primary/20",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.2em] border rounded-full px-2 py-0.5",
            CATEGORY_CLASS[aviso.category],
          )}
        >
          {CATEGORY_LABEL[aviso.category]}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {SCOPE_LABEL[aviso.scope]}
        </span>
        {aviso.is_pinned && (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.18em] text-primary">
            <Pin className="h-3 w-3" /> Fixado
          </span>
        )}
        {!aviso.is_published && (
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-dashed border-border rounded-full px-2 py-0.5">
            Rascunho
          </span>
        )}
        {aviso.is_published && !vigente && (
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Expirado
          </span>
        )}
        {!lido && vigente && (
          <span className="ml-auto h-2 w-2 rounded-full bg-primary" aria-label="Não lido" />
        )}
      </div>

      <h3 className="font-serif text-xl sm:text-2xl mt-3 leading-tight">{aviso.title}</h3>
      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed">
        {aviso.body}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          {formatData(aviso.published_at ?? aviso.created_at)}
        </span>
        {aviso.expires_at && <span>Expira em {formatData(aviso.expires_at)}</span>}
        {podeGerenciar && typeof leitores === "number" && (
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {leitores} leram
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {vigente &&
          (lido ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono uppercase tracking-[0.16em]">
              <Check className="h-3 w-3" /> Lido
            </span>
          ) : (
            <Button size="sm" variant="outline" onClick={onMarcarLido}>
              <Check className="h-4 w-4" /> Marcar como lido
            </Button>
          ))}
        {podeGerenciar && (
          <>
            <Button size="sm" variant="ghost" onClick={onEditar}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={onExcluir}>
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
