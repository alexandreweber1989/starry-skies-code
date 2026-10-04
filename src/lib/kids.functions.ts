import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getChildrenHandler, checkinChildHandler, checkoutChildHandler } from "./kids.server";

/**
 * Garante que apenas a equipe do Kids (ou admin geral, via is_kids_admin) acesse
 * dados de crianças. Os handlers usam a service_role (ignoram RLS), então esta
 * checagem de papel é o que protege estes endpoints contra acesso indevido.
 */
async function assertKidsAccess(context: { supabase: { rpc: Function }; userId: string }) {
  const { data: isKidsAdmin, error } = await context.supabase.rpc("is_kids_admin", {
    _user_id: context.userId,
  });
  if (error) throw new Error("Não foi possível verificar as permissões do Kids.");
  if (!isKidsAdmin) throw new Error("Acesso restrito à equipe do Kids.");
}

export const getChildren = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { search?: string }) => z.object({ search: z.string().optional() }).optional().parse(data))
  .handler(async ({ data, context }) => {
    await assertKidsAccess(context);
    return getChildrenHandler(data || {});
  });

export const checkinChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        childId: z.string().uuid(),
        sessionId: z.string().uuid(),
        droppedByName: z.string().optional(),
        securityCode: z.string(),
        dayNotes: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    await assertKidsAccess(context);
    return checkinChildHandler(data);
  });

export const checkoutChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        checkinId: z.string().uuid(),
        pickedUpByName: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    await assertKidsAccess(context);
    return checkoutChildHandler(data);
  });
