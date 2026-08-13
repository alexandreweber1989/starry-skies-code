import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Heart, HandHelping } from "lucide-react";

const formSchema = z.object({
  needs_food: z.boolean().default(false),
  description: z.string().min(10, "Por favor, descreva brevemente a necessidade (mínimo 10 caracteres)."),
});

export function SocialAssistanceForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      needs_food: false,
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("social_assistance_requests").insert({
        user_id: user.id,
        needs_food: values.needs_food,
        description: values.description,
      });

      if (error) throw error;

      toast.success("Solicitação enviada ao Atos de Amor!");
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao enviar solicitação:", error);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-4 items-start dark:bg-rose-950/20 dark:border-rose-900/30">
        <Heart className="h-5 w-5 text-rose-500 mt-1 shrink-0" />
        <div className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground block mb-1">Atos de Amor</strong>
          Nossa igreja está aqui para estender a mão. Se você ou sua família estão passando por dificuldades, 
          use este canal para solicitar ajuda. A equipe responsável entrará em contato com total discrição.
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="needs_food"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Preciso de auxílio com alimentação (Cesta Básica)
                  </FormLabel>
                  <FormDescription>
                    Marque esta opção se sua necessidade imediata for alimento.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Como podemos ajudar?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva brevemente a situação para que possamos entender como melhor auxiliar..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full gap-2 bg-rose-600 hover:bg-rose-700 text-white" disabled={loading}>
            <HandHelping className="h-4 w-4" />
            {loading ? "Enviando..." : "Solicitar Apoio"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
