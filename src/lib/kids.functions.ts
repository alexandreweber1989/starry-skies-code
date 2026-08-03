import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getChildren = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ church_id: z.string().optional() }).parse(data))
  .handler(async ({ data }) => {
    let query = supabase.from("kids_children").select("*");
    if (data.church_id) query = query.eq("church_id", data.church_id);
    const { data: children, error } = await query.order("full_name");
    if (error) throw error;
    return children;
  });

export const saveChild = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    child: z.any(),
    guardians: z.array(z.any())
  }).parse(data))
  .handler(async ({ data }) => {
    const { child, guardians } = data;
    
    // 1. Salvar criança
    const { data: savedChild, error: childError } = await supabase
      .from("kids_children")
      .upsert(child)
      .select()
      .single();
    
    if (childError) throw childError;

    // 2. Salvar responsáveis
    if (guardians.length > 0) {
      const guardiansToSave = guardians.map(g => ({
        ...g,
        child_id: savedChild.id
      }));
      
      const { error: guardError } = await supabase
        .from("kids_guardians")
        .upsert(guardiansToSave);
      
      if (guardError) throw guardError;
    }

    return savedChild;
  });
