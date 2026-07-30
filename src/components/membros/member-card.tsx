import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  MEMBERSHIP_STATUS,
  ageFrom,
  birthdayThisMonth,
  formatDateBR,
  initialsOf,
  labelOf,
} from "@/lib/membros";

type Profile = Record<string, any>;

/**
 * Card de membro com micro-interações: seleção, expansão ao toque
 * e ações rápidas (ficha, edição, WhatsApp).
 */
export function MemberCard({
  profile,
  index,
  selectable,
  selected,
  onSelect,
  onOpen,
  onEdit,
  canEdit,
}: {
  profile: Profile;
  index: number;
  selectable: boolean;
  selected: boolean;
  onSelect: (v: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const age = ageFrom(profile.birth_date);
  const isBirthday = birthdayThisMonth(profile.birth_date);
  const active = (profile.membership_status ?? "ativo") === "ativo";
  const phone = String(profile.phone ?? "").replace(/\D/g, "");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className={cn(
        "group relative animate-fade-in cursor-pointer select-none overflow-hidden rounded-sm border bg-card p-4",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary",
      )}
    >
      {/* faixa de status que se acende ao passar o mouse */}
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-1 origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100",
          active ? "bg-primary" : "bg-muted-foreground",
        )}
      />

      {selectable && (
        <div
          className={cn(
            "absolute right-3 top-3 transition-opacity duration-200",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox checked={selected} onCheckedChange={(v) => onSelect(v === true)} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-sm font-serif text-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          {initialsOf(profile.full_name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium leading-tight">{profile.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile.email ?? profile.phone ?? "Sem contato"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant={active ? "default" : "secondary"}>
          {labelOf(MEMBERSHIP_STATUS, profile.membership_status ?? "ativo")}
        </Badge>
        {age !== null && <Badge variant="outline">{age} anos</Badge>}
        {profile.is_baptized && <Badge variant="outline">Batizado</Badge>}
        {isBirthday && <Badge className="animate-pulse">🎂 Aniversário do mês</Badge>}
      </div>

      {/* detalhes revelados ao tocar no card */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <dl className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex justify-between gap-2">
              <dt>Telefone</dt>
              <dd className="text-foreground">{profile.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Nascimento</dt>
              <dd className="text-foreground">{formatDateBR(profile.birth_date) ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Cidade</dt>
              <dd className="text-foreground">{profile.city ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Membro desde</dt>
              <dd className="text-foreground">{formatDateBR(profile.member_since) ?? "—"}</dd>
            </div>
          </dl>

          <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" onClick={onOpen}>
              Ver ficha
            </Button>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                Editar
              </Button>
            )}
            {phone && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://wa.me/55${phone}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </Button>
            )}
            {profile.email && (
              <Button size="sm" variant="ghost" asChild>
                <a href={`mailto:${profile.email}`}>E-mail</a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <p
        className={cn(
          "mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-opacity",
          expanded ? "opacity-0" : "opacity-60 group-hover:opacity-100",
        )}
      >
        Toque para ver ações
      </p>
    </div>
  );
}