import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Resumo de um envio de notificação já agrupado por campanha. */
export interface EnvioResumo {
  title: string;
  audience: string | null;
  createdAt: string | null;
  entregues: number;
  semAparelho: number;
  total: number;
}

/** Pessoa que ainda não instalou/ativou o app em nenhum aparelho. */
export interface PessoaSemApp {
  id: string;
  nome: string;
  igreja: string | null;
}

export interface AdocaoStats {
  totalMembros: number;
  comApp: number;
  semApp: number;
  aparelhos: number;
  ativos30d: number;
  /** Percentual inteiro (0–100) de membros com o app em pelo menos um aparelho. */
  taxaAdocao: number;
  porAparelho: { ios: number; android: number; desktop: number; outro: number };
  listaSemApp: PessoaSemApp[];
  envios: EnvioResumo[];
  /** Falso quando a igreja ainda não ativou as chaves de notificação. */
  pushConfigurado: boolean;
}

/**
 * Painel de adoção do app (exclusivo do admin geral).
 *
 * Os aparelhos de cada pessoa ficam protegidos por RLS — cada membro só enxerga
 * o próprio. Para medir a adoção da igreja inteira precisamos do cliente admin
 * (service_role), por isso a leitura é feita aqui no servidor e o acesso é
 * restrito ao admin geral. A agregação é simples e cabe em memória: o volume é
 * o de uma igreja local, não de uma base de internet.
 */
export const estatisticasAdocao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdocaoStats> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });
    if (!isAdmin) throw new Error("Apenas a administração pode ver a adoção do app.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Perfis (base de "quem poderia ter o app").
    const { data: perfis } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, church_id");
    const listaPerfis = (perfis ?? []) as {
      id: string;
      full_name: string | null;
      church_id: string | null;
    }[];

    // Nome das igrejas, para enriquecer a lista de quem falta.
    const { data: igrejas } = await supabaseAdmin.from("churches").select("id, name");
    const nomeIgreja = new Map<string, string>(
      ((igrejas ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
    );

    // Aparelhos (tokens). select("*") de propósito: colunas podem variar entre bases.
    const { data: tokens } = await (supabaseAdmin.from("user_push_tokens" as any) as any).select(
      "user_id, user_agent, updated_at, last_used_at",
    );
    const listaTokens = (tokens ?? []) as {
      user_id: string;
      user_agent: string | null;
      updated_at: string | null;
      last_used_at: string | null;
    }[];

    const idsPerfil = new Set(listaPerfis.map((p) => p.id));
    const comAppSet = new Set<string>();
    const ativosSet = new Set<string>();
    const porAparelho = { ios: 0, android: 0, desktop: 0, outro: 0 };
    const limiar30d = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let aparelhos = 0;

    for (const t of listaTokens) {
      // Ignora tokens órfãos (usuário sem perfil).
      if (!idsPerfil.has(t.user_id)) continue;
      aparelhos += 1;
      comAppSet.add(t.user_id);

      const ua = (t.user_agent ?? "").toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) porAparelho.ios += 1;
      else if (/android/.test(ua)) porAparelho.android += 1;
      else if (ua) porAparelho.desktop += 1;
      else porAparelho.outro += 1;

      const quando = t.last_used_at ?? t.updated_at;
      if (quando && new Date(quando).getTime() >= limiar30d) ativosSet.add(t.user_id);
    }

    const totalMembros = listaPerfis.length;
    const comApp = comAppSet.size;
    const semApp = Math.max(0, totalMembros - comApp);
    const taxaAdocao = totalMembros > 0 ? Math.round((comApp / totalMembros) * 100) : 0;

    const listaSemApp: PessoaSemApp[] = listaPerfis
      .filter((p) => !comAppSet.has(p.id))
      .map((p) => ({
        id: p.id,
        nome: (p.full_name ?? "").trim() || "Sem nome",
        igreja: p.church_id ? nomeIgreja.get(p.church_id) ?? null : null,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .slice(0, 100);

    // Histórico de notificações — uma linha por destinatário. Agrupa por campanha
    // (título + público + minuto do envio) para contar entregues x sem aparelho.
    const { data: hist } = await (supabaseAdmin.from("notifications_history" as any) as any)
      .select("title, audience, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    const porCampanha = new Map<string, EnvioResumo>();
    for (const h of (hist ?? []) as {
      title: string | null;
      audience: string | null;
      status: string | null;
      created_at: string | null;
    }[]) {
      const minuto = (h.created_at ?? "").slice(0, 16);
      const chave = `${h.title ?? ""}|${h.audience ?? ""}|${minuto}`;
      let e = porCampanha.get(chave);
      if (!e) {
        e = {
          title: (h.title ?? "").trim() || "(sem título)",
          audience: h.audience ?? null,
          createdAt: h.created_at,
          entregues: 0,
          semAparelho: 0,
          total: 0,
        };
        porCampanha.set(chave, e);
      }
      e.total += 1;
      if (h.status === "enviado") e.entregues += 1;
      else if (h.status === "sem_aparelho") e.semAparelho += 1;
    }
    const envios = [...porCampanha.values()]
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .slice(0, 15);

    // A igreja já ativou as notificações? (há chaves utilizáveis no servidor.)
    let pushConfigurado = false;
    try {
      const { obterVapid } = await import("./push.server");
      pushConfigurado = (await obterVapid()) !== null;
    } catch {
      pushConfigurado = false;
    }

    return {
      totalMembros,
      comApp,
      semApp,
      aparelhos,
      ativos30d: ativosSet.size,
      taxaAdocao,
      porAparelho,
      listaSemApp,
      envios,
      pushConfigurado,
    };
  });
