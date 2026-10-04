import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CepInput } from "@/components/ui/cep-input";
import type { AddressParts } from "@/lib/cep";
/** Respeita "prefers-reduced-motion"; hidratação-safe (começa falso no SSR). */
function useMenosMovimento() {
  const [reduz, setReduz] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduz(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduz(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduz;
}

export const Route = createFileRoute("/quero-fazer-parte")({
  head: () => ({
    meta: [
      { title: "Quero fazer parte — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Dê o primeiro passo para fazer parte da Igreja Batista Atos. Conte um pouco sobre você e conectamos com alguém pertinho de onde você mora.",
      },
      { property: "og:title", content: "Quero fazer parte — Igreja Batista Atos" },
      { property: "og:description", content: "Venha como você é. Vamos te receber de perto." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: QueroFazerParte,
});

/** Dados coletados — todos opcionais no banco, mas pedimos o essencial para o contato. */
interface FormState {
  full_name: string;
  phone: string;
  email: string;
  city: string;
  neighborhood: string;
  zip_code: string;
  state: string;
  address: string;
  age_range: string;
  notes: string;
}

const EMPTY: FormState = {
  full_name: "",
  phone: "",
  email: "",
  city: "",
  neighborhood: "",
  zip_code: "",
  state: "",
  address: "",
  age_range: "",
  notes: "",
};

const FAIXAS = [
  { value: "crianca", label: "Criança (até 11)" },
  { value: "adolescente", label: "Adolescente (12–17)" },
  { value: "jovem", label: "Jovem (18–29)" },
  { value: "adulto", label: "Adulto (30–59)" },
  { value: "melhor_idade", label: "Melhor idade (60+)" },
  { value: "prefiro_nao_dizer", label: "Prefiro não dizer" },
];

const soDigitos = (v: string) => v.replace(/\D/g, "");

interface Step {
  id: string;
  eyebrow: string;
  question: string;
  hint?: string;
  valid?: (s: FormState) => boolean;
  render: (s: FormState, set: <K extends keyof FormState>(k: K, v: FormState[K]) => void, next: () => void) => React.ReactNode;
}

function QueroFazerParte() {
  const navigate = useNavigate();
  const menosMovimento = useMenosMovimento();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const steps = useMemo<Step[]>(
    () => [
      {
        id: "nome",
        eyebrow: "Prazer em te conhecer",
        question: "Como você se chama?",
        hint: "Pode ser seu nome completo — é assim que vamos te chamar.",
        valid: (s) => s.full_name.trim().length >= 3,
        render: (s, set, next) => (
          <Input
            autoFocus
            value={s.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
            placeholder="Seu nome"
            autoComplete="name"
            className="h-14 text-lg"
          />
        ),
      },
      {
        id: "whatsapp",
        eyebrow: "Para a gente te chamar",
        question: "Qual seu WhatsApp?",
        hint: "É por aqui que alguém da igreja vai te dar um alô — sem spam, prometido.",
        valid: (s) => soDigitos(s.phone).length >= 10,
        render: (s, set, next) => (
          <Input
            autoFocus
            inputMode="tel"
            type="tel"
            autoComplete="tel"
            value={s.phone}
            onChange={(e) => set("phone", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
            placeholder="(47) 99999-0000"
            className="h-14 text-lg"
          />
        ),
      },
      {
        id: "email",
        eyebrow: "Opcional",
        question: "Tem um e-mail?",
        hint: "Se quiser, deixe seu e-mail também. Se preferir, é só pular.",
        valid: () => true,
        render: (s, set, next) => (
          <Input
            autoFocus
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            value={s.email}
            onChange={(e) => set("email", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
            placeholder="voce@email.com (opcional)"
            className="h-14 text-lg"
          />
        ),
      },
      {
        id: "local",
        eyebrow: "Para te conectar com quem está perto",
        question: "Onde você mora?",
        hint: "Com isso, encontramos a pessoa mais próxima de você para te receber — e, quem sabe, uma mesa (grupo) pertinho da sua casa.",
        valid: (s) => s.city.trim().length >= 2,
        render: (s, set) => (
          <div className="space-y-5">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <Label htmlFor="cep" className="text-sm font-medium">
                Sabe seu CEP? Digite e a gente preenche o resto pra você 👇
              </Label>
              <div className="mt-2 max-w-[220px]">
                <CepInput
                  id="cep"
                  value={s.zip_code}
                  onChange={(v) => set("zip_code", v)}
                  onResolved={(a: AddressParts) => {
                    if (a.city) set("city", a.city);
                    if (a.neighborhood) set("neighborhood", a.neighborhood);
                    if (a.state) set("state", a.state);
                    if (a.street) set("address", a.street);
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <CityAutocomplete
                value={s.city}
                onChange={(nome, uf) => {
                  set("city", nome);
                  if (uf) set("state", uf);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={s.neighborhood}
                onChange={(e) => set("neighborhood", e.target.value)}
                placeholder="Seu bairro"
                autoComplete="address-level3"
              />
            </div>
          </div>
        ),
      },
      {
        id: "faixa",
        eyebrow: "Opcional",
        question: "Qual sua faixa de idade?",
        hint: "Ajuda a gente a te apresentar as pessoas e grupos com a sua cara.",
        valid: () => true,
        render: (s, set) => (
          <Select value={s.age_range} onValueChange={(v) => set("age_range", v)}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {FAIXAS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        id: "sobre",
        eyebrow: "Conte pra gente",
        question: "O que te traz até aqui?",
        hint: "Pode ser qualquer coisa: curiosidade, um convite, uma busca, um momento difícil. Venha como você é.",
        valid: () => true,
        render: (s, set) => (
          <Textarea
            autoFocus
            rows={4}
            value={s.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Escreva com suas palavras… (opcional)"
            className="text-lg"
          />
        ),
      },
    ],
    [],
  );

  const total = steps.length;
  const step = steps[Math.min(index, total - 1)];
  const isLast = index === total - 1;
  const canAdvance = step.valid ? step.valid(form) : true;

  function next() {
    if (!canAdvance) {
      toast.error("Preencha este passo para continuar.");
      return;
    }
    if (isLast) {
      void submit();
    } else {
      setIndex((i) => Math.min(i + 1, total - 1));
    }
  }

  function back() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  async function submit() {
    setSaving(true);
    const { error } = await supabase.from("membership_requests").insert({
      full_name: form.full_name.trim().slice(0, 120),
      email: form.email.trim().toLowerCase().slice(0, 255) || null,
      phone: form.phone.trim().slice(0, 30) || null,
      city: form.city.trim().slice(0, 120) || null,
      neighborhood: form.neighborhood.trim().slice(0, 120) || null,
      zip_code: soDigitos(form.zip_code).slice(0, 8) || null,
      state: form.state.trim().slice(0, 2).toUpperCase() || null,
      address: form.address.trim().slice(0, 200) || null,
      age_range: form.age_range || null,
      notes: form.notes.trim().slice(0, 1000) || null,
      status: "pendente",
    } as never);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
      return;
    }
    setDone(true);
  }

  // ----- Tela de boas-vindas -----
  if (!started) {
    return (
      <Shell>
        <div className={menosMovimento ? "" : "animate-in fade-in slide-in-from-bottom-4 duration-500"}>
          <HeartHandshake className="h-10 w-10 text-primary" aria-hidden="true" />
          <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
            Igreja Batista Atos
          </div>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold leading-tight">
            Que bom que você quer<br />fazer parte.
          </h1>
          <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
            São poucas perguntas, rápidas. Com elas, a gente encontra{" "}
            <span className="text-foreground font-medium">a pessoa certa, mais pertinho de você</span>,
            para te dar um alô, te conhecer e te convidar para uma mesa (grupo) perto da sua casa.
            Sem compromisso. Venha como você é.
          </p>
          <Button className="mt-8 h-14 px-8 text-base" onClick={() => setStarted(true)}>
            Começar <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-6 text-xs text-muted-foreground">
            Já faz parte?{" "}
            <Link to="/auth" className="underline underline-offset-4 hover:text-foreground">
              Entrar na plataforma
            </Link>
          </p>
        </div>
      </Shell>
    );
  }

  // ----- Tela final -----
  if (done) {
    return (
      <Shell>
        <div className={menosMovimento ? "" : "animate-in fade-in zoom-in-95 duration-500"}>
          <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight">
            Recebemos, {form.full_name.split(" ")[0]}! 🙌
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
            Já estamos procurando <span className="text-foreground font-medium">alguém pertinho de você</span>{" "}
            para te dar um alô em breve pelo WhatsApp. Fica de olho!
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>
              Voltar ao início
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setForm(EMPTY);
                setIndex(0);
                setDone(false);
                setStarted(false);
              }}
            >
              Enviar outra
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  // ----- Passos (Typeform) -----
  const progresso = Math.round(((index + 1) / total) * 100);

  return (
    <Shell>
      {/* Barra de progresso */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => (index === 0 ? setStarted(false) : back())}
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div
        key={step.id}
        className={menosMovimento ? "" : "animate-in fade-in slide-in-from-bottom-4 duration-300"}
      >
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
          {step.id === "local" && <MapPin className="h-3.5 w-3.5" />}
          {step.eyebrow} · {index + 1} de {total}
        </div>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          {step.question}
        </h2>
        {step.hint && <p className="mt-3 text-sm text-muted-foreground max-w-md">{step.hint}</p>}

        <div className="mt-8 max-w-md">{step.render(form, set, next)}</div>

        <div className="mt-8 flex items-center gap-3">
          <Button className="h-12 px-6" onClick={next} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLast ? (
              <>Enviar <Check className="h-4 w-4" /></>
            ) : (
              <>Continuar <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
          {!isLast && step.valid && !step.valid(form) ? null : (
            <span className="text-xs text-muted-foreground">Enter ↵</span>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ------- Autocomplete de cidade (IBGE, carregado uma vez por sessão) ------- */
type Municipio = { nome: string; uf: string };
let municipiosCache: Municipio[] | null = null;
let municipiosPromise: Promise<Municipio[]> | null = null;

function carregarMunicipios(): Promise<Municipio[]> {
  if (municipiosCache) return Promise.resolve(municipiosCache);
  if (!municipiosPromise) {
    municipiosPromise = fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome",
    )
      .then((r) => r.json())
      .then((data: Array<Record<string, any>>) =>
        data.map((m) => ({
          nome: String(m.nome ?? ""),
          uf: String(m?.microrregiao?.mesorregiao?.UF?.sigla ?? ""),
        })),
      )
      .then((list) => {
        municipiosCache = list;
        return list;
      })
      .catch(() => {
        municipiosPromise = null;
        return [] as Municipio[];
      });
  }
  return municipiosPromise;
}

function CityAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (nome: string, uf?: string) => void;
}) {
  const [all, setAll] = useState<Municipio[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void carregarMunicipios().then(setAll);
  }, []);

  const termo = value.trim().toLowerCase();
  const sugestoes = useMemo(() => {
    if (termo.length < 2) return [];
    return all.filter((m) => m.nome.toLowerCase().includes(termo)).slice(0, 8);
  }, [all, termo]);

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Comece a digitar sua cidade…"
        autoComplete="off"
      />
      {open && sugestoes.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {sugestoes.map((m) => (
            <li key={`${m.nome}-${m.uf}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(m.nome, m.uf);
                  setOpen(false);
                }}
              >
                <span>{m.nome}</span>
                <span className="text-xs text-muted-foreground">{m.uf}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Moldura visual consistente com a tela de login (/auth). */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16 sm:px-10">
        {children}
      </div>
    </main>
  );
}
