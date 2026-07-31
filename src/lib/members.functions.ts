import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  full_name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().default(""),
  password: z.string().min(8).max(72),
});

/**
 * Cria a conta de acesso de um novo membro (auth + perfil).
 * Somente admin geral: a verificação usa o cliente autenticado do chamador,
 * antes de qualquer uso do cliente privilegiado.
 */
export const createMemberAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });
    if (roleError) throw new Error("Não foi possível validar suas permissões.");
    if (!isAdmin) throw new Error("Apenas o administrador geral pode criar membros.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const userId = created.user?.id;
    if (!userId) throw new Error("Conta criada sem identificador.");

    // O gatilho handle_new_user já cria o perfil; aqui complementamos os dados.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, email: data.email, phone: data.phone || null })
      .eq("id", userId);
    if (profileError) throw new Error(profileError.message);

    return { id: userId };
  });
