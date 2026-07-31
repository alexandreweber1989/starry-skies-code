/**
 * Consulta de CEP (ViaCEP) usada para autocompletar endereços no sistema.
 * API pública, sem chave, apenas leitura — segura para chamar do navegador.
 */

export interface AddressParts {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
}

/** Mantém só dígitos e limita a 8 (formato do CEP brasileiro). */
export function onlyCepDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

/** Formata como 00000-000 enquanto o usuário digita. */
export function formatCep(value: string): string {
  const digits = onlyCepDigits(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function isCompleteCep(value: string): boolean {
  return onlyCepDigits(value).length === 8;
}

/**
 * Busca o endereço de um CEP. Retorna null quando o CEP não existe.
 * Lança erro apenas para falhas de rede, para o chamador poder avisar o usuário.
 */
export async function lookupCep(value: string): Promise<AddressParts | null> {
  const cep = onlyCepDigits(value);
  if (cep.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) throw new Error("Não foi possível consultar o CEP agora.");

  const data = (await response.json()) as Record<string, unknown>;
  if (data["erro"]) return null;

  return {
    street: String(data["logradouro"] ?? ""),
    neighborhood: String(data["bairro"] ?? ""),
    city: String(data["localidade"] ?? ""),
    state: String(data["uf"] ?? ""),
    complement: String(data["complemento"] ?? ""),
  };
}
