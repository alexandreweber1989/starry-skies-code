import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileOption {
  id: string;
  full_name: string;
}

/** Lista mínima de perfis para seletores de pessoas (nome + id). */
export function useProfileOptions() {
  return useQuery({
    queryKey: ["profiles-min"],
    queryFn: async (): Promise<ProfileOption[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
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
