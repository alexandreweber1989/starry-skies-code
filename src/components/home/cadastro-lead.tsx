import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalidades } from "@/hooks/use-localidades";

// --- DADOS TEMPORÁRIOS DE ROTEAMENTO (Mantidos do anterior) ---
type Mesa = { perfil: string; rede: string; mesa: string; dia: string; hora: string; local: string; bairros: string[]; cidade?: string; lider: string; whatsapp: string; };

const MESAS_EXEMPLO: Mesa[] = [
  { perfil: "homem", rede: "Rede Zadoque", mesa: "Mesa Zadoque 1", dia: "Quarta", hora: "20h", local: "Uvaranas", bairros: ["Uvaranas", "Oficinas", "Chapada"], cidade: "Ponta Grossa", lider: "Ap. André", whatsapp: "5542999990001" },
  { perfil: "homem", rede: "Rede Zadoque", mesa: "Mesa Zadoque 2", dia: "Quinta", hora: "20h", local: "Centro", bairros: ["Centro", "Nova Rússia", "Contorno"], cidade: "Ponta Grossa", lider: "Ap. Rafael", whatsapp: "5542999990002" },
  { perfil: "mulher", rede: "Rede Sabaoth", mesa: "Mesa Sabaoth 1", dia: "Terça", hora: "20h", local: "Oficinas", bairros: ["Uvaranas", "Oficinas", "Boa Vista"], cidade: "Ponta Grossa", lider: "Ap. Débora", whatsapp: "5542999990003" },
  { perfil: "mulher", rede: "Rede Sabaoth", mesa: "Mesa Sabaoth 2", dia: "Quinta", hora: "20h", local: "Centro", bairros: ["Centro", "Jardim Carvalho", "Colônia Dona Luíza"], cidade: "Ponta Grossa", lider: "Ap. Priscila", whatsapp: "5542999990004" },
  { perfil: "jovem", rede: "Rede de Jovens", mesa: "Mesa dos Jovens", dia: "Sábado", hora: "19h", local: "Templo", bairros: [], cidade: "Ponta Grossa", lider: "Líder Lucas", whatsapp: "5542999990005" },
  { perfil: "adolescente", rede: "Rede de Adolescentes", mesa: "Mesa dos Teens", dia: "Sábado", hora: "16h", local: "Sala Teens", bairros: [], cidade: "Ponta Grossa", lider: "Líder Ana", whatsapp: "5542999990006" },
];
const WHATSAPP_IGREJA = "5542900000000";

const PERFIS = [
  { v: "mulher", label: "Mulher" },
  { v: "homem", label: "Homem" },
  { v: "jovem", label: "Jovem (16+)" },
  { v: "adolescente", label: "Adolescente (7-15)" },
];

function acharMesa(perfil: string, bairro: string, cidade: string): Mesa | null {
  const daRede = MESAS_EXEMPLO.filter((m) => m.perfil === perfil);
  if (daRede.length === 0) return null;
  const porBairro = daRede.find((m) => m.bairros.includes(bairro) && m.cidade === cidade);
  if (porBairro) return porBairro;
  const porCidade = daRede.find((m) => m.cidade === cidade);
  if (porCidade) return porCidade;
  return daRede[0];
}

function listarOutrasMesas(perfil: string, mesaAtual: Mesa | null): Mesa[] {
  return MESAS_EXEMPLO.filter(m => m.perfil === perfil && m.mesa !== mesaAtual?.mesa);
}

function linkWhatsApp(numero: string, msg: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
}

const CIDADES_HABILITADAS = [
  { id: 4104808, nome: "Cascavel", uf: "PR" },
  { id: 4202100, nome: "Barra Velha", uf: "SC" },
  { id: 4104907, nome: "Castro", uf: "PR" },
  { id: 4119905, nome: "Ponta Grossa", uf: "PR" },
];

const BAIRROS_POR_CIDADE: Record<string, string[]> = {
  "4104907": ["Centro", "Jardim Araucária", "Vila Rio Branco"],
  "4119905": ["Boa Vista", "Centro", "Jardim Carvalho", "Nova Rússia", "Oficinas", "Uvaranas"]
};

