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


const CIDADES_HABILITADAS = [
  { id: 4104808, nome: "Cascavel", uf: "PR" },
  { id: 4202100, nome: "Barra Velha", uf: "SC" },
  { id: 4104907, nome: "Castro", uf: "PR" },
  { id: 4119905, nome: "Ponta Grossa", uf: "PR" },
];

const BAIRROS_POR_CIDADE: Record<string, string[]> = {
  "4104808": [ // Cascavel
    "14 de Novembro", "Alto Alegre", "Brasmadeira", "Cancelli", "Caravelle", 
    "Cascavel Velho", "Centro", "Coqueiral", "Country", "Esmeralda", "Fag", 
    "Floresta", "Guarujá", "Interlagos", "Jardim Itália", "Maria Luiza", "Neva", 
    "Pacaembu", "Parque São Paulo", "Parque Verde", "Pioneiros", 
    "Região do Lago", "Santa Cruz", "Santa Felicidade", "Santo Onofre", 
    "Santos Dumont", "São Cristóvão", "Universitário"
  ],
  "4202100": [ // Barra Velha
    "Centro", "Escalvado", "Icaraí", "Itajuba", "Medeiros", "Pedreiras", 
    "Quinta dos Açorianos", "São Cristóvão", "Tabuleiro", "Vila Nova"
  ],
  "4104907": [ // Castro
    "Alvorada", "Cantagalo", "Centro", "Invernada", "Jardim Araucária", 
    "Jardim Arapongas", "Jardim Colonial", "Jardim Primavera", "Jardim das Agulhas", 
    "Jardim das Flores", "Jardim das Nações", "Morada do Sol", "Santa Cruz", "Vila Rio Branco"
  ],
  "4119905": [ // Ponta Grossa
    "Boa Vista", "Cará-Cará", "Centro", "Chapada", "Colônia Dona Luíza",
    "Contorno", "Estrela", "Guaragi", "Itaiacoca", "Jardim Carvalho",
    "Neves", "Nova Rússia", "Oficinas", "Olarias", "Piriquitos",
    "Ronda", "Uvaia", "Uvaranas"
  ]
};

