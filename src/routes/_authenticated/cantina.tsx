import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { CantinaMenus } from "@/components/cantina/cantina-menus";
import { CantinaMyReservations } from "@/components/cantina/cantina-reservations";
import { CantinaAdminItems, CantinaAdminMenus } from "@/components/cantina/cantina-admin";

export const Route = createFileRoute("/_authenticated/cantina")({
  head: () => ({
    meta: [
      { title: "Cantina — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Veja o cardápio da cantina da Igreja Batista Atos e reserve o seu pedido para retirar ao final do culto.",
      },
      { property: "og:title", content: "Cantina — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Cardápio do culto e reserva de pedidos da cantina, sem pagamento antecipado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CantinaPage,
});

function CantinaPage() {
  const { isCantinaAdmin } = useAuth();

  return (
    <>
      <PageHeader
        eyebrow="Comunhão à mesa"
        title="Cantina"
        description="O cardápio de cada culto fica aqui. Reserve o seu pedido com antecedência e retire ao final do culto — o pagamento é feito no balcão."
      />
      <PageBody>
        <Tabs defaultValue="cardapio">
          <TabsList className="mb-8">
            <TabsTrigger value="cardapio">Cardápio</TabsTrigger>
            <TabsTrigger value="reservas">Minhas reservas</TabsTrigger>
            {isCantinaAdmin && <TabsTrigger value="cardapios">Cardápios</TabsTrigger>}
            {isCantinaAdmin && <TabsTrigger value="itens">Itens</TabsTrigger>}
          </TabsList>
          <TabsContent value="cardapio">
            <CantinaMenus />
          </TabsContent>
          <TabsContent value="reservas">
            <CantinaMyReservations />
          </TabsContent>
          {isCantinaAdmin && (
            <TabsContent value="cardapios">
              <CantinaAdminMenus />
            </TabsContent>
          )}
          {isCantinaAdmin && (
            <TabsContent value="itens">
              <CantinaAdminItems />
            </TabsContent>
          )}
        </Tabs>
      </PageBody>
    </>
  );
}