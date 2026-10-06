import { beforeEach, describe, it, expect, vi } from "vitest";
import { checkinChildHandler, checkoutChildHandler } from "./kids.server";

const db = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
}));

vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: db }));

const childId = "550e8400-e29b-41d4-a716-446655440000";
const sessionId = "550e8400-e29b-41d4-a716-446655440001";
const checkinId = "550e8400-e29b-41d4-a716-446655440002";
const now = "2026-10-04T12:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(now));
  for (const method of [db.from, db.insert, db.update, db.select, db.eq]) {
    method.mockReturnValue(db);
  }
  db.single.mockResolvedValue({ data: { id: checkinId }, error: null });
});

describe("Kids — persistência dos handlers (banco simulado, não valida permissões)", () => {
  it("grava o check-in com criança, sessão, código e horário", async () => {
    const result = await checkinChildHandler({
      childId,
      sessionId,
      securityCode: "A1B2",
      droppedByName: "Responsável de teste",
      dayNotes: "Observação de teste",
    });

    expect(db.from).toHaveBeenCalledWith("kids_checkins");
    expect(db.insert).toHaveBeenCalledWith({
      child_id: childId,
      session_id: sessionId,
      security_code: "A1B2",
      dropped_by_name: "Responsável de teste",
      day_notes: "Observação de teste",
      status: "checked_in",
      checked_in_at: now,
    });
    expect(db.select).toHaveBeenCalledOnce();
    expect(db.single).toHaveBeenCalledOnce();
    expect(result).toEqual({ id: checkinId });
  });

  it("aceita check-in sem observações opcionais", async () => {
    await expect(
      checkinChildHandler({ childId, sessionId, securityCode: "A1B2" }),
    ).resolves.toEqual({
      id: checkinId,
    });
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({ dropped_by_name: undefined, day_notes: undefined }),
    );
  });

  it("propaga erro retornado pelo Supabase no check-in, sem falso sucesso", async () => {
    const error = { code: "42501", message: "Operação recusada" };
    db.single.mockResolvedValueOnce({ data: null, error });
    await expect(checkinChildHandler({ childId, sessionId, securityCode: "A1B2" })).rejects.toBe(
      error,
    );
  });

  it("atualiza somente o check-in indicado na retirada", async () => {
    const result = await checkoutChildHandler({
      checkinId,
      pickedUpByName: "Responsável de teste",
    });
    expect(db.from).toHaveBeenCalledWith("kids_checkins");
    expect(db.update).toHaveBeenCalledWith({
      checked_out_at: now,
      picked_up_by_name: "Responsável de teste",
      status: "checked_out",
    });
    expect(db.eq).toHaveBeenCalledWith("id", checkinId);
    expect(db.select).toHaveBeenCalledOnce();
    expect(result).toEqual({ id: checkinId });
  });

  it("propaga erro retornado pelo Supabase no check-out", async () => {
    const error = { message: "Falha ao salvar retirada" };
    db.single.mockResolvedValueOnce({ data: null, error });
    await expect(checkoutChildHandler({ checkinId })).rejects.toBe(error);
  });

  it("propaga falhas de transporte, sem retornar sucesso", async () => {
    db.single.mockRejectedValueOnce(new Error("Conexão indisponível"));
    await expect(checkoutChildHandler({ checkinId })).rejects.toThrow("Conexão indisponível");
  });
});
