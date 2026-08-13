import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MesaAddress {
  id: string;
  mesa_id: string;
  label: string;
  street: string;
  number: string;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  complement: string | null;
  full_address: string;
}

export function useMesaAddresses(mesaId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["mesa-addresses", mesaId],
    enabled: !!mesaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesa_addresses" as any)
        .select("*")
        .eq("mesa_id", mesaId);
      if (error) throw error;
      return data as MesaAddress[];
    },
  });

  const save = useMutation({
    mutationFn: async (payload: Partial<MesaAddress>) => {
      if (payload.id) {
        const { error } = await supabase
          .from("mesa_addresses" as any)
          .update(payload)
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("mesa_addresses" as any)
          .insert({ ...payload, mesa_id: mesaId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mesa-addresses", mesaId] });
      toast.success("Endereço salvo com sucesso.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mesa_addresses" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mesa-addresses", mesaId] });
      toast.success("Endereço removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, save, remove };
}
