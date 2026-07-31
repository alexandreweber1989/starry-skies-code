import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHURCH_FUNCTIONS,
  CHURCH_FUNCTION_HINT,
  churchFunctionPrefix,
  type ChurchFunction,
} from "@/lib/igreja";

export interface ChurchFunctionCardsProps {
  value: string;
  onChange: (value: ChurchFunction) => void;
  /** Sexo do membro: define se pastor vira "Pr." ou "Pra." na pré-visualização. */
  gender?: string | null;
  /** Nome usado apenas na amostra do prefixo. */
  previewName?: string | null;
  disabled?: boolean;
}

/**
 * Cards selecionáveis para definir a função do membro na igreja.
 * Mostra o prefixo que será aplicado ao nome (Pr., Pra., Apasc., Líder).
 */
export function ChurchFunctionCards({
  value,
  onChange,
  gender,
  previewName,
  disabled,
}: ChurchFunctionCardsProps) {
  const selected = value || "membro";

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {CHURCH_FUNCTIONS.map((f) => {
          const active = selected === f.value;
          const prefix = churchFunctionPrefix(f.value, gender);
          return (
            <button
              key={f.value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onChange(f.value as ChurchFunction)}
              className={cn(
                "group relative rounded-sm border p-3 text-left transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-primary hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border bg-card",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{f.label}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </span>
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {prefix ? `${prefix} ` : ""}
                {CHURCH_FUNCTION_HINT[f.value] ?? ""}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Exibição:{" "}
        <span className="text-foreground">
          {[churchFunctionPrefix(selected, gender), (previewName ?? "").trim() || "Nome completo"]
            .filter(Boolean)
            .join(" ")}
        </span>
      </p>
    </div>
  );
}
