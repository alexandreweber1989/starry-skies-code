import * as React from "react";
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
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"emergency" | "announcement" | "event">("announcement");

  const broadcast = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !message.trim()) {
        throw new Error("Preencha o título e a mensagem.");
      }
      return notifyAllMembers({ data: { title, message, type } });
    },
    onSuccess: () => {
      toast.success("Notificação enviada!");
      setOpen(false);
      setTitle("");
      setMessage("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao realizar o disparo.");
    }
  });

  const templates = [
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

  return React.createElement(Dialog, { open: open, onOpenChange: setOpen },
    React.createElement(DialogTrigger, { asChild: true },
      React.createElement(Button, { className: "rounded-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" },
        React.createElement(Megaphone, { className: "h-4 w-4" }),
        "Notificar Todos"
      )
    ),
    React.createElement(DialogContent, { className: "sm:max-w-[500px] border-none bg-background/95 backdrop-blur-xl" },
      React.createElement(DialogHeader, null,
        React.createElement("div", { className: "h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary" },
          React.createElement(Megaphone, { className: "h-6 w-6" })
        ),
        React.createElement(DialogTitle, { className: "font-serif text-2xl tracking-tight" }, "Comunicado Global"),
        React.createElement(DialogDescription, null, "Isso enviará uma notificação em tempo real para todos os membros ativos da plataforma.")
      ),
      React.createElement("div", { className: "space-y-6 py-4" },
        React.createElement("div", { className: "space-y-2" },
          React.createElement("label", { className: "text-xs font-mono uppercase tracking-widest text-muted-foreground" }, "Modelos Rápidos"),
          React.createElement("div", { className: "flex flex-wrap gap-2" },
            templates.map((t) => 
              React.createElement(Button, { 
                key: t.label, 
                variant: "outline", 
                size: "sm", 
                className: "text-[10px] h-7 rounded-full uppercase tracking-tighter",
                onClick: () => {
                  setTitle(t.title);
                  setMessage(t.message);
                  setType(t.type);
                }
              }, t.label)
            )
          )
        ),
        React.createElement("div", { className: "space-y-4" },
          React.createElement("div", { className: "space-y-2" },
            React.createElement("label", { className: "text-sm font-medium" }, "Título do Alerta"),
            React.createElement(Input, { 
              value: title, 
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value), 
              placeholder: "Ex: Culto de Domingo Iniciado",
              className: "bg-card/50"
            })
          ),
          React.createElement("div", { className: "space-y-2" },
            React.createElement("label", { className: "text-sm font-medium" }, "Mensagem"),
            React.createElement(Textarea, { 
              value: message, 
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value), 
              placeholder: "Descreva o comunicado detalhadamente...",
              className: "min-h-[100px] bg-card/50"
            })
          )
        ),
        React.createElement("div", { className: "p-3 rounded-lg bg-primary/5 border border-primary/10 flex gap-3" },
          React.createElement(Info, { className: "h-5 w-5 text-primary shrink-0" }),
          React.createElement("p", { className: "text-xs text-muted-foreground leading-relaxed" },
            React.createElement("strong", null, "Atenção:"),
            " Esta ação não pode ser desfeita. A notificação ficará registrada no histórico de todos os membros."
          )
        )
      ),
      React.createElement(DialogFooter, null,
        React.createElement(Button, { variant: "ghost", onClick: () => setOpen(false), disabled: broadcast.isPending }, "Cancelar"),
        React.createElement(Button, { 
          onClick: () => broadcast.mutate(), 
          disabled: broadcast.isPending,
          className: "gap-2"
        },
          broadcast.isPending ? React.createElement(Clock, { className: "h-4 w-4 animate-spin" }) : React.createElement(Send, { className: "h-4 w-4" }),
          broadcast.isPending ? "Disparando..." : "Enviar Agora"
        )
      )
    )
  );
}
