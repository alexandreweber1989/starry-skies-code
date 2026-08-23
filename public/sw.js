/* Service worker da Igreja Batista Atos.
 * Responsável por receber as notificações push quando o app está fechado e
 * por levar a pessoa direto à tela certa quando ela toca no aviso. */

const TAG_PADRAO = "iba-atos";

self.addEventListener("install", () => {
  // Assume o controle já na primeira instalação, sem exigir recarregar a página.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Igreja Batista Atos", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Igreja Batista Atos";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    // Agrupa por assunto: um novo aviso substitui o anterior em vez de empilhar.
    tag: payload.tag || TAG_PADRAO,
    renotify: Boolean(payload.renotify),
    requireInteraction: payload.type === "emergency",
    vibrate: payload.type === "emergency" ? [200, 100, 200, 100, 200] : [120, 60, 120],
    timestamp: Date.now(),
    data: { url: payload.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Se o app já estiver aberto, apenas navega e traz para a frente.
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(destino).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});

/* O navegador pode rotacionar a assinatura; avisamos o app para reassinar. */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((c) => c.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" }));
    }),
  );
});
