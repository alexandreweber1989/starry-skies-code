import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, HandCoins, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PanelSection } from "@/components/painel/ui";
import { useAuth } from "@/lib/auth-context";
import { pixPayload } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Chaves usadas na tabela de configurações da plataforma. */
const KEYS = {
  key: "pix_key",
  name: "pix_name",
  city: "pix_city",
} as const;

type Tipo = "dizimo" | "oferta";

/** Converte "R$ 1.234,56" ou "1234,56" em centavos; 0 quando não há valor. */
function parseAmountCents(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

function formatAmountInput(raw: string): string {
  const cents = parseAmountCents(raw);
  if (!cents) return "";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/**
 * Dízimos e ofertas por PIX. Não registra transações — apenas apresenta a
 * chave oficial da igreja e o QR Code copia-e-cola (BR Code).
 */
export function ContribuicaoPix() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<Tipo>("dizimo");
  const [valor, setValor] = useState("");
  const [copied, setCopied] = useState<"key" | "payload" | null>(null);
  const [config, setConfig] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["app-settings", "pix"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [KEYS.key, KEYS.name, KEYS.city]);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value ?? "";
      return map;
    },
  });

  const pixKey = settings?.[KEYS.key] ?? "";
  const pixName = settings?.[KEYS.name] || "IGREJA BATISTA ATOS";
  const pixCity = settings?.[KEYS.city] || "CASCAVEL";

  const amountCents = parseAmountCents(valor);
  const payload = pixKey
    ? pixPayload({
        key: pixKey,
        name: pixName,
        city: pixCity,
        amountCents,
        txid: tipo === "dizimo" ? "DIZIMO" : "OFERTA",
      })
    : "";

  const copy = async (value: string, which: "key" | "payload") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
      toast.success(which === "key" ? "Chave PIX copiada." : "Código copia-e-cola copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  };

  return (
    <PanelSection
      label="Dízimos e ofertas"
      title="Contribua com a obra"
      action={
        isAdmin ? (
          <Button variant="outline" size="sm" onClick={() => setConfig(true)}>
            <Settings2 className="h-4 w-4" /> Configurar PIX
          </Button>
        ) : undefined
      }
    >
      {!pixKey ? (
        <div className="text-sm text-muted-foreground">
          A chave PIX da igreja ainda não foi cadastrada.
          {isAdmin ? " Clique em “Configurar PIX” para informar o CNPJ da igreja." : " Fale com a secretaria."}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] items-start">
          <div className="space-y-5">
            <div className="flex gap-2">
              {(["dizimo", "oferta"] as Tipo[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-3 text-left transition-all duration-200",
                    tipo === t
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span className="font-serif text-lg leading-none">
                    {t === "dizimo" ? "Dízimo" : "Oferta"}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    {t === "dizimo" ? "Fidelidade ao Senhor" : "Contribuição voluntária"}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="pix-valor"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                Valor (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  id="pix-valor"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(formatAmountInput(e.target.value))}
                  className="pl-9 h-11 text-base"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe em branco para definir o valor no aplicativo do seu banco.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Chave PIX (CNPJ) · {pixName}
              </div>
              <div className="font-mono text-sm break-all">{pixKey}</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1" onClick={() => copy(pixKey, "key")}>
                  {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copiar chave
                </Button>
                <Button className="flex-1" onClick={() => copy(payload, "payload")}>
                  {copied === "payload" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <HandCoins className="h-4 w-4" />
                  )}
                  Copia e cola
                </Button>
              </div>
            </div>
          </div>

          <div className="mx-auto rounded-xl border border-border bg-background p-4">
            <QRCodeSVG value={payload} size={180} level="M" />
            <p className="mt-3 text-center text-xs text-muted-foreground max-w-[180px]">
              Aponte a câmera do seu banco para o QR Code
            </p>
          </div>
        </div>
      )}

      {isAdmin && (
        <PixConfigDialog
          open={config}
          onOpenChange={setConfig}
          initial={{ key: pixKey, name: pixName, city: pixCity }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["app-settings", "pix"] })}
        />
      )}
    </PanelSection>
  );
}

function PixConfigDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: { key: string; name: string; city: string };
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);

  const save = useMutation({
    mutationFn: async () => {
      const chave = form.key.trim();
      if (chave.replace(/\D/g, "").length !== 14) {
        throw new Error("Informe o CNPJ da igreja com 14 dígitos.");
      }
      const rows = [
        { key: KEYS.key, value: chave },
        { key: KEYS.name, value: form.name.trim().slice(0, 25).toUpperCase() },
        { key: KEYS.city, value: form.city.trim().slice(0, 15).toUpperCase() },
      ];
      const { error } = await supabase
        .from("app_settings")
        .upsert(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })), {
          onConflict: "key",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados do PIX atualizados.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Configurar PIX da igreja</DialogTitle>
          <DialogDescription>
            Estes dados aparecem para todos os membros no painel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Chave PIX — CNPJ
            </label>
            <Input
              value={form.key}
              onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
              placeholder="00.000.000/0001-00"
              maxLength={20}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Nome do recebedor (máx. 25)
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              maxLength={25}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Cidade (máx. 15)
            </label>
            <Input
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              maxLength={15}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
