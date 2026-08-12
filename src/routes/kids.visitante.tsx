import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Baby, Check, Loader2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GUARDIAN_RELATIONS,
  KIDS_CLASSROOMS,
  suggestClassroom,
} from "@/lib/kids";

/**
 * Página pública do Kids (QR Code na porta da sala).
 *
 * Segurança: esta tela apenas **insere** um pedido de cadastro. Ela nunca lê a
 * lista de crianças — a única leitura possível é a busca por telefone, que
 * devolve somente o primeiro nome das crianças daquela família.
 * A criança só entra na sala depois que a equipe confere e aprova.
 */
export const Route = createFileRoute("/kids/visitante")({
  validateSearch: z.object({ kiosk: z.coerce.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Cadastro do Kids para visitantes | IB Atos" },
      {
        name: "description",
        content:
          "Cadastre seu filho no Ministério Infantil da Igreja Batista Atos em menos de um minuto. A equipe confere os dados e entrega a etiqueta com código de retirada.",
      },
      { property: "og:title", content: "Cadastro do Kids para visitantes | IB Atos" },
      {
        property: "og:description",
        content:
          "Cadastro rápido da criança visitante: turma, alergias e responsáveis autorizados a retirar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VisitorPage,
});

const schema = z.object({
  guardian_full_name: z.string().trim().min(3, "Informe o nome completo do responsável").max(120),
  guardian_phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe o telefone com DDD"),
  guardian_relation: z.string().min(1),
  guardian_document: z.string().trim().max(40).optional().or(z.literal("")),
  child_full_name: z.string().trim().min(3, "Informe o nome completo da criança").max(120),
  child_nickname: z.string().trim().max(60).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  classroom: z.string().min(1),
  allergies: z.string().trim().max(500).optional().or(z.literal("")),
  health_notes: z.string().trim().max(500).optional().or(z.literal("")),
  special_needs: z.string().trim().max(500).optional().or(z.literal("")),
  other_pickup: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  photo_consent: z.boolean(),
});

type FormState = z.infer<typeof schema>;

const EMPTY: FormState = {
  guardian_full_name: "",
  guardian_phone: "",
  guardian_relation: "mae",
  guardian_document: "",
  child_full_name: "",
  child_nickname: "",
  birth_date: "",
  classroom: "nao_definida",
  allergies: "",
  health_notes: "",
  special_needs: "",
  other_pickup: "",
  notes: "",
  photo_consent: false,
};

function VisitorPage() {
  const { kiosk } = Route.useSearch();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [knownChildId, setKnownChildId] = useState<string | null>(null);
  const [known, setKnown] = useState<{ child_id: string; first_name: string }[]>([]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Modo quiosque: volta sozinho ao início para a próxima família.
  useEffect(() => {
    if (!done || !kiosk) return;
    const t = setTimeout(() => reset(), 10000);
    return () => clearTimeout(t);
  }, [done, kiosk]);

  function reset() {
    setForm(EMPTY);
    setKnown([]);
    setKnownChildId(null);
    setDone(false);
  }

  /** Reconhece a família na volta — devolve apenas o primeiro nome das crianças. */
  async function lookupPhone(phone: string) {
    if (phone.replace(/\D/g, "").length < 10) return;
    const { data, error } = await supabase.rpc("kids_find_family_by_phone", { _phone: phone });
    if (error || !data?.length) return;
    setKnown(data as { child_id: string; first_name: string }[]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Confira os dados informados.");
      return;
    }
    const v = parsed.data;
    setSaving(true);
    
    // Agora usando a rota de API pública com validação Zod no servidor
    try {
      const response = await fetch('/api/public/kids-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: knownChildId,
          child_full_name: v.child_full_name,
          child_nickname: v.child_nickname || null,
          birth_date: v.birth_date || null,
          classroom: v.classroom,
          allergies: v.allergies || null,
          health_notes: v.health_notes || null,
          special_needs: v.special_needs || null,
          photo_consent: v.photo_consent,
          guardian_full_name: v.guardian_full_name,
          guardian_phone: v.guardian_phone,
          guardian_relation: v.guardian_relation,
          guardian_document: v.guardian_document || null,
          other_pickup: v.other_pickup || null,
          notes: v.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorData.error || "Falha na requisição");
      }
      
      setDone(true);
    } catch (error: any) {
      console.error("Erro ao enviar cadastro:", error);
      toast.error(error.message || "Não foi possível enviar. Chame alguém da equipe do Kids.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen grid place-items-center px-6 py-16 bg-background">
        <div className="max-w-md text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center">
            <Check className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl mt-6">Cadastro enviado</h1>
          <p className="text-muted-foreground mt-3">
            Agora é só chegar no balcão do Kids com um documento seu. A equipe confere os dados,
            libera a entrada e entrega a etiqueta com o <strong>código de retirada</strong> da
            criança. Sem esse código ninguém retira seu filho.
          </p>
          <Button variant="outline" className="mt-8" onClick={reset}>
            Cadastrar outra criança
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-yellow-50 px-4 sm:px-5 py-6 sm:py-10 font-kids selection:bg-pink-200 selection:text-pink-900">
      <div className="mx-auto w-full max-w-xl lg:max-w-4xl xl:max-w-5xl">
        <header className="relative text-center bg-white rounded-3xl sm:rounded-[3rem] p-6 sm:p-10 lg:p-16 border-4 border-yellow-200 shadow-xl mb-6 sm:mb-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400" />

          {kiosk && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="absolute -top-4 -left-4 sm:-left-8 rounded-full hover:bg-muted"
            >
              <Link to="/kids">
                <X className="h-5 w-5 text-muted-foreground" />
              </Link>
            </Button>
          )}
          <Baby className="h-8 w-8 text-primary mx-auto lg:h-12 lg:w-12" />
          <h1 className="text-2xl sm:text-4xl lg:text-5xl mt-4 font-bold text-yellow-600 tracking-tight">Bem-vindo ao Kids! 🎨</h1>
          <p className="text-sm sm:text-lg lg:text-xl mt-4 lg:mt-6 text-muted-foreground leading-relaxed">
            Estamos muito felizes em ter vocês aqui! O cadastro é rapidinho, e logo sua criança estará se divertindo com a gente.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-6 sm:space-y-8 bg-white rounded-3xl sm:rounded-[3rem] p-6 sm:p-12 lg:p-20 border-4 border-blue-100 shadow-2xl relative">
          <div className="absolute -top-6 -right-6 w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center text-white text-2xl animate-bounce">✨</div>
          <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-white text-3xl animate-pulse">🧸</div>

          <section className="space-y-4">
            <SectionTitle step="1" title="Quem está trazendo a criança" />
            <Field label="Telefone com DDD">
              <Input
                inputMode="tel"
                value={form.guardian_phone}
                onChange={(e) => set("guardian_phone", e.target.value)}
                onBlur={(e) => void lookupPhone(e.target.value)}
                placeholder="(11) 99999-0000"
                required
                className="lg:h-14 lg:text-xl lg:rounded-2xl"
              />
            </Field>

            {known.length > 0 && (
              <div className="border border-border bg-card rounded-sm p-4">
                <p className="text-sm text-muted-foreground">
                  Já conhecemos essa família. É uma dessas crianças?
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {known.map((k) => (
                    <Button
                      key={k.child_id}
                      type="button"
                      size="sm"
                      variant={knownChildId === k.child_id ? "default" : "outline"}
                      onClick={() => {
                        setKnownChildId(k.child_id);
                        set("child_full_name", form.child_full_name || k.first_name);
                      }}
                    >
                      {k.first_name}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant={knownChildId === null ? "default" : "outline"}
                    onClick={() => setKnownChildId(null)}
                  >
                    Outra criança
                  </Button>
                </div>
              </div>
            )}

            <Field label="Nome completo do responsável">
              <Input
                value={form.guardian_full_name}
                onChange={(e) => set("guardian_full_name", e.target.value)}
                required
                className="lg:h-14 lg:text-xl lg:rounded-2xl"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Parentesco">
                <Select
                  value={form.guardian_relation}
                  onValueChange={(v) => set("guardian_relation", v)}
                >
                  <SelectTrigger className="lg:h-14 lg:text-xl lg:rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GUARDIAN_RELATIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Documento (RG ou CPF)" hint="Opcional — agiliza a conferência">
                <Input
                  value={form.guardian_document}
                  onChange={(e) => set("guardian_document", e.target.value)}
                  className="lg:h-14 lg:text-xl lg:rounded-2xl"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle step="2" title="Sobre a criança" />
            <Field label="Nome completo da criança">
              <Input
                value={form.child_full_name}
                onChange={(e) => set("child_full_name", e.target.value)}
                required
                className="lg:h-14 lg:text-xl lg:rounded-2xl"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Como chamamos ela?" hint="Apelido, opcional">
                <Input
                  value={form.child_nickname}
                  onChange={(e) => set("child_nickname", e.target.value)}
                  className="lg:h-14 lg:text-xl lg:rounded-2xl"
                />
              </Field>
              <Field label="Data de nascimento">
                <Input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => {
                    set("birth_date", e.target.value);
                    if (e.target.value) set("classroom", suggestClassroom(e.target.value));
                  }}
                  className="lg:h-14 lg:text-xl lg:rounded-2xl"
                />
              </Field>
            </div>
            <Field label="Turma" hint="Sugerida pela idade — a equipe confirma no balcão">
              <Select value={form.classroom} onValueChange={(v) => set("classroom", v)}>
                <SelectTrigger className="lg:h-14 lg:text-xl lg:rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIDS_CLASSROOMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} — {c.hint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </section>

          <section className="space-y-4">
            <SectionTitle step="3" title="Cuidados de saúde" />
            <Field label="Alergias" hint="Alimentos, remédios, picadas…">
              <Textarea
                rows={2}
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
                className="lg:text-xl lg:rounded-2xl"
              />
            </Field>
            <Field label="Observações de saúde">
              <Textarea
                rows={2}
                value={form.health_notes}
                onChange={(e) => set("health_notes", e.target.value)}
                className="lg:text-xl lg:rounded-2xl"
              />
            </Field>
            <Field label="Necessidades específicas" hint="Autismo, TDAH, mobilidade, fraldas…">
              <Textarea
                rows={2}
                value={form.special_needs}
                onChange={(e) => set("special_needs", e.target.value)}
                className="lg:text-xl lg:rounded-2xl"
              />
            </Field>
          </section>

          <section className="space-y-4">
            <SectionTitle step="4" title="Retirada e autorizações" />
            <Field
              label="Quem mais pode retirar a criança"
              hint="Nome e telefone de cada pessoa autorizada"
            >
              <Textarea
                rows={2}
                value={form.other_pickup}
                onChange={(e) => set("other_pickup", e.target.value)}
                className="lg:text-xl lg:rounded-2xl"
              />
            </Field>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.photo_consent}
                onCheckedChange={(v) => set("photo_consent", v === true)}
                className="lg:h-6 lg:w-6"
              />
              <span className="text-sm lg:text-lg text-muted-foreground">
                Autorizo o uso de fotos da criança em registros do ministério infantil.
              </span>
            </label>
            <Field label="Algo mais que precisamos saber?">
              <Textarea 
                rows={2} 
                value={form.notes} 
                onChange={(e) => set("notes", e.target.value)} 
                className="lg:text-xl lg:rounded-2xl"
              />
            </Field>
          </section>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>
              A criança só é entregue mediante o código da etiqueta e o nome de quem retira. Os
              dados ficam visíveis apenas para a equipe do Kids.
            </span>
          </div>

          <Button type="submit" size="lg" className="w-full lg:h-16 lg:text-2xl lg:rounded-3xl shadow-xl hover:scale-[1.02] transition-transform" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 lg:h-6 lg:w-6 animate-spin" />}
            Enviar cadastro
          </Button>
        </form>
      </div>
    </main>
  );
}

function SectionTitle({ step, title }: { step: string; title: string }) {
  const colors = ["bg-yellow-400", "bg-pink-400", "bg-blue-400", "bg-green-400"];
  const color = colors[parseInt(step) - 1] || "bg-primary";
  
  return (
    <div className="flex items-center gap-4 border-b-4 border-dashed border-muted pb-4 mb-6 lg:pb-8 lg:mb-10">
      <span className={cn("flex h-10 w-10 lg:h-14 lg:w-14 items-center justify-center rounded-2xl text-white font-bold text-xl lg:text-3xl shadow-lg rotate-[-10deg]", color)}>
        {step}
      </span>
      <h2 className="text-2xl lg:text-4xl font-bold text-slate-800">{title}</h2>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 lg:space-y-3">
      <Label className="lg:text-xl">{label}</Label>
      {children}
      {hint && <p className="text-xs lg:text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
