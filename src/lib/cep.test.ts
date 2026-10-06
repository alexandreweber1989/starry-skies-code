import { describe, expect, it, vi } from "vitest";
import { formatCep, isCompleteCep, lookupCep, onlyCepDigits } from "./cep";

describe("CEP — preenchimento de endereços", () => {
  it.each([
    ["", ""],
    ["84", "84"],
    ["84000", "84000"],
    ["84000000", "84000-000"],
    ["CEP 84000-000999", "84000-000"],
  ])("formata %j como %j", (input, expected) => {
    expect(formatCep(input)).toBe(expected);
  });

  it("limita a entrada a oito dígitos", () => {
    expect(onlyCepDigits("CEP 84000-000999")).toBe("84000000");
    expect(isCompleteCep("84000-000")).toBe(true);
    expect(isCompleteCep("84000-00")).toBe(false);
  });

  it("não consulta CEP incompleto", async () => {
    await expect(lookupCep("84000")).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("consulta o CEP normalizado e mapeia o endereço", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        logradouro: "Rua de Teste",
        bairro: "Centro",
        localidade: "Ponta Grossa",
        uf: "PR",
        complemento: "",
      }),
    );
    await expect(lookupCep("84000-000")).resolves.toEqual({
      street: "Rua de Teste",
      neighborhood: "Centro",
      city: "Ponta Grossa",
      state: "PR",
      complement: "",
    });
    expect(fetch).toHaveBeenCalledWith("https://viacep.com.br/ws/84000000/json/");
  });

  it("retorna null para CEP inexistente", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ erro: true }));
    await expect(lookupCep("00000-000")).resolves.toBeNull();
  });

  it("aceita resposta sem campos opcionais", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ localidade: "Ponta Grossa", uf: "PR" }));
    await expect(lookupCep("84000-000")).resolves.toEqual({
      street: "",
      neighborhood: "",
      city: "Ponta Grossa",
      state: "PR",
      complement: "",
    });
  });

  it("reporta falha HTTP ao chamador", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(lookupCep("84000-000")).rejects.toThrow("Não foi possível consultar o CEP agora.");
  });

  it("propaga erro de rede", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Sem conexão"));
    await expect(lookupCep("84000-000")).rejects.toThrow("Sem conexão");
  });
});
