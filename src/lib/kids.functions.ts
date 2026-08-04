import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getChildren = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ search: z.string().optional() }).optional().parse(data))
  .handler(async ({ data }) => {
    let query = supabaseAdmin.from("kids_children").select("*");
    if (data?.search) {
      query = query.or(`full_name.ilike.%${data.search}%,nickname.ilike.%${data.search}%`);
    }
    const { data: children, error } = await query;
    if (error) throw error;
    return children;
  });

export const checkinChild = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      childId: z.string().uuid(),
      sessionId: z.string().uuid(),
      droppedByName: z.string().optional(),
      securityCode: z.string(),
      dayNotes: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { data: checkin, error } = await supabaseAdmin
      .from("kids_checkins")
      .insert({
        child_id: data.childId,
        session_id: data.sessionId,
        dropped_by_name: data.droppedByName,
        security_code: data.securityCode,
        day_notes: data.dayNotes,
        status: "checked_in",
        checked_in_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return checkin;
  });

export const checkoutChild = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      checkinId: z.string().uuid(),
      pickedUpByName: z.string().optional(),
      guardianOutId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { data: checkin, error } = await supabaseAdmin
      .from("kids_checkins")
      .update({
        checked_out_at: new Date().toISOString(),
        picked_up_by_name: data.pickedUpByName,
        status: "checked_out",
      })
      .eq("id", data.checkinId)
      .select()
      .single();

    if (error) throw error;
    return checkin;
  });
