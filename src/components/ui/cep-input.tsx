import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type AddressParts, formatCep, isCompleteCep, lookupCep, onlyCepDigits } from "@/lib/cep";

export interface CepInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Recebe rua, bairro, cidade e UF assim que o CEP é encontrado. */
  onResolved: (address: AddressParts) => void;
  className?: string;
  id?: string;
}

/**
 * Campo de CEP que consulta o endereço automaticamente ao completar 8 dígitos
 * e preenche os demais campos do formulário.
 */
export function CepInput({ value, onChange, onResolved, className, id }: CepInputProps) {
  const [loading, setLoading] = useState(false);
  const lastLookup = useRef<string>("");

  useEffect(() => {
    const cep = onlyCepDigits(value);
    if (!isCompleteCep(cep) || lastLookup.current === cep) return;
    lastLookup.current = cep;

    let cancelled = false;
    setLoading(true);
    lookupCep(cep)
      .then((address) => {
        if (cancelled) return;
        if (!address) {
          toast.error("CEP não encontrado. Preencha o endereço manualmente.");
          return;
        }
        onResolved(address);
      })
      .catch((e: Error) => {
        if (!cancelled) toast.error(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // onResolved é recriada a cada render nos formulários; o guard de CEP evita repetição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="numeric"
        placeholder="00000-000"
        value={formatCep(value)}
        onChange={(e) => onChange(formatCep(e.target.value))}
        className={cn("pr-9", className)}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
