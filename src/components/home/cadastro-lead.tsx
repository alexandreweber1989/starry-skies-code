import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalidades } from "@/hooks/use-localidades";

/* ---------------------------------------------------------------------------
 * DADOS DE EXEMPLO — troque pelos reais depois (líderes, WhatsApp e os
 * bairros que cada Mesa atende). O encaminhamento usa este mapa para achar a
 * Mesa mais próxima do bairro, dentro da Rede certa (por perfil).
 * WhatsApp no formato internacional só com números: 55 + DDD + número.
 * ------------------------------------------------------------------------- */
type Mesa = {
  perfil: string;
  rede: string;
  mesa: string;
  dia: string;
  hora: string;
  local: string;
  bairros: string[];
  cidade?: string;
  lider: string;
  whatsapp: string;
};

const MESAS_EXEMPLO: Mesa[] = [
  { perfil: "homem", rede: "Rede Zadoque", mesa: "Mesa Zadoque 1", dia: "Quarta", hora: "20h", local: "Uvaranas", bairros: ["Uvaranas", "Oficinas", "Chapada"], cidade: "Ponta Grossa", lider: "Ap. André", whatsapp: "5542999990001" },
  { perfil: "homem", rede: "Rede Zadoque", mesa: "Mesa Zadoque 2", dia: "Quinta", hora: "20h", local: "Centro", bairros: ["Centro", "Nova Rússia", "Contorno"], cidade: "Ponta Grossa", lider: "Ap. Rafael", whatsapp: "5542999990002" },
  { perfil: "mulher", rede: "Rede Sabaoth", mesa: "Mesa Sabaoth 1", dia: "Terça", hora: "20h", local: "Oficinas", bairros: ["Uvaranas", "Oficinas", "Boa Vista"], cidade: "Ponta Grossa", lider: "Ap. Débora", whatsapp: "5542999990003" },
  { perfil: "mulher", rede: "Rede Sabaoth", mesa: "Mesa Sabaoth 2", dia: "Quinta", hora: "20h", local: "Centro", bairros: ["Centro", "Jardim Carvalho", "Colônia Dona Luíza"], cidade: "Ponta Grossa", lider: "Ap. Priscila", whatsapp: "5542999990004" },
  { perfil: "jovem", rede: "Rede de Jovens", mesa: "Mesa dos Jovens", dia: "Sábado", hora: "19h", local: "Templo", bairros: [], cidade: "Ponta Grossa", lider: "Líder Lucas", whatsapp: "5542999990005" },
  { perfil: "adolescente", rede: "Rede de Adolescentes", mesa: "Mesa dos Teens", dia: "Sábado", hora: "16h", local: "Sala Teens", bairros: [], cidade: "Ponta Grossa", lider: "Líder Ana", whatsapp: "5542999990006" },
];

// Número geral da igreja (fallback quando não encontramos Mesa) — troque pelo real.
const WHATSAPP_IGREJA = "5542900000000";

const PERFIS = [
  { v: "mulher", label: "Mulher" },
  { v: "homem", label: "Homem" },
  { v: "jovem", label: "Jovem (16+)" },
  { v: "adolescente", label: "Adolescente (7–15)" },
];

function acharMesa(perfil: string, bairro: string, cidade: string): Mesa | null {
  const daRede = MESAS_EXEMPLO.filter((m) => m.perfil === perfil);
  if (daRede.length === 0) return null;
  
  // Prioridade 1: Mesmo bairro e cidade
  const porBairro = daRede.find((m) => m.bairros.includes(bairro) && m.cidade === cidade);
  if (porBairro) return porBairro;

  // Prioridade 2: Mesma cidade
  const porCidade = daRede.find((m) => m.cidade === cidade);
  if (porCidade) return porCidade;

  // Fallback
  return daRede[0];
}

function listarOutrasMesas(perfil: string, mesaAtual: Mesa | null): Mesa[] {
  return MESAS_EXEMPLO.filter(m => m.perfil === perfil && m.mesa !== mesaAtual?.mesa);
}

