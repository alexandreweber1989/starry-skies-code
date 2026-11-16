import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { registrarServiceWorker, pushSuportado, sincronizarPush } from "@/lib/push";

/**
 * Registra o service worker (necessário para receber push com o app fechado)
 * e mantém a assinatura deste aparelho válida: a cada abertura do app, e
 * quando o navegador troca a assinatura, ressincroniza em silêncio.
 * O primeiro "Ativar" continua sendo da pessoa, no cartão de notificações.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!pushSuportado()) return;
    void registrarServiceWorker();
  }, []);

  useEffect(() => {
    if (!pushSuportado() || !userId) return;
    void sincronizarPush(userId);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") void sincronizarPush(userId);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [userId]);
}