export function CadastroLead() {
  const reduce = useReducedMotion();
  const { bairros, buscarBairros, loadingBairros } = useLocalidades();
  
  const [form, setForm] = useState({ 
    nome: "", 
    whatsapp: "", 
    perfil: "", 
    uf: "",
    cidadeId: "",
    cidadeNome: "",
    bairro: "",
    bairroManual: ""
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
    
    if (k === "cidadeId") {
      const city = CIDADES_HABILITADAS.find(c => c.id.toString() === value);
      buscarBairros(Number(value));
      setForm((f) => ({ 
        ...f, 
        cidadeId: value, 
        cidadeNome: city?.nome || "", 
        uf: city?.uf || "",
        bairro: "" 
      }));
      return;
    }


    setForm((f) => ({ ...f, [k]: value }));
    if (k === "bairro" && value !== "Outro") {
      setForm(f => ({ ...f, bairroManual: "" }));
    }
  };


  const valido =
    form.nome.trim().length > 1 && 
    form.whatsapp.replace(/\D/g, "").length >= 10 && 
    form.perfil && 
    form.uf &&
    form.cidadeId &&
    (form.bairro === "Outro" ? form.bairroManual.trim().length > 1 : form.bairro);


  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    const numericPhone = form.whatsapp.replace(/\D/g, "");
    const bairroFinal = form.bairro === "Outro" ? form.bairroManual.trim() : form.bairro;
    const mesaPrincipal = acharMesa(form.perfil, bairroFinal, form.cidadeNome);
    const outrasMesas = listarOutrasMesas(form.perfil, mesaPrincipal);

    try {
      await supabase.from("leads").insert({
        name: form.nome.trim(),
        phone: numericPhone,
        profile: form.perfil,
        neighborhood: bairroFinal,

        city: form.cidadeNome,
        state: form.uf,
        suggested_mesa: mesaPrincipal?.mesa ?? null,
        status: "novo",
      });
    } catch (err) {
      console.error("Erro ao salvar lead:", err);
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
    <div className="w-full lg:max-w-4xl xl:max-w-5xl mx-auto rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-6 lg:p-16 xl:p-20 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative group">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-1000" />
      
      <AnimatePresence mode="wait">
        {resultado === undefined ? (
          <motion.form
            key="form"
            onSubmit={enviar}
            initial={reduce ? undefined : { opacity: 0, x: 20 }}
            animate={reduce ? undefined : { opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative z-10"
          >
            <div className="flex gap-2 mb-8">
              <motion.span 
                initial={{ width: 0 }}
                animate={{ width: "33%" }}
                className="h-1 rounded-full bg-primary" 
              />
              <span className="h-1 flex-1 rounded-full bg-white/5" />
              <span className="h-1 flex-1 rounded-full bg-white/5" />
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-mono text-[10px] lg:text-xs font-bold uppercase tracking-[0.3em] text-primary/80 mb-2"
            >
              Comece sua jornada 👋
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-3xl sm:text-4xl xl:text-6xl font-bold leading-[0.9] tracking-tighter mb-4"
            >
              Encontre sua Mesa.
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base lg:text-lg xl:text-xl text-muted-foreground/80 max-w-2xl mb-10 leading-relaxed"
            >
              Acreditamos que ninguém deve caminhar sozinho. Preencha os dados e te ajudaremos a encontrar a Mesa mais próxima da sua casa.
            </motion.p>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6">
                <Campo label="Você é">
                  <select value={form.perfil} onChange={set("perfil")} className={inputCls}>
                    <option value="">Selecione…</option>
                    {PERFIS.map((p) => (
                      <option key={p.v} value={p.v}>{p.label}</option>
                    ))}
                  </select>
                </Campo>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6">
                <Campo label="Cidade">
                  <select 
                    value={form.cidadeId} 
                    onChange={set("cidadeId")} 
                    className={inputCls}
                  >
                    <option value="">Selecione a Cidade…</option>
                    {CIDADES_HABILITADAS.map((c) => (
                      <option key={c.id} value={c.id.toString()}>{c.nome} ({c.uf})</option>
                    ))}
                  </select>
                </Campo>

                <Campo label="Bairro">
                  <select 
                    value={form.bairro} 
                    onChange={set("bairro")} 
                    className={inputCls}
                    disabled={!form.cidadeId || loadingBairros}
                  >
                    <option value="">{loadingBairros ? "Carregando…" : "Selecione o Bairro…"}</option>
                    {BAIRROS_POR_CIDADE[form.cidadeId] ? (
                      BAIRROS_POR_CIDADE[form.cidadeId].sort().map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))
                    ) : (
                      bairros.length > 0 && bairros.map((b) => (
                        <option key={b.id} value={b.nome}>{b.nome}</option>
                      ))
                    )}
                    {form.cidadeId && !loadingBairros && (
                      <option value="Outro">Digitar outro bairro...</option>
                    )}
                  </select>
                </Campo>
                {form.bairro === "Outro" && (
                  <Campo label="Qual o seu bairro?">
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="Ex: Jardim das Flores"
                      onChange={(e) => setForm(f => ({ ...f, bairroManual: e.target.value }))}
                      required
                    />
                  </Campo>
                )}
              </div>


            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              type="submit"
              disabled={!valido || enviando}
              className="mt-8 lg:mt-12 w-full inline-flex items-center justify-center gap-3 rounded-full bg-primary text-primary-foreground font-bold text-base lg:text-xl h-14 lg:h-20 px-8 lg:px-12 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20 group/btn"
            >
              {enviando ? (
                <Loader2 className="h-6 w-6 animate-spin motion-keep-spin" />
              ) : (
                <>
                  Ver minha Mesa ideal
                  <ArrowRight className="h-6 w-6 transition-transform group-hover/btn:translate-x-2" />
                </>
              )}
            </motion.button>
            <p className="text-xs lg:text-sm text-muted-foreground/60 text-center mt-6">
              Conectando você ao Reino, um bairro por vez.
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

            {resultado.principal ? (
              <>
                <p className="text-xs text-muted-foreground mt-3">
                  Sua Mesa mais próxima é:
                </p>
                <div className="mt-2 rounded-xl bg-foreground text-background p-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-background/55">
                    {resultado.principal.rede}
                  </div>
                  <div className="font-serif text-lg font-bold mt-0.5">{resultado.principal.mesa}</div>
                  <div className="text-xs text-background/70 mt-0.5">
                    {resultado.principal.dia} · {resultado.principal.hora} · {resultado.principal.local}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-background/85">
                    <span className="grid place-items-center h-6 w-6 rounded-full bg-background text-foreground font-serif text-[10px] font-bold">
                      {resultado.principal.lider.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 2).toUpperCase()}
                    </span>
                    Responsável: {resultado.principal.lider}
                  </div>
                </div>
                <a
                  href={linkWhatsApp(resultado.principal.whatsapp, mensagemWhats(resultado.principal))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm h-11 px-6 hover:opacity-90 transition-opacity"
                >
                  Falar com {resultado.principal.lider.split(" ").slice(-1)[0]} no WhatsApp
                </a>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-3">
                  Recebemos seu contato! Vamos encontrar a melhor Mesa para você.
                  Envie uma mensagem para que a nossa liderança possa te acolher.
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

            {resultado.outras.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Outras opções de Mesas para você:
                </p>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                  {resultado.outras.map((outra) => (
                    <div key={outra.mesa} className="p-3 rounded-lg border border-border/40 bg-card/50 flex justify-between items-center group">
                      <div>
                        <div className="text-[10px] font-bold text-primary uppercase">{outra.rede}</div>
                        <div className="text-sm font-serif font-bold">{outra.mesa}</div>
                        <div className="text-[10px] text-muted-foreground">{outra.dia} · {outra.hora}</div>
                      </div>
                      <a
                        href={linkWhatsApp(outra.whatsapp, mensagemWhats(outra))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setResultado(undefined)}
              className="mt-6 w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            >
              ← Voltar ao início
            </button>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/5 bg-white/5 px-4 lg:px-6 h-12 lg:h-16 text-base lg:text-lg text-foreground outline-none transition-all focus:border-primary/50 focus:bg-white/10 placeholder:text-muted-foreground/30 disabled:opacity-50 appearance-none";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.label 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="block"
    >
      <span className="block text-xs lg:text-sm font-bold text-muted-foreground/70 mb-2 lg:mb-3 uppercase tracking-wider">{label}</span>
      {children}
    </motion.label>
  );
}
