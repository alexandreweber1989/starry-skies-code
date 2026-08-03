import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ShieldCheck, Compass, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { displayMemberName } from "@/lib/igreja";
import { PanelSection, EmptyLine, Initials } from "./ui";
import { initialsOf } from "@/lib/painel";
import { Button } from "@/components/ui/button";
/**
 * Exibe os responsáveis pelos grupos que o membro participa (ministérios, redes, mesas).
 * Focado em facilitar o contato via WhatsApp para o liderado.
 */
export function MeusLideres() {
    const { user, isAdmin } = useAuth();
    const { data: leaders, isLoading } = useQuery({
        queryKey: ["meus-lideres", user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            // 1. Buscar participações do usuário
            const [mins, redes, mesas] = await Promise.all([
                supabase.from("ministry_members").select("ministry_id, ministries(name)").eq("user_id", user.id),
                supabase.from("rede_members").select("rede_id, redes(name)").eq("user_id", user.id),
                supabase.from("mesa_members").select("mesa_id, mesas(name)").eq("user_id", user.id),
            ]);
            const minIds = (mins.data ?? []).map((m) => m.ministry_id);
            const redeIds = (redes.data ?? []).map((r) => r.rede_id);
            const mesaIds = (mesas.data ?? []).map((m) => m.mesa_id);
            // 2. Buscar responsáveis desses grupos
            const results = [];
            if (minIds.length > 0) {
                const { data } = await supabase
                    .from("ministry_members")
                    .select("user_id, function_name, ministries(name), profiles:profiles!inner(full_name, phone, gender, church_function)")
                    .in("ministry_id", minIds)
                    .filter("function_name", "ilike", "respons%");
                data?.forEach((row) => {
                    results.push({
                        userId: row.user_id,
                        name: displayMemberName(row.profiles.full_name, row.profiles.church_function, row.profiles.gender),
                        phone: row.profiles.phone,
                        churchFunction: row.profiles.church_function,
                        gender: row.profiles.gender,
                        groupName: row.ministries.name,
                        groupKind: "ministério",
                    });
                });
            }
            if (redeIds.length > 0) {
                const { data } = await supabase
                    .from("rede_members")
                    .select("user_id, role, redes(name), profiles:profiles!inner(full_name, phone, gender, church_function)")
                    .in("rede_id", redeIds)
                    .in("role", ["pastor", "apascentador", "lider"]);
                data?.forEach((row) => {
                    results.push({
                        userId: row.user_id,
                        name: displayMemberName(row.profiles.full_name, row.profiles.church_function, row.profiles.gender),
                        phone: row.profiles.phone,
                        churchFunction: row.profiles.church_function,
                        gender: row.profiles.gender,
                        groupName: row.redes.name,
                        groupKind: "rede",
                    });
                });
            }
            if (mesaIds.length > 0) {
                const { data } = await supabase
                    .from("mesa_members")
                    .select("user_id, role, mesas(name), profiles:profiles!inner(full_name, phone, gender, church_function)")
                    .in("mesa_id", mesaIds)
                    .in("role", ["pastor", "apascentador", "lider"]);
                data?.forEach((row) => {
                    results.push({
                        userId: row.user_id,
                        name: displayMemberName(row.profiles.full_name, row.profiles.church_function, row.profiles.gender),
                        phone: row.profiles.phone,
                        churchFunction: row.profiles.church_function,
                        gender: row.profiles.gender,
                        groupName: row.mesas.name,
                        groupKind: "mesa",
                    });
                });
            }
            // Remover duplicatas (mesma pessoa em múltiplos grupos)
            const unique = new Map();
            results.forEach((l) => {
                if (!unique.has(l.userId)) {
                    unique.set(l.userId, l);
                }
            });
            return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
        },
    });
    if (!isLoading && (!leaders || leaders.length === 0))
        return null;
    return (
      <PanelSection label="Apoio e Cuidado" title="Meus Líderes" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {isLoading ? (
          <EmptyLine>Carregando contatos...</EmptyLine>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {leaders?.map((l) => {
              const phone = l.phone?.replace(/\D/g, "");
              const Icon = l.groupKind === "mesa" ? UtensilsCrossed : (l.groupKind === "rede" ? Compass : ShieldCheck);
              return (
                <li key={l.userId} className="flex items-center gap-3 border border-border rounded-sm p-3 hover:bg-muted/30 transition-colors">
                  <Initials text={initialsOf(l.name)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{l.name}</div>
                    <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                      <Icon className="size-3" />
                      <span className="truncate">{l.groupName}</span>
                    </div>
                  </div>
                  {phone && (
                    <Button size="icon" variant="ghost" className="shrink-0" asChild>
                      <a href={`https://wa.me/55${phone}`} target="_blank" rel="noreferrer" title={`Falar com ${l.name}`}>
                        <MessageSquare className="size-4 text-primary" />
                      </a>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[10px] text-muted-foreground mt-4 italic">
          * Estes são os responsáveis pelos grupos que você participa.
        </p>
      </PanelSection>
    );
      {isLoading ? (<EmptyLine>Carregando contatos...</EmptyLine>) : (<ul className="grid sm:grid-cols-2 gap-3">
          {leaders?.map((l) => {
                const phone = l.phone?.replace(/\D/g, "");
                const Icon = l.groupKind === "mesa" ? UtensilsCrossed : (l.groupKind === "rede" ? Compass : ShieldCheck);
                return (<li key={l.userId} className="flex items-center gap-3 border border-border rounded-sm p-3 hover:bg-muted/30 transition-colors">
                <Initials text={initialsOf(l.name)}/>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{l.name}</div>
                  <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    <Icon className="size-3"/>
                    <span className="truncate">{l.groupName}</span>
                  </div>
                </div>
                {phone && (<Button size="icon" variant="ghost" className="shrink-0" asChild>
                    <a href={`https://wa.me/55${phone}`} target="_blank" rel="noreferrer" title={`Falar com ${l.name}`}>
                      <MessageSquare className="size-4 text-primary"/>
                    </a>
                  </Button>)}
              </li>);
            })}
        </ul>)}
      <p className="text-[10px] text-muted-foreground mt-4 italic">
        * Estes são os responsáveis pelos grupos que você participa.
      </p>
    </PanelSection>);
}