function linkWhatsApp(numero: string, msg: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
}

const EASE = [0.22, 1, 0.36, 1] as const;


export function CadastroLead() {
  const reduce = useReducedMotion();
  const { estados, cidades, bairros, buscarCidades, buscarBairros, loadingCidades, loadingBairros } = useLocalidades();
  
  const [form, setForm] = useState({ 
    nome: "", 
    whatsapp: "", 
    perfil: "", 
    uf: "",
    cidadeId: "",
    cidadeNome: "",
    bairro: "" 
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ principal: Mesa | null; outras: Mesa[] } | undefined>(undefined);

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    let value = e.target.value;
    if (k === "whatsapp") {
      value = formatWhatsApp(value);
    }
    
    if (k === "uf") {
      buscarCidades(value);
      setForm((f) => ({ ...f, uf: value, cidadeId: "", cidadeNome: "", bairro: "" }));
      return;
    }

    if (k === "cidadeId") {
      const city = cidades.find(c => c.id.toString() === value);
      buscarBairros(Number(value));
      setForm((f) => ({ ...f, cidadeId: value, cidadeNome: city?.nome || "", bairro: "" }));
      return;
    }

    setForm((f) => ({ ...f, [k]: value }));
  };

  const valido =
    form.nome.trim().length > 1 && 
    form.whatsapp.replace(/\D/g, "").length >= 10 && 
    form.perfil && 
    form.uf &&
    form.cidadeId &&
    form.bairro;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    const numericPhone = form.whatsapp.replace(/\D/g, "");
    const mesaPrincipal = acharMesa(form.perfil, form.bairro, form.cidadeNome);
    const outrasMesas = listarOutrasMesas(form.perfil, mesaPrincipal);

    try {
      // @ts-ignore
      await (supabase.from("leads") as any).insert({
        name: form.nome.trim(),
        phone: numericPhone,
        profile: form.perfil,
        neighborhood: form.bairro,
        city: form.cidadeNome,
        state: form.uf,
        suggested_mesa: mesaPrincipal?.mesa ?? null,
        status: "novo",
      });
    } catch {
      // Ignora erro se tabela não existir
    }
    setResultado({ principal: mesaPrincipal ?? null, outras: outrasMesas });
    setEnviando(false);
  }


  const primeiroNome = form.nome.trim().split(" ")[0] || "";

  const mensagemWhats = (mesa: Mesa | null) =>
    mesa
      ? `Olá! Sou ${form.nome} (${form.bairro}). Vim pelo site e quero participar da ${mesa.mesa} (${mesa.dia} ${mesa.hora}). Pode me ajudar?`
      : `Olá! Sou ${form.nome} (${form.bairro}). Vim pelo site e quero conhecer a igreja e participar de uma Mesa.`;

  return (
    <div className="w-full lg:max-w-4xl xl:max-w-5xl mx-auto rounded-2xl lg:rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 sm:p-6 lg:p-12 xl:p-16 shadow-sm">
      <AnimatePresence mode="wait">
        {resultado === undefined ? (
          <motion.form
            key="form"
            onSubmit={enviar}
            initial={reduce ? undefined : { opacity: 0, y: 10 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {/* passos (decorativo) */}
            <div className="flex gap-1.5 mb-4">
              <span className="h-1 flex-1 rounded-full bg-primary" />
              <span className="h-1 flex-1 rounded-full bg-muted" />
              <span className="h-1 flex-1 rounded-full bg-muted" />
            </div>

            <div className="font-serif text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Novo por aqui? 👋
            </div>
            <h3 className="font-serif text-xl lg:text-3xl xl:text-4xl font-bold leading-tight mt-1 lg:mt-3">
              Encontre uma Mesa perto de você
            </h3>
            <p className="text-xs lg:text-base xl:text-lg text-muted-foreground mt-2 lg:mt-4 mb-4 lg:mb-8">
              A ideia é simples: queremos te ajudar a encontrar um grupo acolhedor para caminhar junto, bem pertinho da sua casa.
            </p>

            <div className="space-y-3 lg:space-y-6">
              <Campo label="Como podemos te chamar?">
                <input
                  value={form.nome}
                  onChange={set("nome")}
                  placeholder="Seu nome"
                  className={inputCls}
                  autoComplete="name"
                />
              </Campo>
              <Campo label="Seu WhatsApp">
                <input
                  value={form.whatsapp}
                  onChange={set("whatsapp")}
                  placeholder="(42) 9 0000-0000"
                  inputMode="tel"
                  className={inputCls}
                  autoComplete="tel"
                />
              </Campo>
              <div className="grid grid-cols-2 gap-3 lg:gap-6">
                <Campo label="Você é">
                  <select value={form.perfil} onChange={set("perfil")} className={inputCls}>
                    <option value="">Selecione…</option>
                    {PERFIS.map((p) => (
                      <option key={p.v} value={p.v}>{p.label}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Seu bairro">
                  <select value={form.bairro} onChange={set("bairro")} className={inputCls}>
                    <option value="">Selecione…</option>
                    {BAIRROS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Campo>
              </div>
            </div>

            <button
              type="submit"
              disabled={!valido || enviando}
              className="mt-4 lg:mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm lg:text-base xl:text-lg h-11 lg:h-14 px-6 lg:px-10 transition-opacity disabled:opacity-50 hover:opacity-90"
            >
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin motion-keep-spin" />
              ) : (
                <>
                  Começar minha jornada
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="text-[11px] lg:text-xs xl:text-sm text-muted-foreground/80 text-center mt-3 lg:mt-5">
              Vamos te conectar à Mesa e à liderança mais próxima.
            </p>
          </motion.form>
        ) : (
          <motion.div
            key="resultado"
            initial={reduce ? undefined : { opacity: 0, y: 10 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="flex items-center gap-2 text-primary">
              <span className="grid place-items-center h-7 w-7 rounded-full bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </span>
              <span className="font-serif text-sm font-bold">
                Que alegria, {primeiroNome}! 🎉
              </span>
            </div>

            {resultado ? (
              <>
                <p className="text-xs text-muted-foreground mt-3">
                  Sua Mesa mais próxima é:
                </p>
                <div className="mt-2 rounded-xl bg-foreground text-background p-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-background/55">
                    {resultado.rede}
                  </div>
                  <div className="font-serif text-lg font-bold mt-0.5">{resultado.mesa}</div>
                  <div className="text-xs text-background/70 mt-0.5">
                    {resultado.dia} · {resultado.hora} · {resultado.local}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-background/85">
                    <span className="grid place-items-center h-6 w-6 rounded-full bg-background text-foreground font-serif text-[10px] font-bold">
                      {resultado.lider.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 2).toUpperCase()}
                    </span>
                    Responsável: {resultado.lider}
                  </div>
                </div>
                <a
                  href={linkWhatsApp(resultado.whatsapp, mensagemWhats(resultado))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm h-11 px-6 hover:opacity-90 transition-opacity"
                >
                  Falar com {resultado.lider.split(" ").slice(-1)[0]} no WhatsApp
                </a>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-3">
                Recebemos seu contato! Vamos encontrar uma Mesa para você.
                É só enviar uma mensagem que a liderança te acolherá.
                </p>
                <a
                  href={linkWhatsApp(WHATSAPP_IGREJA, mensagemWhats(null))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm h-11 px-6 hover:opacity-90 transition-opacity"
                >
                  Falar no WhatsApp
                </a>
              </>
            )}

            <button
              type="button"
              onClick={() => setResultado(undefined)}
              className="mt-3 w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg lg:rounded-xl border border-border/70 bg-background/60 px-3 lg:px-4 h-10 lg:h-14 text-sm lg:text-base xl:text-lg text-foreground outline-none transition-colors focus:border-foreground focus:bg-background";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] lg:text-xs xl:text-sm font-semibold text-foreground/80 mb-1 lg:mb-2">{label}</span>
      {children}
    </label>
  );
}
