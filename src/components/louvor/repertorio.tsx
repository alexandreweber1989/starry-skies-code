import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Music, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LOUVOR_MINISTRY_ID, TEMPO_LABELS } from "@/lib/louvor";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SongDialog, emptySong, type SongDraft } from "./song-dialog";
import { SongSheet, type SongRecord } from "./song-sheet";

function toDraft(song: SongRecord): SongDraft {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist ?? "",
    song_key: song.song_key ?? "C",
    bpm: song.bpm?.toString() ?? "",
    tempo: song.tempo ?? "media",
    theme: song.theme ?? "",
    tags: (song.tags ?? []).join(", "),
    lyrics: song.lyrics ?? "",
    chords: song.chords ?? "",
    youtube_url: song.youtube_url ?? "",
    sheet_url: song.sheet_url ?? "",
    is_active: song.is_active,
  };
}

export function Repertorio() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<SongRecord | null>(null);
  const { isMinistryAdmin } = useAuth();
  const canManage = isMinistryAdmin(LOUVOR_MINISTRY_ID);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["worship-songs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("worship_songs").select("*").order("title");
      if (error) throw error;
      return data as unknown as SongRecord[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("worship_songs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Música removida.");
      qc.invalidateQueries({ queryKey: ["worship-songs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((s) =>
      [s.title, s.artist, s.theme, (s.tags ?? []).join(" ")]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term)),
    );
  }, [data, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por título, artista, tema ou tag"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {canManage && (
          <SongDialog initial={emptySong} trigger={<Button><Plus className="h-4 w-4" /> Nova música</Button>} />
        )}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 rounded-sm" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma música encontrada.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((song) => (
            <div key={song.id} className="border border-border bg-card rounded-sm p-5 flex flex-col gap-3">
              <button className="text-left flex-1" onClick={() => setSelected(song)}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {[song.song_key && `Tom ${song.song_key}`, song.bpm && `${song.bpm} BPM`,
                    song.tempo && TEMPO_LABELS[song.tempo]].filter(Boolean).join(" · ") || "Sem detalhes"}
                </div>
                <div className="font-serif text-2xl leading-tight mt-1">{song.title}</div>
                <div className="text-sm text-muted-foreground">{song.artist ?? "—"}</div>
                {(song.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {song.tags.map((t) => (
                      <span key={t} className="border border-border rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Music className="h-3 w-3" /> {song.chords ? "Com cifra" : "Sem cifra"}
                </span>
                {canManage && (
                  <div className="flex gap-1">
                    <SongDialog
                      initial={toDraft(song)}
                      trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>}
                    />
                    <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => remove.mutate(song.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SongSheet song={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}