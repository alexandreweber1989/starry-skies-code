import { useState } from "react";
import { Plus, Trash2, UserPlus, ShieldCheck, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GUARDIAN_RELATIONS } from "@/lib/kids";
import { PhotoInput } from "@/components/kids/photo-input";
import { useProfileOptions } from "@/lib/use-profiles";
import { displayMemberName } from "@/lib/igreja";
import { cn } from "@/lib/utils";

export interface GuardianDraft {
  id?: string;
  profile_id: string | null;
  full_name: string;
  phone: string;
  relation: string;
  is_primary: boolean;
  can_pickup: boolean;
  document: string;
  photo_url: string;
}

export function emptyGuardian(): GuardianDraft {
  return {
    profile_id: null,
    full_name: "",
    phone: "",
    relation: "mae",
    is_primary: false,
    can_pickup: true,
    document: "",
    photo_url: "",
  };
}

interface GuardiansEditorProps {
  value: GuardianDraft[];
  onChange: (next: GuardianDraft[]) => void;
}

export function GuardiansEditor({ value, onChange }: GuardiansEditorProps) {
  const { data: profiles } = useProfileOptions();
  const [linking, setLinking] = useState<number | null>(null);

  const update = (index: number, patch: Partial<GuardianDraft>) =>
    onChange(value.map((g, i) => (i === index ? { ...g, ...patch } : g)));

  const setPrimary = (index: number) =>
    onChange(value.map((g, i) => ({ ...g, is_primary: i === index })));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold tracking-tight">Responsáveis Autorizados</Label>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Segurança de Retirada</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, emptyGuardian()])}
          className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 h-9"
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>

      {value.length === 0 && (
        <div className="border-2 border-dashed border-border/50 rounded-3xl p-10 text-center bg-muted/5">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto italic">
            Nenhum responsável cadastrado. É obrigatório ter pelo menos um para garantir a segurança da criança.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {value.map((g, index) => (
          <div 
            key={g.id || `draft-${index}`} 
            className={cn(
              "group relative flex flex-col bg-card/40 backdrop-blur-sm border border-border/50 rounded-[2rem] p-6 transition-all duration-300",
              g.is_primary && "ring-2 ring-primary/20 bg-primary/[0.02]"
            )}
          >
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="shrink-0">
                <PhotoInput
                  label="Identificação Visual"
                  value={g.photo_url}
                  onChange={(v) => update(index, { photo_url: v })}
                  folder="responsaveis"
                  variant="responsavel"
                />
              </div>

              <div className="flex-1 grid sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                  <Input
                    value={g.full_name}
                    onChange={(e) => update(index, { full_name: e.target.value })}
                    placeholder="Nome do responsável"
                    className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                    <Input
                      value={g.phone}
                      onChange={(e) => update(index, { phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="h-11 pl-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Parentesco</Label>
                  <Select value={g.relation} onValueChange={(v) => update(index, { relation: v })}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                      {GUARDIAN_RELATIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="rounded-lg">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Documento (RG/CPF)</Label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                    <Input
                      value={g.document}
                      onChange={(e) => update(index, { document: e.target.value })}
                      placeholder="Opcional para conferência"
                      className="h-11 pl-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/40 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 bg-background/50 px-4 py-2 rounded-2xl border border-border/30">
                <Switch 
                  id={`primary-${index}`}
                  checked={g.is_primary} 
                  onCheckedChange={() => setPrimary(index)} 
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor={`primary-${index}`} className="text-xs font-semibold cursor-pointer">Principal</Label>
              </div>

              <div className="flex items-center gap-3 bg-background/50 px-4 py-2 rounded-2xl border border-border/30">
                <Switch
                  id={`pickup-${index}`}
                  checked={g.can_pickup}
                  onCheckedChange={(v) => update(index, { can_pickup: v })}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor={`pickup-${index}`} className="text-xs font-semibold cursor-pointer">Pode Retirar</Label>
              </div>

              <div className="h-4 w-[1px] bg-border/40 mx-2 hidden sm:block" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-xl h-10 px-4 transition-all",
                  g.profile_id ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-accent"
                )}
                onClick={() => setLinking(linking === index ? null : index)}
              >
                <UserPlus className="mr-2 h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                   {g.profile_id ? "Perfil Vinculado" : "Vincular Membro"}
                </span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                title="Remover responsável"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {linking === index && (
              <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                <Select
                  value={g.profile_id ?? ""}
                  onValueChange={(v) => {
                    const profile = (profiles ?? []).find((p) => p.id === v);
                    update(index, {
                      profile_id: v,
                      full_name: profile ? profile.full_name : g.full_name,
                    });
                    setLinking(null);
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-primary/[0.03] border-primary/20 focus:ring-primary/20 font-medium">
                    <SelectValue placeholder="Busque por um membro da igreja..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl shadow-2xl border-border/50">
                    {(profiles ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id} className="rounded-lg py-2.5">
                        {displayMemberName(p.full_name, p.church_function, p.gender)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {g.is_primary && (
               <div className="absolute -top-3 left-8 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                 Responsável Principal
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
