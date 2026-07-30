/** ID do ministério de Louvor (usado como escopo padrão do módulo). */
export const LOUVOR_MINISTRY_ID = "7cc9c01b-b760-4dc7-985e-2e6e8505384b";

export const WORSHIP_FUNCTIONS = [
  "Ministro(a)",
  "Vocal",
  "Backing vocal",
  "Violão",
  "Guitarra",
  "Baixo",
  "Teclado",
  "Bateria",
  "Percussão",
  "Sopro",
  "Técnico de som",
] as const;

export const SONG_KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
  "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm",
] as const;

export const TEMPO_LABELS: Record<string, string> = {
  lenta: "Lenta",
  media: "Média",
  rapida: "Rápida",
};

export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  culto: "Culto",
  ensaio: "Ensaio",
  evento: "Evento",
};

export const SCHEDULE_STATUS: Record<string, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  publicada: { label: "Publicada", className: "bg-primary text-primary-foreground" },
  concluida: { label: "Concluída", className: "bg-muted text-muted-foreground" },
};

export const ASSIGNMENT_STATUS: Record<string, { label: string; className: string }> = {
  pendente: { label: "Aguardando", className: "bg-muted text-muted-foreground" },
  confirmado: { label: "Confirmado", className: "bg-primary text-primary-foreground" },
  recusado: { label: "Recusado", className: "bg-destructive/10 text-destructive" },
};

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function formatTime(time: string | null): string {
  return time ? time.slice(0, 5) : "—";
}

const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
};

/** Transpõe uma cifra em N semitons preservando o texto ao redor. */
export function transposeChords(text: string, semitones: number): string {
  if (!semitones) return text;
  return text.replace(
    /\b([A-G][b#]?)((?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][b#]?)?)/g,
    (match, root: string, rest: string) => {
      const normalized = FLAT_TO_SHARP[root] ?? root;
      const index = SHARP.indexOf(normalized);
      if (index === -1) return match;
      const next = SHARP[(index + semitones + 120) % 12];
      const bassMatch = rest.match(/\/([A-G][b#]?)/);
      if (bassMatch) {
        const bass = FLAT_TO_SHARP[bassMatch[1]] ?? bassMatch[1];
        const bassIndex = SHARP.indexOf(bass);
        if (bassIndex !== -1) {
          rest = rest.replace(/\/([A-G][b#]?)/, "/" + SHARP[(bassIndex + semitones + 120) % 12]);
        }
      }
      return next + rest;
    },
  );
}