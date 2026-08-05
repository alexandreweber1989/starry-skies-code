import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Baby, Pencil, Plus, CalendarDays, Heart, Shield, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChurchSelect } from "@/components/admin/church-select";
import { KIDS_CLASSROOMS, suggestClassroom, type KidsChild } from "@/lib/kids";
import { PhotoInput } from "@/components/kids/photo-input";
import { GuardiansEditor, emptyGuardian, type GuardianDraft } from "@/components/kids/guardians-editor";
import { cn } from "@/lib/utils";

interface ChildDialogProps {
  child?: KidsChild;
  trigger?: React.ReactNode;
}

interface ChildForm {
  full_name: string;
  nickname: string;
  birth_date: string;
  gender: string;
  classroom: string;
  church_id: string;
  allergies: string;
  health_notes: string;
  special_needs: string;
  notes: string;
  photo_consent: boolean;
  can_leave_alone: boolean;
  photo_url: string;
  is_active: boolean;
}

function initialForm(child?: KidsChild): ChildForm {
  return {
    full_name: child?.full_name ?? "",
    nickname: child?.nickname ?? "",
    birth_date: child?.birth_date ?? "",
    gender: child?.gender ?? "",
    classroom: child?.classroom ?? "nao_definida",
    church_id: child?.church_id ?? "",
    allergies: child?.allergies ?? "",
    health_notes: child?.health_notes ?? "",
    special_needs: child?.special_needs ?? "",
    notes: child?.notes ?? "",
    photo_consent: child?.photo_consent ?? false,
    can_leave_alone: child?.can_leave_alone ?? false,
    photo_url: child?.photo_url ?? "",
    is_active: child?.is_active ?? true,
  };
}

