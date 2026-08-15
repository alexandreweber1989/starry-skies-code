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
    description: "Visão 360º e centro de comando da igreja.",
    icon: LayoutDashboard,
    details: "O Dashboard é o ponto de partida de todo administrador. Ele oferece uma visão consolidada de toda a operação da igreja em tempo real. \n\nFuncionalidades principais:\n- **Métricas de Engajamento:** Acompanhamento de presença nos cultos e crescimento da membresia.\n- **Alertas Críticos:** Notificações instantâneas vindas do Módulo Kids (segurança) e do Cuidado Social.\n- **Gestão de Escalas:** Visualização rápida de quem está servindo no Louvor e na Faxina hoje.\n- **Atalhos de Ação:** Botões rápidos para criar Avisos, Eventos e Notícias sem navegar por menus complexos.\n- **Avisos da Liderança:** Espaço para comunicações importantes que aparecem para todos os membros logados.",
  },
  {
    id: "membros",
    title: "Gestão de Membros",
    description: "Cuidado individual e mapeamento da comunidade.",
    icon: Users,
    details: "Mais que um cadastro, é uma ferramenta de pastoreio. Permite acompanhar a jornada de cada pessoa na igreja.\n\nFuncionalidades principais:\n- **Ficha Cadastral Completa:** Dados pessoais, familiares, contatos e status ministerial.\n- **Histórico Pastoral:** Espaço para notas privadas de aconselhamento e acompanhamento (protegido por sigilo de acesso).\n- **Mapa de Membros:** Visualização geográfica de onde moram nossos membros, facilitando a criação de novas Mesas.\n- **Onboarding de Visitantes:** Fluxo automatizado para transformar um visitante em um membro integrado.\n- **Gestão de Famílias:** Vinculação de parentesco para facilitar a comunicação e o cuidado familiar.",
  },
  {
    id: "louvor",
    title: "Ministério de Louvor",
    description: "Excelência técnica para a adoração.",
    icon: Music,
    details: "Centraliza toda a operação musical da igreja, eliminando pastas de papel e PDFs desatualizados.\n\nFuncionalidades principais:\n- **Repertório Inteligente:** Importação automática de cifras (CifraClub/Cifras.com.br) com detecção de BPM e Tom.\n- **Transposição em Tempo Real:** Altere o tom da música com um clique e a cifra se ajusta automaticamente para todos os músicos.\n- **Modo Palco:** Interface otimizada para tablets com alto contraste, fontes grandes e rolagem automática.\n- **Gestão de Escalas:** Definição de bandas, vocais e técnicos para cada culto/evento.\n- **Link de Estudo:** Integração com YouTube e Spotify para que os músicos ensaiem com a versão correta.",
  },
  {
    id: "kids",
    title: "Kids & Segurança",
    description: "Proteção total para a próxima geração.",
    icon: Baby,
    details: "Focado em tranquilizar os pais e garantir a segurança máxima das crianças.\n\nFuncionalidades principais:\n- **Check-in via QR Code:** Entrada rápida e segura com registro fotográfico da criança e do responsável.\n- **Alertas de Emergência:** Disparo imediato de mensagem via WhatsApp para o celular do pai caso a criança precise de atenção.\n- **Controle de Retirada:** Apenas o responsável cadastrado com o código correspondente pode retirar a criança.\n- **Relatórios de Presença:** Histórico de frequência e gestão de visitantes nas salas por faixa etária.\n- **Documentação:** Upload seguro de certidões e termos de responsabilidade.",
  },
  {
    id: "cuidado",
    title: "Cuidado & Social",
    description: "Amor em ação e apoio ministerial.",
    icon: HeartHandshake,
    details: "Gerencia as necessidades da comunidade com discrição e agilidade.\n\nFuncionalidades principais:\n- **Pedidos de Oração:** Canal direto para solicitações que são direcionadas automaticamente ao líder da Mesa ou Rede.\n- **Assistência Social (Atos de Amor):** Cadastro e acompanhamento de famílias assistidas com cestas básicas ou apoio financeiro.\n- **Notificações Urgentes:** Alertas para pastores sobre casos que demandam visita ou intervenção imediata.\n- **Doações Integradas:** Widget de PIX direto para campanhas específicas de ação social.\n- **Privacidade RLS:** Garantia tecnológica de que dados sensíveis só são vistos por quem tem permissão explícita.",
  },
  {
    id: "agenda",
    title: "Agenda & Eventos",
    description: "Calendário unificado da nossa casa.",
    icon: Calendar,
    details: "Evita conflitos de horários e aumenta o engajamento nos eventos.\n\nFuncionalidades principais:\n- **Calendário Interativo:** Visão geral de cultos, ensaios, reuniões de Mesas e eventos especiais.\n- **Sincronização Externa:** Membros podem exportar eventos diretamente para suas agendas Google ou Apple.\n- **Gestão de RSVP:** Controle de quem vai comparecer, facilitando o planejamento de logística e alimentação.\n- **Múltiplos Endereços:** Suporte para eventos que ocorrem em diferentes locais, com integração ao Google Maps.\n- **Lembretes Automáticos:** O sistema avisa os inscritos sobre a proximidade do evento via Push ou WhatsApp.",
  },
  {
    id: "cantina",
    title: "Cantina & Livraria",
    description: "Comunhão e recursos literários.",
    icon: ShoppingBag,
    details: "Moderniza o atendimento e o fluxo financeiro interno.\n\nFuncionalidades principais:\n- **Reserva Antecipada:** O membro escolhe seu lanche ou livro pelo app e reserva para retirada.\n- **Pagamento via PIX:** Integração para agilizar a fila e evitar manuseio de dinheiro físico no balcão.\n- **Painel de Produção:** A equipe da cantina visualiza os pedidos em tempo real para preparar as entregas.\n- **Controle de Estoque:** Atualização automática de produtos disponíveis na livraria e cozinha.\n- **Histórico de Pedidos:** Relatórios financeiros para a tesouraria da igreja.",
  },
  {
    id: "midia",
    title: "Estúdio de Pregações",
    description: "Conteúdo edificado e automatizado.",
    icon: Presentation,
    details: "Transforma nossas lives em recursos de estudo permanentes.\n\nFuncionalidades principais:\n- **Integração YouTube:** Captura automática de vídeos do canal da igreja usando apenas o link.\n- **Resumo Estruturado:** O sistema processa o áudio e gera um resumo completo com tópicos e versículos citados.\n- **Filtro de Conteúdo:** Remove automaticamente partes não relacionadas à mensagem (como avisos ou louvores iniciais).\n- **Arquivo de Mensagens:** Biblioteca organizada por data e tema para consulta posterior dos membros.\n- **Gerador de Capas:** Puxa a identidade visual do vídeo original para manter a organização estética.",
  },
  {
    id: "visitantes",
    title: "Portal de Boas-Vindas",
    description: "Acolhimento desde o primeiro contato.",
    icon: Sparkles,
    details: "Focado em fazer o visitante se sentir amado e conectado.\n\nFuncionalidades principais:\n- **Landing Page Pública:** QR Code nos bancos que leva a uma página de recepção calorosa.\n- **Cadastro Simplificado:** O visitante deixa seus dados básicos em 30 segundos.\n- **Presente Digital:** Após o cadastro, o visitante recebe imediatamente o E-book 'O Progresso do Peregrino'.\n- **Conexão Imediata:** Notificação instantânea para a equipe de recepção e pastores para um cumprimento pessoal.\n- **Jornada de Integração:** Início automático do fluxo de acompanhamento para que ele retorne no próximo domingo.",
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
