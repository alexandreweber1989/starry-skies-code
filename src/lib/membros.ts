/** Opções e metadados da ficha de membro (padrão igreja batista). */

export const GENDERS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
] as const;

export const MARITAL_STATUS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "uniao_estavel", label: "União estável" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
] as const;

export const MEMBERSHIP_TYPES = [
  { value: "batismo", label: "Batismo" },
  { value: "transferencia", label: "Transferência" },
  { value: "aclamacao", label: "Aclamação" },
  { value: "reconciliacao", label: "Reconciliação" },
] as const;

export const MEMBERSHIP_STATUS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "visitante", label: "Visitante" },
  { value: "transferido", label: "Transferido" },
  { value: "disciplina", label: "Em disciplina" },
  { value: "falecido", label: "Falecido" },
] as const;

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const COURSE_OPTIONS = [
  "Classe de integração",
  "Encontro com Deus",
  "Discipulado I",
  "Discipulado II",
  "Escola de líderes",
  "Escola bíblica dominical",
  "Curso de batismo",
  "Curso de noivos",
] as const;

export const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export const EDUCATION_LEVELS = [
  "Fundamental incompleto",
  "Fundamental completo",
  "Médio incompleto",
  "Médio completo",
  "Superior incompleto",
  "Superior completo",
  "Pós-graduação",
] as const;

export function labelOf(
  options: readonly { value: string; label: string }[],
  value?: string | null,
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

export function formatDateBR(value?: string | null): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

/** Idade em anos a partir da data de nascimento (ISO). */
export function ageFrom(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}