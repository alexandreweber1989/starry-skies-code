import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChurchOption {
  id: string;
  name: string;
  city: string | null;
  is_headquarters: boolean;
}

/** Lista de igrejas ativas para vincular ministérios, redes e mesas. */
export function useChurchOptions() {
  return useQuery({
    queryKey: ["churches-min"],
    queryFn: async (): Promise<ChurchOption[]> => {
      const { data, error } = await supabase
        .from("churches")
        .select("id, name, city, is_headquarters")
        .eq("is_active", true)
        .order("is_headquarters", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as ChurchOption[];
    },
  });
}

export function churchLabel(c: ChurchOption): string {
  return c.city ? `${c.name} — ${c.city}` : c.name;
}
