import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileOption {
  id: string;
  full_name: string;
  /** Função eclesiástica (pastor, apascentador, líder...) para desambiguar homônimos. */
  church_function?: string | null;
  /** Sexo: define Pr. ou Pra. no prefixo de tratamento. */
  gender?: string | null;
}

/** Lista mínima de perfis para seletores de pessoas (nome + função na igreja). */
export function useProfileOptions() {
  return useQuery({
    queryKey: ["profiles-min"],
    queryFn: async (): Promise<ProfileOption[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, church_function, gender")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as ProfileOption[];
    },
  });
}

/** Slug estável a partir de um nome livre (sem acentos, minúsculo, hifenizado). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
