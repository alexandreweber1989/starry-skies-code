import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Repertorio } from "@/components/louvor/repertorio";
import { Elenco } from "@/components/louvor/elenco";
import { Escalas } from "@/components/louvor/escalas";
import { MinhasEscalas } from "@/components/louvor/minhas-escalas";
import { VisaoGeral } from "@/components/louvor/visao-geral";

export const Route = createFileRoute("/_authenticated/louvor")({
  head: () => ({
    meta: [
      { title: "Ministério de Louvor — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Escala montada instrumento por instrumento, elenco de músicos e banco de cifras do ministério de louvor da Igreja Batista Atos.",
      },
      { property: "og:title", content: "Ministério de Louvor — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Monte a escala de cada domingo por instrumento e acompanhe o histórico de participação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LouvorPage,
});

function LouvorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ministério"
        title="Louvor"
        description="Elenco organizado por instrumento e voz, escala montada manualmente função por função com histórico de participação nos cultos, e o banco de cifras com transposição de tom."
      />
      <PageBody>
        <Tabs defaultValue="visao">
          <TabsList className="mb-8 flex-wrap h-auto">
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
            <TabsTrigger value="escalas">Escalas &amp; ensaios</TabsTrigger>
            <TabsTrigger value="minhas">Minhas escalas</TabsTrigger>
            <TabsTrigger value="repertorio">Repertório</TabsTrigger>
            <TabsTrigger value="elenco">Elenco por instrumento</TabsTrigger>
          </TabsList>
          <TabsContent value="visao"><VisaoGeral /></TabsContent>
          <TabsContent value="escalas"><Escalas /></TabsContent>
          <TabsContent value="minhas"><MinhasEscalas /></TabsContent>
          <TabsContent value="repertorio"><Repertorio /></TabsContent>
          <TabsContent value="elenco"><Elenco /></TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}