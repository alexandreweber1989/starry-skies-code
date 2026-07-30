import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SONG_KEYS, TEMPO_LABELS } from "@/lib/louvor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SongDraft {
  id?: string;
  title: string;
  artist: string;
  song_key: string;
  bpm: string;
  tempo: string;
  theme: string;
  tags: string;
  lyrics: string;
  chords: string;
  youtube_url: string;
  sheet_url: string;
  is_active: boolean;
}

export const emptySong: SongDraft = {
  title: "",
  artist: "",
  song_key: "C",
  bpm: "",
  tempo: "media",
  theme: "",
  tags: "",
  lyrics: "",
  chords: "",
  youtube_url: "",
  sheet_url: "",
  is_active: true,
};

export function SongDialog({ initial, trigger }: { initial: SongDraft; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.title.trim()) throw new Error("Informe o título da música.");
      const payload = {
        title: draft.title.trim(),
        artist: draft.artist || null,
        song_key: draft.song_key || null,
        bpm: draft.bpm ? Number(draft.bpm) : null,
        tempo: draft.tempo || null,
        theme: draft.theme || null,
        tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
        lyrics: draft.lyrics || null,
        chords: draft.chords || null,
        youtube_url: draft.youtube_url || null,
        sheet_url: draft.sheet_url || null,
        is_active: draft.is_active,
      };
      const { error } = draft.id
        ? await supabase.from("worship_songs").update(payload).eq("id", draft.id)
        : await supabase.from("worship_songs").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Música salva no repertório.");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["worship-songs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(initial); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            {draft.id ? "Editar música" : "Nova música"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Artista / autor</Label>
              <Input value={draft.artist} onChange={(e) => setDraft({ ...draft, artist: e.target.value })} />
            </div>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tom</Label>
              <Select value={draft.song_key} onValueChange={(v) => setDraft({ ...draft, song_key: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {SONG_KEYS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>BPM</Label>
              <Input type="number" value={draft.bpm} onChange={(e) => setDraft({ ...draft, bpm: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Andamento</Label>
              <Select value={draft.tempo} onValueChange={(v) => setDraft({ ...draft, tempo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <Input value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags (separadas por vírgula)</Label>
            <Input placeholder="adoracao, celebracao" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Link do YouTube</Label>
              <Input value={draft.youtube_url} onChange={(e) => setDraft({ ...draft, youtube_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Link da partitura / PDF</Label>
              <Input value={draft.sheet_url} onChange={(e) => setDraft({ ...draft, sheet_url: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cifra</Label>
            <Textarea
              rows={8}
              className="font-mono text-xs"
              placeholder={"Intro: C  G  Am  F\n\nC        G\nLetra da música..."}
              value={draft.chords}
              onChange={(e) => setDraft({ ...draft, chords: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Letra</Label>
            <Textarea rows={6} value={draft.lyrics} onChange={(e) => setDraft({ ...draft, lyrics: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
            <Label className="text-sm">Ativa no repertório</Label>
          </div>
          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            Salvar música
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}