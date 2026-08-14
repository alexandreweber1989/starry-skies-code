import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const registerVisitor = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      full_name: z.string().min(3),
      whatsapp: z.string().min(10),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'];
    const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing credentials for admin operation");
    }

    // Try RPC first as it is SECURITY DEFINER and should bypass RLS reliably
    const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_public_visitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'X-Client-Info': 'supabase-js-custom'
      },
      body: JSON.stringify({
        _full_name: data.full_name,
        _whatsapp: data.whatsapp
      })
    });

    if (rpcResponse.ok) {
      return await rpcResponse.json();
    }

    const rpcErrorText = await rpcResponse.text();
    console.error("RPC registration failed:", rpcErrorText);

    // Fallback to standard insert if RPC fails for some reason
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const { data: result, error } = await adminClient
      .from("visitor_checkins")
      .insert({
        full_name: data.full_name,
        whatsapp: data.whatsapp,
        status: 'novo'
      })
      .select()
      .single();

    if (error) {
      console.error("Admin insert failed after RPC failure:", error);
      throw new Error(error.message || "Erro ao registrar visita");
    }
    
    return result;
  });

export const getVisitorStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const SUPABASE_URL = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'];
    const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { pending: 0 };
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { count } = await admin.from("visitor_checkins").select("*", { count: "exact", head: true }).eq("status", "novo");
    return { pending: count || 0 };
  });
