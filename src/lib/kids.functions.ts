import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getChildren = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ search: z.string().optional() }).optional().parse(data))
  .handler(async ({ data }) => {
    let query = supabaseAdmin.from("kids_children").select("*");
    if (data?.search) {
      query = query.or(`name.ilike.%${data.search}%,nickname.ilike.%${data.search}%`);
    }
    const { data: children, error } = await query;
    if (error) throw error;
    return children;
  });

export const checkinChild = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      childId: z.string().uuid(),
      sessionId: z.string().uuid().optional(),
      guardianId: z.string().uuid().optional(),
      classroom: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { data: session, error } = await supabaseAdmin
      .from("kids_sessions")
      .insert({
        child_id: data.childId,
        checkin_at: new Date().toISOString(),
        classroom: data.classroom,
        guardian_in_id: data.guardianId,
        status: "checked_in",
      })
      .select()
      .single();

    if (error) throw error;
    return session;
  });

export const checkoutChild = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      guardianId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { data: session, error } = await supabaseAdmin
      .from("kids_sessions")
      .update({
        checkout_at: new Date().toISOString(),
        guardian_out_id: data.guardianId,
        status: "checked_out",
      })
      .eq("id", data.sessionId)
      .select()
      .single();

    if (error) throw error;
    return session;
  });
