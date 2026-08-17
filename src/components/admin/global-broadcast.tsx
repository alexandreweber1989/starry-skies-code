import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Send, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { notifyAllMembers } from "@/lib/notifications.functions";

export function GlobalBroadcast() {
  const [isOpen, setIsOpen] = useState(false);
  const [titleStr, setTitleStr] = useState("");
  const [messageStr, setMessageStr] = useState("");
  const [alertType, setAlertType] = useState<"emergency" | "announcement" | "event">("announcement");

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      if (!titleStr.trim() || !messageStr.trim()) {
        throw new Error("Preencha o título e a mensagem.");
      }
      return notifyAllMembers({ data: { title: titleStr, message: messageStr, type: alertType } });
    },
    onSuccess: () => {
      toast.success("Notificação enviada!");
      setIsOpen(false);
      setTitleStr("");
      setMessageStr("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao realizar o disparo.");
    }
  });

  const templatesList = [
    {
      label: "Culto Iniciado",
      title: "O Culto Começou! 🔥",
      message: "Nossa celebração acabou de começar. Venha se juntar a nós ou acompanhe a live!",
      type: "event" as const
    },
    {
      label: "Culto Encerrado",
      title: "Culto Encerrado ✨",
      message: "Que tempo precioso tivemos hoje! O culto foi encerrado. Uma semana abençoada a todos.",
      type: "event" as const
    },
    {
      label: "Aviso Urgente",
      title: "COMUNICADO URGENTE 🚨",
      message: "",
      type: "emergency" as const
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Megaphone className="h-4 w-4" />
          Notificar Todos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-none bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <Megaphone className="h-6 w-6" />
          </div>
          <DialogTitle className="font-serif text-2xl tracking-tight">Comunicado Global</DialogTitle>
          <DialogDescription>
            Isso enviará uma notificação em tempo real para todos os membros ativos da plataforma.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Modelos Rápidos</label>
            <div className="flex flex-wrap gap-2">
              {templatesList.map((t) => (
                <Button 
                  key={t.label} 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-7 rounded-full uppercase tracking-tighter"
                  onClick={() => {
                    setTitleStr(t.title);
                    setMessageStr(t.message);
                    setAlertType(t.type);
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título do Alerta</label>
              <Input 
                value={titleStr} 
                onChange={(e) => setTitleStr(e.target.value)} 
                placeholder="Ex: Culto de Domingo Iniciado"
                className="bg-card/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea 
                value={messageStr} 
                onChange={(e) => setMessageStr(e.target.value)} 
                placeholder="Descreva o comunicado detalhadamente..."
                className="min-h-[100px] bg-card/50"
              />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. A notificação ficará registrada no histórico de todos os membros.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={broadcastMutation.isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={() => broadcastMutation.mutate()} 
            disabled={broadcastMutation.isPending}
            className="gap-2"
          >
            {broadcastMutation.isPending ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {broadcastMutation.isPending ? "Disparando..." : "Enviar Agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
