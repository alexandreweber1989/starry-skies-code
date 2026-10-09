/** Utilitários do painel principal (saudação, versículo do dia, completude do perfil). */

/** Saudação conforme o horário local. */
export function saudacaoPorHorario(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Data de hoje por extenso em pt-BR (ex.: "quinta-feira, 9 de outubro"). */
export function dataHojeExtenso(d = new Date()): string {
  const txt = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

/** Versículo do dia — rotaciona de forma determinística pelo dia do ano. */
const VERSICULOS: { texto: string; ref: string }[] = [
  { texto: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23.1" },
  { texto: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4.13" },
  { texto: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", ref: "Salmos 119.105" },
  { texto: "Porque para Deus nada é impossível.", ref: "Lucas 1.37" },
  { texto: "O amor é paciente, o amor é bondoso.", ref: "1 Coríntios 13.4" },
  { texto: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", ref: "Salmos 37.5" },
  { texto: "Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.", ref: "Filipenses 4.4" },
  { texto: "Buscai primeiro o Reino de Deus e a sua justiça.", ref: "Mateus 6.33" },
  { texto: "O Senhor é a minha luz e a minha salvação; a quem temerei?", ref: "Salmos 27.1" },
  { texto: "Sede fortes e corajosos; o Senhor vai com você.", ref: "Deuteronômio 31.6" },
  { texto: "Em tudo dai graças, porque esta é a vontade de Deus.", ref: "1 Tessalonicenses 5.18" },
  { texto: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.", ref: "1 Pedro 5.7" },
  { texto: "Aquietai-vos e sabei que eu sou Deus.", ref: "Salmos 46.10" },
  { texto: "O choro pode durar uma noite, mas a alegria vem pela manhã.", ref: "Salmos 30.5" },
  { texto: "Amarás o teu próximo como a ti mesmo.", ref: "Marcos 12.31" },
  { texto: "Onde estiverem dois ou três reunidos em meu nome, ali eu estou.", ref: "Mateus 18.20" },
  { texto: "A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.", ref: "2 Coríntios 12.9" },
  { texto: "Tudo tem o seu tempo determinado debaixo do céu.", ref: "Eclesiastes 3.1" },
  { texto: "Confia no Senhor de todo o teu coração.", ref: "Provérbios 3.5" },
  { texto: "Esforça-te, e tem bom ânimo; não temas.", ref: "Josué 1.9" },
];

export function versiculoDoDia(d = new Date()): { texto: string; ref: string } {
  const inicioAno = new Date(d.getFullYear(), 0, 0);
  const diaDoAno = Math.floor((d.getTime() - inicioAno.getTime()) / 86_400_000);
  return VERSICULOS[diaDoAno % VERSICULOS.length];
}

/** Campos considerados no cálculo de completude do perfil. */
const CAMPOS_PERFIL: { campo: string; rotulo: string }[] = [
  { campo: "full_name", rotulo: "Nome completo" },
  { campo: "phone", rotulo: "Telefone" },
  { campo: "birth_date", rotulo: "Data de nascimento" },
  { campo: "avatar_url", rotulo: "Foto" },
  { campo: "gender", rotulo: "Gênero" },
  { campo: "marital_status", rotulo: "Estado civil" },
  { campo: "street", rotulo: "Endereço" },
  { campo: "emergency_contact_name", rotulo: "Contato de emergência" },
];

/** Percentual de completude e lista do que falta preencher. */
export function completudePerfil(perfil: Record<string, unknown> | null | undefined): {
  pct: number;
  faltando: string[];
  total: number;
  preenchidos: number;
} {
  const total = CAMPOS_PERFIL.length;
  if (!perfil) return { pct: 0, faltando: CAMPOS_PERFIL.map((c) => c.rotulo), total, preenchidos: 0 };
  const faltando: string[] = [];
  for (const { campo, rotulo } of CAMPOS_PERFIL) {
    const v = perfil[campo];
    const vazio = v === null || v === undefined || (typeof v === "string" && v.trim() === "");
    if (vazio) faltando.push(rotulo);
  }
  const preenchidos = total - faltando.length;
  return { pct: Math.round((preenchidos / total) * 100), faltando, total, preenchidos };
}

/** Aniversariantes nos próximos N dias, a partir de uma lista com birth_date. */
export function aniversariantesProximos<T extends { birth_date?: string | null; full_name?: string | null }>(
  pessoas: T[],
  dias = 7,
  hoje = new Date(),
): (T & { diaMes: string; quando: string })[] {
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const out: { dado: T & { diaMes: string; quando: string }; delta: number }[] = [];
  for (const p of pessoas) {
    if (!p.birth_date) continue;
    const nasc = new Date(p.birth_date);
    if (Number.isNaN(nasc.getTime())) continue;
    // Próxima ocorrência do aniversário a partir de hoje.
    let prox = new Date(base.getFullYear(), nasc.getMonth(), nasc.getDate());
    if (prox < base) prox = new Date(base.getFullYear() + 1, nasc.getMonth(), nasc.getDate());
    const delta = Math.round((prox.getTime() - base.getTime()) / 86_400_000);
    if (delta < 0 || delta > dias) continue;
    const diaMes = nasc.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
    const quando = delta === 0 ? "hoje" : delta === 1 ? "amanhã" : `em ${delta} dias`;
    out.push({ dado: { ...p, diaMes, quando }, delta });
  }
  out.sort((a, b) => a.delta - b.delta);
  return out.map((o) => o.dado);
}
