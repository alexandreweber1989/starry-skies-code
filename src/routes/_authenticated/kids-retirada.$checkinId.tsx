import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { CheckoutPanel } from "@/components/kids/checkout-dialog";
import { childDisplayName, type KidsCheckin } from "@/lib/kids";

export const Route = createFileRoute("/_authenticated/kids-retirada/$checkinId")({
  head: () => ({
    meta: [
      { title: "Retirada da criança — Kids | Igreja Batista Atos" },
      {
        name: "description",
        content: "Conferência de segurança para liberar a criança ao responsável autorizado.",
      },
      { property: "og:title", content: "Retirada da criança — Kids" },
      {
        property: "og:description",
        content: "Conferência de segurança para liberar a criança ao responsável autorizado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KidsCheckoutPage,
});

/** Tela aberta pelo QR Code do check-in — conferência e retirada da criança. */
function KidsCheckoutPage() {
  const { checkinId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["kids-checkin", checkinId],
    queryFn: async () => {
      const { data: checkin, error: checkinError } = await supabase
        .from("kids_checkins")
        .select("*")
        .eq("id", checkinId)
        .maybeSingle();
      if (checkinError) throw checkinError;
      if (!checkin) return null;

      const { data: child, error: childError } = await supabase
        .from("kids_children")
        .select("id, full_name, nickname")
        .eq("id", checkin.child_id)
        .single();
      if (childError) throw childError;

      return { checkin: checkin as KidsCheckin, child };
    },
  });

  const name = data ? childDisplayName(data.child) : "";

  return (
    <>
      <PageHeader
        eyebrow="Ministério Infantil"
        title="Retirada da criança"
        description="Confira a foto do responsável e o código de segurança antes de liberar."
      />
      <PageBody>
        <div className="max-w-md mx-auto space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/kids">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao painel Kids
            </Link>
          </Button>

          {isLoading && <p className="text-muted-foreground">Carregando check-in…</p>}

          {error && (
            <p className="text-destructive">
              Não foi possível carregar este check-in. Verifique seu acesso ao módulo Kids.
            </p>
          )}

          {!isLoading && !error && !data && (
            <p className="text-muted-foreground">Check-in não encontrado ou já removido.</p>
          )}

          {data && data.checkin.status === "retirada" && (
            <div className="border border-border bg-card rounded-sm p-6 text-center space-y-2">
              <ShieldCheck className="h-8 w-8 text-primary mx-auto" />
              <p className="font-serif text-xl">{name} já foi entregue</p>
              <p className="text-sm text-muted-foreground">
                Retirada por {data.checkin.picked_up_by_name ?? "responsável não informado"}.
              </p>
            </div>
          )}

          {data && data.checkin.status !== "retirada" && (
            <div className="border border-border bg-card rounded-sm p-4">
              <h2 className="font-serif text-2xl mb-4">{name}</h2>
              <CheckoutPanel checkin={data.checkin} childName={name} />
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}
