import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const optionalText = z.string().trim().max(400).optional();
/** Campos livres longos (dons, observações, testemunho) não podem ser truncados. */
const optionalLongText = z.string().trim().max(2000).optional();
const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal("").transform(() => undefined));

const schema = z.object({
  full_name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().default(""),
  password: z.string().min(8).max(72),
  /** Ficha completa opcional preenchida pelo cadastro guiado. */
  profile: z
    .object({
      church_function: z
        .enum(["pastor", "apascentador", "lider", "diacono", "obreiro", "membro"])
        .optional(),
      church_id: z.string().uuid().optional(),
      gender: optionalText,
      marital_status: optionalText,
      spouse_name: optionalText,
      birth_date: optionalDate,
      wedding_date: optionalDate,
      cpf: optionalText,
      rg: optionalText,
      profession: optionalText,
      education: optionalText,
      zip_code: optionalText,
      street: optionalText,
      street_number: optionalText,
      complement: optionalText,
      neighborhood: optionalText,
      city: optionalText,
      state: optionalText,
      emergency_contact_name: optionalText,
      emergency_contact_phone: optionalText,
      emergency_contact_relation: optionalText,
      conversion_date: optionalDate,
      baptism_date: optionalDate,
      baptism_church: optionalText,
      is_baptized: z.boolean().optional(),
      membership_type: optionalText,
      membership_status: optionalText,
      membership_end_date: optionalDate,
      previous_church: optionalText,
      member_since: optionalDate,
      father_name: optionalText,
      mother_name: optionalText,
      courses: z.array(z.string().trim().max(120)).max(30).optional(),
      gifts: optionalLongText,
      availability: optionalLongText,
      allergies: optionalText,
      health_notes: optionalLongText,
      blood_type: optionalText,
      has_children: z.boolean().optional(),
      children_count: z.number().int().min(0).max(30).optional(),
      notes: optionalLongText,
      bio: optionalLongText,
    })
    .partial()
    .optional(),
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

    // A ficha é criada aqui (upsert) para não depender de gatilho no schema auth:
    // sem isso, o update não encontrava linha e o membro nunca aparecia na lista.
    const extra = Object.fromEntries(
      Object.entries(data.profile ?? {}).filter(
        ([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0),
      ),
    );
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          ...extra,
        } as never,
        { onConflict: "id" },
      );
    if (profileError) throw new Error(profileError.message);

    // Papel padrão de acesso à plataforma.
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "membro" } as never, { onConflict: "user_id,role" });



    return { id: userId };
  });
