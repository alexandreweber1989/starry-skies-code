import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para registrar o Service Worker e gerenciar tokens de push.
 */
export function usePushNotifications() {
  useEffect(() => {
    const registerToken = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const mockToken = "web-push-token-" + user.id.substring(0, 8);

      try {
        await (supabase
          .from("user_push_tokens") as any)
          .upsert({
            user_id: user.id,
            token: mockToken,
            device_type: "web"
          }, { onConflict: "user_id,token" });
        
        console.log("Push Token registrado para o usuário.");
      } catch (err) {
        console.error("Falha ao registrar Push Token:", err);
      }
    };

    registerToken();
  }, []);
}
