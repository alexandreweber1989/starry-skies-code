import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Repertorio } from "@/components/louvor/repertorio";
import { Equipes } from "@/components/louvor/equipes";
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
          "Escalas de culto e ensaio, equipes, banco de cifras e repertório do ministério de louvor da Igreja Batista Atos.",
      },
      { property: "og:title", content: "Ministério de Louvor — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Gerencie equipes, escalas, ensaios e o banco de cifras do ministério de louvor.",
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
        description="Equipes montadas pelos ministros, escalas de culto e ensaio com confirmação de presença, e o banco de cifras da igreja com transposição de tom."
      />
      <PageBody>
        <Tabs defaultValue="visao">
          <TabsList className="mb-8 flex-wrap h-auto">
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
            <TabsTrigger value="escalas">Escalas &amp; ensaios</TabsTrigger>
            <TabsTrigger value="minhas">Minhas escalas</TabsTrigger>
            <TabsTrigger value="repertorio">Repertório</TabsTrigger>
            <TabsTrigger value="equipes">Equipes</TabsTrigger>
          </TabsList>
          <TabsContent value="visao"><VisaoGeral /></TabsContent>
          <TabsContent value="escalas"><Escalas /></TabsContent>
          <TabsContent value="minhas"><MinhasEscalas /></TabsContent>
          <TabsContent value="repertorio"><Repertorio /></TabsContent>
          <TabsContent value="equipes"><Equipes /></TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}