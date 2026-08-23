import webpush from "web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Conteúdo que chega no celular. */
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  type?: "emergency" | "announcement" | "event";
  tag?: string;
}

export interface ResultadoEnvio {
  enviados: number;
  falhas: number;
  semAparelho: number;
  expiradas: number;
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/**
 * Chaves VAPID: primeiro do ambiente (se a igreja preferir configurar por lá),
 * senão do banco. Guardar no banco evita depender de variáveis de ambiente do
 * serviço de publicação, que foi o que impediu o recurso de funcionar.
 */
export async function obterVapid(): Promise<VapidKeys | null> {
  const envPub = process.env["VAPID_PUBLIC_KEY"];
  const envPriv = process.env["VAPID_PRIVATE_KEY"];
  if (envPub && envPriv) {
    return {
      publicKey: envPub,
      privateKey: envPriv,
      subject: process.env["VAPID_SUBJECT"] || "mailto:contato@igrejabatistaatos.com.br",
    };
  }

  const { data } = await (supabaseAdmin.from("push_config" as any) as any)
    .select("public_key, private_key, subject")
    .maybeSingle();
  if (!data?.public_key || !data?.private_key) return null;
  return {
    publicKey: data.public_key,
    privateKey: data.private_key,
    subject: data.subject || "mailto:contato@igrejabatistaatos.com.br",
  };
}

/** Gera e guarda um par de chaves caso ainda não exista. Devolve a pública. */
export async function garantirVapid(): Promise<VapidKeys> {
  const atual = await obterVapid();
  if (atual) return atual;

  const geradas = webpush.generateVAPIDKeys();
  const subject = process.env["VAPID_SUBJECT"] || "mailto:contato@igrejabatistaatos.com.br";
  const { error } = await (supabaseAdmin.from("push_config" as any) as any).upsert(
    {
      id: true,
      public_key: geradas.publicKey,
      private_key: geradas.privateKey,
      subject,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw new Error("Não foi possível salvar as chaves de notificação.");
  return { publicKey: geradas.publicKey, privateKey: geradas.privateKey, subject };
}

async function configurarVapid(): Promise<boolean> {
  const chaves = await obterVapid();
  if (!chaves) return false;
  webpush.setVapidDetails(chaves.subject, chaves.publicKey, chaves.privateKey);
  return true;
}

/**
 * Entrega a notificação em todos os aparelhos das pessoas indicadas e registra
 * o histórico. Assinaturas expiradas (404/410) são removidas automaticamente,
 * mantendo a base limpa sem intervenção manual.
 */
export async function enviarPush(
  userIds: string[],
  payload: PushPayload,
  meta: { audience?: string; sentBy?: string | null } = {},
): Promise<ResultadoEnvio> {
  const resultado: ResultadoEnvio = { enviados: 0, falhas: 0, semAparelho: 0, expiradas: 0 };
  if (userIds.length === 0) return resultado;

  if (!(await configurarVapid())) {
    throw new Error(
      "Notificações ainda não configuradas. Um administrador precisa ativá-las em Meu perfil.",
    );
  }

  const { data: assinaturas, error } = await (supabaseAdmin.from("user_push_tokens" as any) as any)
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds)
    .not("endpoint", "is", null);
  if (error) throw new Error("Falha ao carregar os aparelhos cadastrados.");

  const lista = (assinaturas ?? []) as {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string | null;
    auth: string | null;
  }[];

  const comAparelho = new Set(lista.map((a) => a.user_id));
  resultado.semAparelho = userIds.filter((id) => !comAparelho.has(id)).length;

  const corpo = JSON.stringify(payload);
  const expiradas: string[] = [];

  await Promise.all(
    lista.map(async (a) => {
      if (!a.p256dh || !a.auth) {
        resultado.falhas += 1;
        return;
      }
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          corpo,
          { TTL: 60 * 60 * 24, urgency: payload.type === "emergency" ? "high" : "normal" },
        );
        resultado.enviados += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410 = o navegador descartou a assinatura (app desinstalado, etc.).
        if (status === 404 || status === 410) {
          expiradas.push(a.id);
          resultado.expiradas += 1;
        } else {
          resultado.falhas += 1;
        }
      }
    }),
  );

  if (expiradas.length > 0) {
    await (supabaseAdmin.from("user_push_tokens" as any) as any).delete().in("id", expiradas);
  }

  // Histórico: alimenta o painel de envios e o registro do que foi comunicado.
  await (supabaseAdmin.from("notifications_history" as any) as any).insert(
    userIds.map((uid) => ({
      user_id: uid,
      title: payload.title,
      body: payload.body,
      type: payload.type ?? "announcement",
      url: payload.url ?? null,
      audience: meta.audience ?? null,
      sent_by: meta.sentBy ?? null,
      status: comAparelho.has(uid) ? "enviado" : "sem_aparelho",
    })),
  );

  return resultado;
}

/** Resolve o público-alvo em uma lista de pessoas. */
export async function resolverPublico(
  audience: string,
  refId?: string | null,
): Promise<string[]> {
  const ids = new Set<string>();
  const add = (rows: { user_id: string | null }[] | null) =>
    (rows ?? []).forEach((r) => r.user_id && ids.add(r.user_id));

  if (audience === "todos") {
    const { data } = await supabaseAdmin.from("profiles").select("id").eq("membership_status", "ativo");
    (data ?? []).forEach((p: { id: string }) => ids.add(p.id));
    // Perfis sem status definido também recebem (base antiga).
    if (ids.size === 0) {
      const { data: todos } = await supabaseAdmin.from("profiles").select("id");
      (todos ?? []).forEach((p: { id: string }) => ids.add(p.id));
    }
  } else if (audience === "mesa" && refId) {
    const { data } = await supabaseAdmin.from("mesa_members").select("user_id").eq("mesa_id", refId);
    add(data);
  } else if (audience === "rede" && refId) {
    const { data } = await supabaseAdmin.from("rede_members").select("user_id").eq("rede_id", refId);
    add(data);
  } else if (audience === "ministerio" && refId) {
    const { data } = await supabaseAdmin
      .from("ministry_members")
      .select("user_id")
      .eq("ministry_id", refId);
    add(data);
  } else if (audience === "lideranca") {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin_geral", "lider_mesa", "admin_ministerio"]);
    add(data);
  }

  return [...ids];
}
