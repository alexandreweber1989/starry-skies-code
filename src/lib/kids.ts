/**
 * Domínio do Ministério Infantil (Kids).
 *
 * Regras de segurança adotadas:
 * - Toda criança tem ao menos um responsável cadastrado.
 * - Todo check-in gera um código de segurança único do dia; a criança só é
 *   entregue mediante o código + nome de quem está retirando.
 */

export const KIDS_CLASSROOMS = [
  { value: "bercario", label: "Berçário", hint: "0 a 2 anos" },
  { value: "maternal", label: "Maternal", hint: "3 a 4 anos" },
  { value: "jardim", label: "Jardim", hint: "5 a 6 anos" },
  { value: "primarios", label: "Primários", hint: "7 a 8 anos" },
  { value: "juniores", label: "Juniores", hint: "9 a 11 anos" },
  { value: "pre_adolescentes", label: "Pré-adolescentes", hint: "12 a 14 anos" },
  { value: "nao_definida", label: "A definir", hint: "Sem turma definida" },
] as const;

export type KidsClassroom = (typeof KIDS_CLASSROOMS)[number]["value"];

export const KIDS_CLASSROOM_LABEL: Record<string, string> = Object.fromEntries(
  KIDS_CLASSROOMS.map((c) => [c.value, c.label]),
);

export const GUARDIAN_RELATIONS = [
  { value: "mae", label: "Mãe" },
  { value: "pai", label: "Pai" },
  { value: "avo", label: "Avô/Avó" },
  { value: "tio", label: "Tio(a)" },
  { value: "irmao", label: "Irmão(ã)" },
  { value: "responsavel", label: "Responsável legal" },
  { value: "outro", label: "Outro" },
] as const;

export const GUARDIAN_RELATION_LABEL: Record<string, string> = Object.fromEntries(
  GUARDIAN_RELATIONS.map((r) => [r.value, r.label]),
);

export interface KidsChild {
  id: string;
  full_name: string;
  nickname: string | null;
  birth_date: string | null;
  gender: string | null;
  classroom: string;
  church_id: string | null;
  allergies: string | null;
  health_notes: string | null;
  special_needs: string | null;
  photo_consent: boolean;
  can_leave_alone: boolean;
  notes: string | null;
  is_active: boolean;
}

export interface KidsGuardian {
  id: string;
  child_id: string;
  profile_id: string | null;
  full_name: string;
  phone: string | null;
  relation: string;
  is_primary: boolean;
  can_pickup: boolean;
  document: string | null;
}

export interface KidsSession {
  id: string;
  church_id: string | null;
  title: string;
  session_date: string;
  start_time: string | null;
  room: string | null;
  notes: string | null;
  status: string;
}

export interface KidsCheckin {
  id: string;
  session_id: string;
  child_id: string;
  security_code: string;
  status: string;
  checked_in_at: string;
  dropped_by_name: string | null;
  checked_out_at: string | null;
  picked_up_by_name: string | null;
  day_notes: string | null;
}

/** Idade em anos completos; devolve null quando não há data de nascimento. */
export function ageInYears(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const born = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDiff = now.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

/** Sugere a turma a partir da idade — apenas sugestão, o usuário pode trocar. */
export function suggestClassroom(birthDate?: string | null): KidsClassroom {
  const age = ageInYears(birthDate);
  if (age === null) return "nao_definida";
  if (age <= 2) return "bercario";
  if (age <= 4) return "maternal";
  if (age <= 6) return "jardim";
  if (age <= 8) return "primarios";
  if (age <= 11) return "juniores";
  return "pre_adolescentes";
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Código de segurança da etiqueta (sem caracteres ambíguos como O/0 e I/1).
 * Recebe os códigos já usados na sessão para garantir unicidade local.
 */
export function generateSecurityCode(used: string[] = []): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = "";
    for (let i = 0; i < 4; i += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!used.includes(code)) return code;
  }
  return `${Date.now()}`.slice(-4);
}

/** Horário curto (HH:MM) a partir de um timestamp ISO. */
export function shortTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function childDisplayName(child: Pick<KidsChild, "full_name" | "nickname">): string {
  return child.nickname?.trim() ? `${child.full_name} (${child.nickname})` : child.full_name;
}
