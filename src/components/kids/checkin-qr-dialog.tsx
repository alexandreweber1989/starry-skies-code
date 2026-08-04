import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { KidsCheckin } from "@/lib/kids";

interface CheckinQrDialogProps {
  checkin: KidsCheckin;
  childName: string;
}

/** Caminho público (dentro do app) que o QR Code do check-in abre. */
export function checkoutPathFor(checkinId: string): string {
  return `/kids-retirada/${checkinId}`;
}

/**
 * QR Code único do check-in. O voluntário escaneia com o celular e cai
 * direto na tela de retirada daquela criança, sem precisar procurá-la na lista.
 */
export function CheckinQrDialog({ checkin, childName }: CheckinQrDialogProps) {
  const [open, setOpen] = useState(false);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = `${origin}${checkoutPathFor(checkin.id)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <QrCode className="h-3.5 w-3.5" /> QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> {childName}
          </DialogTitle>
          <DialogDescription>
            Escaneie com o celular para abrir a retirada desta criança.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="bg-card p-4 rounded-sm border border-border">
            {open && <QRCodeSVG value={url} size={200} level="M" />}
          </div>
          <div className="text-center">
            <div className="font-mono text-3xl tracking-[0.3em] text-primary">
              {checkin.security_code}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Código de segurança
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center break-all">{url}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
