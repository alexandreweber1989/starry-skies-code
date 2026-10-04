import { useEffect, useState } from "react";
import { Download, Share, Plus, Check, Smartphone, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/** Evento do Chrome/Edge que permite disparar a instalação programaticamente. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectar() {
  if (typeof window === "undefined") {
    return { standalone: false, ios: false };
  }
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  const ua = navigator.userAgent || "";
  const ios = /iphone|ipad|ipod/i.test(ua);
  return { standalone, ios };
}

/** Passos de instalação, mostrados no diálogo e na página /instalar. */
export function PassosInstalacao({ ios }: { ios: boolean }) {
  if (ios) {
    return (
      <ol className="space-y-4 text-sm">
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">1</span>
          <span>Abra este site no <strong>Safari</strong> (precisa ser o Safari no iPhone).</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">2</span>
          <span className="inline-flex flex-wrap items-center gap-1">
            Toque em <Share className="inline h-4 w-4" /> <strong>Compartilhar</strong> (o quadrado com a seta para cima).
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">3</span>
          <span className="inline-flex flex-wrap items-center gap-1">
            Escolha <Plus className="inline h-4 w-4" /> <strong>Adicionar à Tela de Início</strong> e confirme.
          </span>
        </li>
      </ol>
    );
  }
  return (
    <ol className="space-y-4 text-sm">
      <li className="flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">1</span>
        <span className="inline-flex flex-wrap items-center gap-1">
          Toque no menu <MoreVertical className="inline h-4 w-4" /> do navegador (três pontinhos).
        </span>
      </li>
      <li className="flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">2</span>
        <span>Escolha <strong>Instalar aplicativo</strong> (ou "Adicionar à tela inicial").</span>
      </li>
      <li className="flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">3</span>
        <span>Confirme — o ícone da igreja aparece na sua tela, como um app normal.</span>
      </li>
    </ol>
  );
}

/**
 * Botão inteligente de instalação:
 * - Android/Chrome/Edge: dispara a instalação nativa (beforeinstallprompt).
 * - iPhone/Safari e demais: abre um diálogo com o passo a passo.
 * Some automaticamente quando o app já está instalado (modo standalone).
 */
export function InstalarApp({
  className,
  label = "Instalar o app no celular",
}: {
  className?: string;
  label?: string;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = detectar();
    setStandalone(d.standalone);
    setIos(d.ios);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setStandalone(true);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Já instalado: nada a mostrar.
  if (standalone) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <Button onClick={handleClick} className={className}>
        <Download className="h-4 w-4" /> {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-primary" /> Instalar o app
            </DialogTitle>
            <DialogDescription>
              Em poucos toques o app da igreja fica na tela do seu celular — e é por ele que
              chegam os avisos e notificações.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-sm border border-border bg-muted/30 p-4">
            <PassosInstalacao ios={ios} />
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-primary" /> Não ocupa espaço como um app de loja e
            atualiza sozinho.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