export function ChildDialog({ child, trigger }: ChildDialogProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ChildForm>(() => initialForm(child));
  const [guardians, setGuardians] = useState<GuardianDraft[]>([]);

  const set = <K extends keyof ChildForm>(key: K, value: ChildForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(child));
    if (!child) {
      setGuardians([{ ...emptyGuardian(), is_primary: true }]);
      return;
    }
    void supabase
      .from("kids_guardians")
      .select("*")
      .eq("child_id", child.id)
      .order("is_primary", { ascending: false })
      .then(({ data }) =>
        setGuardians(
          (data ?? []).map((g) => ({
            id: g.id,
            profile_id: g.profile_id,
            full_name: g.full_name,
            phone: g.phone ?? "",
            relation: g.relation,
            is_primary: g.is_primary,
            can_pickup: g.can_pickup,
            document: g.document ?? "",
            photo_url: g.photo_url ?? "",
          })),
        ),
      );
  }, [open, child]);

  const save = useMutation({
    mutationFn: async () => {
      const name = form.full_name.trim();
      if (!name) throw new Error("Informe o nome da criança.");
      const validGuardians = guardians.filter((g) => g.full_name.trim());
      if (validGuardians.length === 0)
        throw new Error("Cadastre pelo menos um responsável pela criança.");

      const payload = {
        full_name: name,
        nickname: form.nickname.trim() || null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        classroom: form.classroom,
        church_id: form.church_id || null,
        allergies: form.allergies.trim() || null,
        health_notes: form.health_notes.trim() || null,
        special_needs: form.special_needs.trim() || null,
        notes: form.notes.trim() || null,
        photo_consent: form.photo_consent,
        photo_url: form.photo_url.trim() || null,
        can_leave_alone: form.can_leave_alone,
        is_active: form.is_active,
      };

      let childId = child?.id;
      if (childId) {
        const { error } = await supabase.from("kids_children").update(payload).eq("id", childId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("kids_children")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        childId = data.id;
      }

      const keptIds = validGuardians.map((g) => g.id).filter(Boolean) as string[];
      let del = supabase.from("kids_guardians").delete().eq("child_id", childId);
      if (keptIds.length > 0) del = del.not("id", "in", `(${keptIds.join(",")})`);
      const { error: delError } = await del;
      if (delError) throw delError;

      const rows = validGuardians.map((g) => ({
        ...(g.id ? { id: g.id } : {}),
        child_id: childId!,
        profile_id: g.profile_id,
        full_name: g.full_name.trim(),
        phone: g.phone.trim() || null,
        relation: g.relation,
        is_primary: g.is_primary,
        can_pickup: g.can_pickup,
        document: g.document.trim() || null,
        photo_url: g.photo_url.trim() || null,
      }));
      const { error: upError } = await supabase.from("kids_guardians").upsert(rows);
      if (upError) throw upError;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["kids-children"] });
      void qc.invalidateQueries({ queryKey: ["kids-checkins"] });
      toast.success(child ? "Registro atualizado." : "Criança cadastrada com sucesso.");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="h-12 rounded-xl px-6 shadow-xl shadow-primary/10 hover:-translate-y-1 transition-all">
            <Plus className="mr-2 h-4.5 w-4.5" /> Nova Criança
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] border-border/50 shadow-2xl p-0">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-3xl font-serif">
              <Baby className="h-8 w-8 text-primary" />
              {child ? "Ajustar Cadastro" : "Cadastro Ministerial Kids"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground leading-relaxed mt-2">
              As informações de saúde e responsáveis são cruciais para a segurança durante o tempo em que a criança está sob nossos cuidados.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-10">
          {/* Seção 1: Identidade */}
          <div className="space-y-6">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary/60 px-1">1. Identidade e Localização</h4>
            <div className="grid lg:grid-cols-[auto_1fr] gap-8">
              <div className="shrink-0">
                <PhotoInput
                  label="Foto da Criança"
                  value={form.photo_url}
                  onChange={(v) => set("photo_url", v)}
                  folder="criancas"
                  variant="crianca"
                />
              </div>

              <div className="flex-1 grid sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                  <Input 
                    value={form.full_name} 
                    onChange={(e) => set("full_name", e.target.value)} 
                    className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
                    placeholder="Nome como na certidão"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Como prefere ser chamada</Label>
                  <Input 
                    value={form.nickname} 
                    onChange={(e) => set("nickname", e.target.value)} 
                    className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
                    placeholder="Apelido ou nome social"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Data de Nascimento</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                    <Input
                      type="date"
                      value={form.birth_date}
                      onChange={(e) => {
                        set("birth_date", e.target.value);
                        if (!child) set("classroom", suggestClassroom(e.target.value));
                      }}
                      className="h-11 pl-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Gênero</Label>
                  <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20 font-medium">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                      <SelectItem value="masculino" className="rounded-lg">Masculino</SelectItem>
                      <SelectItem value="feminino" className="rounded-lg">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Turma Recomendada</Label>
                  <Select value={form.classroom} onValueChange={(v) => set("classroom", v)}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                      {KIDS_CLASSROOMS.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="rounded-lg">
                          <span className="font-semibold">{c.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">· {c.hint}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Congregação</Label>
                  <ChurchSelect value={form.church_id} onChange={(v) => set("church_id", v)} />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Saúde */}
          <div className="space-y-6">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive/60 px-1">2. Protocolos de Saúde</h4>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                   <Heart className="h-3.5 w-3.5 text-destructive/60" />
                   <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Alergias Alimentares/Medicação</Label>
                </div>
                <Textarea
                  rows={2}
                  value={form.allergies}
                  onChange={(e) => set("allergies", e.target.value)}
                  placeholder="Ex.: amendoim, leite, corante, dipirona..."
                  className="rounded-2xl bg-muted/30 border-border/50 focus-visible:ring-destructive/20 font-medium resize-none p-4"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                   <Shield className="h-3.5 w-3.5 text-primary/60" />
                   <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cuidados Especiais</Label>
                </div>
                <Textarea
                  rows={2}
                  value={form.health_notes}
                  onChange={(e) => set("health_notes", e.target.value)}
                  placeholder="Condições que a equipe precisa saber..."
                  className="rounded-2xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium resize-none p-4"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Necessidades Específicas</Label>
                <Textarea
                  rows={2}
                  value={form.special_needs}
                  onChange={(e) => set("special_needs", e.target.value)}
                  className="rounded-2xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium resize-none p-4"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                   <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
                   <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Notas da Secretaria</Label>
                </div>
                <Textarea 
                  rows={2} 
                  value={form.notes} 
                  onChange={(e) => set("notes", e.target.value)} 
                  className="rounded-2xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium resize-none p-4"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Permissões */}
          <div className="space-y-6">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 px-1">3. Termos e Ativação</h4>
            <div className="flex flex-wrap gap-6 p-6 rounded-3xl bg-muted/20 border border-border/40">
              <label className="flex items-center gap-3 cursor-pointer group">
                <Switch
                  checked={form.photo_consent}
                  onCheckedChange={(v) => set("photo_consent", v)}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold">Uso de Imagem</span>
                  <p className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Autoriza fotos em cultos</p>
                </div>
              </label>
              
              <div className="w-[1px] h-10 bg-border/50 mx-2 hidden sm:block" />

              <label className="flex items-center gap-3 cursor-pointer group">
                <Switch
                  checked={form.can_leave_alone}
                  onCheckedChange={(v) => set("can_leave_alone", v)}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold">Saída Autônoma</span>
                  <p className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Pode sair sem responsável</p>
                </div>
              </label>

              <div className="w-[1px] h-10 bg-border/50 mx-2 hidden sm:block" />

              <label className="flex items-center gap-3 cursor-pointer group">
                <Switch 
                  checked={form.is_active} 
                  onCheckedChange={(v) => set("is_active", v)} 
                  className="data-[state=checked]:bg-primary"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold">Status do Cadastro</span>
                  <p className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Registro ativo no sistema</p>
                </div>
              </label>
            </div>
          </div>

          {/* Seção 4: Responsáveis */}
          <div className="pt-4">
            <GuardiansEditor value={guardians} onChange={setGuardians} />
          </div>
        </div>

        <div className="sticky bottom-0 z-20 bg-background/80 backdrop-blur-xl border-t border-border/50 p-8">
          <DialogFooter className="sm:justify-between gap-4">
            <Button variant="ghost" onClick={() => setOpen(false)} className="h-12 px-6 rounded-xl hover:bg-destructive/5 hover:text-destructive transition-colors">
              Cancelar
            </Button>
            <Button 
              onClick={() => save.mutate()} 
              disabled={save.isPending}
              className="h-14 px-12 rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all group"
            >
              {save.isPending ? "Processando..." : (child ? "Atualizar Cadastro" : "Finalizar Cadastro")}
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditChildButton({ child }: { child: KidsChild }) {
  return (
    <ChildDialog
      child={child}
      trigger={
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      }
    />
  );
}
