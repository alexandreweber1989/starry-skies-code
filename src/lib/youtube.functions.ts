import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getYoutubeVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => 
    z.object({ 
      type: z.enum(['service', 'podcast']).optional(),
      limit: z.number().default(50)
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("youtube_videos")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(data.limit);

    if (data.type) {
      query = query.eq("type", data.type);
    }

    const { data: videos, error } = await query;
    if (error) throw new Error(error.message);
    return videos || [];
  });

export const syncYoutubeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Check for environment variables at runtime
    if (!process.env['SUPABASE_URL'] || !process.env['SUPABASE_PUBLISHABLE_KEY']) {
      console.error("Missing Supabase environment variables in syncYoutubeContent handler");
      throw new Error("Erro de configuração do servidor (Variaveis de ambiente ausentes). Verifique o Lovable Cloud.");
    }

    // 1. Verificar se é admin
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });
    
    if (roleError) {
      console.error("Erro ao verificar papel do usuário:", roleError);
      throw new Error("Falha na verificação de permissões.");
    }

    if (!isAdmin) {
      console.error(`Usuário ${context.userId} tentou sincronizar sem ser admin_geral`);
      throw new Error("Apenas administradores podem realizar esta ação.");
    }

    // 2. Buscar conteúdo
    try {
      const { fetchYoutubeContent } = await import("./youtube.server");
      const videos = await fetchYoutubeContent("@BatistaAtos");

      if (!videos || !Array.isArray(videos) || videos.length === 0) {
        return { success: true, count: 0, message: "Nenhum vídeo novo encontrado." };
      }

      // 3. Validar e Formatar
      const validVideos = videos
        .filter((v: any) => v.youtube_id && v.title && v.url)
        .map((v: any) => ({
          youtube_id: String(v.youtube_id),
          title: String(v.title),
          thumbnail_url: v.thumbnail_url ? String(v.thumbnail_url) : null,
          type: (v.type === 'podcast' || v.type === 'service') ? v.type : 'service',
          url: String(v.url),
          published_at: v.published_at || new Date().toISOString()
        }));

      if (validVideos.length === 0) {
        return { success: true, count: 0, message: "Os dados retornados pelo YouTube são inválidos." };
      }

      // 4. Salvar no Banco
      const { error: upsertError } = await context.supabase
        .from("youtube_videos")
        .upsert(validVideos, { onConflict: 'youtube_id' });

      if (upsertError) {
        console.error("Erro no upsert de vídeos:", upsertError);
        throw new Error(`Erro de banco de dados: ${upsertError.message}`);
      }

      return { success: true, count: validVideos.length };
    } catch (err: any) {
      console.error("Erro crítico na sincronização do YouTube:", err);
      throw new Error(err.message || "Ocorreu um erro inesperado ao sincronizar.");
    }
  });