import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Tipos de acompanhamento pastoral registrados na ficha do membro. */
export const PASTORAL_KINDS = [
  { value: "visita", label: "Visita" },
  { value: "aconselhamento", label: "Aconselhamento" },
  { value: "oracao", label: "Oração" },
  { value: "ligacao", label: "Ligação" },
  { value: "outro", label: "Outro" },
] as const;

export type PastoralKind = (typeof PASTORAL_KINDS)[number]["value"];

export function pastoralKindLabel(kind: string): string {
  return PASTORAL_KINDS.find((k) => k.value === kind)?.label ?? "Registro";
}

export interface PastoralNote {
  id: string;
  person_id: string;
  author_id: string;
  kind: PastoralKind;
  happened_on: string;
  content: string;
  visibility: "pastoral" | "autor";
  created_at: string;
  author?: { id: string; full_name: string } | null;
}

/** Carrega o histórico pastoral de um membro (RLS já limita à equipe pastoral). */
export function usePastoralNotes(personId?: string, enabled = true) {
  return useQuery({
    queryKey: ["pastoral-notes", personId],
    enabled: !!personId && enabled,
    queryFn: async (): Promise<PastoralNote[]> => {
      const { data, error } = await (supabase as any)
        .from("pastoral_notes")
        .select("*, author:profiles!pastoral_notes_author_id_fkey(id, full_name)")
        .eq("person_id", personId!)
        .order("happened_on", { ascending: false });
      // A relação com o autor pode não existir como FK; nesse caso refazemos sem join.
      if (error) {
        const fallback = await (supabase as any)
          .from("pastoral_notes")
          .select("*")
          .eq("person_id", personId!)
          .order("happened_on", { ascending: false });
        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []) as PastoralNote[];
      }
      return (data ?? []) as PastoralNote[];
    },
  });
}

export function useSavePastoralNote(personId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      kind: PastoralKind;
      happened_on: string;
      content: string;
      visibility: "pastoral" | "autor";
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const authorId = auth.user?.id;
      if (!authorId) throw new Error("Sessão expirada. Entre novamente.");
      if (!input.content.trim()) throw new Error("Escreva o conteúdo do acompanhamento.");
      const { error } = await (supabase as any)
        .from("pastoral_notes")
        .insert({ ...input, person_id: personId, author_id: authorId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pastoral-notes", personId] }),
  });
}

export function useDeletePastoralNote(personId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("pastoral_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pastoral-notes", personId] }),
  });
}
