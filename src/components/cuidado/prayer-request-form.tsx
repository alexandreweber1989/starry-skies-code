import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { sendUrgentNotification } from "@/lib/notifications.functions";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, HeartPulse } from "lucide-react";

const formSchema = z.object({
  category: z.enum(["prayer", "counseling"]),
  content: z.string().min(10, "Por favor, descreva seu pedido com pelo menos 10 caracteres."),
  urgent: z.boolean().default(false),
});


export function PrayerRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "prayer",
      content: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("prayer_requests").insert({
        user_id: profile.id,
        mesa_id: profile.mesa_id,
        category: values.category,
        content: values.content,
        is_private: true,
      });

      if (error) throw error;

      toast.success("Pedido enviado com sucesso!");
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao enviar pedido:", error);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-start">
        <ShieldCheck className="h-5 w-5 text-primary mt-1 shrink-0" />
        <div className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground block mb-1">Privacidade Garantida</strong>
          Este é um canal privado. Seu pedido de oração ou aconselhamento será visualizado{" "}
          <span className="text-primary font-medium italic underline underline-offset-4">
            exclusivamente pelo líder ou pastor responsável pela sua Mesa
          </span>
          . Ninguém mais terá acesso a estas informações.
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Solicitação</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="prayer">Pedido de Oração</SelectItem>
                    <SelectItem value="counseling">Pedido de Aconselhamento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sua mensagem</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Escreva aqui como podemos orar por você ou o que deseja conversar..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Seja específico para que seu líder possa te acompanhar melhor.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <HeartPulse className="h-4 w-4" />
            {loading ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
