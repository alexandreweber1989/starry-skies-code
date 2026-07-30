import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBRL, pixPayload } from "@/lib/store";

export interface PixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickupCode: string;
  totalCents: number;
  pixKey: string;
  pixName: string;
  pixCity: string;
}

export function PixDialog({
  open,
  onOpenChange,
  pickupCode,
  totalCents,
  pixKey,
  pixName,
  pixCity,
}: PixDialogProps) {
  const [copied, setCopied] = useState<"key" | "payload" | null>(null);
  const payload = pixPayload({
    key: pixKey,
    name: pixName,
    city: pixCity,
    amountCents: totalCents,
    txid: pickupCode.replace("-", ""),
  });

  const copy = async (value: string, which: "key" | "payload") => {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Pedido registrado</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="border border-border rounded-sm p-5 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Código de retirada
            </div>
            <div className="font-serif text-4xl mt-2 tracking-tight">{pickupCode}</div>
            <p className="text-xs text-muted-foreground mt-3">
              Apresente este código na livraria da igreja para retirar seu pedido.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Total via PIX
              </span>
              <span className="font-serif text-2xl">{formatBRL(totalCents)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 border border-border rounded-sm px-3 py-2 text-sm truncate">
                {pixKey}
              </div>
              <Button variant="outline" size="sm" onClick={() => copy(pixKey, "key")}>
                {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button className="w-full" onClick={() => copy(payload, "payload")}>
              {copied === "payload" ? "Copiado!" : "Copiar PIX copia e cola"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Após pagar, avise em “Meus pedidos” anexando o link do comprovante. A equipe da
              livraria confirma o pagamento e libera a retirada.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}