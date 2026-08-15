import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChurchLogo } from "@/components/ui/church-logo";

export const Route = createFileRoute("/_authenticated/manual")({
  component: PlatformManual,
});

function PlatformManual() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Estilizado */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChurchLogo className="h-8 w-8" />
            <div>
              <h1 className="font-serif font-bold text-xl tracking-tight uppercase">Manual Operacional</h1>
              <p className="text-[10px] font-mono text-muted-foreground tracking-[0.2em] uppercase">Plataforma Igreja Batista Atos · v4.8</p>
            </div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="rounded-full gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        
        {/* Intro */}
        <section className="max-w-3xl">
          <Badge variant="outline" className="mb-4 font-mono text-[10px] tracking-widest uppercase border-primary/20 text-primary">Introdução</Badge>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold tracking-tighter mb-6">A bússola digital da nossa comunidade.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Este documento é o guia definitivo para administradores e líderes. Ele detalha cada funcionalidade, menu e lógica da nossa plataforma, garantindo que a tecnologia sirva à visão da igreja: forjar discípulos através do relacionamento.
          </p>
        </section>

        {/* Módulos Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Dashboard */}
          <Card className="border-border/40 bg-card/50 hover:bg-card transition-colors">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <CardTitle className="font-serif text-2xl tracking-tight">Painel Operacional</CardTitle>
              <CardDescription>O centro nervoso da plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>O Dashboard oferece uma visão 360º de tudo o que está acontecendo na igreja hoje.</p>
              <ul className="space-y-2 list-disc list-inside marker:text-primary">
                <li>Alertas urgentes (Kids e Cuidado)</li>
                <li>Escalas pendentes de louvor e faxina</li>
                <li>Métricas de crescimento e presença</li>
                <li>Atalhos rápidos para Eventos e Avisos</li>
              </ul>
            </CardContent>
          </Card>

          {/* Membros */}
          <Card className="border-border/40 bg-card/50 hover:bg-card transition-colors">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="font-serif text-2xl tracking-tight">Gestão de Membros</CardTitle>
              <CardDescription>Paternidade e acompanhamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Ferramenta avançada para cuidar da membresia, desde o visitante até o líder.</p>
              <ul className="space-y-2 list-disc list-inside marker:text-primary">
                <li>Onboarding e trilha de crescimento</li>
                <li>Histórico pastoral e notas privadas</li>
                <li>Mapa geográfico de membros e mesas</li>
                <li>Gestão de famílias e conexões</li>
              </ul>
            </CardContent>
          </Card>

          {/* Louvor */}
          <Card className="border-border/40 bg-card/50 hover:bg-card transition-colors">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <Music className="h-5 w-5" />
              </div>
              <CardTitle className="font-serif text-2xl tracking-tight">Ministério de Louvor</CardTitle>
              <CardDescription>Técnica e adoração em harmonia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Sistema completo para músicos e técnicos de som.</p>
              <ul className="space-y-2 list-disc list-inside marker:text-primary">
                <li>Importador automático de cifras (CifraClub)</li>
                <li>Transposição de tons em tempo real</li>
                <li>Modo Palco (interface otimizada para tablets)</li>
                <li>Escalas por instrumento e elenco</li>
              </ul>
            </CardContent>
          </Card>

          {/* Kids */}
          <Card className="border-border/40 bg-card/50 hover:bg-card transition-colors">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <Baby className="h-5 w-5" />
              </div>
              <CardTitle className="font-serif text-2xl tracking-tight">Kids & Segurança</CardTitle>
              <CardDescription>Cuidado com a próxima geração.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Protocolos de segurança e check-in para o ministério infantil.</p>
              <ul className="space-y-2 list-disc list-inside marker:text-primary">
                <li>Check-in e Checkout via QR Code</li>
                <li>Alertas de emergência para pais (WhatsApp)</li>
                <li>Gestão de visitantes e fila de espera</li>
                <li>Relatórios de presença e salas</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cuidado */}
          <Card className="border-border/40 bg-card/50 hover:bg-card transition-colors">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <CardTitle className="font-serif text-2xl tracking-tight">Cuidado & Social</CardTitle>
              <CardDescription>Atos de Amor na prática.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Gestão de oração, aconselhamento e assistência social.</p>
              <ul className="space-y-2 list-disc list-inside marker:text-primary">
                <li>Pedidos de oração com RLS (Privacidade)</li>
                <li>Acompanhamento de assistência social</li>
                <li>Widget de doações PIX integrado</li>
                <li>Alertas para pastores e líderes de mesa</li>
              </ul>
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card className="border-border/40 bg-card/50 hover:bg-card transition-colors">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <CardTitle className="font-serif text-2xl tracking-tight">Agenda & Eventos</CardTitle>
              <CardDescription>O calendário da nossa casa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Planejamento e engajamento da comunidade.</p>
              <ul className="space-y-2 list-disc list-inside marker:text-primary">
                <li>Calendário interativo com artes customizadas</li>
                <li>Sincronização com Google/Apple Calendar</li>
                <li>Gestão de endereços múltiplos por Mesa</li>
                <li>Controle de RSVP e lembretes push</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cantina e Livraria */}
          <Card className="border-border/40 bg-card/50 hover:bg-card transition-colors">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <CardTitle className="font-serif text-2xl tracking-tight">Cantina & Livraria</CardTitle>
              <CardDescription>Recursos e retiradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Gestão de vendas internas e pedidos antecipados.</p>
              <ul className="space-y-2 list-disc list-inside marker:text-primary">
                <li>Reserva de lanches para retirada na igreja</li>
                <li>Catálogo de livros e vestuário da igreja</li>
                <li>Pagamento via PIX com aprovação automática</li>
                <li>Gestão de estoque e demanda em tempo real</li>
              </ul>
            </CardContent>
          </Card>

          {/* Pregações e Mídia */}
          <Card className="border-border/40 bg-card/50 hover:bg-card transition-colors">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <Presentation className="h-5 w-5" />
              </div>
              <CardTitle className="font-serif text-2xl tracking-tight">Estúdio de Pregações</CardTitle>
              <CardDescription>Conteúdo e Inteligência IA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Integração com YouTube e IA para edificação.</p>
              <ul className="space-y-2 list-disc list-inside marker:text-primary">
                <li>Importação automática de lives via link</li>
                <li>Transcrição e Resumo por IA em tópicos</li>
                <li>Extração de versículos citados na pregação</li>
                <li>Status de Live em tempo real no Dashboard</li>
              </ul>
            </CardContent>
          </Card>

          {/* Visitantes */}
          <Card className="border-border/40 bg-card/50 hover:bg-card transition-colors">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle className="font-serif text-2xl tracking-tight">Portal de Boas-Vindas</CardTitle>
              <CardDescription>A primeira impressão digital.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Experiência interativa para quem pisa na casa pela primeira vez.</p>
              <ul className="space-y-2 list-disc list-inside marker:text-primary">
                <li>Landing page pública de recepção</li>
                <li>Presente digital (E-book) pós-cadastro</li>
                <li>Alertas instantâneos para líderes via WhatsApp</li>
                <li>Dashboard de novos check-ins em tempo real</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes Técnicos e Segurança */}
        <section className="bg-card border rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-primary/10 -rotate-12 pointer-events-none">
            <ShieldCheck className="h-64 w-64" />
          </div>
          
          <div className="max-w-2xl relative z-10">
            <Badge className="mb-6 rounded-full px-4">Segurança & RBAC</Badge>
            <h3 className="text-3xl font-serif font-bold mb-6">Políticas de Acesso (RBAC)</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="font-mono text-primary text-lg">01</div>
                <div>
                  <h4 className="font-bold mb-1 uppercase tracking-wider text-xs">Administrador Geral</h4>
                  <p className="text-muted-foreground text-sm">Acesso total e irrestrito. Responsável pela configuração do sistema e auditoria.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="font-mono text-primary text-lg">02</div>
                <div>
                  <h4 className="font-bold mb-1 uppercase tracking-wider text-xs">Pastores e Líderes</h4>
                  <p className="text-muted-foreground text-sm">Acesso aos dados da sua Rede ou Mesa. Visualizam o histórico e necessidades dos seus liderados.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="font-mono text-primary text-lg">03</div>
                <div>
                  <h4 className="font-bold mb-1 uppercase tracking-wider text-xs">Membros e Voluntários</h4>
                  <p className="text-muted-foreground text-sm">Acesso às suas próprias escalas, perfil e conteúdos públicos como avisos e eventos.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rodapé do Manual */}
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
