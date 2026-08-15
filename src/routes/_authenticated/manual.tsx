import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  ShieldCheck, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Music, 
  ShoppingBag, 
  Baby, 
  HeartHandshake,
  Settings,
  ArrowRight,
  Download,
  Info,
  Presentation,
  Sparkles,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChurchLogo } from "@/components/ui/church-logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const MODULES = [
  {
    id: "dashboard",
    title: "Painel Operacional",
    description: "O centro nervoso da plataforma.",
    icon: LayoutDashboard,
    details: "O Dashboard oferece uma visão 360º de tudo o que está acontecendo na igreja hoje. Inclui alertas urgentes (Kids e Cuidado), monitoramento de escalas de louvor e faxina, métricas de crescimento e presença, além de atalhos rápidos para ações como criar Avisos e Eventos.",
  },
  {
    id: "membros",
    title: "Gestão de Membros",
    description: "Paternidade e acompanhamento.",
    icon: Users,
    details: "Ferramenta avançada para cuidar da membresia. O sistema gerencia desde a entrada do visitante (Onboarding) até o acompanhamento contínuo (Histórico pastoral e notas privadas). Inclui ferramentas como o Mapa geográfico de membros e mesas, além da gestão detalhada de famílias.",
  },
  {
    id: "louvor",
    title: "Ministério de Louvor",
    description: "Técnica e adoração em harmonia.",
    icon: Music,
    details: "Sistema completo para músicos e técnicos de som. Oferece importação automática de cifras de sites como CifraClub e Cifras.com.br, transposição de tons em tempo real, Modo Palco otimizado para tablets e gestão completa de escalas por instrumento e elenco.",
  },
  {
    id: "kids",
    title: "Kids & Segurança",
    description: "Cuidado com a próxima geração.",
    icon: Baby,
    details: "Protocolos rigorosos de segurança e check-in. O sistema gerencia o check-in e checkout via QR Code, envia alertas de emergência via WhatsApp para os pais, e mantém um histórico completo de presenças e gestão de visitantes nas salas.",
  },
  {
    id: "cuidado",
    title: "Cuidado & Social",
    description: "Atos de Amor na prática.",
    icon: HeartHandshake,
    details: "Gestão de oração e assistência social com privacidade garantida por RLS. Líderes e pastores recebem alertas em tempo real sobre pedidos de oração ou necessidade social da sua mesa ou rede. Também integra widget de doações PIX para o Atos de Amor.",
  },
  {
    id: "agenda",
    title: "Agenda & Eventos",
    description: "O calendário da nossa casa.",
    icon: Calendar,
    details: "Planejamento e engajamento. Permite criar eventos com artes customizadas, sincronização com calendários pessoais (Google/Apple), gestão complexa de endereços múltiplos para mesas e controle de RSVP com envio de lembretes automáticos.",
  },
  {
    id: "cantina",
    title: "Cantina & Livraria",
    description: "Recursos e retiradas.",
    icon: ShoppingBag,
    details: "Gestão de vendas internas. Permite que membros reservem lanches ou itens da livraria para retirada na igreja, efetuando o pagamento via PIX. A administração tem controle de estoque e demanda em tempo real.",
  },
  {
    id: "midia",
    title: "Estúdio de Pregações",
    description: "Gestão e automação de conteúdo.",
    icon: Presentation,
    details: "Integração poderosa com o YouTube. Ao inserir o link da live, o sistema puxa a capa e realiza o processamento completo do conteúdo para gerar um resumo estruturado (tópicos e versículos), ignorando louvores e avisos iniciais.",
  },
  {
    id: "visitantes",
    title: "Portal de Boas-Vindas",
    description: "A primeira impressão digital.",
    icon: Sparkles,
    details: "A porta de entrada interativa. Visitantes registram sua chegada em uma landing page pública, recebem um presente digital (E-book) e o sistema dispara alertas imediatos para os líderes de recepção via WhatsApp.",
  }
];

export const Route = createFileRoute("/_authenticated/manual")({
  component: PlatformManual,
});

function PlatformManual() {
  const [selectedModule, setSelectedModule] = useState<(typeof MODULES)[0] | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChurchLogo className="h-8 w-8" />
            <div>
              <h1 className="font-serif font-bold text-xl tracking-tight uppercase">Manual Operacional</h1>
              <p className="text-[10px] font-mono text-muted-foreground tracking-[0.2em] uppercase">Plataforma Igreja Batista Atos · v4.8</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-full gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        <section className="max-w-3xl">
          <Badge variant="outline" className="mb-4 font-mono text-[10px] tracking-widest uppercase border-primary/20 text-primary">Introdução</Badge>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold tracking-tighter mb-6">A bússola digital da nossa comunidade.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Este documento é o guia definitivo para administradores e líderes. Ele detalha cada funcionalidade, menu e lógica da nossa plataforma, garantindo que a tecnologia sirva à visão da igreja: forjar discípulos através do relacionamento.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MODULES.map((module) => (
            <Card 
              key={module.id} 
              className="border-border/40 bg-card/50 hover:bg-card transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1"
              onClick={() => setSelectedModule(module)}
            >
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                  <module.icon className="h-5 w-5" />
                </div>
                <CardTitle className="font-serif text-2xl tracking-tight">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between group">
                  Ver detalhes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl">{selectedModule?.title}</DialogTitle>
              <DialogDescription>{selectedModule?.description}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4 mt-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {selectedModule?.details}
                </p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <section className="bg-card border rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-primary/10 -rotate-12 pointer-events-none">
            <ShieldCheck className="h-64 w-64" />
          </div>
          
          <div className="max-w-2xl relative z-10">
            <Badge className="mb-6 rounded-full px-4">Segurança & RBAC</Badge>
            <h3 className="text-3xl font-serif font-bold mb-6">Políticas de Acesso (RBAC)</h3>
            <div className="space-y-6">
              {[
                { title: "Administrador Geral", desc: "Acesso total e irrestrito. Responsável pela configuração do sistema e auditoria." },
                { title: "Pastores e Líderes", desc: "Acesso aos dados da sua Rede ou Mesa. Visualizam o histórico e necessidades dos seus liderados." },
                { title: "Membros e Voluntários", desc: "Acesso às suas próprias escalas, perfil e conteúdos públicos como avisos e eventos." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="font-mono text-primary text-lg">0{i + 1}</div>
                  <div>
                    <h4 className="font-bold mb-1 uppercase tracking-wider text-xs">{item.title}</h4>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="pt-12 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <Info className="h-5 w-5 text-primary" />
            <p>Este manual é autogerado e atualizado a cada nova funcionalidade implementada.</p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">
            Igreja Batista Atos · PG · Brasil
          </div>
        </footer>
      </main>
    </div>
  );
}
