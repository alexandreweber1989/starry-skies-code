import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const registerVisitor = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      full_name: z.string().min(3),
      whatsapp: z.string().min(10),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { data: checkin, error } = await (supabase as any)
      .from("visitor_checkins")
      .insert({
        full_name: data.full_name,
        whatsapp: data.whatsapp,
      })
      .select()
      .single();

    if (error) throw error;
    
    return checkin;
  });

export const getVisitorStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const { count, error } = await (supabase as any)
      .from("visitor_checkins")
      .select("*", { count: "exact", head: true })
      .eq("status", "novo");

    if (error) throw error;
    return { pending: count || 0 };
  });
