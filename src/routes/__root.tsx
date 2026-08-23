import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, Suspense, lazy } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { GlobalErrorBoundary } from "@/components/error-boundary";

const PushRegistration = lazy(() => import("@/components/auth/push-registration"));

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Ops! Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não conseguimos carregar esta página. Tente atualizar ou volte para o início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border-2 border-input bg-background px-6 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent hover:scale-105 active:scale-95"
          >
            Página Inicial
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Igreja Batista Atos | Uma casa sobre a rocha" },
      {
        name: "description",
        content:
          "Comunidade cristã dedicada a edificar um lugar de oração para todos os povos em Ponta Grossa. Forjando discípulos através do relacionamento, da mesa e da paternidade.",
      },
      { name: "author", content: "Igreja Batista Atos" },
      { name: "theme-color", content: "#111216" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "IB Atos" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "Igreja Batista Atos | Uma casa sobre a rocha" },
      {
        property: "og:description",
        content:
          "Comunidade cristã dedicada a edificar um lugar de oração para todos os povos em Ponta Grossa. Forjando discípulos através do relacionamento, da mesa e da paternidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Igreja Batista Atos | Uma casa sobre a rocha" },
      {
        name: "twitter:description",
        content:
          "Comunidade cristã dedicada a edificar um lugar de oração para todos os povos em Ponta Grossa. Forjando discípulos através do relacionamento, da mesa e da paternidade.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6c5a2957-c7da-4e8a-9fe9-4e79d6a2fe6e/id-preview-7103e3f7--519a36d2-6c4e-4611-a052-6f92099a6321.lovable.app-1785495563909.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6c5a2957-c7da-4e8a-9fe9-4e79d6a2fe6e/id-preview-7103e3f7--519a36d2-6c4e-4611-a052-6f92099a6321.lovable.app-1785495563909.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Syne:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
        crossOrigin: "",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const state = router.state;
  const prefersReducedMotion = useReducedMotion();

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={state.location.pathname}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 0, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } }
                }
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex-1 flex flex-col pt-page-transition"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
            <Suspense fallback={null}>
              <PushRegistration />
            </Suspense>
          </div>
          <Toaster richColors position="top-right" closeButton />
        </AuthProvider>
      </GlobalErrorBoundary>
    </QueryClientProvider>
  );
}