// COMPONENTE PRINCIPAL
export function CadastroLead() {
  const reduce = useReducedMotion();
  const { bairros, buscarBairros, loadingBairros } = useLocalidades();
  
  const [form, setForm] = useState({ nome: "", whatsapp: "", perfil: "", uf: "", cidadeId: "", cidadeNome: "", bairro: "", bairroManual: "" });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ principal: Mesa | null; outras: Mesa[] } | undefined>(undefined);

  const formatWhatsApp = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 2) return v;
    if (v.length <= 3) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2, 3)} ${v.slice(3)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 3)} ${v.slice(3, 7)}-${v.slice(7, 11)}`;
  };

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    let value = e.target.value;
    if (k === "whatsapp") value = formatWhatsApp(value);
    
    if (k === "cidadeId") {
      const city = CIDADES_HABILITADAS.find(c => c.id.toString() === value);
      buscarBairros(Number(value));
      setForm(f => ({ ...f, cidadeId: value, cidadeNome: city?.nome || "", uf: city?.uf || "", bairro: "" }));
      return;
    }
    setForm(f => ({ ...f, [k]: value }));
  };

  const valido = form.nome.length > 2 && form.whatsapp.replace(/\D/g, "").length >= 10 && form.perfil && form.cidadeId && (form.bairro === "Outro" ? form.bairroManual.length > 1 : form.bairro);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    const numericPhone = form.whatsapp.replace(/\D/g, "");
    const bairroFinal = form.bairro === "Outro" ? form.bairroManual.trim() : form.bairro;
    const mesaPrincipal = acharMesa(form.perfil, bairroFinal, form.cidadeNome);
    
    try {
      await supabase.from("leads").insert({
        name: form.nome.trim(), phone: numericPhone, profile: form.perfil,
        neighborhood: bairroFinal, city: form.cidadeNome, state: form.uf,
        suggested_mesa: mesaPrincipal?.mesa ?? null, status: "novo",
      });
    } catch (err) {}
    
    setResultado({ principal: mesaPrincipal ?? null, outras: listarOutrasMesas(form.perfil, mesaPrincipal) });
    setEnviando(false);
  }

  const anim = !reduce ? { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.95 } } : {};

  return (
    <div className="w-full relative mx-auto my-12" style={{ maxWidth: "1100px" }}>
      {/* Background Decorativo Aberto (não é mais uma caixa preta, integra no site) */}
      <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[400px] bg-sky-600/10 blur-[150px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        {!resultado ? (
          <motion.form key="form" onSubmit={enviar} {...anim} transition={{ duration: 0.6 }} className="relative z-10 w-full flex flex-col lg:flex-row gap-12 xl:gap-20">
            
            {/* Coluna da Esquerda - Títulos e Perfil */}
            <div className="flex-1 lg:max-w-md flex flex-col justify-start">
              <h3 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold leading-[0.95] tracking-tight text-white mb-6">
                Descubra a sua <br/><span className="text-primary italic font-light">Mesa.</span>
              </h3>
              <p className="text-zinc-400 text-lg leading-relaxed mb-12">
                A resposta não está num prédio enorme, está na simplicidade de uma mesa. Diz pra gente quem você é e onde está.
              </p>

              {/* Box de Perfil Moderno (Botões em vez de select) */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-2 block mb-4">Em qual grupo você está?</span>
                <div className="flex flex-wrap gap-2">
                  {PERFIS.map(p => (
                    <button
                      key={p.v} type="button"
                      onClick={() => setForm(f => ({ ...f, perfil: p.v }))}
                      className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 border ${
                        form.perfil === p.v 
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna da Direita - Campos de Texto Glass */}
            <div className="flex-1 flex flex-col justify-center gap-6 pt-4 lg:pt-0">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputClean label="Como chamamos você?" val={form.nome} onChange={set("nome")} hold="Seu nome" />
                <InputClean label="DDD + WhatsApp" val={form.whatsapp} onChange={set("whatsapp")} hold="(42) 90000-0000" type="tel" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectClean label="Sua Cidade" val={form.cidadeId} onChange={set("cidadeId")} options={CIDADES_HABILITADAS.map(c => ({val: c.id.toString(), num: `${c.nome}`}))} />
                <SelectClean label="Seu Bairro" val={form.bairro} onChange={set("bairro")} disabled={!form.cidadeId}
                  options={[
                    ...(BAIRROS_POR_CIDADE[form.cidadeId] ? BAIRROS_POR_CIDADE[form.cidadeId].sort().map(b => ({val: b, num: b})) : (bairros.map(b => ({val: b.nome, num: b.nome})))),
                    ...(form.cidadeId ? [{val:"Outro", num:"Outro bairro..."}] : [])
                  ]} 
                />
              </div>

              {form.bairro === "Outro" && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <InputClean label="Digite o bairro" val={form.bairroManual} onChange={(e) => setForm(f => ({...f, bairroManual: e.target.value}))} hold="Seu bairro" />
                </div>
              )}

              {/* Botão Flutuante Diferenciado */}
              <button
                type="submit" disabled={!valido || enviando}
                className="mt-8 relative overflow-hidden group w-full h-[80px] rounded-2xl bg-zinc-900 border border-white/10 text-white flex items-center justify-between px-8 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-white/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="font-serif italic text-2xl lg:text-3xl relative z-10 group-hover:text-primary transition-colors">
                  {enviando ? "Preparando..." : "Mostrar meu próximo passo"}
                </span>
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-black transition-all group-hover:-translate-x-2 relative z-10">
                  {enviando ? <Loader2 className="animate-spin w-5 h-5"/> : <ArrowRight className="w-6 h-6" />}
                </div>
              </button>

            </div>
          </motion.form>
        ) : (
          <motion.div key="result" {...anim} className="w-full max-w-3xl mx-auto rounded-3xl bg-zinc-950/60 backdrop-blur-2xl border border-white/10 p-10 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-6">
              <Check className="w-10 h-10" />
            </div>
            
            <h3 className="font-serif text-3xl lg:text-6xl text-white mb-2">Tudo pronto, {form.nome.split(" ")[0]}!</h3>
            <p className="text-zinc-400 text-lg mb-12">Seu lugar já está lá, falta apenas você chegar.</p>

            {resultado.principal ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-10 mb-8 text-left relative overflow-hidden group">
                <div className="text-xs font-bold text-primary tracking-[0.2em] uppercase mb-4">{resultado.principal.rede}</div>
                <div className="text-4xl lg:text-5xl font-serif text-white mb-2 group-hover:text-primary transition-colors">{resultado.principal.mesa}</div>
                <div className="text-zinc-400 text-lg mb-6 flex items-center gap-2"><MapPin className="w-4 h-4"/> {resultado.principal.local} — {resultado.principal.dia}, às {resultado.principal.hora}</div>
                
                <a href={linkWhatsApp(resultado.principal.whatsapp, `Olá, quero participar da ${resultado.principal.mesa}`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white text-black px-8 h-14 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                  Falar no WhatsApp <ArrowRight className="w-5 h-5"/>
                </a>
              </div>
            ) : (
             <a href={linkWhatsApp(WHATSAPP_IGREJA, "Olá! Vim pelo site...")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white text-black px-8 h-14 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                Falar com a Central <ArrowRight className="w-5 h-5"/>
             </a>
            )}

            <button onClick={() => setResultado(undefined)} className="text-sm text-zinc-500 hover:text-white transition-colors uppercase tracking-widest mt-8">← Tentar Novamente</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputClean({ label, val, hold, onChange, type="text" }: any) {
  return (
    <label className="flex flex-col gap-2 group">
      <span className="text-xs uppercase tracking-widest font-medium text-zinc-500 group-focus-within:text-white transition-colors pl-2">{label}</span>
      <input type={type} value={val} onChange={onChange} placeholder={hold} className="h-16 px-5 rounded-2xl bg-zinc-900/50 border border-white/10 text-white text-lg placeholder:text-zinc-700 outline-none transition-all focus:bg-white/5 focus:border-white/30 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
    </label>
  );
}

function SelectClean({ label, val, options, onChange, disabled }: any) {
  return (
    <label className={`flex flex-col gap-2 group ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <span className="text-xs uppercase tracking-widest font-medium text-zinc-500 group-focus-within:text-white transition-colors pl-2">{label}</span>
      <select value={val} onChange={onChange} disabled={disabled} className="h-16 px-5 rounded-2xl bg-zinc-900/50 border border-white/10 text-white text-lg outline-none transition-all focus:bg-white/5 focus:border-white/30 appearance-none disabled:cursor-not-allowed">
        <option value="" className="text-zinc-800">Selecione...</option>
        {options.map((o: any) => <option key={o.val} value={o.val} className="text-black">{o.num}</option>)}
      </select>
    </label>
  );
}