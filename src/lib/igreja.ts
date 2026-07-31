/** Funções eclesiásticas usadas em membros, redes e mesas (enum church_function no banco). */
export const CHURCH_FUNCTIONS = [
  { value: "pastor", label: "Pastor(a)" },
  { value: "apascentador", label: "Apascentador(a)" },
  { value: "lider", label: "Líder" },
  { value: "diacono", label: "Diácono(isa)" },
  { value: "obreiro", label: "Obreiro(a)" },
  { value: "membro", label: "Membro" },
] as const;

export type ChurchFunction = (typeof CHURCH_FUNCTIONS)[number]["value"];

export const CHURCH_FUNCTION_LABEL: Record<string, string> = Object.fromEntries(
  CHURCH_FUNCTIONS.map((f) => [f.value, f.label]),
);

/** Ordem de precedência para exibir liderança primeiro em listagens. */
export function churchFunctionRank(value: string): number {
  const index = CHURCH_FUNCTIONS.findIndex((f) => f.value === value);
  return index === -1 ? CHURCH_FUNCTIONS.length : index;
}

export const GENDERS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
] as const;

export const MARITAL_STATUS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "uniao_estavel", label: "União estável" },
] as const;

export const MEMBERSHIP_TYPES = [
  { value: "batismo", label: "Batismo" },
  { value: "transferencia", label: "Transferência" },
  { value: "aclamacao", label: "Aclamação" },
  { value: "congregado", label: "Congregado(a)" },
] as const;
