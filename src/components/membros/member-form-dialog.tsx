import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Section, SelectField, TextField } from "./member-fields";
import { ChurchFunctionCards } from "./church-function-cards";
import { CepInput } from "@/components/ui/cep-input";
import { FamilyLinksEditor } from "./family-links-editor";
import {
  BLOOD_TYPES,
  COURSE_OPTIONS,
  EDUCATION_LEVELS,
  GENDERS,
  MARITAL_STATUS,
  MEMBERSHIP_STATUS,
  MEMBERSHIP_TYPES,
  UFS,
} from "@/lib/membros";

export type MemberProfile = Record<string, any>;

/** Validação mínima: o restante da ficha é opcional por natureza pastoral. */
const schema = z.object({
  full_name: z.string().trim().min(3, "Informe o nome completo").max(120),
  email: z.union([z.string().trim().email("E-mail inválido").max(255), z.literal("")]),
  phone: z.string().trim().max(30),
  children_count: z.number().int().min(0).max(30),
});

const EMPTY: MemberProfile = {};

export function MemberFormDialog({
  profile,
  open,
  onOpenChange,
  canEditMembership,
}: {
  profile: MemberProfile | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Somente a administração define situação/forma de entrada na membresia. */
  canEditMembership: boolean;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<MemberProfile>(EMPTY);

  useEffect(() => {
    if (open && profile) setForm({ ...profile });
  }, [open, profile]);

  const set = (key: string) => (value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const str = (key: string) => (form[key] ?? "") as string;

  const toggleCourse = (course: string, checked: boolean) => {
    const current: string[] = Array.isArray(form.courses) ? form.courses : [];
    setForm((prev) => ({
      ...prev,
      courses: checked ? [...current, course] : current.filter((c) => c !== course),
    }));
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Cadastro não encontrado.");
      const parsed = schema.safeParse({
        full_name: str("full_name"),
        email: str("email"),
        phone: str("phone"),
        children_count: Number(form.children_count ?? 0),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      // Campos de data/texto vazios voltam como null para não sujar o banco.
      const clean = (v: unknown) => (v === "" || v === undefined ? null : v);
      const payload: Record<string, unknown> = {
        full_name: parsed.data.full_name,
        email: clean(parsed.data.email),
        phone: clean(parsed.data.phone),
        birth_date: clean(form.birth_date),
        gender: clean(form.gender),
        marital_status: clean(form.marital_status),
        spouse_name: clean(form.spouse_name),
        wedding_date: clean(form.wedding_date),
        father_name: clean(form.father_name),
        mother_name: clean(form.mother_name),
        profession: clean(form.profession),
        education: clean(form.education),
        cpf: clean(form.cpf),
        rg: clean(form.rg),
        zip_code: clean(form.zip_code),
        street: clean(form.street),
        street_number: clean(form.street_number),
        complement: clean(form.complement),
        neighborhood: clean(form.neighborhood),
        city: clean(form.city),
        state: clean(form.state),
        emergency_contact_name: clean(form.emergency_contact_name),
        emergency_contact_phone: clean(form.emergency_contact_phone),
        emergency_contact_relation: clean(form.emergency_contact_relation),
        conversion_date: clean(form.conversion_date),
        is_baptized: !!form.is_baptized,
        baptism_date: clean(form.baptism_date),
        baptism_church: clean(form.baptism_church),
        previous_church: clean(form.previous_church),
        member_since: clean(form.member_since),
        courses: Array.isArray(form.courses) ? form.courses : [],
        gifts: clean(form.gifts),
        availability: clean(form.availability),
        allergies: clean(form.allergies),
        health_notes: clean(form.health_notes),
        blood_type: clean(form.blood_type),
        has_children: !!form.has_children,
        children_count: parsed.data.children_count,
        bio: clean(form.bio),
        notes: clean(form.notes),
        church_function: form.church_function || "membro",
      };
      if (canEditMembership) {
        payload.membership_type = clean(form.membership_type);
        payload.membership_status = form.membership_status || "ativo";
        payload.membership_end_date = clean(form.membership_end_date);
      }

      const { error } = await supabase.from("profiles").update(payload as never).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ficha do membro atualizada.");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Ficha de membro</DialogTitle>
          <DialogDescription>
            Dados pessoais, endereço, vida cristã e informações de serviço.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-2">
          <Section title="Identificação">
            <TextField label="Nome completo" value={str("full_name")} onChange={set("full_name")} full />
            <TextField label="E-mail" type="email" value={str("email")} onChange={set("email")} />
            <TextField label="Telefone / WhatsApp" value={str("phone")} onChange={set("phone")} />
            <TextField label="Data de nascimento" type="date" value={str("birth_date")} onChange={set("birth_date")} />
            <SelectField label="Sexo" value={str("gender")} onChange={set("gender")} options={GENDERS} />
            <TextField label="CPF" value={str("cpf")} onChange={set("cpf")} maxLength={14} />
            <TextField label="RG" value={str("rg")} onChange={set("rg")} maxLength={20} />
            <SelectField
              label="Escolaridade"
              value={str("education")}
              onChange={set("education")}
              options={EDUCATION_LEVELS.map((e) => ({ value: e, label: e }))}
            />
            <TextField label="Profissão" value={str("profession")} onChange={set("profession")} />
          </Section>

          <Section title="Família">
            <SelectField
              label="Estado civil"
              value={str("marital_status")}
              onChange={set("marital_status")}
              options={MARITAL_STATUS}
            />
            <TextField label="Nome do cônjuge" value={str("spouse_name")} onChange={set("spouse_name")} />
            <TextField label="Data de casamento" type="date" value={str("wedding_date")} onChange={set("wedding_date")} />
            <TextField label="Nome do pai" value={str("father_name")} onChange={set("father_name")} />
            <TextField label="Nome da mãe" value={str("mother_name")} onChange={set("mother_name")} />
            <Field label="Possui filhos">
              <div className="flex items-center gap-3 h-9">
                <Switch checked={!!form.has_children} onCheckedChange={set("has_children")} />
                <span className="text-sm text-muted-foreground">{form.has_children ? "Sim" : "Não"}</span>
              </div>
            </Field>
            {form.has_children && (
              <TextField
                label="Quantidade de filhos"
                type="number"
                value={String(form.children_count ?? 0)}
                onChange={(v) => set("children_count")(Number(v) || 0)}
              />
            )}
          </Section>

          {profile?.id && (
            <Section title="Parentes cadastrados na igreja">
              <FamilyLinksEditor personId={profile.id as string} canEdit={canEditMembership} />
            </Section>
          )}

          <Section title="Endereço">
            <Field label="CEP">
              <CepInput
                value={str("zip_code")}
                onChange={set("zip_code")}
                onResolved={(a) => {
                  if (a.street) set("street")(a.street);
                  if (a.neighborhood) set("neighborhood")(a.neighborhood);
                  if (a.city) set("city")(a.city);
                  if (a.state) set("state")(a.state);
                }}
              />
            </Field>
            <TextField label="Rua" value={str("street")} onChange={set("street")} />
            <TextField label="Número" value={str("street_number")} onChange={set("street_number")} maxLength={10} />
            <TextField label="Complemento" value={str("complement")} onChange={set("complement")} />
            <TextField label="Bairro" value={str("neighborhood")} onChange={set("neighborhood")} />
            <TextField label="Cidade" value={str("city")} onChange={set("city")} />
            <SelectField
              label="Estado"
              value={str("state")}
              onChange={set("state")}
              options={UFS.map((u) => ({ value: u, label: u }))}
            />
          </Section>

          <Section title="Contato de emergência">
            <TextField
              label="Nome"
              value={str("emergency_contact_name")}
              onChange={set("emergency_contact_name")}
            />
            <TextField
              label="Telefone"
              value={str("emergency_contact_phone")}
              onChange={set("emergency_contact_phone")}
            />
            <TextField
              label="Parentesco"
              value={str("emergency_contact_relation")}
              onChange={set("emergency_contact_relation")}
            />
          </Section>

          <Section title="Vida cristã e membresia">
            <TextField label="Data da conversão" type="date" value={str("conversion_date")} onChange={set("conversion_date")} />
            <Field label="Batizado nas águas">
              <div className="flex items-center gap-3 h-9">
                <Switch checked={!!form.is_baptized} onCheckedChange={set("is_baptized")} />
                <span className="text-sm text-muted-foreground">{form.is_baptized ? "Sim" : "Não"}</span>
              </div>
            </Field>
            <TextField label="Data do batismo" type="date" value={str("baptism_date")} onChange={set("baptism_date")} />
            <TextField label="Igreja onde foi batizado" value={str("baptism_church")} onChange={set("baptism_church")} />
            <TextField label="Membro desde" type="date" value={str("member_since")} onChange={set("member_since")} />
            <TextField label="Igreja de origem" value={str("previous_church")} onChange={set("previous_church")} />
            {canEditMembership && (
              <>
                <SelectField
                  label="Forma de entrada"
                  value={str("membership_type")}
                  onChange={set("membership_type")}
                  options={MEMBERSHIP_TYPES}
                />
                <SelectField
                  label="Situação na membresia"
                  value={str("membership_status") || "ativo"}
                  onChange={set("membership_status")}
                  options={MEMBERSHIP_STATUS}
                />
                <TextField
                  label="Data de desligamento"
                  type="date"
                  value={str("membership_end_date")}
                  onChange={set("membership_end_date")}
                />
              </>
            )}
          </Section>

          <Section title="Formação e serviço">
            <Field label="Cursos e encontros concluídos" full>
              <div className="grid sm:grid-cols-2 gap-2">
                {COURSE_OPTIONS.map((course) => {
                  const checked = Array.isArray(form.courses) && form.courses.includes(course);
                  return (
                    <label key={course} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggleCourse(course, v === true)}
                      />
                      {course}
                    </label>
                  );
                })}
              </div>
            </Field>
            <Field label="Dons e talentos" full>
              <Textarea
                rows={2}
                maxLength={500}
                value={str("gifts")}
                onChange={(e) => set("gifts")(e.target.value)}
                placeholder="Ex.: canto, instrumentos, ensino, intercessão..."
              />
            </Field>
            <Field label="Disponibilidade para servir" full>
              <Textarea
                rows={2}
                maxLength={300}
                value={str("availability")}
                onChange={(e) => set("availability")(e.target.value)}
                placeholder="Ex.: domingo à noite, quartas, sábados pela manhã"
              />
            </Field>
          </Section>

          <Section title="Saúde e observações">
            <SelectField
              label="Tipo sanguíneo"
              value={str("blood_type")}
              onChange={set("blood_type")}
              options={BLOOD_TYPES.map((b) => ({ value: b, label: b }))}
            />
            <TextField label="Alergias" value={str("allergies")} onChange={set("allergies")} />
            <Field label="Observações de saúde" full>
              <Textarea
                rows={2}
                maxLength={500}
                value={str("health_notes")}
                onChange={(e) => set("health_notes")(e.target.value)}
              />
            </Field>
            <Field label="Testemunho / bio" full>
              <Textarea rows={3} maxLength={1000} value={str("bio")} onChange={(e) => set("bio")(e.target.value)} />
            </Field>
            {canEditMembership && (
              <Field label="Observações pastorais (internas)" full>
                <Textarea rows={3} maxLength={1000} value={str("notes")} onChange={(e) => set("notes")(e.target.value)} />
              </Field>
            )}
          </Section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar ficha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}