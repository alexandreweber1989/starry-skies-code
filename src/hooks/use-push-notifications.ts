import { useEffect } from "react";
import { registrarServiceWorker, pushSuportado } from "@/lib/push";

/**
 * Registra o service worker (necessário para receber push com o app fechado)
 * e reassina quando o navegador rotaciona a assinatura.
 * A ativação em si é feita pela pessoa, no cartão "Ativar notificações".
 */
export function usePushNotifications() {
  useEffect(() => {
    if (!pushSuportado()) return;
    void registrarServiceWorker();

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
        // O navegador trocou a assinatura; a próxima visita ao perfil reativa.
        console.info("Assinatura de push renovada pelo navegador.");
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);
}
