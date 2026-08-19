import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getYoutubeVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => 
    z.object({ 
      type: z.enum(['service', 'podcast']).optional(),
      limit: z.number().default(10)
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
    // Verificar se é admin
    console.log("Checking admin role for user:", context.userId);
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });
    
    if (roleError) {
      console.error("Error checking role:", roleError);
      throw new Error("Erro ao verificar permissões.");
    }

    if (!isAdmin) {
      console.error("User is not admin_geral");
      throw new Error("Apenas administradores podem sincronizar o conteúdo.");
    }

    console.log("Fetching content from YouTube via AI...");
    const { fetchYoutubeContent } = await import("./youtube.server");
    const videos = await fetchYoutubeContent("@BatistaAtos");
    console.log(`Fetched ${videos?.length || 0} videos.`);

    if (videos && videos.length > 0) {
      console.log("Upserting videos to DB...");
      const { error } = await context.supabase
        .from("youtube_videos")
        .upsert(
          videos.map((v: any) => ({
            youtube_id: v.youtube_id,
            title: v.title,
            thumbnail_url: v.thumbnail_url,
            type: v.type,
            url: v.url,
            published_at: v.published_at || new Date().toISOString()
          })),
          { onConflict: 'youtube_id' }
        );

      if (error) {
        console.error("Upsert error:", error);
        throw new Error(error.message);
      }
    }

    return { success: true, count: videos?.length || 0 };
  });