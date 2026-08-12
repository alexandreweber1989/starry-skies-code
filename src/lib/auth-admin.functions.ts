import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const updateUserPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateUserPassword = createServerFn({ method: "POST" })
  .inputValidator((data) => updateUserPasswordSchema.parse(data))
  .handler(async ({ data }) => {
    console.log(`[Auth] Attempting to set password for ${data.email}`);
    
    // In serverless environments, dynamic imports inside the handler ensure
    // we don't leak server-only modules into the client bundle.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Get the user ID by email
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUserError) {
      console.error("[Auth] Error listing users:", getUserError);
      throw new Error("Falha ao localizar usuário no sistema.");
    }

    const user = userData.users.find((u) => u.email === data.email);

    if (!user) {
      console.error(`[Auth] User not found: ${data.email}`);
      throw new Error("Usuário não encontrado. Verifique se o e-mail está correto.");
    }

    // 2. Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: data.password }
    );

    if (updateError) {
      console.error("[Auth] Error updating password:", updateError);
      throw new Error(`Erro ao definir senha: ${updateError.message}`);
    }

    console.log(`[Auth] Password updated successfully for ${data.email}`);
    
    return { success: true, message: "Senha configurada com sucesso!" };
  });
