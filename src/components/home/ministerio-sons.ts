/* ---------------------------------------------------------------------------
 * Sons temáticos por ministério — 100% sintetizados no navegador (Web Audio API).
 * Sem arquivos e sem áudio de terceiros: são efeitos criados na hora, inspirados
 * no "clima" de cada ministério (ex.: Zadoque = brado de guerra em 3 batidas).
 * Só tocam a partir de um clique do usuário (nada de autoplay).
 * ------------------------------------------------------------------------- */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

type Onda = OscillatorType;

function tom(
  c: AudioContext,
  destino: AudioNode,
  t0: number,
  o: {
    freq: number;
    dur: number;
    tipo?: Onda;
    vol?: number;
    freqEnd?: number;
    attack?: number;
  },
) {
  const { freq, dur, tipo = "sine", vol = 0.2, freqEnd, attack = 0.008 } = o;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(Math.max(1, freq), t0);
  if (freqEnd)
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(destino);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function ruido(
  c: AudioContext,
  destino: AudioNode,
  t0: number,
  dur: number,
  vol: number,
  filtroHz?: number,
) {
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const dados = buf.getChannelData(0);
  for (let i = 0; i < n; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = vol;
  let node: AudioNode = src;
  if (filtroHz) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filtroHz;
    src.connect(f);
    node = f;
  }
  node.connect(g).connect(destino);
  src.start(t0);
  src.stop(t0 + dur);
}

export function tocarSomMinisterio(tipo: string) {
  const c = getCtx();
  if (!c) return;
  const master = c.createGain();
  master.gain.value = 0.85;
  master.connect(c.destination);
  const t = c.currentTime + 0.02;

  switch (tipo) {
    // 🛡️ Homens · Zadoque — brado de guerra: 3 batidas graves + tambor
    case "zadoque": {
      for (let i = 0; i < 3; i++) {
        const t0 = t + i * 0.28;
        tom(c, master, t0, { freq: 90, freqEnd: 45, dur: 0.2, tipo: "sine", vol: 0.6 });
        tom(c, master, t0 + 0.02, { freq: 240, freqEnd: 120, dur: 0.24, tipo: "sawtooth", vol: 0.22 });
        ruido(c, master, t0, 0.1, 0.28, 1000);
      }
      break;
    }
    // 🎵 Louvor — arpejo maior (dó–mi–sol) ascendente
    case "louvor": {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tom(c, master, t + i * 0.09, { freq: f, dur: 0.5, tipo: "sine", vol: 0.22 }),
      );
      break;
    }
    // 📷 Mídia — dois cliques de câmera
    case "midia": {
      ruido(c, master, t, 0.03, 0.35, 6000);
      ruido(c, master, t + 0.12, 0.05, 0.3, 5000);
      tom(c, master, t + 0.12, { freq: 1800, freqEnd: 900, dur: 0.06, tipo: "square", vol: 0.12 });
      break;
    }
    // ✨ Dança — glissando ascendente leve
    case "danca": {
      tom(c, master, t, { freq: 330, freqEnd: 990, dur: 0.5, tipo: "triangle", vol: 0.22 });
      tom(c, master, t + 0.06, { freq: 660, freqEnd: 1320, dur: 0.4, tipo: "sine", vol: 0.12 });
      break;
    }
    // 🌸 Mulheres · Sabaoth — acorde quente e suave
    case "sabaoth": {
      [440, 554.37, 659.25].forEach((f) =>
        tom(c, master, t, { freq: f, dur: 0.75, tipo: "sine", vol: 0.16, attack: 0.05 }),
      );
      break;
    }
    // 🔥 Jovens — zap enérgico
    case "jovens": {
      tom(c, master, t, { freq: 880, freqEnd: 180, dur: 0.22, tipo: "square", vol: 0.2 });
      tom(c, master, t + 0.04, { freq: 1200, freqEnd: 400, dur: 0.18, tipo: "sawtooth", vol: 0.12 });
      break;
    }
    // 🧭 Adolescentes — dois toques brincalhões
    case "adolescentes": {
      tom(c, master, t, { freq: 660, dur: 0.16, tipo: "triangle", vol: 0.22 });
      tom(c, master, t + 0.14, { freq: 990, dur: 0.2, tipo: "triangle", vol: 0.22 });
      break;
    }
    // 🍼 Kids — bloop fofo ascendente
    case "kids": {
      tom(c, master, t, { freq: 500, freqEnd: 1100, dur: 0.22, tipo: "sine", vol: 0.28 });
      break;
    }
    // 💛 Atos de Amor — duas notas gentis
    case "atos": {
      tom(c, master, t, { freq: 587.33, dur: 0.35, tipo: "sine", vol: 0.2, attack: 0.03 });
      tom(c, master, t + 0.18, { freq: 880, dur: 0.5, tipo: "sine", vol: 0.2, attack: 0.03 });
      break;
    }
    default: {
      tom(c, master, t, { freq: 660, dur: 0.18, tipo: "sine", vol: 0.2 });
    }
  }
}
